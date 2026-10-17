import { randomUUID } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { app, BrowserWindow, dialog, ipcMain, Menu, shell, WebContentsView } from "electron"
import type { AuthStatus } from "../shared/auth"
import type { Task, TaskInput } from "../shared/tasks"
import type { AppState, JevServer, ModelOption, ModelRef, ModelServer, NavState, RiskAsk } from "../shared/types"
import type { JobEntry, JobTarget } from "../shared/jobs"
import { deleteJevServer, hiddenJevNames, jevDefault, listJevServers, saveJevServer, setDefaultJev, testJevServer, unhideJevServer } from "./jev-servers"
import { authStatus, ensureQuota, login, logout, syncTokenUsage } from "./auth"
import { releaseSleepGuard, syncSleepGuard } from "./idle"
import { BrowserController, type RiskDecision } from "./browser/controller"
import { TabsHost } from "./browser/tabs"
import { startBrowserMcp, type BrowserMcp } from "./browser/mcp"
import { TAKEBACK_RESUME_PROMPT } from "./browser/challenge"
import { RISK_TITLES } from "./browser/risk"
import { Cdp, electronTransport } from "./browser/cdp"
import { electronPage, type BrowserHost, type Page } from "./browser/page"
import { installEgoRuntime } from "./ego"
import { EgoHost } from "./ego-host"
import { egoMatches } from "./ego-route"
import { createLogger, currentLogFile, initLogging } from "./log"
import { extractMaterials, type Summary } from "./materials/extract"
import { startOpencode, type OpencodeHandle } from "./opencode"
import { cloudModels, defaultModelRef, defaultOwnConfig, deleteModelServer, envFileServer, hiddenModels, hideModel, listModelServers, modelEfforts, ownConfigs, probeModelServer, saveModelServer, setModelDefault, setModelEffort, unhideModel } from "./model-servers"
import { credentialHolderIds, isOwnProviderId, modelRefOf, parseModelRef, pickerUsable, resolveThinking, seesOfListedModel, serverProviderId, thinkingOptionsOf, type OwnModelConfig } from "./model-server-core"
import { basename } from "node:path"
import { appRoot, fixture } from "./paths"
import { closeWeb, openWeb, searchWeb } from "./web"
import { addTokens, emptyTokens, normalizeTokens, type TokenUsage } from "./quota-math"
import { runAgentSmoke, runEgoSmoke, runFeedSmoke, runMaterialsSmoke, runResumeSmoke, runSmoke, runTaskSmoke } from "./smoke"
import { buildStartPrompt } from "./start-prompt"
import { clearPlatformAccount, getPlatformAccount, getPlatformPassword, savePlatformAccount, savePlatformPassword } from "./tasks/accounts"
import { scanMaterialsForLogin } from "./browser/material-creds"
import { resolveCredentials } from "./browser/login-creds"
import { getStudentMemo, setStudentMemo } from "./tasks/student-memo"
import { countMaterials, createTask, getTask, listStudents, updateTask } from "./tasks/tasks"
import { ensureWorkspace, writeGuide } from "./workspace"
import { overview as feedOverview, runOnceNow, saveFeedSchedule, saveFeedSources, saveJobTarget, feedRunFinishedAt, listSources, feedForStudent, readJobTarget } from "./feed/feed"
import { startFeedScheduler, type FeedScheduler } from "./feed/scheduler"
import { findEngine as findResumeEngine, generateResume, invalidateEngine as invalidateResumeEngine, listResumes } from "./resume/resume"

const here = dirname(fileURLToPath(import.meta.url))
const TOOLBAR_HEIGHT = 48
const SMOKE = process.argv.includes("--smoke")
  ? "browser"
  : process.argv.includes("--smoke-agent")
    ? "agent"
    : process.argv.includes("--smoke-tasks")
      ? "tasks"
      : process.argv.includes("--smoke-e2e")
        ? "e2e"
        : process.argv.includes("--smoke-materials")
          ? "materials"
          : process.argv.includes("--smoke-do")
            ? "do"
            : process.argv.includes("--run")
              ? "run"
              : process.argv.includes("--smoke-window")
                ? "window"
                : process.argv.includes("--smoke-search")
                  ? "search"
                  : process.argv.includes("--smoke-ego")
                    ? "ego"
                    : process.argv.includes("--smoke-feed")
                      ? "feed"
                      : process.argv.includes("--smoke-resume")
                        ? "resume"
                        : process.argv.includes("--run-real")
                          ? "real"
                          : undefined

app.setName("Terra-Edu Neo Job Agent")
const log = createLogger("app")
const sessionLog = createLogger("session")
const pageLog = createLogger("page")

let win: BrowserWindow
let page: WebContentsView
let browser: BrowserController
let mcp: BrowserMcp | undefined
let opencode: OpencodeHandle | undefined
let feedScheduler: FeedScheduler | undefined
let sidebarWidth = 440
const state: AppState = { phase: "starting", view: "home", workspace: "", models: [], arch: `${process.platform}-${process.arch}` }

// Plan 2 stage 3 (docs/BROWSER.md): pages on these hosts run in ego lite instead of the embedded view —
// UCAS's Cloudflare flags the Electron host, and the probe measured the same attachment clean in ego.
// NEO_EGO_HOSTS overrides the list; NEO_EGO=off keeps everything embedded, browser never started.
const egoHosts = (process.env.NEO_EGO_HOSTS || "ucas.com").split(",").map((h) => h.trim()).filter(Boolean)
/** The embedded view's host pair; the controller always starts here. */
let electronHost: BrowserHost
/** Every page the embedded stage hosts (2026-10-16 多标签): the application tab plus site popups. */
let tabs: TabsHost | undefined
/** Resolved when an allowed window.open has produced its real BrowserWindow (browser_open_in_window). */
let realWindowWaiter: ((win: BrowserWindow) => void) | undefined
/** Resolved once the controller is bound to that real window. */
let realWindowReady: Promise<void> = Promise.resolve()
/** Non-null while the active task's page lives in the ego lite window. */
let activeEgo: EgoHost | null = null
let egoWatchOff: (() => void) | undefined
/** Ownership polling on ego's official channel, live while the tools hold the page (stage 4). */
let egoOwnershipOff: (() => void) | undefined
/** Tasks the consultant routed to ego with the ☰ switch. Session-only — a reopen needs one more click (honest, ROADMAP). */
const egoManual = new Set<string>()
/** The first-launch copy of the browser bundle (boot); task opening waits for it before ego is started from it. */
let egoInstall: Promise<unknown> = Promise.resolve(null)

function startOwnershipWatch(host: EgoHost) {
  stopOwnershipWatch()
  egoOwnershipOff = host.watchOwnership(() => {
    // ego's ownership only fences ITS channel — this is us honoring its rules on the CDP side:
    // the consultant took the page in ego's own window, the tools stop like any 交给人.
    void browser.handoffToHuman("manual")
  })
}

function stopOwnershipWatch() {
  egoOwnershipOff?.()
  egoOwnershipOff = undefined
}

/** The page the toolbar and the controller act on right now. */
const activePage = (): Page => (activeEgo ? activeEgo.page : tabs ? tabs.activeHost().page : electronHost.page)
const eventTaps = new Set<(evt: any) => void>()
const windowEvents: string[] = []
const riskWaiters = new Map<string, { ask: RiskAsk; resolve: (decision: RiskDecision) => void }>()

// ------------------------------------------------------------------ settings (tiny, per machine)

const settingsPath = () => join(app.getPath("userData"), "settings.json")
function loadSettings(): { model?: ModelRef; modelPickedFor?: number; sidebarWidth?: number } {
  try {
    return JSON.parse(readFileSync(settingsPath(), "utf8"))
  } catch {
    return {}
  }
}
function saveSettings(patch: object) {
  writeFileSync(settingsPath(), JSON.stringify({ ...loadSettings(), ...patch }, null, 2))
}

// ------------------------------------------------------------------ window: page on the left, conversation on the right

const toRenderer = (channel: string, payload?: unknown) => {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload)
}
/** Every view switch lands here — so this is the hook for the sleep guard (2026-10-07: 填表中被屏保/锁屏打断). */
const publish = () => {
  syncSleepGuard(state.view)
  toRenderer("app:state", state)
}

function layout() {
  const [width, height] = win.getContentSize()
  const frame = { x: 0, y: TOOLBAR_HEIGHT, width: Math.max(320, width - sidebarWidth), height: Math.max(0, height - TOOLBAR_HEIGHT) }
  // The page only exists inside a task; login, home and the new-task form own the whole window.
  if (!tabs) {
    page.setVisible(state.view === "task")
    page.setBounds(frame)
    return
  }
  tabs.setFrame(frame, state.view === "task")
}

function navState(): NavState {
  const p = activePage()
  return { url: p.getURL(), title: p.getTitle(), canGoBack: p.canGoBack(), canGoForward: p.canGoForward(), loading: p.isLoading(), inEgo: !!activeEgo }
}

/**
 * The escape hatch for opener write-back (HKUST-style institution pickers): the model asks for a REAL
 * window, we let the MAIN tab's own `window.open` through (opener is Chromium's own), position the
 * window next to the app, and move the tools onto it. When it closes itself — as those popups do —
 * the tools go back to the application tab. The window is a real window: the consultant can also
 * just take it over by hand.
 */
function wireRealWindow(child: BrowserWindow, fromTabId: string) {
  tabs?.realWindowOpened(fromTabId)
  if (win && !win.isDestroyed()) {
    child.setParentWindow(win)
    const b = win.getBounds()
    child.setPosition(b.x + 80, b.y + 90)
  }
  const host = { page: electronPage(child.webContents), cdp: new Cdp(electronTransport(child.webContents)) }
  realWindowReady = browser
    .bindHost(host)
    .then(() => toRenderer("nav:state", navState()))
    .catch((error) => log.warn("binding the real window failed", { error }))
  child.on("closed", () => {
    tabs?.realWindowClosed()
    void (async () => {
      const switched = await tabs?.activate(fromTabId)
      const back = switched ?? tabs?.hostById(fromTabId) ?? tabs?.activeHost()
      if (back) await browser.bindHost(back)
      toRenderer("nav:state", navState())
    })().catch((error) => log.warn("returning from the real window failed", { error }))
  })
  realWindowWaiter?.(child)
  realWindowWaiter = undefined
}

/** The controller door behind browser_open_in_window — always re-opens from the MAIN (application) tab. */
async function openInRealWindow(url: string): Promise<string> {
  if (!tabs) throw new Error("当前没有标签页机制。")
  if (!tabs.allowRealWindowOnce("main")) throw new Error("当前没有可用的申请页标签。")
  const opened = new Promise<BrowserWindow>((resolve) => (realWindowWaiter = resolve))
  const mainHost = tabs.hostById("main")
  if (!mainHost) throw new Error("申请页标签不在了。")
  // window.open returns the new Window — not serializable (returnByValue chokes on it), so discard it.
  await mainHost.cdp.sendWithTimeout("Runtime.evaluate", { expression: `window.open(${JSON.stringify(url)}), "opened"`, returnByValue: true }, undefined, 8_000)
  const child = await Promise.race([
    opened,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("8 秒内没有等到窗口创建——这个页面可能拦下了 window.open。")), 8_000)),
  ])
  await realWindowReady
  void child
  return `真窗口已打开（${url}）：window.opener 指向申请页，回写型弹窗在这里正常工作。工具现在作用在这个窗口；窗口一关自动回到申请页标签。`
}

function createWindow() {
  win = new BrowserWindow({
    width: 1480,
    height: 940,
    minWidth: 980,
    minHeight: 600,
    show: !SMOKE || SMOKE === "window",
    title: app.getName(),
    backgroundColor: "#f6f1e7",
    webPreferences: { preload: join(here, "../preload/index.cjs"), contextIsolation: true, sandbox: true },
  })

  // The application page: an ordinary, persistent browser profile. Logins survive restarts.
  page = new WebContentsView({ webPreferences: { partition: "persist:application", contextIsolation: true, sandbox: true } })
  // The host pair exists before the first navigation: nav events fire at once and the toolbar reads them.
  electronHost = { page: electronPage(page.webContents), cdp: new Cdp(electronTransport(page.webContents)) }
  win.contentView.addChildView(page)
  layout()
  win.on("resize", layout)
  // The window changing size by itself has been seen in a real run; whenever it happens, the log should say when.
  for (const evt of ["maximize", "unmaximize", "enter-full-screen", "leave-full-screen"] as const) win.on(evt as any, () => (windowEvents.push(evt), log.info(`window ${evt}`, { bounds: win.getBounds() })))

  const c = page.webContents
  win.webContents.on("render-process-gone", (_e, details) => log.error("sidebar renderer gone", { ...details }))

  // Windows that open OUTSIDE the page cannot be clicked away from inside it, and would stall an unattended run:
  // a "save as" panel, the system asking for the camera or for notifications, a browser-level password box.
  const session = c.session
  session.on("will-download", (_e, item) => {
    // Into the student's workspace; self-tests have none and must not litter the consultant's Downloads folder.
    const dir = state.workspace ? join(state.workspace, "downloads") : SMOKE ? join(app.getPath("temp"), "neo-smoke-downloads") : app.getPath("downloads")
    mkdirSync(dir, { recursive: true })
    const file = join(dir, item.getFilename().replace(/[\\/:]/g, "_") || "download")
    item.setSavePath(file) // no "save as" panel
    item.once("done", (_evt, result) => {
      pageLog.info("download", { file, result, bytes: item.getReceivedBytes() })
      browser?.addNote(result === "completed" ? `页面下载了一个文件，已存到 ${file}` : `页面想下载 “${item.getFilename()}”，没有成功（${result}）`)
    })
  })
  const harmless = new Set(["clipboard-sanitized-write", "clipboard-read", "fullscreen", "pointerLock", "window-management"])
  session.setPermissionRequestHandler((_wc, permission, allow, details) => {
    const ok = harmless.has(permission)
    if (!ok) {
      pageLog.info("permission refused", { permission, url: details.requestingUrl })
      browser?.addNote(`页面想要 “${permission}” 权限（摄像头 / 定位 / 通知这一类），已拒绝，没有弹系统窗口。申请表真的需要它时（比如视频面试），告诉顾问。`)
    }
    allow(ok)
  })
  c.on("login", (event, details, _authInfo, cancel) => {
    // A browser-level user name / password box: never ours to fill, and there is no window for it here.
    event.preventDefault()
    pageLog.warn("http auth requested", { url: details.url })
    browser?.addNote("这个网址要求浏览器级的用户名和密码（HTTP 认证），应用里没有这个输入框。告诉顾问。")
    cancel()
  })

  if (process.env.ELECTRON_RENDERER_URL) void win.loadURL(process.env.ELECTRON_RENDERER_URL)
  else void win.loadFile(join(here, "../renderer/index.html"))
}

// ------------------------------------------------------------------ the consultant's decision on reserved actions

/** Unattended runs have nobody to ask: the answer is no, and the run notes that the question came up. */
const refusedUnattended: { kind: string; label: string }[] = []

function confirmRisk(risk: { kind: RiskAsk["kind"]; label: string; url: string }) {
  if (SMOKE) return (refusedUnattended.push({ kind: risk.kind, label: risk.label }), Promise.resolve<RiskDecision>("deny"))
  return new Promise<RiskDecision>((resolve) => {
    const ask: RiskAsk = { id: randomUUID(), kind: risk.kind, title: RISK_TITLES[risk.kind], label: risk.label, url: risk.url }
    riskWaiters.set(ask.id, { ask, resolve })
    toRenderer("risk:ask", ask)
    win.flashFrame(true)
  })
}

function dismissRiskQuestions() {
  for (const [id, waiter] of riskWaiters) {
    waiter.resolve("deny")
    riskWaiters.delete(id)
    toRenderer("risk:closed", id)
  }
}

// ------------------------------------------------------------------ credits: meter what the model actually used

/** tokens per assistant message of the current conversation; summed and reported when the model pauses */
const messageTokens = new Map<string, TokenUsage>()
let lastSyncedAt = 0

function meter(evt: any) {
  const info = evt?.properties?.info
  if (evt?.type === "message.updated" && info?.role === "assistant" && info.tokens) messageTokens.set(info.id, normalizeTokens(info.tokens))
  const stepDone = evt?.type === "message.part.updated" && evt.properties?.part?.type === "step-finish"
  if (evt?.type === "session.idle" || (stepDone && Date.now() - lastSyncedAt > 60_000)) void reportUsage()
}

async function reportUsage() {
  const sessionID = state.sessionID
  if (!sessionID || messageTokens.size === 0) return
  lastSyncedAt = Date.now()
  const total = [...messageTokens.values()].reduce(addTokens, emptyTokens())
  try {
    const quota = await syncTokenUsage(sessionID, state.workspace, total)
    if (quota && state.auth) {
      state.auth = { ...state.auth, quota }
      publish()
    }
  } catch (error) {
    createLogger("auth").warn("usage sync failed; will retry at the next pause", { error })
  }
}

// ------------------------------------------------------------------ opencode

async function listModels(connected: Set<string> | null): Promise<ModelOption[]> {
  const res = await opencode!.client.config.providers()
  // The consultant's own servers (settings screen + local.env) think at the level set there unless the picker says otherwise.
  const own = ownConfigs()
  const ownThinking = new Map(own.map((own) => [own.providerID, own.thinking]))
  // Whether a model sees images is answered BY OUR CONFIG FILE for every model it spells out (cloud rows and own servers):
  // opencode does not reliably echo `attachment` back for injected models, and this flag decides whether screenshots go.
  const fileSees = new Map<string, boolean>([
    ...cloudModels().map((row) => [modelRefOf(row.providerID!, row.model), row.sees] as const),
    ...own.flatMap((own) => Object.entries(own.provider.models as Record<string, { attachment?: boolean }>).map(([id, m]) => [modelRefOf(own.providerID, id), m.attachment === true] as const)),
  ])
  const efforts = modelEfforts()
  const hidden = new Set(hiddenModels())
  const out: ModelOption[] = []
  for (const provider of res.data?.providers ?? []) {
    for (const [modelID, model] of Object.entries(provider.models ?? {})) {
      const ref = modelRefOf(provider.id, modelID)
      if (hidden.has(ref)) continue // deleted from the settings screen — gone from the picker too
      const info = model as any
      const options = thinkingOptionsOf(Object.keys(info?.variants ?? {}))
      const chosen = efforts[ref] && options.includes(efforts[ref]) ? efforts[ref] : undefined
      out.push({
        providerID: provider.id,
        modelID,
        provider: provider.name || provider.id,
        label: info?.name || modelID,
        sees: seesOfListedModel(fileSees.get(ref), info),
        thinkingOptions: options,
        thinking: resolveThinking(options, chosen, ownThinking.get(provider.id) ?? ""),
        thinkingChosen: chosen,
      })
    }
  }
  return pickerUsable(out, connected)
}

/**
 * Which providers hold a REAL credential on this machine (null when the call does not answer — then nothing is filtered on a guess).
 * NOT `connected`: a provider merely DECLARED by our injected config is reported connected even with no credential
 * (its entry carries `source: "config"` and no `key` — probe 2026-10-01), which made the old filter useless against exactly
 * the case it was written for, and made applyCloudKeys skip writing the typed key ("already connected").
 * The honest signal is the entry's `key` field: absent without a credential, present once auth.set stored one.
 */
async function connectedProviderIds(client: OpencodeHandle["client"] = opencode!.client): Promise<Set<string> | null> {
  const res = await client.provider.list().catch((error) => (log.warn("provider list did not answer; not filtering by login", { error }), undefined))
  return credentialHolderIds(res?.data?.all)
}

/** Forms are read with eyes. Unless the consultant chose otherwise: MiniMax, whose token plan has room for everything — M3.1 first, plain M3 underneath it as the backup. */
const PREFERRED_MODELS = ["minimax-cn/MiniMax-M3.1-Flash-Preview", "minimax-cn/MiniMax-M3"]
const MODEL_CHOICE_ERA = 2

/** Cloud models the consultant is logged into but the settings screen does not list yet — shown there as rows that can be set default, edited into a row, or hidden. */
function liveCloudModels(): ModelOption[] {
  const listed = new Set([...listModelServers().map((s) => modelRefOf(s.providerID ?? serverProviderId(s.id ?? ""), s.model)), ...hiddenModels()])
  return state.models.filter((m) => !isOwnProviderId(m.providerID) && !listed.has(modelRefOf(m.providerID, m.modelID)))
}

async function newSession(title: string) {
  const created = await opencode!.client.session.create({ title })
  if (!created.data) throw new Error(`无法创建对话：${JSON.stringify(created.error)}`)
  state.sessionID = created.data.id
  messageTokens.clear()
  sessionLog.info("conversation created", { sessionID: state.sessionID, title })
  return created.data.id
}

const loggedUserMessages = new Set<string>()
let lastLoggedStatus = ""

/** The conversation as the log sees it: what the model did, asked and spent — never the streamed text deltas. */
function logSessionEvent(evt: any) {
  const p = evt?.properties ?? {}
  switch (evt?.type) {
    case "message.part.updated": {
      const part = p.part
      if (part?.type === "tool" && (part.state?.status === "completed" || part.state?.status === "error")) {
        const st = part.state
        // Our own browser tools already left a richer line under mod "tool"; keep OpenCode's view of them at debug.
        const level = st.status === "error" ? "warn" : String(part.tool).startsWith("browser_") ? "debug" : "info"
        sessionLog[level](`tool ${part.tool} ${st.status}`, {
          callID: part.callID,
          ms: st.time?.end && st.time?.start ? st.time.end - st.time.start : undefined,
          title: st.title,
          input: st.input,
          error: st.error,
        })
      }
      if (part?.type === "text" && part.time?.end && !part.synthetic) sessionLog.info("assistant text", { messageID: part.messageID, text: part.text })
      if (part?.type === "step-finish") sessionLog.info("step finished", { reason: part.reason, cost: part.cost, tokens: part.tokens })
      break
    }
    case "message.updated":
      if (p.info?.role === "user" && !loggedUserMessages.has(p.info.id)) {
        loggedUserMessages.add(p.info.id)
        sessionLog.debug("user message stored", { messageID: p.info.id })
      }
      if (p.info?.error) sessionLog.error("message error", { messageID: p.info.id, model: `${p.info.providerID}/${p.info.modelID}`, error: p.info.error })
      break
    case "session.status":
      if (p.status?.type === "retry") sessionLog.warn("model call retrying", { attempt: p.status.attempt, message: p.status.message })
      else if (p.status?.type !== lastLoggedStatus && p.status?.type !== "idle") sessionLog.info(`status ${p.status?.type}`)
      lastLoggedStatus = p.status?.type ?? ""
      break
    case "session.idle":
      if (lastLoggedStatus !== "idle:logged") sessionLog.info("idle")
      lastLoggedStatus = "idle:logged"
      break
    case "session.error":
      sessionLog.error("session error", { error: p.error })
      break
    case "session.compacted":
      sessionLog.info("context compacted")
      break
    case "question.asked":
      sessionLog.info("question asked", { requestID: p.id, questions: p.questions?.map((q: any) => ({ header: q.header, question: q.question, options: q.options?.map((o: any) => o.label) })) })
      break
    case "question.replied":
      sessionLog.info("question answered", { requestID: p.requestID, answers: p.answers })
      break
    case "question.rejected":
      sessionLog.info("question dismissed", { requestID: p.requestID })
      break
    case "permission.asked":
      sessionLog.warn("permission asked (unexpected while everything is allowed)", { permission: p.permission, patterns: p.patterns })
      break
  }
}

async function pumpEvents(handle: OpencodeHandle) {
  while (opencode === handle) {
    try {
      const events = await handle.client.event.subscribe()
      for await (const evt of events.stream as AsyncIterable<any>) {
        if (opencode !== handle) return
        const sessionID = evt?.properties?.sessionID ?? evt?.properties?.info?.sessionID ?? evt?.properties?.part?.sessionID
        if (sessionID && sessionID !== state.sessionID) continue
        logSessionEvent(evt)
        meter(evt)
        for (const tap of eventTaps) tap(evt)
        toRenderer("oc:event", evt)
      }
    } catch (error) {
      if (opencode === handle) sessionLog.warn("event stream dropped; reconnecting", { error })
    }
    await new Promise((r) => setTimeout(r, 800))
  }
}

function stopOpencode() {
  if (!opencode) return
  void reportUsage()
  dismissRiskQuestions()
  opencode.stop()
  opencode = undefined
  state.sessionID = undefined
  state.workspace = ""
}

/**
 * Boot OpenCode for a workspace and hand it the settings screen's cloud-provider keys. The keys go through
 * auth.set (opencode's own private credential store), never through the injected config — that env string is
 * readable by the model's shell tool. Keys only take effect at boot, so the first application restarts once;
 * never a second time: a key that still did not take stays visible as the "key missing" notice, not a restart loop.
 */
async function startIsolated(directory: string): Promise<OpencodeHandle> {
  for (let round = 0; ; round++) {
    const handle = await startOpencode({ workspace: directory, mcp: mcp! })
    const applied = await applyCloudKeys(handle)
    if (!applied || round) return handle
    log.info("restarting opencode once: newly applied cloud keys only take effect at boot")
    handle.stop()
  }
}

/** Every stored provider key whose provider does not already hold a credential, written into opencode's auth store. The keys themselves never go into a log line. */
async function applyCloudKeys(handle: OpencodeHandle): Promise<number> {
  // The credential-holding list, NOT `connected` — a config-declared provider sits in `connected` without any key,
  // and the old check here read that as "already logged in", silently dropping the Key the consultant had just typed.
  const connected = (await connectedProviderIds(handle.client)) ?? new Set<string>()
  let applied = 0
  for (const row of cloudModels()) {
    if (!row.providerID || !row.apiKey || connected.has(row.providerID)) continue
    const ok = await handle.client.auth.set({ providerID: row.providerID, auth: { type: "api", key: row.apiKey } }).then(() => true).catch((error) => (log.warn("opencode refused a stored cloud key", { providerID: row.providerID, error }), false))
    if (ok) (applied++, log.info("cloud provider key applied to opencode's own store", { providerID: row.providerID }))
  }
  return applied
}

/** OpenCode runs inside one folder at a time — the student's. Switching students restarts it (about a second). */
async function useWorkspace(directory: string) {
  // The guide is ours and travels with the app version, so EVERY entry into a workspace refreshes it —
  // a 继续 on a conversation that gets no opening message, a 【重开】, a corner created months ago.
  // Rules added after a folder was first created thus reach the applications already in flight.
  await writeGuide(directory).catch((error) => log.warn("could not refresh the workspace guide", { error }))
  if (opencode && opencode.directory === directory) return
  stopOpencode()
  state.workspace = directory
  const handle = await startIsolated(directory)
  opencode = handle
  state.opencodeBinary = handle.binary
  const connected = await connectedProviderIds()
  // Cloud models only where this machine holds the login — an injected row alone does not promise the model answers (that was the "Anthropic API key missing" surprise on a machine that never logged into MiniMax).
  state.models = await listModels(connected)
  const [envProvider, ...envModel] = (process.env.NEO_MODEL || "").split("/")
  // A choice made before forms were read with eyes (the saved model could not see its own screenshots) does not
  // outrank the default that can; a choice made since then does.
  const settings = loadSettings()
  const saved = envModel.length ? { providerID: envProvider, modelID: envModel.join("/") } : settings.modelPickedFor === MODEL_CHOICE_ERA ? settings.model : undefined
  const has = (ref?: ModelRef) => ref && state.models.some((m) => m.providerID === ref.providerID && m.modelID === ref.modelID)
  // Is the consultant's own server there right now? (A home-network address is dead on the road.) A server counts as
  // chosen — the saved pick, or the default set in the settings screen — only while it answers; otherwise the cloud model that can see and think.
  const owns = ownConfigs()
  const savedOwn = saved && owns.find((own) => own.providerID === saved.providerID)
  const defaultOwn = defaultOwnConfig(owns)
  const reachable = new Map<string, boolean>()
  const toProbe = new Set([savedOwn, defaultOwn].filter((own): own is OwnModelConfig => Boolean(own)))
  await Promise.all([...toProbe].map(async (own) => reachable.set(own.providerID, (await probeModelServer({ baseURL: own.provider.options.baseURL, apiKey: own.provider.options.apiKey })).ok)))
  if (defaultOwn && reachable.get(defaultOwn.providerID) !== true && (!has(saved) || (savedOwn && savedOwn.providerID === defaultOwn.providerID))) {
    log.warn("own model server does not answer; falling back to the cloud default", { name: defaultOwn.provider.name, baseURL: defaultOwn.provider.options.baseURL })
    toRenderer("notice", `连不上默认用的模型服务器「${defaultOwn.provider.name}」（不在那个网络里？），这次先用云端的默认模型。`)
  }
  // One default for every kind of model (the settings screen writes a single ref): an own server counts only while
  // it answers, a cloud model only while its login is alive (it is still in the list). Behind whatever wins sits the MiniMax chain.
  const defOwn = defaultOwn ? { providerID: defaultOwn.providerID, modelID: defaultOwn.modelID } : undefined
  const rawDefault = parseModelRef(defaultModelRef() ?? "")
  const defCloud = rawDefault && !isOwnProviderId(rawDefault.providerID) ? rawDefault : undefined
  // has() reads the filtered list, so a cloud default counts only while its login is on this machine.
  const defaultUsable = (defOwn && reachable.get(defOwn.providerID) === true ? defOwn : undefined) ?? (defCloud && has(defCloud) ? defCloud : undefined)
  if (defCloud && !has(defCloud)) {
    const why = connected && !connected.has(defCloud.providerID) ? "还没有填过这个服务商的 Key——到「设置」里那张卡片点【编辑】填一次即可" : "登录还在吗？"
    log.warn("default cloud model is not there; falling back", { ref: modelRefOf(defCloud.providerID, defCloud.modelID), why })
    toRenderer("notice", `默认的云端模型「${defCloud.modelID}」这次用不了（${why}），先用兜底的模型。`)
  }
  const candidates = [...(defaultUsable ? [modelRefOf(defaultUsable.providerID, defaultUsable.modelID)] : []), ...PREFERRED_MODELS]
  const preferred = candidates.map((id) => ({ providerID: id.split("/")[0], modelID: id.split("/").slice(1).join("/") })).find(has)
  const savedUsable = has(saved) && (!savedOwn || reachable.get(savedOwn.providerID) === true || envModel.length > 0)
  state.model = savedUsable ? saved : preferred
  if (!state.model) toRenderer("notice", "现在没有任何能用的模型：云端模型要先拿到这台电脑上——到「设置」里那张模型卡片点【编辑】，把服务商的 API Key 填进去（MiniMax 的 key 在 MiniMax 开放平台拿）；或者「添加自己的模型服务器」。")
  void pumpEvents(handle)
}

/**
 * The model servers are baked into the `opencode serve` spawn, so a change on the settings screen restarts it in
 * place: same folder, same conversation (sessions live on disk under it), model preference re-derived. Credits are
 * charged on a conversation's running total, so the meter starts again from what it already used.
 */
async function applyModelServers() {
  if (!opencode) return
  const directory = opencode.directory
  const previous = state.sessionID
  const before = state.model
  if (previous) await opencode.client.session.abort({ sessionID: previous }).catch(() => {})
  stopOpencode()
  try {
    await useWorkspace(directory)
  } catch (error) {
    state.phase = "failed"
    state.error = error instanceof Error ? error.message : String(error)
    log.error("restart after a model-server change failed", { error })
    publish()
    throw error
  }
  if (previous) {
    const known = (await opencode!.client.session.get({ sessionID: previous }).catch(() => undefined))?.data
    if (known) {
      state.sessionID = known.id
      messageTokens.clear()
      const history = (await opencode!.client.session.messages({ sessionID: known.id }).catch(() => undefined))?.data ?? []
      for (const m of history) if (m.info.role === "assistant" && (m.info as any).tokens) messageTokens.set(m.info.id, normalizeTokens((m.info as any).tokens))
    }
    if (state.task) state.task = { ...state.task, sessionID: state.sessionID }
  }
  if (state.model?.providerID !== before?.providerID || state.model?.modelID !== before?.modelID) {
    const label = state.models.find((m) => m.providerID === state.model?.providerID && m.modelID === state.model?.modelID)
    if (label) toRenderer("notice", `模型服务器变了，当前模型：${label.provider} · ${label.label}。`)
  }
  publish()
}

async function sendPrompt(text: string) {
  if (!opencode || !state.sessionID) throw new Error("AI 还没准备好")
  await ensureQuota()
  const chosen = state.models.find((m) => m.providerID === state.model?.providerID && m.modelID === state.model?.modelID)
  sessionLog.info("prompt", { sessionID: state.sessionID, model: state.model, variant: chosen?.thinking, sees: chosen?.sees, text })
  // OpenCode's own webfetch asks for pages over plain HTTP and is refused by anything with anti-scraping (a real run:
  // about 15 refusals out of 20 on search pages). browser_search / browser_open do the same job in a real browser, so
  // the broken path is taken away here — per message, because the same key in the injected config does nothing at all.
  const res = await opencode.client.session.promptAsync({
    sessionID: state.sessionID,
    model: state.model,
    variant: chosen?.thinking,
    tools: { webfetch: false },
    parts: [{ type: "text", text }],
  })
  if (res.error) throw new Error(JSON.stringify(res.error))
}

// ------------------------------------------------------------------ materials → text

async function readMaterials(studentDir: string) {
  if (!studentDir) throw new Error("当前没有打开任何学生的工作区。")
  toRenderer("materials:progress", { done: 0, total: 0, current: "正在查看材料" })
  try {
    return await extractMaterials(studentDir, (progress) => toRenderer("materials:progress", progress))
  } finally {
    toRenderer("materials:progress", null)
  }
}

/** What the model (and the first prompt) is told about the text versions. */
function describeExtraction(summary: Summary) {
  const failed = summary.entries.filter((e) => e.method === "failed")
  const lowTrust = summary.entries.filter((e) => e.method === "vision")
  // These used to appear only as a row in INDEX.md — a student's whole folder arrived as one .zip and the model was
  // never told that a part of the materials had not been read at all.
  const untouched = summary.entries.filter((e) => e.method === "unsupported")
  return [
    `材料共 ${summary.entries.length} 个文件，文字版在 materials_text/（先读 materials_text/INDEX.md）。这次新处理 ${summary.processed} 个，${summary.reused} 个没变化。`,
    failed.length ? `没能读出文字的：${failed.map((e) => `${e.file}（${e.note}）`).join("；")}。需要的话用 read 直接打开原文件；还是读不出就记进待顾问清单，最后一起问。` : "",
    lowTrust.length ? `${lowTrust.length} 个扫描件用的是低可信识别（这台电脑没装 PaddleOCR），姓名、证件号、成绩务必对照原件。` : "",
    untouched.length ? `这些文件软件读不了，里面的内容你现在看不到：${untouched.map((e) => e.file).join("；")}。要用的话用 read 打开，或者记进待顾问清单。` : "",
  ].filter(Boolean).join("\n")
}

// ------------------------------------------------------------------ tasks

/**
 * The opening message a task sends itself — one shared path for a first open AND for 【重开】: refresh the text
 * versions of the materials (cheap when nothing changed), then state the facts of this application once.
 * The prompt itself carries 「已有答案库直接用、不要重做」, so restarting never redoes corrected answers.
 */
async function sendStartPrompt(task: Task) {
  const extraction = await readMaterials(task.studentDir).catch((error) => (log.error("materials extraction failed", { error }), undefined))
  const materials = await countMaterials(task.studentDir)
  const described = state.task ?? task
  const hasResume = await hasResumeWorkspace(described.studentDir).catch(() => false)
  await sendPrompt(buildStartPrompt(described, materials, extraction ? describeExtraction(extraction) : undefined, existsSync(join(described.studentDir, "student_profile.json")), hasResume, getStudentMemo(described.studentDir))).catch((error) => {
    log.warn("could not start automatically", { error })
    toRenderer("notice", error instanceof Error ? error.message : String(error))
  })
}

/** The student has at least one LaTeX resume project (a resume-* folder under resume/). */
async function hasResumeWorkspace(studentDir: string): Promise<boolean> {
  const { readdir } = await import("node:fs/promises")
  const root = join(studentDir, "resume")
  const names = await readdir(root).catch(() => [])
  return names.some((n) => n.startsWith("resume-"))
}

/** The `resume_compile` MCP door: compile a LaTeX project (or bootstrap one) inside any workspace. */
async function compileResumeFolderForMcp(folder: string): Promise<string> {
  const { compileFolder } = await import("./resume/resume")
  const result = await compileFolder(folder)
  const tail = result.log
    .trim()
    .split("\n")
    .slice(-8)
    .join("\n")
  return `编译完成。\nLaTeX 工程：${result.item.tex}\n已导出：${result.item.exported}\n\n${tail}`
}

/** Runs at each scheduled slot (and on manual 【立即抓取】): fetch → match → tell the UI. */
const feedRunCallback = async () => {
  const ov = await runOnceNow()
  toRenderer("feed:state", ov)
  const n = ov.lastRun?.new ?? 0
  if (n > 0) toRenderer("notice", `岗位中心已抓到 ${n} 条新岗位，按学生画像筛好了。`)
}

/**
 * Which browser the task's page belongs to (Plan 2 stages 3-4): UCAS runs in the ego lite window —
 * Cloudflare reads OUR embedded view as a machine there, while the same debugger on ego arrives
 * clean (probe in docs/BROWSER.md) — and a challenge that does show up is something the consultant
 * can pass with their own hands in a real browser. The page now lives in an ego TASK SPACE (the
 * agent's own isolated space, official CLI for its lifecycle — docs/ROADMAP.md stage 4); the
 * ☰ 【用 ego lite】 switch (forceEgo) routes any other site the same way. Everything else stays
 * in the embedded view. `firstOpen` decides whether a tab that already exists gets navigated: a
 * reopened task must not wipe where the consultant left it.
 */
async function bindPageFor(target: string | undefined, firstOpen: boolean, forceEgo = false) {
  // A new task starts from the application tab again — popup tabs belong to the previous flow.
  await tabs?.resetToMain()
  if (process.env.NEO_EGO !== "off" && (forceEgo || egoMatches(target, egoHosts))) {
    await egoInstall // the first-launch copy must have finished before we start the browser from it
    const host = await EgoHost.ensure()
    if (host) {
      activeEgo = host
      const spaceName = `neo ${state.task?.input.studentName ?? ""} ${state.task?.input.company ?? ""}`.replace(/\s+/g, " ").trim()
      let entered = await host.enterTaskSpace(spaceName, target!, firstOpen).catch(async (error) => {
        log.warn("ego space entry failed", { error })
        toRenderer("notice", "这个 ego 空间还在你手里（你在 ego 窗口里接管了它）：在 ego 窗口里把它交回，或从任务列表重开这份任务。这一页暂时开在内置浏览器里。")
        activeEgo = null
        return { kind: "gave-up" as const }
      })
      if (entered.kind === "needs-onboarding") {
        // ego's own wizard is up and it just opened its welcome window. We touch NOTHING (CDP-
        // closing the wizard starves the official channel — measured, the two gates are separate);
        // the left pane explains and we ask again every few seconds. Once per machine, ever.
        void page.webContents.loadURL(fixture("ego-held.html#setup")).catch(() => {})
        toRenderer("notice", "第一次用 ego：请点完它刚弹出的欢迎窗口，点完这边自动继续（不用重开任务）。")
        const deadline = Date.now() + 10 * 60_000
        while (entered.kind === "needs-onboarding" && Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, 3000))
          entered = await host.enterTaskSpace(spaceName, target!, firstOpen).catch(() => ({ kind: "needs-onboarding" as const }))
        }
        if (entered.kind !== "ok") toRenderer("notice", "欢迎窗口还开着但一直没等到应答——这一页先退回内置浏览器；点完向导后可去任务列表重开。")
      }
      if (entered.kind === "ok") {
        await browser.bindHost(host.host)
        egoWatchOff?.()
        egoWatchOff = host.page.onChanged(() => toRenderer("nav:state", navState()))
        startOwnershipWatch(host)
        void page.webContents.loadURL(fixture("ego-held.html")).catch(() => {})
        log.info("task page runs in ego lite", { url: target })
        return
      }
    } else {
      toRenderer("notice", "ego lite 起不来，这一页退回内置浏览器——真撞上人机验证还是会循环，验证请在本机 Chrome 里做。")
    }
  }
  activeEgo = null
  egoWatchOff?.()
  stopOwnershipWatch()
  await browser.bindHost(electronHost)
  const onOurPages = page.webContents.getURL().startsWith("file:") || page.webContents.getURL() === "about:blank"
  if (target && (firstOpen || onOurPages)) void page.webContents.loadURL(target).catch(() => {})
  else if (!target && firstOpen) void page.webContents.loadURL(fixture("welcome.html")).catch(() => {})
}

async function openTask(taskDir: string, opts: { fresh?: boolean } = {}) {
  const task = await getTask(taskDir)
  // Moving to another page ends any handoff silently — the consultant is not coming back to that held page.
  if (browser?.humanHandoff) await browser.takeBackFromHuman().catch(() => undefined)
  if (opts.fresh) {
    // 【重开】: whatever was running goes quiet first — a stuck turn must not keep talking into the new conversation.
    // Settle credits while the OLD task is still the one in state, before anything is overwritten.
    if (opencode && state.sessionID) await opencode.client.session.abort({ sessionID: state.sessionID }).catch(() => undefined)
    dismissRiskQuestions()
    if (state.task && state.sessionID) await reportUsage().catch(() => undefined)
  }
  state.view = "task"
  state.task = task
  state.phase = "starting"
  state.error = undefined
  layout()
  publish()
  try {
    await useWorkspace(task.studentDir)

    // Pick the conversation up where it was left; a fresh never-opened task — and a 【重开】, which forgets the known one — start a new session.
    const known = opts.fresh || !task.sessionID ? undefined : (await opencode!.client.session.get({ sessionID: task.sessionID }).catch(() => undefined))?.data
    const firstOpen = !known
    if (known) {
      state.sessionID = known.id
      // Credits are charged on the conversation's running total, so a reopened one must start from what it already used.
      messageTokens.clear()
      const history = (await opencode!.client.session.messages({ sessionID: known.id }).catch(() => undefined))?.data ?? []
      for (const m of history) if (m.info.role === "assistant" && (m.info as any).tokens) messageTokens.set(m.info.id, normalizeTokens((m.info as any).tokens))
    } else {
      await newSession(`${task.input.company} · ${task.input.jobTitle}`)
    }
    await updateTask(task.taskDir, { sessionID: state.sessionID, lastOpenedAt: new Date().toISOString() })
    state.task = { ...task, sessionID: state.sessionID }

    await bindPageFor(task.input.applicationUrl, firstOpen, egoManual.has(task.taskDir))

    state.phase = "ready"
    log.info("task opened", { taskDir: task.taskDir, sessionID: state.sessionID, firstOpen, url: task.input.applicationUrl })
    publish()

    if (firstOpen) {
      // The consultant already said what they want by creating the task; do not make them type "开始" — and a 【重开】 lands here too, same opening message.
      await sendStartPrompt(task)
    } else {
      // Even a resumed conversation gets the text versions refreshed: cheap when nothing changed, and the model should never have to OCR by guesswork.
      await readMaterials(task.studentDir).catch((error) => (log.error("materials extraction failed", { error }), undefined))
    }
  } catch (error) {
    state.phase = "failed"
    state.error = error instanceof Error ? error.message : String(error)
    log.error("open task failed", { taskDir, error })
    publish()
  }
  return state
}

/**
 * A conversation with no application attached. Two kinds, because a consultant asks two kinds of question:
 * something general (a folder of its own, named for the day and the topic, so the notes survive), or something about
 * one student — then it opens THAT student's workspace, where the materials and the answer bank already are. Never a
 * second copy of a student who already has a folder.
 */
async function openPlaygroundIn(choice: { kind: "fresh"; topic?: string } | { kind: "student"; studentDir: string }) {
  if (choice.kind === "student") return openPlayground(choice.studentDir, `问问题 · ${basename(choice.studentDir)}`)
  const day = new Date().toLocaleDateString("sv")
  const topic = (choice.topic ?? "").trim().replace(/[\\/:*?"<>|]/g, " ").slice(0, 40)
  const dir = await ensureWorkspace(join("自由对话", `${day} ${topic || "随便聊聊"}`.trim()))
  return openPlayground(dir, topic || "自由对话")
}

/** A conversation with no task attached — for trying things out on the practice form. */
async function openPlayground(directory?: string, title = "自由对话") {
  state.view = "task"
  state.task = undefined
  state.phase = "starting"
  state.error = undefined
  layout()
  publish()
  try {
    const dir = directory ?? (await ensureWorkspace("playground"))
    await useWorkspace(dir)
    await newSession(title)
    // A free conversation never runs in ego: whatever page a task had parked in the ego window stays there untouched.
    activeEgo = null
    egoWatchOff?.()
    await browser.bindHost(electronHost)
    // Somebody else's page is nobody's business: only the plain welcome page, and only when this is a fresh corner.
    if (!directory || directory.includes("自由对话")) void page.webContents.loadURL(fixture("welcome.html")).catch(() => {})
    log.info("free chat opened", { directory: dir, title })
    state.phase = "ready"
  } catch (error) {
    state.phase = "failed"
    state.error = error instanceof Error ? error.message : String(error)
    log.error("open playground failed", { error })
  }
  publish()
  return state
}

function goHome() {
  if (opencode && state.sessionID) void opencode.client.session.abort({ sessionID: state.sessionID }).catch(() => {})
  if (browser?.humanHandoff) void browser.takeBackFromHuman().catch(() => undefined)
  stopOpencode()
  state.view = "home"
  state.task = undefined
  state.phase = "ready"
  state.error = undefined
  layout()
  publish()
  return state
}

async function refreshAuth(): Promise<AuthStatus> {
  state.auth = await authStatus()
  publish()
  return state.auth
}

// ------------------------------------------------------------------ boot

/** Every exit goes through here (app.exit skips before-quit): the tab machinery must know it is teardown. */
function exitApp(code: number) {
  if (tabs) tabs.quitting = true
  app.exit(code)
}

async function boot() {
  const started = Date.now()
  try {
    electronHost = { page: electronPage(page.webContents), cdp: new Cdp(electronTransport(page.webContents)) }
    tabs = new TabsHost()
    tabs.showRealWindows = !SMOKE
    tabs.adoptMain(page, electronHost)
    tabs.onStateChanged = () => {
      toRenderer("tabs:state", tabs!.list())
      toRenderer("nav:state", navState())
    }
    tabs.onNote = (text) => browser?.addNote(text)
    tabs.onActiveChanged = (host) => void browser.bindHost(host).then(() => toRenderer("nav:state", navState()))
    tabs.onRealWindow = wireRealWindow
    tabs.onNewView = (view) => {
      if (win && !win.isDestroyed()) win.contentView.addChildView(view)
    }
    tabs.onRemoveView = (view) => {
      if (win && !win.isDestroyed()) win.contentView.removeChildView(view)
    }
    browser = new BrowserController(electronHost, {
      workspace: () => state.workspace || app.getPath("temp"),
      confirmRisk,
      // 2026-10-16 多标签: the snapshot header tells the truth about the current tab (popup tabs have
      // no window.opener; a real window from browser_open_in_window does), and the tab tools ride
      // these doors — the controller itself stays transport-shaped.
      pageIntro: () => tabs?.introForActive(),
      tabsList: () => tabs?.formatList() ?? "（当前没有标签页机制。）",
      switchTab: async (id) => {
        const host = await tabs?.activate(id)
        if (!host) return "已经在这个标签页上了。"
        await browser.bindHost(host)
        return "已切到这个标签页。"
      },
      openInRealWindow: openInRealWindow,
      // Auto-login (ROADMAP 2026-10-09 B / 2026-10-12): the controller gets a door to the encrypted store, and only while the
      // open task opted in. The pair the model carries in as arguments is trusted (the consultant gave it) and lands in the
      // store straight away — that path skips the materials scan entirely. Everything else goes through login-creds.ts.
      loginCredentials: async (explicit) => {
        const t = state.task
        const url = t?.input.applicationUrl
        if (!t?.input.allowAutoLogin || !url) return undefined
        const store = {
          getPassword: getPlatformPassword,
          getAccount: getPlatformAccount,
          savePassword: savePlatformPassword,
          saveAccount: savePlatformAccount,
        }
        if (explicit?.password) return resolveCredentials({ kind: "none" }, url, store, explicit)
        // 2026-10-10 用户点单：资料里的记录是正源——主进程自己扫学生的材料找这一站，认出来就用、顺手缓存，
        // 扫描在软件侧做，结果不进模型上下文。决策面整套搬进 login-creds.ts 独立钉住（2026-10-11 实测轮：
        // 「loose 跳缓存」这种调用方行为，光靠读代码确认等于没钉）。
        const scan = await scanMaterialsForLogin(t.studentDir, url)
        return resolveCredentials(scan, url, store)
      },
      // 2026-10-12 review P2: the door cached the explicit pair on receipt; the site just denied it —
      // drop that platform's entry again so a wrong password is not handed out by the next zero-arg call.
      discardDeniedExplicit: () => {
        const url = state.task?.input.applicationUrl
        if (url) clearPlatformAccount(url)
      },
      onActivity: (text) => toRenderer("activity", text),
      onHandoff: (on, why) => {
        state.humanHandoff = on || undefined
        publish()
        if (on)
          toRenderer(
            "notice",
            activeEgo
              ? why === "gate"
                ? "碰到机器人验证页：切到 ego lite 窗口，亲手点验证、输密码（这个勾选框 AI 不碰），工具已经停手不再动这一页。弄完点右侧的【我操作完了，交回 AI】。"
                : "页面交给你了：切到 ego lite 窗口亲手操作（那本来就是真浏览器窗口），工具已停手。完事点【我操作完了，交回 AI】，AI 接着来。"
              : why === "gate"
                ? "碰到机器人验证页：这类关卡探得到工具的调试协议，挂着的时候谁点都会无限重验——工具已放手，并已替你刷新这一页，验证会在干净状态下重跑。还反复的话点左上角再刷新一次；亲手点验证、输密码，弄完点右侧的【我操作完了，交回 AI】。"
                : "页面交给你了：工具已断开，你亲手操作完点【我操作完了，交回 AI】，AI 接着来。",
          )
      },
    })
    await browser.start()
    mcp = await startBrowserMcp(browser, (text) => toRenderer("activity", text), async () => describeExtraction(await readMaterials(state.workspace)), { search: searchWeb, open: openWeb }, compileResumeFolderForMcp)
    log.info("browser tools listening", { url: mcp.url, ms: Date.now() - started })

    if (SMOKE) {
      // Self-tests must not touch ~/Documents (macOS would stop to ask for folder access) or need a login.
      process.env.NEO_WORKSPACES_ROOT ||= join(app.getPath("temp"), "neo-app-agent-smoke")
      process.env.NEO_AUTH = "off"
      // Only the real-model runs talk to the real Jev; the rest script it, so they need no network and burn no quota.
      if (SMOKE !== "e2e" && SMOKE !== "agent" && SMOKE !== "do" && SMOKE !== "run" && SMOKE !== "real") process.env.NEO_JEV = "off"
      return void exitApp(await runSelfTest())
    }

    state.auth = await authStatus()
    state.phase = "ready"
    log.info("ready", { ms: Date.now() - started, signedIn: state.auth.authenticated, authConfigured: state.auth.configured })
    // Plan 2: put the bundled ego lite into our runtime directory in the background (400MB copy, so not on
    // the UI path). Skipped by self-tests and by the dev screenshot/form hooks — those run on dev machines
    // where a copy into the shared userData would be pure noise.
    if (!SMOKE && !process.env.NEO_SHOT && !process.env.NEO_MODEL_SERVER_TEST) egoInstall = installEgoRuntime()
    // The daily job-fetch scheduler: Beijing 13:00 + US Eastern 13:00, with a catch-up after sleep.
    if (!SMOKE && !process.env.NEO_SHOT) {
      feedScheduler = startFeedScheduler(feedRunCallback, feedRunFinishedAt)
    }
    if (process.env.NEO_SHOT) void devScreenshot(process.env.NEO_SHOT)
    if (process.env.NEO_TASK_FILE && !app.isPackaged) void devOpenTask(process.env.NEO_TASK_FILE)
    if (process.env.NEO_MODEL_SERVER_TEST && !app.isPackaged) void devModelServerTest(process.env.NEO_MODEL_SERVER_TEST)
  } catch (error) {
    state.phase = "failed"
    state.error = error instanceof Error ? error.message : String(error)
    log.error("boot failed", { error })
    if (SMOKE) exitApp(1)
  }
  publish()
}

async function runSelfTest() {
  if (SMOKE === "tasks") return runTaskSmoke()
  if (SMOKE === "feed") return runFeedSmoke()
  if (SMOKE === "resume") return runResumeSmoke()
  if (SMOKE === "real") return runReal()
  if (SMOKE === "materials") return runMaterialsSmoke(page.webContents)
  // A hidden WebContentsView swallows injected mouse events, so the page must be "on screen" like in a real task.
  state.view = "task"
  layout()
  if (SMOKE === "browser") return runSmoke(browser, electronHost.page)
  if (SMOKE === "ego") return runEgoSmoke(browser)
  if (SMOKE === "do") return runDoSmoke()
  if (SMOKE === "e2e") return runEndToEnd()
  if (SMOKE === "run") return runUnattended()
  if (SMOKE === "window") return runWindowSmoke()
  if (SMOKE === "search") return runSearchSmoke()
  await useWorkspace(await ensureWorkspace("playground"))
  await newSession("self-test")
  const [providerID, ...rest] = (process.env.NEO_MODEL || "").split("/")
  const code = await runAgentSmoke({
    client: opencode!.client,
    sessionID: state.sessionID!,
    model: rest.length ? { providerID, modelID: rest.join("/") } : state.model,
    variant: state.models.find((m) => (rest.length ? m.providerID === providerID && m.modelID === rest.join("/") : m.providerID === state.model?.providerID && m.modelID === state.model?.modelID))?.thinking,
    browser,
    contents: page.webContents,
    tap: (listener) => (eventTaps.add(listener), () => eventTaps.delete(listener)),
  })
  stopOpencode()
  return code
}

/**
 * `bun run smoke:e2e` — the product's main path with a real model and no scripted instruction:
 * create a task → it opens and starts itself → the model reads the materials, fills the practice form, saves →
 * leave and come back → the same conversation is there.
 */
async function runEndToEnd() {
  const { mkdtemp, writeFile, readdir } = await import("node:fs/promises")
  const { rm } = await import("node:fs/promises")
  await rm(process.env.NEO_WORKSPACES_ROOT!, { recursive: true, force: true })
  const source = await mkdtemp(join(app.getPath("temp"), "neo-e2e-student-"))
  await writeFile(
    join(source, "学生信息表.md"),
    [
      "# 学生信息表", "", "- 姓名：张美玲（Meiling Zhang）", "- 邮箱：meiling.zhang@example.com", "- 出生日期：2003 年 5 月 17 日", "- 国籍：中国；省份：浙江（Zhejiang）",
      "- 手机：13812345678", "- 最高学历：本科（Bachelor's），专业 Computer Science，荣誉毕业（honors）", "- 英语考试：雅思 IELTS", "- 推荐人：李教授，prof.li@example.edu", "",
      "成绩单原件还没拿到，这次不用上传。",
    ].join("\n"),
  )
  const task = await createTask({
    studentName: "张美玲", sourceFolder: source, jobType: "实习", taskGoal: "全流程投递", outputLanguage: "zh", allowUpload: false,
    company: "Practice Co", jobTitle: "Data Science Intern", applicationUrl: fixture("form.html"), notes: "这是练习用的申请表，填完点 Save 保存成功即可。",
  })

  const code = await runAgentSmoke({
    client: undefined as any, // the task opens its own conversation; runAgentSmoke only listens
    sessionID: "",
    browser,
    contents: page.webContents,
    tap: (listener) => (eventTaps.add(listener), () => eventTaps.delete(listener)),
    start: async () => void (await openTask(task.taskDir)),
    answer: (requestID, answers) => opencode!.client.question.reply({ requestID, answers }).then(() => {}),
  })

  // Is the fetch tool we switched off really unavailable? A config key that silently does nothing would leave the
  // model reaching for the path anti-scraping refuses. `tool.list` only reports built-ins (our MCP tools are not in
  // it), so ask by behaviour: tell it to use webfetch and see what comes back.
  const attempt = await tryWebfetch()
  console.log(`${attempt.blocked ? "PASS" : "FAIL"}  webfetch is not available to the model — it has browser_search / browser_open instead (${attempt.how})`)

  const firstSession = state.sessionID
  const notes = (await readdir(task.studentDir)).filter((name) => name === "student_profile.json")
  console.log(`${notes.length ? "PASS" : "FAIL"}  the model wrote the answer bank student_profile.json (workspace: ${(await readdir(task.studentDir)).join(", ")})`)
  goHome()
  await openTask(task.taskDir)
  const history = (await opencode!.client.session.messages({ sessionID: state.sessionID! })).data ?? []
  const resumed = state.sessionID === firstSession && history.length > 1
  console.log(`${resumed ? "PASS" : "FAIL"}  reopening the task resumes the same conversation (${history.length} messages)`)

  // 【重开】: the same task starts over — a new conversation, the opening message sent again, and the answer bank
  // the first run wrote stays on disk (the prompt itself orders the model not to redo it).
  await openTask(task.taskDir, { fresh: true })
  // The opening travels through promptAsync: the request answers before the user message is stored, so
  // the fresh history has to be given a moment to actually hold it — poll, do not read at the instant.
  let freshHistory = (await opencode!.client.session.messages({ sessionID: state.sessionID! })).data ?? []
  for (let waited = 0; waited < 30 && !freshHistory.some((m) => m.info.role === "user"); waited++) {
    await new Promise((r) => setTimeout(r, 1000))
    freshHistory = (await opencode!.client.session.messages({ sessionID: state.sessionID! }).catch(() => undefined))?.data ?? []
  }
  const firstUserText = (freshHistory.find((m) => m.info.role === "user")?.parts ?? []).filter((p: any) => p.type === "text").map((p: any) => p.text).join("")
  const restarted = state.sessionID !== firstSession && firstUserText.includes("【开场 · Opening】") && existsSync(join(task.studentDir, "student_profile.json"))
  console.log(`${restarted ? "PASS" : "FAIL"}  【重开】 starts a new conversation from the opening message, files kept (${freshHistory.length} message(s), bank ${existsSync(join(task.studentDir, "student_profile.json")) ? "still there" : "GONE"})`)

  // The picker's effort choice: a saved level beats the automatic one from the next message on, without a restart (then left as found).
  const picked = state.models.find((m) => m.providerID === state.model?.providerID && m.modelID === state.model?.modelID)
  let effortOk = true
  if (picked && (picked.thinkingOptions?.length ?? 0) > 1) {
    const wanted = picked.thinkingOptions!.find((level) => level !== picked.thinking) ?? picked.thinkingOptions![0]
    setModelEffort(modelRefOf(picked.providerID, picked.modelID), wanted)
    state.models = await listModels(await connectedProviderIds())
    const after = state.models.find((m) => m.providerID === picked.providerID && m.modelID === picked.modelID)
    effortOk = after?.thinking === wanted && after?.thinkingChosen === wanted
    setModelEffort(modelRefOf(picked.providerID, picked.modelID), null)
    console.log(`${effortOk ? "PASS" : "FAIL"}  picking a thinking level changes the variant sent, without a restart (${picked.thinking} → ${wanted})`)
  } else console.log(`PASS  effort picker has nothing to offer for ${picked?.label ?? "the model"} (no levels) — automatic level stands`)
  stopOpencode()
  return code || (notes.length && resumed && attempt.blocked && restarted && effortOk ? 0 : 1)
}

/**
 * `electron . --smoke-window` — with the window really on screen: does anything the browser tools do make the window
 * change size or zoom by itself (seen on a real run: "the window keeps maximizing and going back")? Each action is
 * followed by a look at the window's bounds and the maximize / full-screen events.
 */
async function runWindowSmoke() {
  await page.webContents.loadURL(fixture("form.html"))
  await new Promise((r) => setTimeout(r, 1200))
  const snap = await browser.snapshot()
  const ref = (role: string, name: string) => new RegExp(`- ${role} "${name}[^"]*"[^\\n]*\\[ref=(e\\d+)\\]`).exec(snap)?.[1] ?? ""
  const first = ref("textbox", "First name")
  let failures = 0
  const steps: Array<[string, () => Promise<unknown>]> = [
    ["click a text box", () => browser.click(first)],
    ["click it again (a person's double click)", () => browser.click(first, { doubleClick: true })],
    ["fill a text box", () => browser.fill(first, "Meiling")],
    ["fill_form", () => browser.fillForm([{ ref: first, value: "Mei" }, { ref: ref("textbox", "Last name"), value: "Zhang" }])],
    ["screenshot", () => browser.screenshot(false, false)],
    ["numbered screenshot", () => browser.screenshot(false, true)],
    ["full-page screenshot", () => browser.screenshot(true, false)],
    ["ruled screenshot", () => browser.screenshot(false, false, { grid: true })],
    ["click near the top edge of the page", () => browser.clickAt(200, 3, "页面最上沿")],
    ["snapshot", () => browser.snapshot()],
    ["press Tab", () => browser.pressKey("Tab")],
    // Meta+A must select all IN THE PAGE (a real run: the model pressed it and got the app's About window instead),
    // and no key we send may conjure a window of our own.
    ["select all in the page with Meta+A", async () => {
      await browser.fill(first, "Meiling Zhang")
      await browser.pressKey("Meta+A")
      const windows = BrowserWindow.getAllWindows().length
      // A focused text box keeps its selection to itself — getSelection() stays empty even when all of it is selected.
      const selected = await browser.evaluate(
        `(() => { const el = document.activeElement; return String(el && el.selectionEnd !== undefined && el.selectionStart !== undefined ? el.selectionEnd - el.selectionStart : (getSelection() || "").toString().length) })()`,
      )
      if (Number(selected) !== "Meiling Zhang".length || windows !== 1) throw new Error(`select-all did nothing (selected ${selected} of 13 chars, ${windows} windows)`)
    }],
    // The page answers Save with alert("… is required"): it must be gone again by itself, and the page must respond.
    ["a page alert (closed by the tool, page responsive afterwards)", async () => {
      const out = await browser.click(ref("button", "Save"))
      const alive = await Promise.race([browser.evaluate("1 + 1"), new Promise<string>((r) => setTimeout(() => r("frozen"), 2500))])
      if (!out.includes("已自动点掉") || alive !== "2") throw new Error(`alert not handled: page says ${alive}`)
    }],
  ]
  // The page's own idea of its size counts too: a viewport that balloons and snaps back looks like the window doing it.
  await page.webContents.executeJavaScript("window.__sizes = []; addEventListener('resize', () => __sizes.push(innerWidth + 'x' + innerHeight)); 0")
  for (const [name, act] of steps) {
    const before = JSON.stringify(win.getBounds())
    windowEvents.length = 0
    const error = await act().then(() => "", (e) => String(e?.message ?? e).slice(0, 120))
    await new Promise((r) => setTimeout(r, 700))
    const sizes: string[] = await page.webContents.executeJavaScript("(() => { const s = window.__sizes || []; window.__sizes = []; return s })()").catch(() => [])
    if (sizes.length) windowEvents.push(`page resized: ${sizes.join(" → ")}`)
    const moved = before !== JSON.stringify(win.getBounds()) || windowEvents.length > 0 || /alert not handled|select-all did nothing/.test(error)
    if (moved) failures++
    console.log(`${moved ? "FAIL" : "PASS"}  window stays as it is after: ${name}${moved ? `  ← ${before} → ${JSON.stringify(win.getBounds())} ${windowEvents.join(",")}` : ""}${error ? `  (action said: ${error})` : ""}`)
  }
  console.log(failures ? `\nWINDOW SMOKE FAILED (${failures})` : "\nWINDOW SMOKE PASSED")
  return failures ? 1 : 0
}

/** Ask the model to use webfetch, and report what actually happened to that tool call. */
async function tryWebfetch(): Promise<{ blocked: boolean; how: string }> {
  let outcome = ""
  const done = new Promise<void>((resolve) => {
    const tap = (evt: any) => {
      const part = evt?.properties?.part
      if (evt?.type === "message.part.updated" && part?.type === "tool" && part.tool === "webfetch" && ["completed", "error"].includes(part.state?.status)) {
        outcome = `${part.state.status}: ${String(part.state.error ?? part.state.title ?? "").slice(0, 160)}`
        eventTaps.delete(tap)
        resolve()
      }
      if (evt?.type === "session.idle") (eventTaps.delete(tap), resolve())
    }
    eventTaps.add(tap)
  })
  await sendPrompt("请用 webfetch 这个工具打开 https://example.com 并把标题告诉我。只试这一个工具，不要用别的办法。").catch((error) => (outcome = `prompt failed: ${error}`))
  await Promise.race([done, new Promise((r) => setTimeout(r, 90_000))])
  if (!outcome) return { blocked: true, how: "the model never called it" }
  return { blocked: /error/.test(outcome), how: outcome }
}

/**
 * `bun run smoke:search` — looking things up really works, and the consultant's page is left alone while it happens.
 * Needs the network.
 */
async function runSearchSmoke() {
  let failures = 0
  const check = (name: string, ok: boolean, detail = "") => {
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  ← ${detail.slice(0, 400)}`}`)
    if (!ok) failures++
  }
  await page.webContents.loadURL(fixture("form.html"))
  const before = page.webContents.getURL()

  const found = await searchWeb("University of California transfer application deadline").catch((error) => `FAILED: ${error?.message ?? error}`)
  check("a search comes back with results", /\n1\. /.test(found) && /https?:\/\//.test(found), found)
  check("the application page the consultant is filling in was not touched", page.webContents.getURL() === before, `${before} → ${page.webContents.getURL()}`)

  const read = await openWeb("https://example.com").catch((error) => `FAILED: ${error?.message ?? error}`)
  check("a page can be read in the background", /Example Domain/i.test(read), read)
  check("…and that did not touch the consultant's page either", page.webContents.getURL() === before, `${before} → ${page.webContents.getURL()}`)

  const refused = await openWeb("file:///etc/passwd").then(() => "opened", (error) => String(error?.message ?? error))
  check("only http(s): a local file is refused", /只能打开/.test(refused), refused)

  closeWeb()
  console.log(failures ? `\nSEARCH SMOKE FAILED (${failures})` : "\nSEARCH SMOKE PASSED")
  return failures ? 1 : 0
}

/**
 * `NEO_RUN_TASK=<TaskInput json> NEO_RUN_OUT=<dir> electron . --run` — one whole task with the real model and nobody
 * at the keyboard, for measuring: every question gets "it is not in the materials, leave it and go on", every
 * reserved action is refused. When the model stops, NEO_RUN_DUMP (a JS expression, optional) is evaluated on the page
 * and written to state.json next to run.json: model calls, tokens, questions asked, what it said.
 */
async function runUnattended() {
  const { mkdir, writeFile, rm } = await import("node:fs/promises")
  const out = process.env.NEO_RUN_OUT!
  await mkdir(out, { recursive: true })
  await rm(process.env.NEO_WORKSPACES_ROOT!, { recursive: true, force: true })
  const task = await createTask(JSON.parse(readFileSync(process.env.NEO_RUN_TASK!, "utf8")))
  const started = Date.now()
  const budget = (Number(process.env.NEO_RUN_MINUTES) || 30) * 60_000
  let nudges = Number(process.env.NEO_RUN_NUDGES) || 0
  const asked: string[] = []
  const said: string[] = []
  const tools: Record<string, number> = {}
  let llmCalls = 0
  let sawWork = false
  let failure = ""
  const stamp = () => `[${((Date.now() - started) / 1000).toFixed(0)}s]`

  const finished = new Promise<void>((resolve) => {
    const tap = (evt: any) => {
      const p = evt.properties ?? {}
      const part = p.part
      if (evt.type === "message.part.updated" && part?.type === "tool" && (part.state?.status === "completed" || part.state?.status === "error")) {
        sawWork = true
        tools[part.tool] = (tools[part.tool] ?? 0) + 1
        console.log(`  ${stamp()} ${part.tool} ${part.state.status}${part.state.status === "error" ? ` — ${String(part.state.error).slice(0, 160)}` : ""}`)
      }
      if (evt.type === "message.part.updated" && part?.type === "step-finish") llmCalls++
      if (evt.type === "message.part.updated" && part?.type === "text" && part.time?.end && !part.synthetic) {
        said.push(`${stamp()} ${part.text}`)
        console.log(`  AI: ${String(part.text).replace(/\s+/g, " ").slice(0, 240)}`)
      }
      if (evt.type === "question.asked") {
        for (const q of p.questions ?? []) asked.push(String(q.question))
        console.log(`  AI asks: ${p.questions?.map((q: any) => q.question).join(" / ")}`)
        const answers = (p.questions ?? []).map(() => ["材料里没有这一项，我现在也给不了。先留空，记到待顾问清单里，接着把其余的做完。"])
        void opencode!.client.question.reply({ requestID: p.id, answers }).catch(() => {})
      }
      if (evt.type === "session.error") failure = JSON.stringify(p.error).slice(0, 500)
      if (!(evt.type === "session.idle" || failure) || !(sawWork || failure)) return
      if (!failure && nudges-- > 0 && Date.now() - started < budget) {
        asked.push("（停下来等顾问）")
        return void sendPrompt("我现在处理不了这一项。先跳过它，把其余能做的都做完、存好草稿，最后一起告诉我还差什么。").catch(() => {})
      }
      eventTaps.delete(tap)
      resolve()
    }
    eventTaps.add(tap)
  })

  await openTask(task.taskDir)
  if (state.phase === "failed") failure = state.error ?? "open task failed"
  await Promise.race([finished, new Promise((r) => setTimeout(r, budget)), ...(failure ? [Promise.resolve()] : [])])
  const timedOut = Date.now() - started >= budget
  if (opencode && state.sessionID) await opencode.client.session.abort({ sessionID: state.sessionID }).catch(() => {})

  if (process.env.NEO_RUN_DUMP) {
    await browser.handleDialog(false).catch(() => {})
    const dumped = await Promise.race([browser.evaluate(process.env.NEO_RUN_DUMP), new Promise<string>((r) => setTimeout(() => r(""), 10_000))]).catch(() => "")
    await writeFile(join(out, "state.json"), dumped || "{}")
  }
  await writeFile(join(out, "page.png"), (await page.webContents.capturePage()).toPNG()).catch(() => {})
  const tokens = [...messageTokens.values()].reduce(addTokens, emptyTokens())
  const run = {
    handoffs: asked.length, handoffItems: asked, refused: refusedUnattended, llmCalls, tools, wallMs: Date.now() - started,
    tokens, model: state.model ? `${state.model.providerID}/${state.model.modelID}` : "", timedOut, failure, workspace: task.studentDir, said,
  }
  await writeFile(join(out, "run.json"), JSON.stringify(run, null, 2))
  console.log(`\nRUN FINISHED in ${(run.wallMs / 1000).toFixed(0)}s · ${llmCalls} model calls · ${asked.length} questions · ${refusedUnattended.length} reserved actions refused${timedOut ? " · TIMED OUT" : ""}${failure ? ` · ERROR ${failure}` : ""}`)
  stopOpencode()
  return failure ? 1 : 0
}

/**
 * `NEO_DO_URL=… NEO_DO_GOAL=… bun run smoke:do` — the click-only errand runner with the REAL Jev on a real page,
 * no big model involved. For public pages only: nothing is typed, nothing is logged in.
 */
async function runDoSmoke() {
  const url = process.env.NEO_DO_URL || fixture("form.html")
  const goal = process.env.NEO_DO_GOAL || "Open the scholarship guide in the help centre"
  await page.webContents.loadURL(url).catch(() => {})
  await new Promise((r) => setTimeout(r, 1500))
  const started = Date.now()
  const out = await browser.do(goal, Number(process.env.NEO_DO_STEPS) || 12).catch((error) => `FAILED: ${error instanceof Error ? error.message : error}`)
  console.log(out.split("\n\n现在的页面")[0])
  console.log(`\n最后停在：${page.webContents.getTitle()} · ${page.webContents.getURL().split(/[?#]/)[0]}`)
  console.log(`DO SMOKE FINISHED in ${((Date.now() - started) / 1000).toFixed(1)}s`)
  return 0
}

/**
 * `NEO_REAL_FOLDER=<学生资料文件夹> NEO_REAL_STUDENT=<姓名> NEO_MODEL=own/... electron . --run-real`
 * —— 一次真学生、真局域网 AI 的完整实测（窗口不弹）。走产品主流程：
 *   建档案/求职目标 → 自动生成简历 → 岗位中心真抓取并画像匹配 → 针对头名岗位让模型定向改简历并重编译
 *   → 打开真实招聘页自动填表（不提交：保留动作一律拒绝，无人会替学生按提交）。
 * 邮箱等敏感问答自动回「材料里没有，先留空」；全程不对外发送、不付款。
 */
async function runReal() {
  const { mkdir, writeFile, stat, readdir } = await import("node:fs/promises")
  const out = process.env.NEO_REAL_OUT || join(app.getPath("temp"), "neo-real")
  await mkdir(out, { recursive: true })
  const folder = process.env.NEO_REAL_FOLDER!
  const studentName = process.env.NEO_REAL_STUDENT || "Daniel Fang"

  const results: Array<{ name: string; ok: boolean; detail: string }> = []
  const check = (name: string, ok: boolean, detail = "") => {
    results.push({ name, ok, detail })
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  ← ${detail.slice(0, 500)}`}`)
  }
  const stamp = () => `[${new Date().toISOString().slice(11, 19)}]`

  /** One phase's watcher: drives until the model pauses (or the budget runs out); auto-answers questions. */
  const waitIdle = (budgetMs: number, nudges: number) =>
    new Promise<{ sawWork: boolean; tools: Record<string, number>; llmCalls: number; asked: string[]; failure: string }>((resolve) => {
      const started = Date.now()
      let sawWork = false
      let llmCalls = 0
      let failure = ""
      const tools: Record<string, number> = {}
      const asked: string[] = []
      const tap = (evt: any) => {
        const p = evt.properties ?? {}
        const part = p.part
        if (evt.type === "message.part.updated" && part?.type === "tool" && (part.state?.status === "completed" || part.state?.status === "error")) {
          sawWork = true
          tools[part.tool] = (tools[part.tool] ?? 0) + 1
          console.log(`  ${stamp()} tool: ${part.tool} ${part.state.status}${part.state.status === "error" ? ` — ${String(part.state.error).slice(0, 140)}` : ""}`)
        }
        if (evt.type === "message.part.updated" && part?.type === "step-finish") llmCalls++
        if (evt.type === "message.part.updated" && part?.type === "text" && part.time?.end && !part.synthetic) {
          console.log(`  ${stamp()} AI: ${String(part.text).replace(/\s+/g, " ").slice(0, 200)}`)
        }
        if (evt.type === "question.asked") {
          for (const q of p.questions ?? []) asked.push(String(q.question))
          console.log(`  ${stamp()} AI asks: ${p.questions?.map((q: any) => q.question).join(" / ")}`)
          const answers = (p.questions ?? []).map(() => ["这份材料里没有这一项，先留空，记进待顾问清单，其余照做。"])
          void opencode!.client.question.reply({ requestID: p.id, answers }).catch(() => {})
        }
        if (evt.type === "session.error") failure = JSON.stringify(p.error).slice(0, 500)
        if (!(evt.type === "session.idle" || failure) || (failure && !sawWork)) return
        if (!failure && nudges-- > 0 && Date.now() - started < budgetMs) {
          return void sendPrompt("先把能做完的全部做完：档案、求职目标、简历、该填的字段都弄好，最后一次性告诉我缺什么。").catch(() => {})
        }
        eventTaps.delete(tap)
        resolve({ sawWork, tools, llmCalls, asked, failure })
      }
      eventTaps.add(tap)
      setTimeout(() => {
        eventTaps.delete(tap)
        resolve({ sawWork, tools, llmCalls, asked, failure })
      }, budgetMs)
    })

  const newestResumeUtc = async (dir: string): Promise<number> => {
    let newest = 0
    for (const name of await readdir(dir).catch(() => [])) {
      const p = join(dir, name)
      try {
        if (name.endsWith(".tex") || name.endsWith(".pdf")) newest = Math.max(newest, (await stat(p)).mtimeMs)
        else if (!name.includes(".")) newest = Math.max(newest, await newestResumeUtc(p))
      } catch {
        /* skip */
      }
    }
    return newest
  }

  console.log(`\n===== REAL RUN · ${studentName} @ ${folder} =====`)
  try {
    check("学生资料文件夹可读", Boolean(folder && existsSync(folder)), folder)

    // ----- Phase 1: 建档案 + 求职目标（AI 自动开工）-----
    console.log(`\n--- Phase 1 · 建档案与求职目标（AI 自动开工）---`)
    const task1 = await createTask({
      studentName, sourceFolder: folder, jobType: "实习", taskGoal: "全流程投递",
      outputLanguage: "zh", allowUpload: false,
      company: "（档案搭建）", jobTitle: "求职档案与简历",
    })
    const studentDir = task1.studentDir
    check("学生工作区已建、材料已拷入", existsSync(join(studentDir, "materials")), studentDir)

    const p1 = waitIdle(Number(process.env.NEO_REAL_PHASE1_MS) || 30 * 60_000, 3)
    await openTask(task1.taskDir).catch((e) => check("打开投递任务（自动开工）", false, String((e as Error)?.message ?? e)))
    const r1 = await p1
    check("Phase 1 · AI 写了答案库 student_profile.json", existsSync(join(studentDir, "student_profile.json")), r1.failure || "无档案")
    check("Phase 1 · AI 写了求职目标 job_target.json", existsSync(join(studentDir, "job_target.json")), r1.failure || "无目标")
    check("Phase 1 · 模型确实在干活", r1.sawWork, JSON.stringify(r1.tools))

    // ----- Resume: 自动生成 LaTeX 简历 -----
    console.log(`\n--- Resume · 自动生成 LaTeX 简历 ---`)
    let exportedResumeUtc = 0
    if (existsSync(join(studentDir, "student_profile.json"))) {
      try {
        const rr = await generateResume(studentDir, "engineering")
        exportedResumeUtc = await newestResumeUtc(join(studentDir, "resume"))
        check("自动生成 LaTeX 简历并导出 PDF", existsSync(rr.item.exported) && exportedResumeUtc > 0, rr.item.exported)
      } catch (e) {
        check("自动生成 LaTeX 简历并导出 PDF", false, String((e as Error)?.message ?? e).slice(0, 400))
      }
    } else check("自动生成 LaTeX 简历（缺档案，跳过）", false, "Phase 1 没产出 student_profile.json")

    // ----- Phase 2: 岗位中心真抓取 + 画像匹配 -----
    console.log(`\n--- Phase 2 · 岗位中心真抓取 + 画像匹配 ---`)
    const srcs = listSources()
    if (!srcs.some((s) => s.id === "gh-stripe")) srcs.push({ id: "gh-stripe", name: "Stripe（Greenhouse 板）", enabled: true, kind: "greenhouse", url: "stripe" })
    if (!srcs.some((s) => s.id === "gh-datadog")) srcs.push({ id: "gh-datadog", name: "Datadog（Greenhouse 板）", enabled: true, kind: "greenhouse", url: "datadog" })
    saveFeedSources(srcs)
    const ov = await runOnceNow()
    check("Phase 2 · 岗位中心真联网抓取", (ov.lastRun?.fetched ?? 0) > 0, `fetched=${ov.lastRun?.fetched} failed=${ov.lastRun?.failed.length} kept=${ov.sources.length} 个源`)
    const target = await readJobTarget(studentDir)
    check("Phase 2 · 读到求职目标（喂给匹配）", (target.roleKeywords?.length ?? 0) + (target.locations?.length ?? 0) > 0, JSON.stringify(target).slice(0, 260))
    const feed = await feedForStudent(studentDir)
    const matched = feed.entries
      .filter((e) => feed.matches[e.id]?.matched)
      .sort((a, b) => (feed.matches[b.id]?.score ?? 0) - (feed.matches[a.id]?.score ?? 0))
    check("Phase 2 · 按学生画像筛出了岗位", matched.length > 0, `快照 ${feed.entries.length} 条，匹配 ${matched.length} 条`)
    for (const e of matched.slice(0, 6)) console.log(`  ≈${feed.matches[e.id]!.score}  ${e.company} · ${e.title} · ${e.location}`)
    const top = matched[0]

    // ----- Phase 3: 针对头名岗位，AI 定向改简历 + 重编译 -----
    if (top) {
      console.log(`\n--- Phase 3 · 针对「${top.company} · ${top.title}」定向改简历 ---`)
      const beforeTex = await newestResumeUtc(join(studentDir, "resume"))
      const p3 = waitIdle(Number(process.env.NEO_REAL_PHASE3_MS) || 12 * 60_000, 2)
      await sendPrompt(
        `请为「${top.company} · ${top.title}」这份具体岗位微调学生的简历：先读材料原文和 resume/ 里最新的 main.tex，针对性调整（教育/项目/技能按岗位要求排序和措辞，bullet 动词开头+数字），然后调用 resume_compile 把 PDF 重新导出。改了什么最后用一句话说清楚。`,
      ).catch((e) => check("下发「定向改简历」指令", false, String((e as Error)?.message ?? e)))
      const r3 = await p3
      const afterTex = await newestResumeUtc(join(studentDir, "resume"))
      const recompiled = (r3.tools["resume_compile"] ?? 0) > 0 || afterTex > beforeTex
      check("Phase 3 · 简历被针对该岗位修改并重新导出", recompiled, `resume_compile 调用=${r3.tools["resume_compile"] ?? 0} tex/pdf 时间戳 ${beforeTex}→${afterTex}`)

      // ----- Phase 4: 从匹配岗位「投递」→ 打开真实招聘页自动填表（不提交）-----
      console.log(`\n--- Phase 4 · 一键投递 → 真实招聘页自动填表（不提交）---`)
      const task2 = await createTask({
        studentName, jobType: top.internship ? "实习" : top.fullTime ? "全职" : "其他", taskGoal: "全流程投递",
        outputLanguage: "zh", allowUpload: true,
        company: top.company, jobTitle: top.title, applicationUrl: top.url,
        notes: top.description ? `岗位描述（从岗位中心投递而来）：\n${top.description.slice(0, 1500)}` : undefined,
      })
      check("Phase 4 · 投递任务已建（一键投递路径）", Boolean(task2.taskDir), task2.taskDir)
      const p4 = waitIdle(Number(process.env.NEO_REAL_PHASE4_MS) || 25 * 60_000, 3)
      await openTask(task2.taskDir).catch((e) => check("打开投递工作台（自动开工）", false, String((e as Error)?.message ?? e)))
      const r4 = await p4
      const filled = ["browser_fill_page", "browser_fill_form", "browser_fill", "browser_choose", "browser_select", "browser_upload", "browser_click"].filter((t) => (r4.tools[t] ?? 0) > 0)
      check("Phase 4 · 自动填表工具真被调用（未提交）", filled.length > 0 || r4.sawWork, `用到的工具：${filled.join("、") || "（只有其它动作）"} ${JSON.stringify(r4.tools)}`)
      check("Phase 4 · 没有任何最终提交被按下", !refusedUnattended.some((x) => x.kind === "final_submit"), JSON.stringify(refusedUnattended))
    } else {
      console.log("  (没有匹配岗位，跳过 Phase 3/4)")
    }

    await writeFile(join(out, "page.png"), (await page.webContents.capturePage()).toPNG()).catch(() => undefined)
    const refused = refusedUnattended.filter((x) => x.kind !== "final_submit")
    await writeFile(
      join(out, "run.json"),
      JSON.stringify(
        {
          studentName, folder, workspace: state.workspace || "",
          model: state.model ? `${state.model.providerID}/${state.model.modelID}` : "",
          results, refused, refusedUnattended,
          feed: { fetched: ov.lastRun?.fetched, failed: ov.lastRun?.failed },
          matchedTop: matched.slice(0, 6).map((e) => ({ score: feed.matches[e.id]!.score, company: e.company, title: e.title, url: e.url })),
        },
        null,
        2,
      ),
    )
    console.log(`\n===== REAL RUN DONE · 结果 ${results.filter((r) => r.ok).length}/${results.length} =====`)
    console.log(`报告在 ${join(out, "run.json")}`)
  } catch (error) {
    check("real run completed", false, error instanceof Error ? error.stack || error.message : String(error))
    console.log(`\n===== REAL RUN FAILED =====`)
  }
  stopOpencode()
  return results.every((r) => r.ok) ? 0 : 1
}

/**
 * Dev aid (`NEO_TASK_FILE=<json with a TaskInput>`): create that task and open it, as if the consultant
 * had filled in the form and clicked it — the window stays up, the consultant logs in on the left and watches.
 * Pair it with NEO_WORKSPACES_ROOT so a trial run never touches the real workspaces.
 */
async function devOpenTask(file: string) {
  try {
    const input = JSON.parse(readFileSync(file, "utf8"))
    const [providerID, ...rest] = (process.env.NEO_MODEL || "").split("/")
    if (rest.length) state.model = { providerID, modelID: rest.join("/") }
    const task = await createTask(input)
    log.info("dev: opening task from file", { file, taskDir: task.taskDir, reused: task.reusedExisting === true })
    await openTask(task.taskDir)
  } catch (error) {
    log.error("dev: could not open task from file", { file, error })
  }
}

/**
 * Dev aid (`NEO_MODEL_SERVER_TEST=<json with a ModelServer>`): the settings screen's whole save path without a keyboard —
 * open a free conversation, save this server exactly as the IPC does, restart in place, and ask the model one thing
 * through it. Pair with `--user-data-dir` so the trial never touches the saved store. Prints PASS/FAIL lines and exits.
 */
async function devModelServerTest(file: string) {
  let listed: ModelOption | undefined
  let survived = false, answered = "", deduped = false, deletedToRestorable = false
  try {
    const entry = JSON.parse(readFileSync(file, "utf8")) as ModelServer
    await openPlayground()
    const before = state.sessionID
    saveModelServer({ ...entry, id: entry.id ?? "dev-test" })
    await applyModelServers()
    survived = Boolean(state.sessionID) && state.sessionID === before
    listed = state.models.find((m) => m.providerID === serverProviderId(entry.id ?? "dev-test") && m.modelID === entry.model)

    // The surprise the consultant met on the second machine: saving the same cloud model twice grew a second card.
    // Same path, twice — the second draft without an id, the way an edit loses one — and then 删除 must land in the restore list.
    saveModelServer({ providerID: "dev-test-cn", name: "去重试验", baseURL: "", model: "dedupe-me", sees: true, thinkingLevels: [], thinkingDefault: "", context: 0, output: 0 })
    saveModelServer({ providerID: "dev-test-cn", name: "去重试验（第二次保存）", baseURL: "", model: "dedupe-me", sees: true, thinkingLevels: [], thinkingDefault: "", context: 0, output: 0 })
    const dup = listModelServers().filter((s) => s.providerID === "dev-test-cn")
    deduped = dup.length === 1 && dup[0].name === "去重试验（第二次保存）"
    hideModel("dev-test-cn/dedupe-me")
    deletedToRestorable = !listModelServers().some((s) => s.providerID === "dev-test-cn") && hiddenModels().includes("dev-test-cn/dedupe-me")
    // The picker only lands on it by default while the server answers; the test asks it explicitly either way.
    if (listed) state.model = { providerID: listed.providerID, modelID: listed.modelID }
    const said = new Promise<string>((resolve) => {
      let text = ""
      const tap = (evt: any) => {
        const part = evt?.properties?.part
        if (evt?.type === "message.part.updated" && part?.type === "text" && part.time?.end && !part.synthetic) text += part.text
        if (evt?.type === "session.idle") (eventTaps.delete(tap), resolve(text.trim()))
      }
      eventTaps.add(tap)
    })
    await sendPrompt("请只回复两个字母：OK").catch((error) => (answered = `prompt failed: ${error instanceof Error ? error.message : error}`))
    if (!answered) answered = await Promise.race([said, new Promise<string>((r) => setTimeout(() => r("(等了两分钟没有回答)"), 120_000))])
  } catch (error) {
    log.error("dev: model-server test failed", { error })
    answered = answered || `crashed: ${error instanceof Error ? error.message : String(error)}`
  }
  console.log(`${survived ? "PASS" : "FAIL"}  the conversation survives the in-place restart after saving`)
  console.log(`${listed ? "PASS" : "FAIL"}  the saved server shows up in the model list${listed ? `  (thinking=${listed.thinking ?? "off"}, sees=${listed.sees}, thinkingOptions=${listed.thinkingOptions?.join(",") ?? "none"})` : ""}`)
  console.log(`${deduped ? "PASS" : "FAIL"}  saving the same cloud model twice stays ONE card (the second draft without an id)`)
  console.log(`${deletedToRestorable ? "PASS" : "FAIL"}  deleting a cloud model takes it out of the list into the restore strip`)
  console.log(`${answered && answered !== "(等了两分钟没有回答)" && !/failed|crashed/.test(answered.slice(0, 30)) ? "PASS" : "FAIL"}  the model answers through the new server: ${answered.slice(0, 100)}`)
  stopOpencode()
  exitApp(survived && listed && deduped && deletedToRestorable && answered && !/failed|crashed/.test(answered.slice(0, 30)) && answered !== "(等了两分钟没有回答)" ? 0 : 1)
}

/** Dev aid (`NEO_SHOT=<dir>`): save what the window looks like. `NEO_SHOT_VIEW=login|home|new|settings|settings-new|task|handoff|menu` picks the screen. */
async function devScreenshot(dir: string) {
  const { mkdir, writeFile } = await import("node:fs/promises")
  await mkdir(dir, { recursive: true })
  const view = process.env.NEO_SHOT_VIEW || "task"
  if (view === "handoff") {
    // 交给人 in both states, on a fake gate page, without ever waking a model.
    await openPlayground()
    await page.webContents.loadURL(fixture("challenge.html"))
    await new Promise((r) => setTimeout(r, 800))
    await writeFile(join(dir, "handoff-button.png"), (await win.webContents.capturePage()).toPNG())
    await writeFile(join(dir, "handoff-button-page.png"), (await page.webContents.capturePage()).toPNG())
    await browser!.handoffToHuman("manual")
    await new Promise((r) => setTimeout(r, 800))
    // The page must still be a live, visible page with the debugger off — read it without our CDP (executeJavaScript uses Electron's own channel).
    log.info("handoff shot probe", { text: String(await page.webContents.executeJavaScript("document.title + ' | ' + document.body.innerText.slice(0, 40)").catch(() => "READ FAILED")) })
    await writeFile(join(dir, "handoff.png"), (await win.webContents.capturePage()).toPNG())
    await writeFile(join(dir, "handoff-page.png"), (await page.webContents.capturePage()).toPNG())
    exitApp(0)
  }
  if (view === "menu") {
    // The ☰ menu both closed and open, on a live task screen, without ever waking a model.
    await openPlayground()
    await page.webContents.loadURL(fixture("form.html"))
    await new Promise((r) => setTimeout(r, 900))
    await writeFile(join(dir, "menu-closed.png"), (await win.webContents.capturePage()).toPNG())
    toRenderer("dev:view", "menu")
    await new Promise((r) => setTimeout(r, 600))
    await writeFile(join(dir, "menu-open.png"), (await win.webContents.capturePage()).toPNG())
    exitApp(0)
  }
  if (view === "task") {
    await openPlayground()
    await page.webContents.loadURL(fixture("form.html"))
    const [providerID, ...rest] = (process.env.NEO_MODEL || "").split("/")
    if (rest.length) state.model = { providerID, modelID: rest.join("/") }
    const done = new Promise<void>((resolve) => {
      const tap = (evt: any) => evt.type === "session.idle" && (eventTaps.delete(tap), resolve())
      eventTaps.add(tap)
    })
    await sendPrompt(process.env.NEO_SHOT_PROMPT || "看一下左边的页面，用两三句话告诉我这是什么表、有哪些必填项。先不要填。")
    await Promise.race([done, new Promise((r) => setTimeout(r, 120_000))])
  } else {
    toRenderer("dev:view", view)
  }
  await new Promise((r) => setTimeout(r, 1500))
  await writeFile(join(dir, `${view}.png`), (await win.webContents.capturePage()).toPNG())
  if (view === "task") await writeFile(join(dir, "page.png"), (await page.webContents.capturePage()).toPNG())
  exitApp(0)
}

// ------------------------------------------------------------------ menu

/**
 * Our own menu, so the keys a person expects belong to the page they are typing in. Electron's default menu was in
 * charge until now, and it binds things we never wanted: Cmd+R reloads the application page mid-form (it broke the
 * layout in a real run), and every accelerator it invents is one that can collide with the site on the left.
 * Here: editing keys only (they act on whatever has focus — the page or the sidebar), nothing else bound.
 */
function buildMenu() {
  app.setAboutPanelOptions({ applicationName: app.getName(), applicationVersion: app.getVersion(), credits: "求职投递工作台" })
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: app.getName(),
        submenu: [
          { label: `关于 ${app.getName()}`, role: "about" }, // deliberately no accelerator
          { type: "separator" },
          { role: "hide", label: "隐藏" },
          { role: "hideOthers", label: "隐藏其他" },
          { role: "unhide", label: "全部显示" },
          { type: "separator" },
          { role: "quit", label: "退出" },
        ],
      },
      {
        label: "编辑",
        submenu: [
          { role: "undo", label: "撤销" },
          { role: "redo", label: "重做" },
          { type: "separator" },
          { role: "cut", label: "剪切" },
          { role: "copy", label: "复制" },
          { role: "paste", label: "粘贴" },
          { role: "selectAll", label: "全选" },
        ],
      },
      {
        label: "窗口",
        submenu: [
          { role: "minimize", label: "最小化" },
          { role: "zoom", label: "缩放" },
          { type: "separator" },
          // Available when something goes wrong, but on no accelerator: the page on the left owns the keyboard.
          { label: "开发者工具", accelerator: "", click: () => page?.webContents.openDevTools({ mode: "detach" }) },
        ],
      },
    ]),
  )
}

// ------------------------------------------------------------------ ipc

/** Every IPC handler goes through here so a failure is logged once, with its channel and arguments. */
function handle(channel: string, fn: (...args: any[]) => unknown) {
  ipcMain.handle(channel, async (_event, ...args) => {
    try {
      return await fn(...args)
    } catch (error) {
      // Positional arguments carry no key for the sanitizer to recognise, and auth:login's second one is a password.
      log.error(`ipc ${channel} failed`, { args: channel.startsWith("auth:") ? "[redacted]" : args, error })
      throw error
    }
  })
}

function registerIpc() {
  handle("log:write", (level: "debug" | "info" | "warn" | "error", msg: string, data?: Record<string, unknown>) => createLogger("ui")[level]?.(msg, data))
  handle("log:reveal", () => {
    const file = currentLogFile()
    if (file) shell.showItemInFolder(file)
  })

  handle("app:state", () => state)
  handle("app:home", () => goHome())
  handle("app:playground", () => openPlayground())
  handle("app:playgroundIn", (choice: { kind: "fresh"; topic?: string } | { kind: "student"; studentDir: string }) => openPlaygroundIn(choice))

  handle("auth:status", () => refreshAuth())
  handle("auth:login", async (email: string, password: string) => {
    state.auth = await login(email, password)
    publish()
    return state.auth
  })
  handle("auth:logout", () => {
    logout()
    goHome()
    return refreshAuth()
  })

  handle("tasks:list", () => listStudents())
  handle("tasks:create", async (input: TaskInput) => {
    const task = await createTask(input)
    if (task.newMaterials) toRenderer("notice", `这个学生原来就有档案，这次从你选的文件夹里新拷进来 ${task.newMaterials} 个文件，打开任务时会自动转成文字版。`)
    return task
  })
  handle("tasks:open", (taskDir: string) => openTask(taskDir))
  handle("tasks:restart", (taskDir: string) => openTask(taskDir, { fresh: true }))
  handle("tasks:reveal", (task: Task) => shell.openPath(task.taskDir).then(() => {}))
  // 2026-10-16 多标签: the consultant's tab strip. Activating rebinds the tools to that page — the
  // same path browser_switch_tab takes, so consultant and agent always see the same page.
  handle("tabs:list", () => tabs?.list() ?? [])
  handle("tabs:activate", async (id: string) => {
    const host = await tabs?.activate(id)
    if (host) await browser.bindHost(host)
    toRenderer("nav:state", navState())
    return tabs?.list() ?? []
  })
  handle("tabs:close", async (id: string) => {
    const host = await tabs?.close(id)
    if (host) await browser.bindHost(host)
    toRenderer("nav:state", navState())
    return tabs?.list() ?? []
  })
  handle("account:get", (url: string) => getPlatformAccount(url))
  handle("account:clear", (url: string) => clearPlatformAccount(url))
  // auth: on purpose — handle() redacts every argument on auth: channels when a call throws, and this argument is a password.
  handle("auth:savePlatformPassword", (url: string, password: string) => savePlatformPassword(url, password))
  // Student-wide credentials memo (2026-10-14 编辑). Whole-text replace, stored secret-outside-workspace;
  // the software never reads a line of it — only buildStartPrompt copies it into the opening message.
  handle("auth:studentMemo:get", (studentDir: string) => getStudentMemo(studentDir))
  handle("auth:studentMemo:set", (studentDir: string, text: string) => setStudentMemo(studentDir, text))

  handle("pick:folder", async () => {
    const result = await dialog.showOpenDialog(win, { title: "选择学生资料文件夹", properties: ["openDirectory"] })
    return result.canceled ? null : result.filePaths[0]
  })

  // ---- 岗位中心 (daily job feed) ----
  handle("feed:overview", () => feedOverview())
  handle("feed:saveSources", async (sources: Parameters<typeof saveFeedSources>[0]) => {
    saveFeedSources(sources)
    feedScheduler?.stop()
    feedScheduler = startFeedScheduler(feedRunCallback, feedRunFinishedAt)
    return feedOverview()
  })
  handle("feed:saveSchedule", async (schedule: Parameters<typeof saveFeedSchedule>[0]) => {
    saveFeedSchedule(schedule)
    feedScheduler?.stop()
    feedScheduler = startFeedScheduler(feedRunCallback, feedRunFinishedAt)
    return feedOverview()
  })
  handle("feed:runNow", async () => {
    const ov = await runOnceNow()
    return ov
  })
  handle("feed:saveTarget", async (studentDir: string, target: JobTarget) => {
    await saveJobTarget(studentDir, target)
    return feedOverview()
  })
  handle("feed:applyToJob", async (input: { studentDir: string; entry: JobEntry; notes?: string; taskGoal?: string }) => {
    const groups = await listStudents()
    const group = groups.find((g) => g.studentDir === input.studentDir)
    if (!group) throw new Error("找不到这位学生。")
    const task = await createTask({
      studentName: group.studentName,
      jobType: input.entry.internship ? "实习" : input.entry.fullTime ? "全职" : "其他",
      taskGoal: input.taskGoal ?? "全流程投递",
      outputLanguage: "zh",
      allowUpload: true,
      company: input.entry.company,
      jobTitle: input.entry.title,
      applicationUrl: input.entry.url,
      notes: input.notes ?? (input.entry.description ? input.entry.description.slice(0, 1200) : undefined),
      allowAutoLogin: false,
    })
    await openTask(task.taskDir)
    return task
  })

  // ---- 简历 (LaTeX resume studio) ----
  handle("resume:engine", () => findResumeEngine())
  handle("resume:engineReset", () => invalidateResumeEngine())
  handle("resume:list", (studentDir: string) => listResumes(studentDir))
  handle("resume:generate", async (studentDir: string, track: string) => generateResume(studentDir, track))
  handle("os:reveal", (path: string) => {
    if (typeof path === "string" && path.trim()) shell.showItemInFolder(path)
  })
  handle("os:openExternal", (url: string) => {
    if (typeof url === "string" && /^https?:\/\//i.test(url)) void shell.openExternal(url)
  })

  // 【交给人】/【我操作完了，交回 AI】: the consultant takes the page in hand — bot gates are only passable by a person
  // (and fighting them in the tools only locks it harder). Giving it back wakes the model with one short message.
  handle("browser:handoff", async (on: boolean) => {
    if (!browser) return
    if (on) {
      await browser.handoffToHuman("manual")
      // ego sees its own channel only — tell it too, so its window shows 「已交给你」 (stage 4).
      if (activeEgo) void activeEgo.handOffSpace()
    } else {
      // ego's rule: takeOver ONLY behind the consultant's explicit click — this click. If ego says
      // the human still holds the space, we do NOT take the page back; the banner stays up.
      if (activeEgo && !(await activeEgo.takeOverSpace())) {
        toRenderer("notice", "ego 那边显示空间还在你手里——在 ego 窗口里把页面交还给 AI，再点一次【我操作完了，交回 AI】。")
        return
      }
      await browser.takeBackFromHuman()
      if (activeEgo) startOwnershipWatch(activeEgo)
      if (state.sessionID) await sendPrompt(TAKEBACK_RESUME_PROMPT).catch((error) => log.warn("handoff resume did not send", { error }))
    }
  })

  // ☰ 【用 ego lite 操作这页】: the consultant's manual route (2026-10-06 拍板). Per task, session-only.
  handle("task:useEgo", async (on: boolean) => {
    const task = state.task
    if (!task) return navState()
    if (on) egoManual.add(task.taskDir)
    else egoManual.delete(task.taskDir)
    await bindPageFor(task.input.applicationUrl, false, on)
    toRenderer("nav:state", navState())
    return navState()
  })

  handle("nav:get", () => navState())
  handle("chat:history", async () => {
    if (!opencode || !state.sessionID) return []
    return (await opencode.client.session.messages({ sessionID: state.sessionID })).data ?? []
  })
  handle("question:list", async () => {
    if (!opencode) return []
    const all = (await opencode.client.question.list()).data ?? []
    return all.filter((q: any) => q.sessionID === state.sessionID)
  })
  handle("chat:send", (text: string) => sendPrompt(text))
  handle("chat:abort", async () => {
    if (opencode && state.sessionID) await opencode.client.session.abort({ sessionID: state.sessionID })
    dismissRiskQuestions()
  })
  // The task view's 【重开】: quiet the stuck or winding conversation, settle up, and start this application over
  // from the opening message — exactly the fresh start a reopen from the list would give (files and the answer bank stay).
  // A free chat has no task and no opening message: it keeps the old plain "new conversation".
  handle("chat:new", async () => {
    if (state.task) return openTask(state.task.taskDir, { fresh: true })
    await reportUsage()
    await newSession("自由对话")
    return state
  })
  handle("model:set", (model: ModelRef) => {
    state.model = model
    saveSettings({ model, modelPickedFor: MODEL_CHOICE_ERA })
    return state
  })
  // The picker's thinking level for one model: remembered in the store, in force from the next message, no restart —
  // and opencode itself refuses any level a model does not offer, so a stale pick can never go out.
  handle("model:effort", async (model: ModelRef & { level: string | null }) => {
    setModelEffort(modelRefOf(model.providerID, model.modelID), model.level)
    state.models = await listModels(await connectedProviderIds())
    return state
  })
  handle("modelServers:list", async () => {
    // `connected` is what the cloud cards tell the truth with: which providers hold a credential on this machine right now (null = kernel not running, don't claim anything).
    const ids = opencode ? await connectedProviderIds() : null
    return { servers: listModelServers(), fileServer: envFileServer(), defaultRef: defaultModelRef() ?? undefined, hidden: hiddenModels(), liveCloud: liveCloudModels(), connected: ids ? [...ids] : null }
  })
  handle("modelServers:save", async (server: ModelServer) => {
    saveModelServer(server)
    await applyModelServers()
  })
  handle("modelServers:delete", async (id: string) => {
    deleteModelServer(id)
    await applyModelServers()
  })
  // The first-level 「设为默认」 / 「删除」 on each settings card — for a cloud model, 删除 goes through the hidden
  // list (opencode's own catalog cannot be deleted from; the screen's restore strip is the way back). All three
  // re-derive the running server's model in place, the same as save/delete.
  handle("modelServers:setDefault", async (ref: string | null) => {
    setModelDefault(ref)
    await applyModelServers()
  })
  handle("modelServers:hide", async (ref: string) => {
    hideModel(ref)
    await applyModelServers()
  })
  handle("modelServers:unhide", async (ref: string) => {
    unhideModel(ref)
    await applyModelServers()
  })
  // The form's draft, straight from the settings screen: apiKey is masked by log-sanitize on any failure line.
  handle("modelServers:test", (server: ModelServer) => probeModelServer({ baseURL: server.baseURL, apiKey: server.apiKey, model: server.model }))
  // The settings screen's Jev section (2026-10-08): which fast-judgement engine answers while a form fills.
  // No kernel restart needed — Jev lives in this process; the next tool call already uses the new row.
  handle("jevServers:list", async () => ({ servers: listJevServers(), default: jevDefault(), hidden: hiddenJevNames() }))
  handle("jevServers:save", async (server: JevServer) => saveJevServer(server))
  handle("jevServers:delete", async (id: string) => deleteJevServer(id))
  handle("jevServers:unhide", async (id: string) => unhideJevServer(id))
  handle("jevServers:setDefault", async (id: string | "off" | null) => setDefaultJev(id))
  handle("jevServers:test", (id: string) => testJevServer(id))
  handle("question:reply", (requestID: string, answers: string[][]) => opencode?.client.question.reply({ requestID, answers }).then(() => {}))
  handle("question:reject", (requestID: string) => opencode?.client.question.reject({ requestID }).then(() => {}))
  handle("risk:decide", (id: string, decision: RiskDecision) => {
    riskWaiters.get(id)?.resolve(decision)
    riskWaiters.delete(id)
    toRenderer("risk:closed", id)
  })
  handle("nav:go", (url: string) => {
    const target = /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}`
    // The address bar steers wherever the task's page currently lives — the ego tab too.
    return activePage().loadURL(target).catch(() => {})
  })
  handle("nav:back", () => activePage().goBack())
  handle("nav:forward", () => activePage().goForward())
  handle("nav:reload", () => activePage().reload())
  handle("layout:sidebar", (width: number) => {
    sidebarWidth = Math.min(760, Math.max(340, Math.round(width)))
    saveSettings({ sidebarWidth })
    layout()
  })
  handle("workspace:open", () => shell.openPath(state.task?.taskDir || state.workspace).then(() => {}))
}

// ------------------------------------------------------------------ lifecycle

app.whenReady().then(async () => {
  initLogging()
  sidebarWidth = loadSettings().sidebarWidth ?? sidebarWidth
  registerIpc()
  buildMenu()
  createWindow()
  // CDP only answers once the view has a live page, so land somewhere before attaching.
  await page.webContents.loadURL(process.env.NEO_START_URL || fixture("welcome.html")).catch(() => page.webContents.loadURL("about:blank"))
  await boot()
})

app.on("window-all-closed", () => app.quit())
app.on("before-quit", () => {
  if (tabs) tabs.quitting = true // teardown destroys every view; the destroyed handlers must not rebuild
  releaseSleepGuard()
  closeWeb()
  stopOpencode()
  feedScheduler?.stop()
  EgoHost.stopIfRunning()
  mcp?.close()
})
