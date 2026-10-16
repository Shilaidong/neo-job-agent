import { execFileSync, spawn, type ChildProcess } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { createServer } from "node:net"
import { join, sep } from "node:path"
import { app } from "electron"
import { Cdp, wsTransport } from "./browser/cdp"
import type { BrowserHost, Page } from "./browser/page"
import { EgoCli, EGO_SERVER_NAME } from "./ego-cli"
import { bundledEgoApp, egoCliIn, installedEgoApp } from "./ego"
import { createLogger } from "./log"
import { waitForHealth } from "./ready"

const log = createLogger("ego-host")

/**
 * ego lite as a live page host (Plan 2 stages 3-4, docs/BROWSER.md): we start OUR runtime copy
 * with `--remote-debugging-port` + `--ego-server-name`, drive its tab over plain WebSocket CDP,
 * and hand the window itself to the consultant when a human is needed. Why this rather than the
 * embedded view: the A/B probe measured the same debugger attachment that makes Cloudflare loop
 * on Electron arriving at UCAS clean in ego — the flag is about the HOST, not about attaching.
 *
 * Stage 4 (the 正规军 line): the task's page lives in an ego TASK SPACE opened through the
 * official CLI (`ego-cli.ts`) — isolated from the consultant's own windows and from any other
 * agent's spaces — while every tool call stays on the WS-CDP we already proved (a space's tab is
 * visible in `/json/list` under the SAME targetId the CLI returns, measured). The CLI is also the
 * only judge of ego's own state: the first-run wizard is NEVER closed by us over CDP any more —
 * CDP-closing it starved the official channel (the two gates are separate, measured), so a
 * refused CLI means "leave the wizard up, the consultant clicks it once".
 *
 * Lifecycle follows opencode.ts exactly: a pid file (plus a `ps` check) to bury what a crash left
 * behind, a free port, health polling with one restart. ego does NOT write the usual
 * DevToolsActivePort file (measured), so OUR OWN port file is what a later launch uses to adopt a
 * still-running instance instead of starting a second browser nobody asked for.
 */

const pidFile = () => join(app.getPath("userData"), "ego-browser.pid")
const portFile = () => join(app.getPath("userData"), "ego-browser.port")

const profileDir = () => process.env.NEO_EGO_PROFILE ?? join(app.getPath("userData"), "ego-profile")

/**
 * 2026-10-10 (user: 「把 ego 欢迎页面干掉」): ego lite's first-run master switch is `not_first_run`
 * in `<profile>/ego_config.json` — absent/false makes ego pop its import wizard window AND refuse
 * every official-CLI command (one gate, measured). Seeding it — plus Local State's `welcome_page_shown`
 * for the welcome tab — means nobody ever sees them again; an existing profile is left untouched.
 * Importing old Chrome data stays available: it's the consultant's own click in ego's window, no longer
 * our startup ritual. The `needs-onboarding` branch in enterTaskSpace stays as the honest fallback if
 * a future ego changes shape (smoke pins the refusal).
 */
function seedEgoProfile(dir: string) {
  try {
    const config = join(dir, "ego_config.json")
    if (!existsSync(config)) {
      mkdirSync(dir, { recursive: true })
      writeFileSync(config, '{\n   "not_first_run": true\n}')
      log.info("seeded ego profile — the first-run wizard will not appear", { dir })
    }
    const local = join(dir, "Local State")
    if (!existsSync(local)) writeFileSync(local, JSON.stringify({ ego: { welcome_page_shown: true, workspace_button: { hint_shown: true } } }))
  } catch (error) {
    log.warn("cannot seed the ego profile — ego may show its wizard once more", { error: String(error) })
  }
}

/** Which bundle to start: the runtime copy from the installer first, the vendored dev copy second. */
function egoBin(): string | null {
  if (process.env.NEO_EGO_BIN) return existsSync(process.env.NEO_EGO_BIN) ? process.env.NEO_EGO_BIN : null
  return installedEgoApp() ?? bundledEgoApp()?.app ?? null
}

/** A .app bundle is a directory — what you spawn is the executable inside it. */
const egoExe = (bundle: string) => (bundle.endsWith(".app") ? join(bundle, "Contents", "MacOS", "ego lite") : bundle)

/** The CLI helper sits inside the same bundle as the browser we start — one copy, one channel. */
function egoCliPath(): string | null {
  const bin = egoBin()
  if (!bin) return null
  const bundle = bin.endsWith(".app") ? bin : bin.slice(0, bin.lastIndexOf(`${sep}Contents${sep}`))
  const cli = egoCliIn(bundle)
  return existsSync(cli) ? cli : null
}

/** A crash cannot run our shutdown code; next launch buries whatever the previous ego left behind. */
function reapPrevious() {
  try {
    const pid = Number(readFileSync(pidFile(), "utf8"))
    const command = pid > 1 ? execFileSync("ps", ["-o", "command=", "-p", String(pid)], { encoding: "utf8" }) : ""
    if (/ego lite/.test(command)) {
      log.warn("reaping ego left by a previous run", { pid })
      process.kill(pid)
    }
  } catch {
    // no pid file, or the process is already gone
  }
  rmSync(pidFile(), { force: true })
}

function freePort() {
  return new Promise<number>((resolve, reject) => {
    const probe = createServer()
    probe.once("error", reject)
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address() as { port: number }
      probe.close(() => resolve(port))
    })
  })
}

const versionAt = async (port: number): Promise<string | undefined> => {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/json/version`)
    if (!res.ok) return undefined
    return ((await res.json()) as { Browser?: string }).Browser
  } catch {
    return undefined
  }
}

type PageInfo = { id: string; url: string; title: string; type: string; webSocketDebuggerUrl?: string }

let running: EgoHost | null = null

export class EgoHost {
  /** The tab this app owns: the task page. The consultant's extra tabs are left alone. */
  private tabId: string | null = null
  private url = ""
  private title = ""
  private loading = false
  private canBack = false
  private canFwd = false
  private rootFrame = ""
  private readonly navStarts = new Set<() => void>()
  private readonly changes = new Set<() => void>()

  /** The observer wire: toolbar state (url/title/loading/history) and the toolbar's own commands.
   * Separate from the tools' Cdp so the address bar and the human handoff keep working while
   * every tool command is being refused. */
  private readonly observer = wsTransport(() => this.tabEndpoint())

  /** The tools' channel — the controller binds its Cdp to exactly this. */
  private readonly tools = new Cdp(wsTransport(() => this.tabEndpoint()))

  constructor(
    private readonly port: number,
    /** null when we adopted an instance a previous run started (we then leave it alone on quit too). */
    private readonly child: ChildProcess | null,
  ) {
    this.observer.onEvent((evt) => this.onObserverEvent(evt))
    this.observer.onLost(() => (this.rootFrame = ""))
  }

  get host(): BrowserHost {
    return { page: this.page, cdp: this.tools }
  }

  // ---------------------------------------------------------------- lifecycle

  /** Start ego (or adopt ours from a previous task), or return null — the caller falls back to the embedded page. */
  static async ensure(): Promise<EgoHost | null> {
    if (process.env.NEO_EGO === "off") {
      log.info("ego routing disabled (NEO_EGO=off)")
      return null
    }
    if (running) {
      if (await versionAt(running.port)) return running
      log.warn("our ego died between tasks — starting it again")
      running = null
    }
    const bin = egoBin()
    if (!bin) {
      log.warn("no ego lite bundle available — cannot route through it")
      return null
    }
    // An instance of OUR ego still up and answering on OUR recorded port: adopt, don't compete with it.
    const adopted = await EgoHost.tryAdopt()
    if (adopted) return adopted
    seedEgoProfile(profileDir())
    for (let attempt = 1; attempt <= 2; attempt++) {
      const port = await freePort()
      const child = spawn(egoExe(bin), ["--user-data-dir=" + profileDir(), `--remote-debugging-port=${port}`, `--ego-server-name=${EGO_SERVER_NAME}`, "--no-first-run", "--no-default-browser-check"], { stdio: "ignore" })
      child.on("error", (error) => log.error("cannot start ego", { error }))
      try {
        writeFileSync(pidFile(), String(child.pid))
        writeFileSync(portFile(), String(port))
      } catch (error) {
        log.error("cannot write the ego pid/port files", { error })
      }
      const exited = () => (child.exitCode !== null || child.signalCode !== null ? `ego exited (${child.exitCode ?? child.signalCode})` : undefined)
      const started = Date.now()
      const browser = await waitForHealth(() => versionAt(port), { deadlineMs: 60_000, betweenMs: 500, exited })
      if (browser) {
        const host = new EgoHost(port, child)
        running = host
        log.info("ego lite is up", { port, browser, ms: Date.now() - started, attempt })
        return host
      }
      log.warn("ego did not answer the DevTools port", { port, attempt, why: exited() ?? "health deadline" })
      try {
        child.kill("SIGTERM")
      } catch {
        /* already gone */
      }
    }
    // One last look: a slow machine can finish starting after the deadline; a second browser would do harm.
    return (await EgoHost.tryAdopt()) ?? null
  }

  private static async tryAdopt(): Promise<EgoHost | null> {
    try {
      const pid = Number(readFileSync(pidFile(), "utf8"))
      const port = Number(readFileSync(portFile(), "utf8"))
      const command = pid > 1 ? execFileSync("ps", ["-o", "command=", "-p", String(pid)], { encoding: "utf8" }) : ""
      if (!/ego lite/.test(command)) return null
      const browser = await versionAt(port)
      if (!browser) return null
      log.info("adopting our ego still running from a previous task", { pid, port })
      const host = new EgoHost(port, null)
      running = host
      return host
    } catch {
      return null
    }
  }

  /** Leave our ego down on the way out; anything we adopted from an earlier run was left alone already. */
  stop() {
    if (!this.child) return
    try {
      this.child.kill("SIGTERM")
    } catch {
      /* already gone */
    }
    rmSync(pidFile(), { force: true })
    if (running === this) running = null
  }

  /**
   * A stop a caller can rely on: SIGTERM, then WAIT for the port to go quiet, then SIGKILL.
   * (SIGTERM alone was trusted once and it was not enough — a smoke run whose process was killed
   * mid-exit left a named instance holding ego's official channel, and the NEXT run's CLI quietly
   * talked to THAT one, docs/ROADMAP.md. The port answering is the only truth that it is gone.)
   */
  async forceStop(timeoutMs = 8000): Promise<boolean> {
    if (!this.child) return true
    this.stop()
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
      if (!(await versionAt(this.port))) return true
      await new Promise((r) => setTimeout(r, 250))
    }
    log.warn("ego ignored SIGTERM — escalating to SIGKILL", { port: this.port })
    try {
      this.child.kill("SIGKILL")
    } catch {
      /* already gone */
    }
    return !(await versionAt(this.port))
  }

  static stopIfRunning() {
    running?.stop()
  }

  // ---------------------------------------------------------------- the task tab

  private base = () => `http://127.0.0.1:${this.port}`

  private async http<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(this.base() + path, init)
    if (!res.ok) throw new Error(`ego ${path} -> HTTP ${res.status}`)
    return (await res.json()) as T
  }

  private async pages(): Promise<PageInfo[]> {
    return (await this.http<PageInfo[]>("/json/list")).filter((t) => t.type === "page" && t.webSocketDebuggerUrl)
  }

  /**
   * Put `url` in the ego window: reuse the task's tab if it still lives (reopening a task must not
   * wipe where the consultant left it) or create one — and bring it forward, the consultant should
   * SEE the page the AI is about to work in.
   */
  async openTaskTab(url: string, navigateIfPresent: boolean) {
    const pages = await this.pages().catch(() => [] as PageInfo[])
    const tab = this.tabId ? pages.find((p) => p.id === this.tabId) : undefined
    if (tab && navigateIfPresent && tab.url !== url) {
      await this.page.loadURL(url)
      return
    }
    if (!tab) {
      const created = await this.http<PageInfo>("/json/new?" + encodeURIComponent(url), { method: "PUT" })
      this.tabId = created.id
      await fetch(`${this.base()}/json/activate/${created.id}`).catch(() => undefined)
      await this.observer.open().catch((error) => log.warn("observer cannot watch the new tab yet", { error }))
      await this.seedTab(created.id)
      log.info("ego tab opened", { url, tabId: created.id })
      return
    }
    await this.seedTab(tab.id)
  }

  // ---------------------------------------------------------------- the task space (stage 4)

  /** ego's own official channel; only the space lifecycle ever goes through it, never page work.
   * Public so smoke can pin the refusal shapes on a fresh profile (docs/ROADMAP.md stage 4). */
  readonly cli = new EgoCli(egoCliPath() ?? "")

  /** The space holding the task's page; null while a tab was opened directly (smoke's transport path). */
  private spaceId: number | null = null
  private ownershipTimer: ReturnType<typeof setInterval> | undefined

  /**
   * Put the task's page into a task space named `spaceName` — ego's isolation for agents: the
   * consultant's own windows and every other agent's spaces stay out of each other's way, while
   * the tab itself shows in `/json/list` under the SAME targetId the CLI reported (measured), so
   * the observer and the tools' CDP bind to it exactly as before.
   * Returns `needs-onboarding` when ego's own channel refuses for want of a clicked wizard — the
   * caller keeps its "complete the welcome window" pane up and retries. We close NOTHING in the
   * meantime: CDP-closing the wizard starves the CLI (measured — the two gates are separate).
   */
  async enterTaskSpace(spaceName: string, url: string, navigateIfPresent: boolean): Promise<{ kind: "ok" } | { kind: "needs-onboarding" }> {
    const space = await this.cli.ensureSpace(spaceName)
    if (!space.ok) {
      if (space.needsOnboarding) return { kind: "needs-onboarding" }
      throw new Error(`ego space "${spaceName}": ${space.error}`)
    }
    this.spaceId = space.value.id
    const pages = await this.pages().catch(() => [] as PageInfo[])
    if (this.tabId && pages.some((p) => p.id === this.tabId)) {
      // Reopening a task must not wipe where the consultant left it — only steer when it's a fresh open.
      if (navigateIfPresent && this.url !== url) await this.page.loadURL(url)
      else await this.seedTab(this.tabId)
      return { kind: "ok" }
    }
    const opened = await this.cli.openTab(space.value.id, url)
    if (!opened.ok) {
      if (opened.needsOnboarding) return { kind: "needs-onboarding" }
      throw new Error(`ego openTab in space ${space.value.id} failed: ${opened.error}`)
    }
    if (!opened.value.id) throw new Error(`ego opened the tab but reported no targetId (space ${space.value.id})`)
    this.tabId = opened.value.id
    await fetch(`${this.base()}/json/activate/${this.tabId}`).catch(() => undefined) // bring the page forward — the consultant should SEE where the AI works
    await this.seedTab(this.tabId)
    log.info("ego task space bound", { spaceName, spaceId: space.value.id, tabId: this.tabId })
    return { kind: "ok" }
  }

  /**
   * ego's ownership rules fence its OWN channel but not our CDP (measured — a structural gap of
   * the raw-CDP route, docs/ROADMAP.md). So we watch ego's state ourselves: while the tools are
   * bound, ask the official channel who holds the space, and the moment it is not the agent, stop.
   * A round costs ~0.4s (measured); 2.5s cadence is cheap. The watch stops on the first loss —
   * the handoff stays held until the consultant clicks 【我操作完了，交回 AI】.
   */
  watchOwnership(onTakenByHuman: () => void): () => void {
    if (this.spaceId == null) return () => undefined
    let busy = false
    this.ownershipTimer = setInterval(() => {
      const spaceId = this.spaceId
      if (busy || spaceId == null) return
      busy = true
      void this.cli
        .ownership(spaceId)
        .then((own) => {
          if (own.ok && own.value !== "agent") {
            log.info("ego space ownership left the agent — tools down", { spaceId, ownership: own.value })
            this.stopOwnershipWatch()
            onTakenByHuman()
          }
        })
        .finally(() => (busy = false))
    }, 2500)
    return () => this.stopOwnershipWatch()
  }

  private stopOwnershipWatch() {
    if (this.ownershipTimer) clearInterval(this.ownershipTimer)
    this.ownershipTimer = undefined
  }

  /** Tell ego's own channel about a handoff we initiated, so its window shows the right state. */
  async handOffSpace() {
    if (this.spaceId == null) return
    const r = await this.cli.handOff(this.spaceId)
    if (!r.ok) log.warn("ego space handOff did not report back (the space may already be the human's)", { error: r.error })
  }

  /** The consultant clicked 【交回 AI】 — the explicit confirmation ego demands before takeOver. Never called on our own initiative. */
  async takeOverSpace(): Promise<boolean> {
    if (this.spaceId == null) return true
    const r = await this.cli.takeOver(this.spaceId)
    if (!r.ok) {
      log.warn("ego space takeOver failed", { error: r.error })
      return false
    }
    log.info("ego space back with the agent", { spaceId: this.spaceId })
    return true
  }

  /** A tab closed under our feet (the consultant may have closed it): bring it back — via the space when we are in one. */
  private async reopenTab(url: string) {
    if (this.spaceId != null) {
      const opened = await this.cli.openTab(this.spaceId, url).catch(() => null)
      if (opened?.ok && opened.value.id) {
        this.tabId = opened.value.id
        await this.seedTab(this.tabId)
        return
      }
      log.warn("space reopen failed — falling back to a direct tab", { url })
    }
    await this.openTaskTab(url, false)
  }

  /** The observer's first look at the tab: its frame tree (to tell main-frame events from iframe ones) and where it stands. */
  private async seedTab(tabId: string) {
    const pages = await this.pages().catch(() => [] as PageInfo[])
    const tab = pages.find((p) => p.id === tabId)
    if (tab) (this.url = tab.url), (this.title = tab.title)
    this.loading = true
    try {
      await this.observer.open()
      await this.observer.post("Page.enable").catch(() => undefined)
      const tree = await this.observer.post<{ frameTree?: { frame?: { id?: string } } }>("Page.getFrameTree").catch(() => undefined)
      this.rootFrame = tree?.frameTree?.frame?.id ?? ""
      await this.refreshHistory()
    } catch (error) {
      log.warn("ego tab not watchable yet", { error })
    }
    this.fireChanged()
  }

  /** Stage 4 pin (smoke): the CLI's targetId must show up in `/json/list` as this very id — the bridge between the two channels. */
  async tabVisible(tabId: string): Promise<boolean> {
    return (await this.pages().catch(() => [] as PageInfo[])).some((p) => p.id === tabId)
  }

  private async tabEndpoint(): Promise<string> {
    const tab = (await this.pages()).find((p) => p.id === this.tabId)
    if (!tab?.webSocketDebuggerUrl) throw new Error(this.tabId ? "the ego tab was closed — open the page again (the address bar still works)" : "no ego tab is open yet")
    return tab.webSocketDebuggerUrl
  }

  // ---------------------------------------------------------------- observer events → the Page surface

  private onObserverEvent(evt: { method: string; params: any; sessionId?: string }) {
    if (evt.sessionId) return // iframe children are the tools' business; the toolbar only follows the page itself
    switch (evt.method) {
      case "Page.frameStartedLoading":
        if (!this.rootFrame || evt.params?.frameId === this.rootFrame) (this.loading = true), this.fireNavStart()
        break
      case "Page.frameNavigated": {
        const frame = evt.params?.frame
        if (frame && !frame.parentId) (this.url = frame.url ?? this.url), (this.loading = true), void this.refreshHistory(), this.fireChanged()
        break
      }
      case "Page.navigatedWithinPage":
        if (evt.params?.url) (this.url = evt.params.url), this.fireChanged()
        break
      case "Page.titleChanged":
        if (typeof evt.params?.title === "string") (this.title = evt.params.title), this.fireChanged()
        break
      case "Page.loadEventFired":
        this.loading = false
        this.fireChanged()
        break
    }
  }

  private async refreshHistory() {
    const history = await this.observer
      .post<{ currentIndex: number; entries: { url: string }[] }>("Page.getNavigationHistory")
      .catch(() => undefined)
    if (!history) return
    this.canBack = history.currentIndex > 0
    this.canFwd = history.currentIndex < history.entries.length - 1
  }

  private async historyStep(delta: -1 | 1) {
    try {
      const history = await this.observer.post<{ currentIndex: number; entries: { id: number }[] }>("Page.getNavigationHistory")
      const entry = history.entries[history.currentIndex + delta]
      if (entry) await this.observer.post("Page.navigateToHistoryEntry", { entryId: entry.id })
    } catch (error) {
      log.warn("ego history step failed", { delta, error })
    }
  }

  private fireNavStart() {
    for (const handler of [...this.navStarts]) handler()
  }
  private fireChanged() {
    for (const handler of [...this.changes]) handler()
  }

  readonly page: Page = {
    getURL: () => this.url,
    getTitle: () => this.title,
    isLoading: () => this.loading,
    canGoBack: () => this.canBack,
    canGoForward: () => this.canFwd,
    reload: () => {
      this.observer.post("Page.reload").catch((error) => {
        log.warn("ego reload failed", { error })
        void this.reopenTab(this.url || "about:blank")
      })
    },
    loadURL: async (url: string) => {
      if (!this.tabId || !(await this.pages().catch(() => [])).some((p) => p.id === this.tabId)) return this.reopenTab(url)
      this.loading = true
      this.fireNavStart()
      await this.observer.post("Page.navigate", { url })
    },
    goBack: () => void this.historyStep(-1),
    goForward: () => void this.historyStep(1),
    onNavStart: (handler) => {
      this.navStarts.add(handler)
      return () => this.navStarts.delete(handler)
    },
    onChanged: (handler) => {
      this.changes.add(handler)
      return () => this.changes.delete(handler)
    },
  }
}
