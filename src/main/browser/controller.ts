import { copyFile, mkdir, writeFile } from "node:fs/promises"
import { basename, extname, isAbsolute, join, resolve } from "node:path"
import { nativeImage } from "electron"
import { askJev } from "../jev"
import { createLogger } from "../log"
import { CHALLENGE_PROBE, challengePageHit, HANDOFF_TAKEOVER, HumanHeldError } from "./challenge"
import { BrowserError } from "./errors"
import type { ExplicitCredentials, LoginCredentials } from "./login-creds"
import type { BrowserHost, Page } from "./page"
import { existsSync } from "node:fs"
import { readdir, readFile } from "node:fs/promises"
import vocabularyJson from "../../../resources/profile-keys.json?raw"
import { decideMappings, flattenProfile, mappingQuestions, offeredKeys, type Mapping, type Profile } from "./autofill"
import { CLICKABLE_FN } from "./clickable"
import { detectDateFormat, formatDate, monthNumber, parseIso, sameDigits } from "./dates"
import { EDIT_COMMANDS, KEYS } from "./keys"
import { describeField, disambiguate, FIELD_EVIDENCE_FN, FIELD_ROLES, mergeRadios, PAGE_COMPLAINTS, type PageField } from "./fields"
import { describeMiss, pickOption, type Pick } from "./match"
import { clickables, decide, doQuestions, MAX_ELEMENTS, scrubPageText, type DoStep } from "./do"
import { chooseOverlayButton } from "./overlay"
import { classifyRisk, type RiskMatch } from "./risk"
import { collectFrameTree, findByRoleNameNth, nameOf, newLedger, renderSnapshot, roleOf, type AXNode, type RefEntry } from "./snapshot"

export type PendingDialog = { type: "confirm" | "prompt" | "beforeunload"; message: string; defaultPrompt?: string; sessionId?: string }
export type DialogNote = { type: string; message: string; at: number }
export type RiskDecision = "allow" | "deny"

type Resolved = { sessionId?: string; backendNodeId: number; entry: RefEntry }
type Kind = { kind: "select" | "radio" | "checkbox" | "search" | "text" | "button"; labels?: string[]; checked?: boolean; popup?: boolean }

/** Defined in ./errors.ts so throw-only callers can import it without Electron riding along. Re-exported here for existing `from "./controller"` callers. */
export { BrowserError }

const log = createLogger("browser")

/**
 * Everything the model can do to the application page. One page, one tab:
 * observe (accessibility snapshot with refs) → act by ref with real input events → read back.
 */
export class BrowserController {
  /** The page pair this controller is currently acting on (see bindHost). */
  private host: BrowserHost
  private unwire: (() => void) | undefined
  get cdp() {
    return this.host.cdp
  }
  private get page(): Page {
    return this.host.page
  }
  private refs = new Map<string, RefEntry>()
  private ledger = newLedger()
  private pendingDialog: PendingDialog | undefined
  private dialogNotes: DialogNote[] = []
  private overlayNotes: string[] = []
  private happenings: string[] = []

  /** Things that happened outside the page itself (a download, a refused permission, a print request): the model hears of them with the next result. */
  addNote(text: string) {
    this.happenings.push(text)
  }
  private dialogOpened = deferred()

  constructor(
    host: BrowserHost,
    private readonly options: {
      workspace: () => string
      /** Ask the consultant about a reserved action; resolves with their decision. */
      confirmRisk: (risk: RiskMatch & { url: string }) => Promise<RiskDecision>
      onActivity?: (text: string) => void
      /** The page left/returned the model's hands (bot gate or the consultant's own button); `why` comes only on the way out. */
      onHandoff?: (on: boolean, why?: "gate" | "manual") => void
      /** Auto-login (ROADMAP 2026-10-09 B / 2026-10-10 materials pass / 2026-10-12 the model may carry a pair in): the door that hands this platform's account over, open only while the task opted in. `explicit` is what the consultant gave the model as tool arguments — trusted, cached, and it outranks the scan. It may scan the student's materials (async); an ambiguous pile of records it throws on, so the model hears "交顾问" and not a guess. `loose` says the record named no site — the only one in the folder — so the login note must tell that to the model. */
      loginCredentials?: (explicit?: ExplicitCredentials) => LoginCredentials | undefined | Promise<LoginCredentials | undefined>
      /** The door cached the explicit pair on receipt; the site just said it is wrong — drop it again (2026-10-12 review P2). Only fires when this attempt carried `explicit` credentials and the page denied login, so a pair that only ever arrived is not handed out again by the next zero-arg call. */
      discardDeniedExplicit?: () => void | Promise<void>
      /** 2026-10-16 多标签: the honest word about the current tab in every snapshot header (popup tabs have no window.opener; a real window from open_in_window does). */
      pageIntro?: () => string | undefined
      /** The tab tools' doors — index.ts owns the TabsHost; the controller stays transport-shaped. */
      tabsList?: () => string
      switchTab?: (id: string) => Promise<string>
      openInRealWindow?: (url: string) => Promise<string>
    },
  ) {
    this.host = host
  }

  /** smoke: a scripted stand-in for the credential door, so the password path is testable with no keychain and no real password. */
  private loginCredentialsOverride?: (explicit?: ExplicitCredentials) => LoginCredentials | undefined | Promise<LoginCredentials | undefined>
  setLoginCredentialsForTests(fn?: (explicit?: ExplicitCredentials) => LoginCredentials | undefined | Promise<LoginCredentials | undefined>) {
    this.loginCredentialsOverride = fn
  }
  /** The resolved credentials, or nothing — the override only ever exists under smoke. */
  private async autoLoginCredentials(explicit?: ExplicitCredentials) {
    return await (this.loginCredentialsOverride?.(explicit) ?? this.options.loginCredentials?.(explicit))
  }

  /** smoke: a scripted stand-in for the "denied pair leaves the cache" door (2026-10-12 review P2). */
  private discardDeniedExplicitOverride?: () => void | Promise<void>
  setDiscardDeniedExplicitForTests(fn?: () => void | Promise<void>) {
    this.discardDeniedExplicitOverride = fn
  }
  private async discardDeniedExplicit() {
    const run = this.discardDeniedExplicitOverride ?? this.options.discardDeniedExplicit
    if (!run) return
    await Promise.resolve(run()).catch(() => {}) // a keychain hiccup must not turn a clean rejection into a login error
  }

  /**
   * Point the controller at another page — the embedded view or an ego lite tab (Plan 2). Whatever
   * was learned about the old page (refs, ledger, notes) belongs there and is dropped; a handoff
   * that was still on ends silently, since the consultant is not coming back to that page.
   */
  async bindHost(next: BrowserHost) {
    if (this.held) {
      this.held = undefined
      this.host.cdp.paused = false
      this.options.onHandoff?.(false)
    }
    this.unwire?.()
    this.host = next
    this.refs.clear()
    this.ledger = newLedger()
    this.pendingDialog = undefined
    this.dialogNotes = []
    this.overlayNotes = []
    this.happenings = []
    this.seen = undefined
    await next.cdp.attach()
    this.unwire = next.cdp.on((evt) => {
      if (evt.method === "Page.javascriptDialogOpening") void this.onDialog(evt.params, evt.sessionId)
      if (evt.method === "Page.javascriptDialogClosed") {
        this.pendingDialog = undefined
        this.dialogOpened = deferred()
      }
    })
  }

  // ---------------------------------------------------------------- human handoff
  /**
   * Some pages (Cloudflare's "prove you are human") read our attached CDP as a machine and loop forever —
   * the only way through is to take the debugger off and let the consultant pass it by hand.
   */
  private held: "gate" | "manual" | undefined
  get humanHandoff() {
    return this.held !== undefined
  }

  async handoffToHuman(why: "gate" | "manual") {
    if (this.held) return
    this.held = why
    this.cdp.releaseToHuman()
    // A gate page ran its detection while our debugger was still attached — detaching afterwards does not un-flag
    // THIS load; the widget just re-challenges itself inside the already-flagged page (real UCAS use: 【交给人】
    // clicked, loop went on). Reloading once makes the check run again in a browser no tool is touching.
    // Manual handoff never reloads: the consultant may be mid-typing a password.
    if (why === "gate") this.page.reload()
    log.info("page handed to the consultant", { why, reloaded: why === "gate", url: this.page.getURL().slice(0, 120) })
    this.options.onHandoff?.(true, why)
  }

  async takeBackFromHuman() {
    if (!this.held) return
    this.held = undefined
    await this.cdp.resumeTools()
    log.info("tools back on the page")
    this.options.onHandoff?.(false)
  }

  /** Is what shows right now a bot gate a tool must not fight? (Conservative: see challenge.ts.) */
  private async challengeHit() {
    return this.cdp
      .sendWithTimeout("Runtime.evaluate", { expression: CHALLENGE_PROBE, returnByValue: true }, undefined, 3_000)
      .then((r) => challengePageHit(JSON.parse(String(r?.result?.value ?? "{}"))), () => false)
  }

  async start() {
    await this.bindHost(this.host)
  }

  /** "e12" → `textbox “First name”`, for progress text the consultant can read. */
  describeRef(ref: string) {
    const entry = this.refs.get(ref)
    return entry ? shown(entry) : ref
  }

  // ---------------------------------------------------------------- dialogs

  /** alert() only has one answer, so take it and tell the model what it said. The rest wait for a decision. */
  private async onDialog(params: any, sessionId?: string) {
    const type = String(params?.type || "alert")
    const message = String(params?.message || "")
    log.info("page dialog", { type, message, url: params?.url, autoDismissed: type === "alert" })
    if (type === "alert") {
      this.dialogNotes.push({ type, message, at: Date.now() })
      // An alert left standing freezes the page for everyone — the consultant included. Make sure it is really gone.
      for (let attempt = 1; attempt <= 4; attempt++) {
        const closed = await this.cdp.sendWithTimeout("Page.handleJavaScriptDialog", { accept: true }, sessionId, 3_000).then(() => true, (error) => /no dialog/i.test(String(error?.message ?? error)))
        if (closed) return
        log.warn("alert did not close, trying again", { attempt, message })
        await sleep(300)
      }
      // Could not close it: say so instead of pretending, so the model (or the consultant, with one click) deals with it.
    }
    if (type === "alert") log.error("alert is still open after 4 attempts", { message })
    this.pendingDialog = { type: type as PendingDialog["type"], message, defaultPrompt: params?.defaultPrompt, sessionId }
    this.dialogOpened.resolve()
  }

  /**
   * confirm()/prompt() freeze the page, and with it the very CDP command that triggered them
   * (a mouse release, a key press, a script). Race every page-touching command against the dialog
   * so the action returns and the model can be told what popped up.
   */
  private input<T = any>(method: string, params: Record<string, unknown>, sessionId?: string): Promise<T | undefined> {
    const command = this.cdp.send<T>(method, params, sessionId)
    command.catch(() => {})
    return Promise.race([command, this.dialogOpened.promise.then(() => undefined)])
  }

  async handleDialog(accept: boolean, promptText?: string) {
    const dialog = this.pendingDialog
    if (!dialog) throw new BrowserError("当前没有等待处理的对话框。")
    if (accept) {
      const risk = classifyRisk(dialog.message)
      if (risk) await this.guard(risk)
    }
    await this.cdp.send("Page.handleJavaScriptDialog", { accept, promptText }, dialog.sessionId)
    log.info("dialog answered", { type: dialog.type, message: dialog.message, accept })
    this.pendingDialog = undefined
    await this.settle()
    return `已${accept ? "确认" : "取消"}对话框：${dialog.message}`
  }

  private assertNoDialog() {
    const d = this.pendingDialog
    if (!d) return
    throw new BrowserError(
      `页面弹出了 ${d.type} 对话框，页面已被它挡住：“${d.message}”。先用 browser_handle_dialog 决定确认还是取消。`,
    )
  }

  /** Appended to tool results so the model hears what the page said since last time. */
  private drainNotes() {
    const notes = this.dialogNotes.splice(0)
    const overlays = this.overlayNotes.splice(0)
    const happened = this.happenings.splice(0)
    return (
      (happened.length ? `\n\n页面之外发生的事：\n${happened.map((n) => `- ${n}`).join("\n")}` : "") +
      (notes.length
        ? `\n\n页面弹出过提示框（已自动点掉）：\n${notes.map((n) => `- ${n.message}`).join("\n")}\n（自动点掉的提示框如果是保存被拒的报错，很多系统整条记录都不会存——它们一页只在 Save 时持久化。先重新快照核对这一页现在的状态，别当作「只差一格」继续填。）`
        : "") +
      (overlays.length ? `\n\n有弹层挡住了表单，已替你关掉：\n${overlays.map((n) => `- ${n}`).join("\n")}` : "")
    )
  }

  // ---------------------------------------------------------------- observe

  async snapshot() {
    this.assertNoDialog()
    // HKUST report P1-4: huge old CGI pages can time the accessibility tree out while the page itself is
    // fine (screenshots kept working) — and the model burned rounds retrying. Retry once, then degrade
    // with the recovery that actually worked (one re-navigation) instead of erroring into a loop.
    let snap
    let frameCount = 0
    try {
      const tree = await this.treeWithRetry()
      frameCount = countFrames(tree)
      snap = renderSnapshot(tree, this.ledger)
    } catch (error) {
      if (!/timed?\s*out|timeout/i.test(String(error))) throw error
      log.warn("accessibility tree timed out twice; degrading", { url: this.page.getURL() })
      return `〔页面结构暂时读不出来（无障碍树连着两次超时）。页面多半没坏——截图一直是好的：先 browser_screenshot 看一眼再决定；对同一网址再 browser_navigate 一次，实测一次就能恢复。不要反复重试快照空转。〕${this.drainNotes()}`
    }
    this.refs = snap.refs
    const text = (await this.nameTheFields(snap.text)) + (await this.undeclaredClickables()) + (await this.blindRegions()) + this.seatingHint()
    this.seen = { url: this.page.getURL().split("#")[0], hash: this.page.getURL().split("#")[1] ?? "", title: this.page.getTitle(), refs: new Set(snap.refs.keys()), complaints: await this.complaints() }
    log.debug("snapshot", { url: this.page.getURL(), refs: snap.refs.size, chars: text.length, frames: frameCount, truncated: snap.truncated })
    const out = `${this.pageHeader()}\n${text}${this.drainNotes()}`
    // Same deal as the screenshot: this is the last read the model gets before the page belongs to a person.
    if (!this.held && (await this.challengeHit())) {
      await this.handoffToHuman("gate")
      return `${out}${HANDOFF_TAKEOVER}`
    }
    return out
  }

  /** The accessibility tree, with one retry on a timeout (HKUST report P1-4) before the caller degrades. */
  private async treeWithRetry() {
    try {
      return await collectFrameTree(this.cdp)
    } catch (error) {
      if (!/timed?\s*out|timeout/i.test(String(error))) throw error
      await sleep(1_000)
      return await collectFrameTree(this.cdp)
    }
  }

  /**
   * Parts of the page that show something but have no structure to read: a canvas someone drew a form on, an embedded
   * document. A person does not care how it is built; the model is told where it is and that it has to go by the picture.
   */
  private async blindRegions() {
    const found = await this.cdp
      .sendWithTimeout("Runtime.evaluate", { expression: BLIND_REGIONS, returnByValue: true }, undefined, 3_000)
      .then((r) => JSON.parse(r?.result?.value ?? "[]") as Array<{ kind: string; x: number; y: number; width: number; height: number }>, () => [])
    if (!found.length) return ""
    return `\n\n〔这一页有 ${found.length} 块看不到结构的区域，里面的东西没有编号：${found.map((b) => `${b.kind}（左上角 ${b.x},${b.y}，${b.width}×${b.height}）`).join("；")}。这一块只能看图操作：browser_screenshot grid=true（密的地方加 region 放大）→ browser_click_at → browser_type / browser_press_key Tab → 再截图确认显示的值。〕`
  }

  /** What the page looked like at the last snapshot — so the next one can say what an action changed. */
  private seen: { url: string; hash: string; title: string; refs: Set<string>; complaints: string[] } | undefined
  private lastFields: PageField[] = []

  /** Everything the page is currently complaining about: per field (with the field's name) and page-wide summaries. */
  private async complaints() {
    const perField = this.lastFields.filter((f) => f.error).map((f) => `“${f.label || f.axName || f.devName || f.ref}”：${f.error}`)
    const pageWide = await this.cdp
      .sendWithTimeout("Runtime.evaluate", { expression: PAGE_COMPLAINTS, returnByValue: true }, undefined, 3_000)
      .then((r) => JSON.parse(r?.result?.value ?? "[]") as string[], () => [] as string[])
    const known = this.lastFields.map((f) => f.error).filter(Boolean) as string[]
    return [...perField, ...pageWide.filter((text) => !known.some((e) => text === e))]
  }

  /**
   * Snapshot after an action, headed by what the action changed — a person notices at once that the page did not
   * move on, that a panel opened, that three boxes went red; the model should not have to diff two listings to see it.
   */
  private async snapshotAfter(before = this.seen) {
    let listing = await this.snapshot()
    const now = this.seen
    if (!before || !now) return listing
    const lines: string[] = []
    const moved = now.url !== before.url
    let seated = ""
    if (moved) lines.push(`到了另一页：${now.title || now.url}`)
    else {
      const appeared = [...now.refs].filter((ref) => !before.refs.has(ref))
      const gone = [...before.refs].filter((ref) => !now.refs.has(ref)).length
      if (now.hash !== before.hash || now.title !== before.title) lines.push(`网址没换，但页面内容换了（${now.title}）`)
      if (appeared.length && appeared.length <= 60) lines.push(`新出现了 ${appeared.length} 个元素${gone ? `、消失了 ${gone} 个` : ""}：${appeared.slice(0, 8).map((ref) => this.describeRef(ref)).join("、")}${appeared.length > 8 ? " …" : ""}`)
      else if (appeared.length) lines.push(`页面内容大面积更换（新出现 ${appeared.length} 个元素）`)
      else if (gone) lines.push(`有 ${gone} 个元素消失了（弹层 / 段落收起了）`)
      else lines.push("页面还是原来那一页，元素没有增减")
      // A choice brings its own follow-up boxes ("Other → please specify", a province once a country is picked). Seat
      // just those, now: the model should not have to come back for what its own click revealed, working from a
      // judgement it made before the page changed under it.
      const outcome = await this.seatFresh(appeared).catch((error) => (log.warn("seating the new fields failed", { error }), undefined))
      if (outcome) {
        seated = outcome.text
        if (outcome.filled) listing = await this.snapshot()
      }
    }
    const fresh = now.complaints.filter((c) => !before.complaints.includes(c))
    if (fresh.length) lines.push(`页面现在报错（${moved ? "" : "没让过，"}按它说的改，不要绕）：\n${fresh.slice(0, 12).map((c) => `  - ${c}`).join("\n")}`)
    else if (!moved && now.complaints.length) lines.push(`页面上原有的 ${now.complaints.length} 条报错还在`)
    return `〔这一步之后：${lines.join("；")}〕${seated}\n\n${listing}`
  }

  private seating = false
  /** Pages the model has already been made to look at once (see clickCore). */
  private lookedAt = new Set<string>()
  /** What WE typed on the page we are on: a stop is only ever about our own values, never the site's own. */
  private typedHere = new Map<string, { value: string; url: string }>()

  /**
   * The boxes this one action brought into being, seated against the answer bank straight away. Deliberately narrow:
   * same page, a handful of boxes, one Jev request — a whole page of new boxes is browser_fill_page's job and the
   * model is told so instead. No answer bank or no Jev: nothing happens here.
   */
  private async seatFresh(appearedRefs: string[]): Promise<{ text: string; filled: number } | undefined> {
    if (this.seating || this.pendingDialog || !appearedRefs.length) return undefined
    const appeared = new Set(appearedRefs)
    const open = this.lastFields.filter((f) => appeared.has(f.ref) && (!f.value || f.defaulted) && f.kind !== "other" && f.kind !== "file")
    if (!open.length) return undefined
    if (open.length > 8) return { text: `\n这一步冒出 ${open.length} 个空格子，调 browser_fill_page 一次对号入座。`, filled: 0 }
    const profile = await this.answerBank()
    if (!profile) return undefined
    this.seating = true
    try {
      const { mappings, jev } = await this.seatFields(open, profile)
      if (!jev) return { text: `\n这一步冒出 ${open.length} 个新格子（小模型现在不可用，你自己看着填）。`, filled: 0 }
      const fills = mappings.filter((m): m is Extract<Mapping, { decision: "fill" }> => m.decision === "fill")
      const filled = fills.length ? await this.fillFields(fills.map((m) => ({ ref: m.ref, value: m.value })), { fromBank: true }) : { lines: [] as string[], done: 0 }
      const rest = mappings.filter((m) => m.decision === "think" || m.decision === "human")
      const head = `\n这一步冒出 ${open.length} 个新格子${filled.lines.length ? `，替你对号入座填了 ${filled.done} 个：\n${filled.lines.join("\n")}` : ""}`
      const left = rest.length ? `\n还剩 ${rest.map((m) => `“${this.describeRef(m.ref)}”`).join("、")} 要你定（答案库里没有现成的，或者要判断）。` : ""
      return { text: `${head}${left}`, filled: filled.done }
    } finally {
      this.seating = false
    }
  }

  /** The student's answer bank, flattened; undefined when it is not there yet or cannot be read. */
  private async answerBank(): Promise<Profile | undefined> {
    const raw = await readFile(join(this.options.workspace(), "student_profile.json"), "utf8").catch(() => undefined)
    if (raw === undefined) return undefined
    try {
      return flattenProfile(JSON.parse(raw))
    } catch {
      return undefined
    }
  }

  private sources: { at: number; text: string; digits: string } | undefined

  /**
   * What the student actually handed in, as one normalised haystack: the text versions under materials_text/.
   *
   * Deliberately NOT the answer bank. The bank is written by the model, so letting it count as evidence makes an
   * invented value prove itself — which is exactly what happened on a blind run: a made-up candidate number went into
   * the bank, was copied onto the form, and nothing flagged it because the bank "said so".
   */
  private async sourceText() {
    if (this.sources && Date.now() - this.sources.at < 60_000) return this.sources
    const dir = join(this.options.workspace(), "materials_text")
    const files = await readdir(dir).catch(() => [] as string[])
    const parts = await Promise.all(files.filter((f) => f.endsWith(".md")).slice(0, 200).map((f) => readFile(join(dir, f), "utf8").catch(() => "")))
    const text = normalizeForSearch(parts.join(" "))
    this.sources = { at: Date.now(), text, digits: text.replace(/\D+/g, "") }
    log.debug("the student's papers loaded", { files: files.length, chars: text.length })
    return this.sources
  }

  /**
   * Can this value be pointed at something the student actually handed in? A real run put a complete Chinese street
   * address on a UC form that appears nowhere in the materials (they only describe the place in English) — every value
   * on an application has to come from somewhere. Only a warning: reformatting and transliteration are legitimate, so
   * the tool says what it could not find and the model decides.
   */
  private async traceable(value: string) {
    const text = value.trim()
    // Too short to mean anything, too long to be a fact (an essay), or a date — dates are reformatted by design and
    // are already checked by reading the box back.
    if (text.length < 4 || text.length > 80 || parseIso(text) || /^[\d\s./-]{6,12}$/.test(text)) return true
    const needle = normalizeForSearch(text)
    if (needle.length < 4) return true
    const papers = await this.sourceText()
    if (papers.text.includes(needle)) return true
    // A number written differently is still the same number: a country code put in front, spaces regrouped.
    const digits = needle.replace(/\D+/g, "")
    return digits.length >= 8 && papers.digits.includes(digits.slice(-8))
  }

  /** Which of the values now on this page cannot be pointed at the answer bank or the student's papers. */
  private async untraceableOnPage(fields?: PageField[]) {
    const list = (fields ?? (await this.fields())).filter((f) => f.value && ["text", "textarea", "search"].includes(f.kind))
    const out: string[] = []
    for (const f of list) if (!(await this.traceable(f.value!).catch(() => true))) out.push(`“${f.label || f.axName || f.ref}” = “${f.value}”`)
    return out
  }

  /** One Jev request: which answer-bank entry belongs in each of these boxes (docs/FILLING.md). */
  private async seatFields(open: PageField[], profile: Profile) {
    const keys = offeredKeys(profile, JSON.parse(vocabularyJson).keys)
    const { state, questions } = mappingQuestions(open, keys)
    const started = Date.now()
    const answers = await askJev(state, questions, this.options.workspace())
    const mappings = decideMappings(open, answers, profile)
    log.info("page seated", {
      fields: open.length,
      keys: Object.keys(keys).length,
      ms: Date.now() - started,
      jev: Boolean(answers),
      decisions: mappings.reduce<Record<string, number>>((acc, m) => ((acc[m.decision] = (acc[m.decision] ?? 0) + 1), acc), {}),
    })
    return { mappings, jev: Boolean(answers) }
  }

  private emptyFields = 0
  /** Tools speak: a page with many empty boxes and an answer bank in the workspace is a page for browser_fill_page. */
  private seatingHint() {
    if (this.emptyFields < 4) return ""
    const bank = existsSync(join(this.options.workspace(), "student_profile.json"))
    return `\n\n〔这一页有 ${this.emptyFields} 个空着的格子。${bank ? "先调 browser_fill_page" : "等你写好答案库 student_profile.json，先调 browser_fill_page"}：它会对照答案库对号入座，把有把握的一次填好，剩下的连同证据交给你。〕`
  }

  /** Numbers the things a person could click that the site never declared (see clickable.ts). Main frame only, for now. */
  private async undeclaredClickables() {
    const objectGroup = `neo-click-${Date.now()}`
    try {
      const evaluated = await this.cdp.sendWithTimeout("Runtime.evaluate", { expression: CLICKABLE_FN, includeCommandLineAPI: true, returnByValue: false, objectGroup }, undefined, 8_000)
      const arrayId = evaluated?.result?.objectId as string | undefined
      if (!arrayId) return ""
      const { result: items } = await this.cdp.send<{ result: Array<{ name: string; value?: { objectId?: string } }> }>("Runtime.getProperties", { objectId: arrayId, ownProperties: true }, undefined)
      const rows = await Promise.all(
        items
          .filter((p) => /^\d+$/.test(p.name) && p.value?.objectId)
          .map(async (p) => {
            const props = await this.cdp.send<{ result: Array<{ name: string; value?: { objectId?: string; value?: unknown } }> }>("Runtime.getProperties", { objectId: p.value!.objectId!, ownProperties: true })
            const get = (name: string) => props.result.find((x) => x.name === name)?.value
            const elId = get("el")?.objectId
            if (!elId) return undefined
            const described = await this.cdp.send("DOM.describeNode", { objectId: elId }).catch(() => undefined)
            const backendNodeId = described?.node?.backendNodeId as number | undefined
            return backendNodeId === undefined ? undefined : { backendNodeId, name: String(get("name")?.value ?? ""), how: String(get("how")?.value ?? "") }
          }),
      )
      const known = new Set([...this.refs.values()].map((e) => e.backendNodeId))
      const fresh = rows.filter((r): r is NonNullable<typeof r> => Boolean(r) && !known.has(r!.backendNodeId))
      if (!fresh.length) return ""
      const counts = new Map<string, number>()
      const lines = fresh.map((row) => {
        const identity = `||${row.backendNodeId}`
        const ref = this.ledger.ids.get(identity) ?? `e${++this.ledger.next}`
        this.ledger.ids.set(identity, ref)
        const nth = counts.get(row.name) ?? 0
        counts.set(row.name, nth + 1)
        this.refs.set(ref, { ref, backendNodeId: row.backendNodeId, role: "clickable", name: row.name, nth })
        return `  - clickable "${row.name.replace(/"/g, "'")}" [ref=${ref}]`
      })
      log.debug("undeclared clickables", { count: fresh.length, how: fresh.reduce<Record<string, number>>((acc, r) => ((acc[r.how] = (acc[r.how] ?? 0) + 1), acc), {}) })
      return `\n- 页面上还有这些看得出能点、但网站没有声明的东西（文字、卡片、日历格子…）：\n${lines.join("\n")}`
    } catch (error) {
      log.warn("clickable probe failed", { error })
      return ""
    } finally {
      void this.cdp.send("Runtime.releaseObjectGroup", { objectGroup }).catch(() => {})
    }
  }

  /**
   * The accessibility tree only knows the names a site bothered to declare. People read the words next to a box;
   * so do we: a field with no name (or whose "name" is just its example text) is shown under the label a person
   * would use, the example is marked as an example, and what the page flags is shown on the field it flags.
   */
  private async nameTheFields(text: string) {
    const fields = await this.fields().catch((error) => (log.warn("field naming failed", { error }), [] as PageField[]))
    const byRef = new Map(fields.map((f) => [f.ref, f]))
    this.lastFields = fields
    this.emptyFields = fields.filter((f) => (!f.value || f.defaulted) && f.kind !== "other" && f.kind !== "checkbox").length
    let named = 0
    const out = text.replace(/^(\s*- [\w-]+)(?: "((?:[^"\\]|\\.)*)")?([^\n]*?\[ref=(e\d+)\][^\n]*)$/gm, (line, head: string, axName: string | undefined, rest: string, ref: string) => {
      const f = byRef.get(ref)
      if (!f) return line
      const entry = this.refs.get(ref)
      const nameless = !axName || (f.hint && axName.trim().toLowerCase() === f.hint.toLowerCase())
      // Also rename a control whose own name is shared with others on the page ("country code" ×3): its row tells them apart.
      const qualified = Boolean(axName && f.label && f.label !== axName && f.label.includes(axName))
      if ((nameless || qualified) && f.label && f.kind !== "radio") {
        if (entry) entry.label = f.label
        named++
        line = `${head} "${f.label.replace(/"/g, "'")}"${rest}`
      } else if (nameless && f.kind !== "radio") {
        if (entry) entry.label = f.devName ? `（页面上没有标签；开发者命名 ${f.devName}）` : "（页面上没有标签）"
        line = `${head}${rest}` // an example text is not a name
      }
      const notes = [f.hint ? `示例：${f.hint}（不是数据）` : "", f.required && !/\[required\]/.test(line) ? "必填" : "", f.error ? `⚠ ${f.error}` : "", nameless && !f.label && f.devName ? `开发者命名：${f.devName}` : ""].filter(Boolean)
      return notes.length ? `${line} 〔${notes.join("；")}〕` : line
    })
    if (named) log.debug("fields named from the page", { named, of: fields.length })
    return out
  }

  /**
   * Every form field of the last snapshot the way a person sees it: the text next to it, its section, the example
   * inside it, required / flagged, current value — and what the developers called it. One page call per frame.
   */
  async fields(): Promise<PageField[]> {
    const entries = [...this.refs.values()].filter((e) => FIELD_ROLES.has(e.role) || e.role === "button")
    // One call per document: elements of a same-process iframe live in another JavaScript world than their parent page.
    const byDocument = new Map<string, RefEntry[]>()
    for (const e of entries) { const k = `${e.sessionId ?? ""}|${e.frameId ?? ""}`; byDocument.set(k, [...(byDocument.get(k) ?? []), e]) }
    const out: PageField[] = []
    for (const group of byDocument.values()) {
      const sessionId = group[0].sessionId
      const objectGroup = `neo-fields-${Date.now()}`
      const resolved = await Promise.all(
        group.map((e) => this.cdp.send("DOM.resolveNode", { backendNodeId: e.backendNodeId, objectGroup }, sessionId).then((r) => r?.object?.objectId as string | undefined, () => undefined)),
      )
      const live = group.map((entry, i) => ({ entry, objectId: resolved[i] })).filter((x): x is { entry: RefEntry; objectId: string } => Boolean(x.objectId))
      if (!live.length) continue
      try {
        const result = await this.cdp.sendWithTimeout(
          "Runtime.callFunctionOn",
          { objectId: live[0].objectId, functionDeclaration: FIELD_EVIDENCE_FN, arguments: live.map((x) => ({ objectId: x.objectId })), returnByValue: true },
          sessionId,
          10_000,
        )
        const rows = (result?.result?.value ?? []) as Array<Omit<PageField, "ref" | "role" | "axName"> | null>
        rows.forEach((row, i) => {
          if (!row) return
          const { entry } = live[i]
          // A plain button is not a field; one that opens a list, fronts a file input, or is where a document goes in, is.
          const uploadEntry = entry.role === "button" && UPLOAD_ENTRY.test(entry.name)
          if (entry.role === "button" && !entry.popup && row.kind !== "file" && !uploadEntry) return
          const done = uploadEntry && this.uploadedHere.has(`${this.page.getURL()}|${entry.name}|${row.label}`)
          out.push({ ...row, kind: uploadEntry ? "file" : entry.role === "button" && entry.popup ? "search" : row.kind, value: done ? "（已上传）" : row.value, ref: entry.ref, role: entry.role, axName: entry.name })
        })
      } catch (error) {
        log.warn("field evidence failed for a frame", { error, fields: live.length })
      } finally {
        void this.cdp.send("Runtime.releaseObjectGroup", { objectGroup }, sessionId).catch(() => {})
      }
    }
    return disambiguate(mergeRadios(out))
  }

  /**
   * Seat a whole page against the student's answer bank (docs/FILLING.md): Jev matches every empty field to an entry
   * in ONE request; what it is sure of is filled with the bank's value verbatim; the rest comes back to the big model
   * with the evidence and a numbered picture of the page. Without Jev, everything comes back — slower, not broken.
   */
  async fillPage(): Promise<{ text: string; image?: string }> {
    this.assertNoDialog()
    const profilePath = join(this.options.workspace(), "student_profile.json")
    const raw = await readFile(profilePath, "utf8").catch(() => undefined)
    if (raw === undefined) throw new BrowserError("工作区里还没有 student_profile.json（答案库）。先读完材料，按 profile-keys.json 里的键把它写出来，再调用这个工具。")
    let profile
    try { profile = flattenProfile(JSON.parse(raw)) } catch (error) { throw new BrowserError(`student_profile.json 不是合法的 JSON：${error instanceof Error ? error.message : error}`) }

    await this.snapshot()
    const all = await this.fields()
    const open = all.filter((f) => (!f.value || f.defaulted) && f.kind !== "other")
    const already = all.length - open.length
    if (!open.length) return { text: `这一页的 ${all.length} 个字段都已经有值了。用 browser_review 核对一遍。` }

    const { mappings, jev } = await this.seatFields(open, profile)

    const lines: string[] = []
    const name = (ref: string) => { const f = open.find((x) => x.ref === ref)!; return f.label || f.axName || (f.devName ? `（无标签，开发者命名 ${f.devName}）` : ref) }
    const fills = mappings.filter((x): x is Extract<Mapping, { decision: "fill" }> => x.decision === "fill")
    const isFile = (ref: string) => open.find((f) => f.ref === ref)?.kind === "file"
    // Everything that is not a file goes through fill_form in one go: one pass, one snapshot at the end.
    const typed = fills.filter((m) => !isFile(m.ref))
    if (typed.length) {
      const result = await this.fillFields(typed.map((m) => ({ ref: m.ref, value: m.value })), { fromBank: true })
      typed.forEach((m, i) => lines.push(result.lines[i] ? `${result.lines[i]}  〔答案库：${m.key}〕` : `✗ “${name(m.ref)}” 还没填（答案库：${m.key}）`))
      await this.snapshot() // filling re-renders the page; the ref table has to catch up before we go looking again
    }
    // Filling renumbers the page; find every remaining field again by what it IS, not by its old number.
    const identity = (f: PageField) => `${f.kind}|${f.label}|${f.devName}|${f.group}`
    const remap = async () => {
      const now = await this.fields()
      const seen = new Map<string, number>()
      const index = new Map<string, string>()
      for (const f of now) { const k = identity(f); const n = seen.get(k) ?? 0; seen.set(k, n + 1); index.set(`${k}#${n}`, f.ref) }
      const counted = new Map<string, number>()
      const old = new Map<string, string>()
      for (const f of all) { const k = identity(f); const n = counted.get(k) ?? 0; counted.set(k, n + 1); old.set(f.ref, `${k}#${n}`) }
      return (ref: string) => index.get(old.get(ref) ?? "") ?? ref
    }
    let current = typed.length && !this.pendingDialog ? await remap() : (ref: string) => ref
    for (const m of fills.filter((x) => isFile(x.ref))) {
      if (this.pendingDialog) break
      try {
        const field = open.find((f) => f.ref === m.ref)
        const result = await this.upload(current(m.ref), [m.value])
        const went = result.startsWith("已选择文件")
        if (went && field) this.uploadedHere.add(`${this.page.getURL()}|${field.axName}|${field.label}`)
        // An upload is often a little journey (crop, save); the first two lines say how far it got.
        lines.push(`${went ? "✓" : "⚠"} “${name(m.ref)}”：${result.split("\n").slice(0, 2).join(" ")}  〔答案库：${m.key}〕`)
        current = await remap()
      } catch (error) {
        lines.push(`✗ “${name(m.ref)}” 没传上（答案库：${m.key} = ${m.value}）：${error instanceof Error ? error.message : String(error)}`)
      }
    }
    for (const f of open) f.ref = current(f.ref)
    for (const m of mappings) m.ref = current(m.ref)
    const skipped = mappings.filter((m) => m.decision === "skip").map((m) => `“${name(m.ref)}”`)
    const human = mappings.filter((m) => m.decision === "human").map((m) => `“${name(m.ref)}”`)
    const think = mappings.filter((m): m is Extract<Mapping, { decision: "think" }> => m.decision === "think")
    const thinkLines = think.map((m) => {
      const f = open.find((x) => x.ref === m.ref)!
      return `${describeField(f)}${f.options?.length ? `；选项：${f.options.join(" | ")}` : ""}${m.leaning ? `；小模型倾向答案库的 ${m.leaning}（${m.confidence.toFixed(2)}，没敢填）` : ""}`
    })
    const parts = [
      `这一页 ${all.length} 个字段：${already} 个本来就有值；对号入座填了 ${lines.filter((l) => l.startsWith("✓") || l.startsWith("⚠")).length} 个${jev ? "" : "（小模型现在不可用，这一页全部交给你）"}。`,
      lines.length ? lines.join("\n") : "",
      skipped.length ? `留空（选填，或答案库里没有对应的内容）：${skipped.join("、")}` : "",
      human.length ? `必须由顾问本人来的（签名一类）：${human.join("、")}——记进待顾问清单，最后一起请他处理。` : "",
      think.length ? `\n**剩下 ${think.length} 个要你来定**（需要判断、要写、或小模型拿不准）。对照 student_profile.json 和下面这张带编号的截图想清楚——特别是格子到底在问什么——再用 browser_fill_form 一次补完；答案库里确实没有的，留空并记进待顾问清单，不要编：\n${thinkLines.join("\n")}` : "",
      `\n填完用 browser_review 把整页核对一遍，再翻页。`,
    ].filter(Boolean)
    const shot = think.length ? await this.screenshot(false, true).catch(() => undefined) : undefined
    return { text: parts.join("\n") + this.drainNotes(), image: shot?.data }
  }

  /** The page as a list of fields: what the big model checks a page against, and what the consultant can read. */
  async review() {
    this.assertNoDialog()
    await this.snapshot()
    const fields = await this.fields()
    const flagged = fields.filter((f) => f.error)
    const missing = fields.filter((f) => f.required && !f.value && !f.error)
    // The moment the consultant asked for: before this page is saved and left behind, say which values cannot be
    // pointed at anything the student handed in.
    const hearsay = await this.untraceableOnPage(fields)
    const head = `${this.pageHeader()}\n这一页共 ${fields.length} 个字段${flagged.length ? `，其中 ${flagged.length} 个被页面标了错` : ""}${missing.length ? `，${missing.length} 个必填还空着` : ""}。逐项对照答案库核一遍：值对不对、**是不是填在了对的格子里**；示例文字不是数据。`
    const doubt = hearsay.length
      ? `\n\n⚠ 这几格的值在材料里找不到原文：${hearsay.join("；")}。回去读那份材料再定——对的话把出处补进答案库，凭印象写的就改掉或留空，**不要带着它保存**。`
      : ""
    return `${head}${doubt}\n\n${fields.map(describeField).join("\n")}${this.drainNotes()}`
  }

  private pageHeader() {
    return `页面：${this.page.getTitle()}\n网址：${this.page.getURL()}${this.options.pageIntro?.() ?? ""}`
  }

  // ---------------------------------------------------------------- tabs (2026-10-16)

  /** browser_tabs: what tabs exist, which one the tools are on. */
  async tabsList(): Promise<string> {
    return this.options.tabsList?.() ?? "（这个页面没有标签机制。）"
  }

  /** browser_switch_tab: rebind to another hosted page and snapshot it. */
  async switchTab(id: string): Promise<string> {
    if (!this.options.switchTab) throw new BrowserError("这个页面没有标签机制。")
    const head = await this.options.switchTab(id)
    return `${head}\n${await this.snapshot()}`
  }

  /** browser_open_in_window: the opener-preserving escape (P0-2) — see index.ts openInRealWindow. */
  async openInRealWindow(url: string): Promise<string> {
    if (!this.options.openInRealWindow) throw new BrowserError("这个页面没有标签机制。")
    const head = await this.options.openInRealWindow(url)
    return `${head}\n${await this.snapshot()}`
  }

  /**
   * With `marks`, every numbered element of the last snapshot wears its number in the picture, so a model that
   * can see reads the page like a person and still acts through refs: eyes to recognise, DOM to act.
   */
  async screenshot(fullPage = false, marks = false, opts: { grid?: boolean; region?: { x: number; y: number; width: number; height: number } } = {}): Promise<{ data: string; file: string; more?: Array<{ data: string; file: string }>; handoff?: boolean }> {
    this.assertNoDialog()
    if (marks) {
      if (!this.refs.size) await this.snapshot()
      await this.paintMarks()
    }
    if (opts.grid) await this.paintGrid(opts.region ? 50 : 100)
    let shot
    try {
      shot = fullPage && !opts.region ? await this.captureScrolling() : await this.capture(opts.region)
    } finally {
      if (marks || opts.grid) await this.cdp.sendWithTimeout("Runtime.evaluate", { expression: "document.getElementById('__neo_marks__')?.remove(); document.getElementById('__neo_grid__')?.remove()" }, undefined, 5_000).catch(() => {})
    }
    // The picture goes out even for a gate page (the model sees what the consultant is being handed) — but the
    // tools let go with it, so nothing loops the verification.
    if (!this.held && (await this.challengeHit())) {
      await this.handoffToHuman("gate")
      return { ...shot, handoff: true }
    }
    return shot
  }

  /** A ruler over the viewport, in the same CSS pixels browser_click_at takes — so a position can be read off the picture. */
  private async paintGrid(step: number) {
    await this.cdp.sendWithTimeout(
      "Runtime.evaluate",
      {
        expression: `(() => { document.getElementById("__neo_grid__")?.remove(); const g = document.createElement("div"); g.id = "__neo_grid__";
          g.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483646;font:600 9px/1 -apple-system,sans-serif";
          const line = (css) => { const l = document.createElement("div"); l.style.cssText = "position:absolute;background:rgba(0,120,255,.35);" + css; g.append(l) };
          const tag = (text, css) => { const t = document.createElement("span"); t.textContent = text; t.style.cssText = "position:absolute;color:#fff;background:rgba(0,90,200,.85);padding:1px 2px;border-radius:2px;" + css; g.append(t) };
          for (let x = ${step}; x < innerWidth; x += ${step}) { line("top:0;bottom:0;width:1px;left:" + x + "px"); for (let y = 0; y < innerHeight; y += ${step * 4}) tag(String(x), "left:" + (x + 2) + "px;top:" + (y + 2) + "px") }
          for (let y = ${step}; y < innerHeight; y += ${step}) { line("left:0;right:0;height:1px;top:" + y + "px"); for (let x = 0; x < innerWidth; x += ${step * 4}) tag(String(y), "top:" + (y + 2) + "px;left:" + (x + 2) + "px") }
          document.documentElement.append(g) })()`,
      },
      undefined,
      5_000,
    )
  }

  /**
   * The last resort for what has no structure (a form drawn on a canvas, an embedded document): click where the
   * picture says. Anything that HAS a number is refused here — numbers are exact, positions are a guess — and the
   * one hard rule applies to what the model says it is clicking as much as to what the page says is there.
   */
  async clickAt(x: number, y: number, what: string, opts: { doubleClick?: boolean } = {}) {
    this.assertNoDialog()
    // What a click here would land on, and the two elements around it: if any of them has a number, use the number.
    const objectGroup = `neo-at-${Date.now()}`
    const chain: number[] = []
    let objectId = (await this.cdp.sendWithTimeout("Runtime.evaluate", { expression: `document.elementFromPoint(${Math.round(x)}, ${Math.round(y)})`, objectGroup }, undefined, 3_000).catch(() => undefined))?.result?.objectId as string | undefined
    if (!objectId) throw new BrowserError(`(${x}, ${y}) 不在页面的可见范围内。坐标是视口里的 CSS 像素，先用 browser_screenshot grid=true 看刻度。`)
    for (let hop = 0; objectId && hop < 3; hop++) {
      const node = await this.cdp.send("DOM.describeNode", { objectId }).catch(() => undefined)
      if (node?.node?.backendNodeId) chain.push(node.node.backendNodeId)
      objectId = (await this.cdp.send("Runtime.callFunctionOn", { objectId, functionDeclaration: "function(){ return this.parentElement }", objectGroup }).catch(() => undefined))?.result?.objectId
    }
    void this.cdp.send("Runtime.releaseObjectGroup", { objectGroup }).catch(() => {})
    const numbered = [...this.refs.values()].find((e) => !e.sessionId && chain.includes(e.backendNodeId) && !["canvas", "Canvas", "img", "image", "generic", "application", "document", "RootWebArea", "main", "form", "region", "group"].includes(e.role))
    if (numbered)
      throw new BrowserError(`这个位置上是有编号的元素 ${numbered.ref}（${numbered.role} “${shown(numbered)}”）。有编号的一律用编号操作（browser_click / browser_fill_form），坐标只留给没有结构的区域。`)
    const under = await this.cdp
      .sendWithTimeout("Runtime.evaluate", { expression: `(() => { const el = document.elementFromPoint(${Math.round(x)}, ${Math.round(y)}); return el ? (el.innerText || el.getAttribute("aria-label") || el.getAttribute("title") || "").replace(/\\s+/g, " ").trim().slice(0, 200) : "" })()`, returnByValue: true }, undefined, 3_000)
      .then((r) => String(r?.result?.value ?? ""), () => "")
    const risk = classifyRisk(what) ?? (under.length <= 80 ? classifyRisk(under) : undefined)
    if (risk) await this.guard(risk)

    const before = await this.bitmap()
    await this.mouseClick({ x, y }, undefined, opts.doubleClick ? 2 : 1)
    await this.settle(450)
    if (this.pendingDialog) return { text: `已在 (${x}, ${y}) 点击 “${what}”。页面弹出对话框：“${this.pendingDialog.message}”。用 browser_handle_dialog 处理。` }
    const change = describeChange(before, await this.bitmap())
    log.info("click at", { x, y, what, change })
    const shot = await this.screenshot(false, false, { grid: true }).catch(() => undefined)
    return { text: `已在 (${x}, ${y}) 点击 “${what}”。${change}\n看下面这张图确认：点中了吗？焦点在不在你要的那一格？要打字就接着用 browser_type，打完再截图核对显示的值。`, image: shot?.data }
  }

  /** The viewport at half size as raw pixels, for telling whether (and where) an action changed the picture. */
  private async bitmap() {
    const metrics = await this.cdp.send("Page.getLayoutMetrics").catch(() => undefined)
    const v = metrics?.cssVisualViewport
    if (!v) return undefined
    const shot = await this.cdp.sendWithTimeout<{ data: string }>("Page.captureScreenshot", { format: "png", clip: { x: v.pageX, y: v.pageY, width: v.clientWidth, height: v.clientHeight, scale: 0.5 } }, undefined, 10_000).catch(() => undefined)
    if (!shot) return undefined
    const image = nativeImage.createFromBuffer(Buffer.from(shot.data, "base64"))
    return { pixels: image.toBitmap(), ...image.getSize(), scale: v.clientWidth / Math.max(1, image.getSize().width) }
  }

  private async paintMarks() {
    const entries = [...this.refs.values()].filter((e) => !e.sessionId && !e.frameId && e.role !== "option" && e.role !== "MenuListOption").slice(0, 220)
    const boxes = await Promise.all(
      entries.map((e) =>
        this.cdp.send<{ quads: number[][] }>("DOM.getContentQuads", { backendNodeId: e.backendNodeId }).then(
          (r) => { const q = r.quads?.[0]; return q ? { ref: e.ref, x: Math.min(q[0], q[6]), y: Math.min(q[1], q[3]) } : undefined },
          () => undefined,
        ),
      ),
    )
    const marks = boxes.filter((b): b is { ref: string; x: number; y: number } => Boolean(b))
    await this.cdp.sendWithTimeout(
      "Runtime.evaluate",
      {
        expression: `(() => { document.getElementById("__neo_marks__")?.remove(); const layer = document.createElement("div"); layer.id = "__neo_marks__";
          layer.style.cssText = "position:absolute;left:0;top:0;width:0;height:0;pointer-events:none;z-index:2147483647";
          for (const m of ${JSON.stringify(marks)}) { const b = document.createElement("span"); b.textContent = m.ref;
            b.style.cssText = "position:absolute;font:700 10px/1.1 -apple-system,sans-serif;color:#fff;background:#c2185b;border-radius:3px;padding:1px 3px;white-space:nowrap;left:" + Math.max(0, m.x + scrollX - 2) + "px;top:" + Math.max(0, m.y + scrollY - 9) + "px";
            layer.append(b) }
          document.documentElement.append(layer) })()`,
      },
      undefined,
      5_000,
    )
  }

  private async capture(region?: { x: number; y: number; width: number; height: number }): Promise<{ data: string; file: string; more?: Array<{ data: string; file: string }> }> {
    const params: Record<string, unknown> = { format: "jpeg", quality: region ? 85 : 72 }
    if (region) {
      // A closer look at one part of the viewport, enlarged — small print and dense rows become readable.
      const v = (await this.cdp.send("Page.getLayoutMetrics")).cssVisualViewport
      const width = Math.max(40, Math.min(region.width, v.clientWidth - region.x))
      const height = Math.max(40, Math.min(region.height, v.clientHeight - region.y))
      params.clip = { x: v.pageX + Math.max(0, region.x), y: v.pageY + Math.max(0, region.y), width, height, scale: Math.min(3, Math.max(1, 1100 / width)) }
    }
    const { data } = await this.cdp.sendWithTimeout<{ data: string }>("Page.captureScreenshot", params, undefined, 20_000)
    const dir = join(this.options.workspace(), "screenshots")
    await mkdir(dir, { recursive: true })
    const file = join(dir, `${new Date().toISOString().replace(/[:.]/g, "-")}.jpg`)
    await writeFile(file, Buffer.from(data, "base64"))
    return { data, file }
  }

  /**
   * The whole page, one screenful after another, the way a person scrolls through it. NOT Chromium's "capture beyond
   * viewport": that inflates the viewport to the full page height and back — the page visibly balloons, and the site's
   * own resize handlers fire (seen on a real run as "the window keeps growing and shrinking").
   */
  private async captureScrolling(maxScreens = 5) {
    const evaluate = (expression: string) => this.cdp.sendWithTimeout("Runtime.evaluate", { expression, returnByValue: true }, undefined, 5_000).then((r) => r?.result?.value)
    const m = (await evaluate("JSON.stringify({ y: scrollY, h: innerHeight, total: Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0) })").then((v) => JSON.parse(String(v)), () => undefined)) as { y: number; h: number; total: number } | undefined
    if (!m || m.total <= m.h + 40) return this.capture()
    const shots: Array<{ data: string; file: string }> = []
    try {
      for (let top = 0, n = 0; top < m.total && n < maxScreens; top += m.h - 60, n++) {
        await evaluate(`scrollTo(0, ${top})`)
        await sleep(180)
        shots.push(await this.capture())
      }
    } finally {
      await evaluate(`scrollTo(0, ${m.y})`).catch(() => {})
    }
    return { ...shots[0], more: shots.slice(1) }
  }

  // ---------------------------------------------------------------- resolve

  private async resolve(ref: string): Promise<Resolved> {
    const entry = this.refs.get(ref.replace(/^\[?ref=|\]$/g, ""))
    if (!entry) throw new BrowserError(`${ref} 这个编号现在的页面上没有（元素已经消失，或者页面换了）。先 browser_snapshot 看看现在的页面。`)
    const live = await this.cdp
      .send("DOM.resolveNode", { backendNodeId: entry.backendNodeId }, entry.sessionId)
      .then((r) => r?.object?.objectId as string | undefined)
      .catch(() => undefined)
    if (live) {
      void this.cdp.send("Runtime.releaseObject", { objectId: live }, entry.sessionId).catch(() => {})
      return { sessionId: entry.sessionId, backendNodeId: entry.backendNodeId, entry }
    }
    const { nodes } = await this.cdp.send<{ nodes: AXNode[] }>(
      "Accessibility.getFullAXTree",
      entry.frameId ? { frameId: entry.frameId } : {},
      entry.sessionId,
    )
    const fresh = findByRoleNameNth(nodes, entry)
    log.info("stale ref re-resolved", { ref, role: entry.role, name: entry.name, nth: entry.nth, found: fresh !== undefined })
    if (fresh === undefined) throw new BrowserError(`${ref}（${entry.role} “${entry.name}”）已不在页面上，请重新 browser_snapshot。`)
    entry.backendNodeId = fresh
    return { sessionId: entry.sessionId, backendNodeId: fresh, entry }
  }

  private async centerOf(target: Resolved) {
    await this.cdp.send("DOM.scrollIntoViewIfNeeded", { backendNodeId: target.backendNodeId }, target.sessionId).catch(() => {})
    const quads = await this.cdp
      .send<{ quads: number[][] }>("DOM.getContentQuads", { backendNodeId: target.backendNodeId }, target.sessionId)
      .then((r) => r.quads)
      .catch(() => [] as number[][])
    for (const q of quads) {
      const xs = [q[0], q[2], q[4], q[6]]
      const ys = [q[1], q[3], q[5], q[7]]
      const width = Math.max(...xs) - Math.min(...xs)
      const height = Math.max(...ys) - Math.min(...ys)
      if (width >= 1 && height >= 1) return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 }
    }
    return undefined
  }

  /**
   * What would a real click at this point actually hit? If it is not the target (or part of it),
   * say what is in the way — an open dropdown, a modal, a cookie banner — so the model can deal with it.
   */
  private async blockerAt(target: Resolved): Promise<string | undefined> {
    // Asked from inside the element's own document, so iframes and shadow roots need no coordinate mapping.
    return this.callOn<string>(
      target,
      `function(){
        const r = this.getBoundingClientRect()
        if (!r.width || !r.height) return ""
        const root = this.getRootNode()
        const el = (root.elementFromPoint ? root : this.ownerDocument).elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
        if (!el || this === el || this.contains(el) || el.contains(this)) return ""
        const label = el.closest("label")
        if (label && (label.control === this || label.contains(this))) return ""
        if (this.labels && Array.from(this.labels).some((l) => l.contains(el))) return ""
        const text = (el.innerText || el.getAttribute("aria-label") || "").replace(/\\s+/g, " ").trim().slice(0, 60)
        return "<" + el.tagName.toLowerCase() + ">" + (text ? " “" + text + "”" : "")
      }`,
    )
      .then((blocker) => blocker || undefined)
      .catch(() => undefined) // cannot tell (node gone mid-check): let the click speak for itself
  }

  private async pointFor(target: Resolved, force?: boolean) {
    const point = await this.centerOf(target)
    if (!point || force) return point
    let blocker = await this.blockerAt(target)
    if (!blocker) return point
    log.info("click target occluded", { target: target.entry.name, role: target.entry.role, blocker })
    // A banner, a notice, a session warning: get it out of the way once, then look again.
    const why = await this.clearOverlay(target)
    if (why === undefined) {
      blocker = await this.blockerAt(target)
      if (!blocker) return (await this.centerOf(target)) ?? point
    }
    throw new BrowserError(
      `“${shown(target.entry)}” 被别的东西挡住了：${blocker}。${why ? `${why}。` : ""}多半是没关的下拉、弹层或遮罩——先处理它（点它的关闭、按 Escape、或完成它要的选择）再重试。如果确认就是要点这个位置（比如自绘的复选框），加 force: true。`,
    )
  }

  /**
   * Returns undefined when it clicked something on the overlay, otherwise why it left the overlay alone.
   * Only plain pop-ups: anything with fields of its own (a real dialog form, an open dropdown) is not ours to dismiss.
   */
  private async clearOverlay(target: Resolved): Promise<string | undefined> {
    const found = await this.callOn<{ text: string; buttons: string[] } | null>(
      target,
      `function(){
        const r = this.getBoundingClientRect()
        const root = this.getRootNode()
        let el = (root.elementFromPoint ? root : this.ownerDocument).elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
        let box = null
        for (; el && el !== document.documentElement; el = el.parentElement) {
          const cs = getComputedStyle(el)
          if (el.tagName === "DIALOG" || el.getAttribute("role") === "dialog" || el.getAttribute("role") === "alertdialog" || el.getAttribute("aria-modal") === "true" || cs.position === "fixed" || cs.position === "sticky") box = el
        }
        if (!box || box.contains(this)) return null
        if (box.querySelector('input:not([type=button]):not([type=submit]):not([type=hidden]), select, textarea, [role="option"], [role="listbox"]')) return null
        const buttons = Array.from(box.querySelectorAll('button, [role="button"], a[href], input[type=button], input[type=submit]')).filter((b) => b.getClientRects().length)
        buttons.forEach((b, i) => b.setAttribute("data-neo-overlay", String(i)))
        const label = (b) => (b.innerText || b.value || b.getAttribute("aria-label") || b.title || "").replace(/\\s+/g, " ").trim()
        return { text: (box.innerText || "").replace(/\\s+/g, " ").trim().slice(0, 600), buttons: buttons.map(label) }
      }`,
    ).catch(() => null)
    if (!found || !found.buttons.length) return "它不像是普通的提示弹层（没有按钮，或者里面有自己的输入框 / 选项）"

    const choice = await chooseOverlayButton(found.text, found.buttons, (state, questions) => askJev(state, questions, this.options.workspace()))
    if (!choice.ok) {
      log.info("overlay left alone", { text: found.text.slice(0, 120), buttons: found.buttons, why: choice.why })
      return `弹层上写着 “${found.text.slice(0, 160)}”，按钮有：${found.buttons.join(" | ")}。${choice.why}`
    }
    const label = found.buttons[choice.index]
    const risk = classifyRisk(label)
    if (risk) return `弹层上的按钮 “${label}” 属于保留动作，没有替你点`
    const button = await this.related(target, `function(i){ return (this.ownerDocument || document).querySelector('[data-neo-overlay="' + i + '"]') }`, [choice.index])
    if (!button) return "弹层上的按钮找不到了"
    const at = await this.centerOf(button)
    if (at) await this.mouseClick(at, button.sessionId)
    else await this.callOn(button, "function(){ this.click() }")
    await this.settle(200)
    log.info("overlay dismissed", { text: found.text.slice(0, 120), clicked: label, how: choice.how })
    this.overlayNotes.push(`“${found.text.slice(0, 80)}${found.text.length > 80 ? "…" : ""}” → 点了 “${label}”`)
    return undefined
  }

  private async callOn<T = unknown>(target: Resolved, fn: string, args: unknown[] = []): Promise<T> {
    const { object } = await this.cdp.send("DOM.resolveNode", { backendNodeId: target.backendNodeId }, target.sessionId)
    try {
      const command = this.cdp.sendWithTimeout(
        "Runtime.callFunctionOn",
        { objectId: object.objectId, functionDeclaration: fn, arguments: args.map((value) => ({ value })), returnByValue: true, awaitPromise: true },
        target.sessionId,
        10_000,
      )
      command.catch(() => {})
      const result = await Promise.race([command, this.dialogOpened.promise.then(() => undefined)])
      if (!result) return undefined as T // a dialog opened mid-call; the caller reports it
      if (result.exceptionDetails) throw new BrowserError(result.exceptionDetails.exception?.description || result.exceptionDetails.text)
      return result.result?.value as T
    } finally {
      void this.cdp.send("Runtime.releaseObject", { objectId: object.objectId }, target.sessionId).catch(() => {})
    }
  }

  // ---------------------------------------------------------------- input primitives

  private async mouseClick(point: { x: number; y: number }, sessionId?: string, clickCount = 1) {
    const base = { x: point.x, y: point.y, button: "left", clickCount }
    await this.input("Input.dispatchMouseEvent", { type: "mouseMoved", x: point.x, y: point.y }, sessionId)
    await this.input("Input.dispatchMouseEvent", { ...base, type: "mousePressed" }, sessionId)
    await this.input("Input.dispatchMouseEvent", { ...base, type: "mouseReleased" }, sessionId)
  }

  private checkedOf(target: Resolved) {
    return this.callOn<boolean>(target, 'function(){ return this.tagName === "INPUT" ? this.checked : this.getAttribute("aria-checked") === "true" }')
  }

  /**
   * What a keyboard user does with a box they cannot hit: focus the control itself — never mind where the
   * site drew its picture of it — and press a real Space. The browser toggles a native checkbox and a
   * custom widget's own handler takes the keydown; no site, no component library is known here.
   * Returns the tick state afterwards, or undefined when it could not even focus (or could not read back).
   */
  private async focusAndSpace(target: Resolved): Promise<boolean | undefined> {
    const focused = await this.callOn<boolean>(
      target,
      "function(){ const on = () => (this.getRootNode().activeElement || document.activeElement) === this; if (on()) return true; this.focus(); return on() }",
    ).catch(() => false)
    if (!focused) return undefined
    await this.key("Space")
    await this.settle(150)
    // A space that reaches a text box instead of the box leaves a stray " " in the student's answer.
    // It did not take: undo that character rather than leave it for the page to save.
    const took = await this.checkedOf(target).catch(() => undefined)
    if (!took) await this.key("Backspace").catch(() => {})
    return took
  }

  private async key(name: string, modifiers = 0, commands?: string[]) {
    const def = KEYS[name] ?? KEYS[name.toLowerCase()]
    if (!def && [...name].length !== 1) throw new BrowserError(`不认识的按键：${name}`)
    const key = def ?? { key: name, code: "", keyCode: name.toUpperCase().charCodeAt(0), text: name }
    // Cmd/Ctrl + A/C/V/X/Z are editing commands: the browser performs them itself, a bare key event does nothing.
    const edit = modifiers & 6 ? EDIT_COMMANDS[name.toLowerCase()] : undefined
    if (edit && !commands) commands = [edit]
    const base = { key: key.key, code: key.code, windowsVirtualKeyCode: key.keyCode, nativeVirtualKeyCode: key.keyCode, modifiers }
    const text = modifiers & ~8 ? undefined : key.text // no text while Ctrl/Alt/Meta is held (8 = Shift)
    await this.input("Input.dispatchKeyEvent", { ...base, type: text ? "keyDown" : "rawKeyDown", text, commands })
    await this.input("Input.dispatchKeyEvent", { ...base, type: "keyUp" })
  }

  /** Let the page react: finish any navigation the action started, then a beat for scripts to render. */
  private async settle(ms = 250) {
    await sleep(120)
    const deadline = Date.now() + 15_000
    while (this.page.isLoading() && Date.now() < deadline && !this.pendingDialog) await sleep(100)
    await sleep(ms)
  }

  // ---------------------------------------------------------------- the one hard stop

  private async guard(risk: RiskMatch) {
    this.options.onActivity?.(`等待顾问决定：${risk.label}`)
    const asked = Date.now()
    const decision = await this.options.confirmRisk({ ...risk, url: this.page.getURL() })
    log.warn("reserved action", { kind: risk.kind, label: risk.label, url: this.page.getURL(), decision, waitedMs: Date.now() - asked })
    if (decision === "allow") return
    throw new BrowserError(
      `“${risk.label}”属于最终提交 / 付款 / 推荐信邀请，这一步留给顾问本人操作，顾问已选择自己来。不要再尝试点击它；告诉顾问页面已经准备好，并继续其他不涉及这一步的工作。`,
    )
  }

  // ---------------------------------------------------------------- actions

  async navigate(url: string) {
    const target = /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}`
    await this.page.loadURL(target).catch((error) => {
      if (!/ERR_ABORTED/.test(String(error))) throw new BrowserError(`打不开 ${target}：${error.message || error}`)
    })
    await this.settle()
    return this.snapshot()
  }

  async back() {
    this.page.goBack()
    await this.settle()
    return this.snapshot()
  }

  /**
   * The keyword rule, and only that (2026-10-07 用户拍板): the words on the control are what the fence reads.
   * The Jev second look over the surrounding text is gone — it only ever added questions the real runs then
   * lost time to, and the consultant asked for fewer. A bare "Continue" beside a fee notice is the accepted gap.
   */
  private async reserved(target: Resolved, label = target.entry.name): Promise<RiskMatch | undefined> {
    const byKeyword = classifyRisk(label)
    if (!byKeyword) return undefined
    // A link in a list of step links is a way to LOOK at a page, not the irreversible step — that lives on the page it
    // opens, and is still guarded there. ("8. Review and submit" in the sidebar cost a real run a hand-off.) Only the
    // submit flavour is relaxed: a link that talks about paying or writing to a recommender still asks.
    if (byKeyword.kind !== "payment" && byKeyword.kind !== "recommender_invite" && target.entry.role === "link" && (await this.isStepLink(target))) {
      log.info("step navigation link, not an action", { label })
      return undefined
    }
    return byKeyword
  }

  /** A genuine navigation link sitting among sibling step links (a wizard's step list, a tab bar, a sidebar menu). */
  private isStepLink(target: Resolved) {
    return this.callOn<boolean>(
      target,
      `function(){
        const href = this.getAttribute("href") || ""
        if (!href || href.startsWith("#") || /^javascript:/i.test(href)) return false
        const box = this.closest('nav, aside, ol, ul, [role="navigation"], [role="tablist"], [role="menubar"], [role="list"], [class*="step" i], [class*="nav" i], [class*="wizard" i], [class*="tab" i]')
        if (!box) return false
        const siblings = Array.from(box.querySelectorAll("a[href]")).filter((a) => { const h = a.getAttribute("href") || ""; return h && !h.startsWith("#") && !/^javascript:/i.test(h) })
        return siblings.length >= 2 && siblings.includes(this)
      }`,
    ).catch(() => false)
  }

  /** Enter inside a form is a click on its submit button: same rule. */
  private async guardEnter() {
    const submit = await this.cdp
      .sendWithTimeout(
        "Runtime.evaluate",
        {
          expression: `(() => {
            let el = document.activeElement
            while (el && el.shadowRoot && el.shadowRoot.activeElement) el = el.shadowRoot.activeElement
            if (!el || el.tagName === "TEXTAREA" || el.isContentEditable || !el.form) return ""
            const b = el.form.querySelector('button[type=submit], input[type=submit], button:not([type])')
            return b ? (b.innerText || b.value || b.getAttribute("aria-label") || "").replace(/\\s+/g, " ").trim() : ""
          })()`,
          returnByValue: true,
        },
        undefined,
        5_000,
      )
      .then((r) => String(r?.result?.value || ""))
      .catch(() => "")
    const risk = submit ? classifyRisk(submit) : undefined
    if (risk) await this.guard({ ...risk, label: `${risk.label}（按回车会触发它）` })
  }

  async click(ref: string, opts: { doubleClick?: boolean; force?: boolean } = {}) {
    const before = this.seen
    const what = await this.clickCore(ref, opts)
    if (this.pendingDialog) return `${what}。\n页面随即弹出 ${this.pendingDialog.type} 对话框：“${this.pendingDialog.message}”。用 browser_handle_dialog 处理。`
    return `${what}。\n${await this.snapshotAfter(before)}`
  }

  /** The click itself, with every check that belongs to it; callers decide what to show afterwards. */
  private async clickCore(ref: string, opts: { doubleClick?: boolean; force?: boolean } = {}) {
    this.assertNoDialog()
    const target = await this.resolve(ref)
    const risk = await this.reserved(target)
    if (risk) await this.guard(risk)
    // A box that says “clicked” while nothing ticked is the page's most common quiet lie: read the tick on both sides of the click.
    const tickish = ["checkbox", "switch"].includes(target.entry.role)
    const tickedBefore = tickish ? await this.checkedOf(target).catch(() => undefined) : undefined

    // Any click may turn out to open the system's file panel, which nobody could then close: keep the trap armed.
    await this.cdp.sendWithTimeout("Page.setInterceptFileChooserDialog", { enabled: true }, target.sessionId, 3_000).catch(() => {})
    const chooser = this.cdp.once("Page.fileChooserOpened", 350)
    // The moment the consultant named: "before it saves and turns the page". A run can go the whole way without ever
    // calling review — so saving or moving on carries the same check with it.
    // The moment the consultant named: "before it saves and turns the page". A run can go the whole way without ever
    // calling review — so saving or moving on carries the check with it, for the values WE put on this page.
    const url = this.page.getURL().split("#")[0]
    const leaving = MOVING_ON.test(shown(target.entry))
      ? [...this.typedHere].filter(([, v]) => v.url === url).map(([ref, v]) => `“${this.describeRef(ref)}” = “${v.value}”`)
      : []
    // Telling the model is not enough: a blind run saw this warning three times and saved anyway. So the first attempt
    // to leave a page does not happen — it has to look. Clicking again goes through, at most one stop per page, so
    // nothing can deadlock and the cost is bounded.
    if (leaving.length && !this.lookedAt.has(url)) {
      this.lookedAt.add(url)
      throw new BrowserError(
        `先别急着离开这一页：${leaving.join("；")} —— 材料里找不到这些值的原文。回去把对应的那份材料读一遍：对的就把出处补进答案库，凭印象写的就改掉或留空。核对完确实要照原样保存，再点一次这个按钮就放行。`,
      )
    }

    const point = await this.pointFor(target, opts.force)
    if (point) await this.mouseClick(point, target.sessionId, opts.doubleClick ? 2 : 1)
    else await this.callOn(target, "function(){ this.click() }") // no geometry (hidden / zero-size): synthetic click
    await this.settle()
    const opened = this.pendingDialog ? undefined : await chooser
    // Not awaited: while a JavaScript dialog is up the page answers nothing, and the click's result must not wait for it.
    void this.cdp.sendWithTimeout("Page.setInterceptFileChooserDialog", { enabled: false }, target.sessionId, 5_000).catch(() => {})
    if (opened) {
      this.pendingChooser = { backendNodeId: opened.params.backendNodeId, sessionId: opened.sessionId, at: Date.now() }
      return `已点击 ${target.entry.role} “${shown(target.entry)}”——它打开了文件选择框（已替你接住，没有弹系统窗口）。现在用 browser_upload 把文件交给它（ref 还用 ${ref}）`
    }
    let tickNote = ""
    if (tickish && tickedBefore !== undefined && !this.pendingDialog && !opened) {
      let after = await this.checkedOf(target).catch(() => undefined)
      const byClick = after === !tickedBefore
      if (!byClick) after = (await this.focusAndSpace(target)) ?? after
      if (after === !tickedBefore && !byClick) tickNote = `；鼠标点击没让它变，改用键盘空格${after ? "勾上了" : "取消了"}`
      else if (after !== !tickedBefore) tickNote = `；⚠ 鼠标点击和键盘空格都没让它变，请用快照确认（仍然是${after ? "勾选" : "未勾选"}状态）`
    }
    const doubt = leaving.length
      ? `\n⚠ 离开这一页之前请注意：${leaving.join("；")} —— 材料里找不到这些值的原文。回去读那份材料，对就把出处补进答案库，凭印象写的就改掉或留空。`
      : ""
    return `已点击 ${target.entry.role} “${shown(target.entry)}”${tickNote}${doubt}`
  }

  /**
   * A click-only errand run by Jev (docs/REALRUN-NTU.md §3). It cannot type; every click goes through
   * clickCore, so the reserved-action rule and overlay handling all still apply.
   */
  async do(goal: string, maxSteps = 12) {
    this.assertNoDialog()
    const started = Date.now()
    const steps: DoStep[] = []
    const lines: string[] = []
    let snap = await this.snapshot()
    let ending = ""
    for (let i = 0; i < Math.min(Math.max(maxSteps, 1), 20); i++) {
      const elements = clickables(snap).slice(0, MAX_ELEMENTS)
      const pageText = await this.cdp
        .sendWithTimeout("Runtime.evaluate", { expression: "document.body ? document.body.innerText : ''", returnByValue: true }, undefined, 5_000)
        .then((r) => scrubPageText(String(r?.result?.value || "")))
        .catch(() => "")
      // The operation question has to see what could be clicked, or "nothing here says 'scholarship'" reads as BLOCKED.
      const state = {
        page: { title: this.page.getTitle().slice(0, 120), address: this.page.getURL().split(/[?#]/)[0] },
        page_text: pageText,
        elements: elements.map((e) => `${e.role} “${e.name}”${e.flags ? ` ${e.flags}` : ""}`),
        recent_actions: steps.slice(-6),
      }
      // No cache: the same page and goal can call for a different answer once recent_actions has moved on — and it has.
      const decision = decide(await askJev(state, doQuestions(goal, elements)), elements)
      if (!decision) {
        ending = lines.length ? "小模型中途不可用了，剩下的请你自己一步步来。" : "小模型现在不可用。请用 browser_click 自己一步步来。"
        break
      }
      log.info("do step", { goal, step: i + 1, decision })
      if (decision.kind === "done") { ending = "小模型判断：目标已经达到。请你自己看一眼下面的页面确认。"; break }
      if (decision.kind === "blocked") { ending = "小模型判断：靠点击走不下去了（可能需要打字、登录、上传，或者要人拿主意）。接下来由你来。"; break }
      if (decision.kind === "unsure") {
        ending = `小模型拿不准${decision.about === "target" ? "该点哪个" : "下一步做什么"}（把握 ${decision.confidence.toFixed(2)}），没有乱点。它的前几个想法：${decision.candidates.join("、")}。由你来定。`
        break
      }
      if (decision.kind === "wait") {
        await sleep(700)
        const next = await this.snapshot()
        steps.push({ action: "WAIT", changed: next !== snap })
        if (steps.slice(-3).every((s) => s.action === "WAIT") && steps.length >= 3) { ending = "等了三次页面都没有变化。"; break }
        snap = next
        continue
      }
      if (decision.kind !== "click") break
      try {
        lines.push(`${lines.length + 1}. ${await this.clickCore(decision.ref)}`)
      } catch (error) {
        ending = `第 ${lines.length + 1} 步没有点成：${error instanceof Error ? error.message : String(error)}`
        break
      }
      if (this.pendingDialog) { ending = `页面弹出了 ${this.pendingDialog.type} 对话框：“${this.pendingDialog.message}”。用 browser_handle_dialog 处理。`; break }
      const next = await this.snapshot()
      steps.push({ action: `CLICK ${decision.label}`, changed: clickables(next).map((e) => e.role + e.name + e.flags).join() !== clickables(snap).map((e) => e.role + e.name + e.flags).join() || this.page.getTitle() !== state.page.title })
      const last = steps.slice(-2)
      if (last.length === 2 && last[0].action === last[1].action && !last[1].changed) { ending = `连续两次点了同一个地方（${decision.label}），页面没有变化。`; break }
      snap = next
    }
    if (!ending) ending = `到了 ${maxSteps} 步的上限，目标还没确认达到。`
    log.info("do finished", { goal, clicks: lines.length, ms: Date.now() - started, ending })
    if (this.pendingDialog) return `目标：${goal}\n${lines.join("\n")}\n\n${ending}`
    return `目标：${goal}\n${lines.join("\n") || "（一步都没有点）"}\n\n${ending}（共 ${lines.length} 次点击，${((Date.now() - started) / 1000).toFixed(1)} 秒）\n\n现在的页面：\n\n${await this.snapshot()}`
  }

  async hover(ref: string) {
    this.assertNoDialog()
    const target = await this.resolve(ref)
    const point = await this.centerOf(target)
    if (!point) throw new BrowserError("这个元素没有可见位置，无法悬停。")
    await this.cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: point.x, y: point.y }, target.sessionId)
    await this.settle(150)
    return `已悬停在 “${shown(target.entry)}”。`
  }

  /** Focus with a real click, replace the content, read it back. */
  async fill(ref: string, value: string, opts: { slowly?: boolean; submit?: boolean } = {}) {
    this.assertNoDialog()
    const t0 = Date.now()
    const marks: Record<string, number> = {}
    const mark = (name: string) => (marks[name] = Date.now() - t0)
    const target = await this.resolve(ref)
    mark("resolve")
    // Typing one's name under a declaration IS the signature — the one thing of its kind still left for the consultant (2026-10-07).
    if (SIGNATURE_TEXT.test(`${target.entry.label ?? ""} ${target.entry.name ?? ""}`)) {
      log.info("signature field left for the consultant", { field: shown(target.entry) })
      throw new BrowserError(`“${shown(target.entry)}” 是签名 / 签署栏：在这里打上名字就等于本人签了字，工具不替顾问填。记进待顾问清单，接着做别的。`)
    }
    // No road from the model to a password box (2026-10-09): the answer bank, the chat and the logs all carry
    // plain text, and fill echoes its value back. browser_login types passwords from the encrypted store instead.
    if ((await this.callOn<boolean>(target, "function(){ return this.type === 'password' }").catch(() => false)) === true) {
      log.info("password field refused to the model's tools", { field: shown(target.entry) })
      throw new BrowserError(`“${shown(target.entry)}” 是密码框：密码不经这个工具（你写的、看到的、说出的每个字都会留下文字痕迹）。登录用 browser_login——任务开了自动登录它自己会取密码；它说没有，就把登录交给顾问。`)
    }
    // HKUST report P2-6/P2-9: a readonly box is fed by a popup or a calendar — typing at it "succeeds" and
    // stays empty. Refuse with the way out instead of letting the model retry spellings; and say the length
    // cap up front so the model converges before the page truncates mid-word.
    const guard = await this.callOn<{ readOnly: boolean; disabled: boolean; maxLength: number; transform: string }>(
      target,
      `function(){
        const cs = getComputedStyle(this)
        return { readOnly: !!this.readOnly, disabled: this.disabled === true, maxLength: Number(this.getAttribute("maxlength")) || 0, transform: cs.textTransform || "" }
      }`,
    ).catch(() => undefined)
    if (guard?.disabled)
      throw new BrowserError(`“${shown(target.entry)}” 是禁用（disabled）的输入框，页面不让写——通常要先点它前面的某个选项或勾选才会解锁。看快照里它附近的控件；确实该填就记待顾问。`)
    if (guard?.readOnly && !parseIso(value))
      // A readonly box fed an ISO date goes on to the calendar paths below — those know how to feed it.
      throw new BrowserError(`“${shown(target.entry)}” 是只读（readonly）输入框，直接填是填不进去的：这种格子由页面自己的弹窗、日历或选择器来喂。找打开它的控件（它附近的按钮 / 图标 / 链接）；如果那个弹窗需要回写父页而这里是弹窗标签页，用 browser_open_in_window；都不行就记进待顾问清单，跳过它接着做别的。`)
    const overLength = guard?.maxLength && value.length > guard.maxLength ? `⚠ 值长 ${value.length}，超过这格的上限 ${guard.maxLength}——页面会把它拦腰截断，先按上限收敛再填。` : ""

    // Native date/time/range/color inputs ignore typed text; set them the way frameworks can observe.
    const setDirectly = await this.callOn<boolean>(
      target,
      `function(v){
        if (this.tagName !== "INPUT" || !["date","time","datetime-local","month","week","range","color"].includes(this.type)) return false
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set
        this.focus(); setter.call(this, v)
        this.dispatchEvent(new Event("input", { bubbles: true })); this.dispatchEvent(new Event("change", { bubbles: true }))
        return true
      }`,
      [value],
    )
    if (setDirectly) {
      const now = await this.callOn<string>(target, "function(){ return String(this.value) }")
      return `“${shown(target.entry)}” ← “${value}”，${now === value ? "读回一致" : `读回为 “${now}”（这类输入框要求 ISO 格式，如 2026-09-18）`}。`
    }

    // A calendar widget with an API of its own (flatpickr is everywhere on application sites): tell it the date, then verify.
    if (parseIso(value)) {
      const viaWidget = await this.setDateWidget(target, value)
      if (viaWidget) return viaWidget
    }

    // An ISO date going into a text box: the page usually says how it wants it (placeholder, label, hint).
    let dateNote = ""
    if (parseIso(value)) {
      const hints = await this.callOn<{ texts: string[]; readOnly: boolean }>(
        target,
        `function(){
          const described = (this.getAttribute("aria-describedby") || "").split(/\\s+/).map((id) => id && document.getElementById(id)).filter(Boolean).map((el) => el.innerText)
          const label = this.labels && this.labels[0] ? this.labels[0].innerText : ""
          return { texts: [this.getAttribute("data-date-format"), this.getAttribute("data-format"), this.placeholder, this.title, this.getAttribute("aria-label"), label, ...described], readOnly: !!this.readOnly }
        }`,
      )
      const format = detectDateFormat([...(hints?.texts ?? []), target.entry.name])
      const wanted = format ? formatDate(value, format) : undefined
      if (format && !wanted) throw new BrowserError(`“${shown(target.entry)}” 要的格式是 ${format}，但 “${value}” 里没有“日”。给一个完整的日期（YYYY-MM-DD）。`)
      if (wanted) {
        dateNote = `（页面要求 ${format}，由 ${value} 转换）`
        if (hints?.readOnly) return (await this.pickInCalendar(target, value, dateNote)) ?? this.setReadonlyDate(target, wanted, dateNote)
        value = wanted
        opts = { ...opts, slowly: true } // masks only listen to real keystrokes
      } else if (hints?.readOnly) {
        const picked = await this.pickInCalendar(target, value, "")
        if (picked) return picked
        throw new BrowserError(`“${shown(target.entry)}” 是只读的日期框（要用它弹出的日历选），页面也没写格式。点开它，取一次快照，用日历上的年 / 月下拉和日期按钮来选；试几次不行就记进待顾问清单（待顾问.md：哪一页、哪个格子、该填什么、试过什么），跳过它接着做别的——不要为这一格停下来问顾问。`)
      }
    }

    mark("typeCheck")
    const point = await this.pointFor(target)
    mark("point")
    if (point) await this.mouseClick(point, target.sessionId)
    else await this.callOn(target, "function(){ this.focus() }")
    mark("click")

    await this.callOn(target, `function(){
      if (typeof this.select === "function" && this.type !== "date" && this.type !== "time") this.select()
      else if (this.isContentEditable) { const r = document.createRange(); r.selectNodeContents(this); const s = getSelection(); s.removeAllRanges(); s.addRange(r) }
    }`)
    if (!value) await this.key("Backspace")
    else if (opts.slowly) for (const ch of value) await this.key(ch)
    else await this.input("Input.insertText", { text: value })
    mark("typed")
    if (opts.submit) await this.guardEnter()
    if (opts.submit) await this.key("Enter")
    await sleep(80)

    const now = await this.callOn<string>(target, "function(){ return this.value !== undefined ? String(this.value) : (this.textContent || '') }").catch(() => "")
    if (opts.submit) await this.settle()
    mark("readback")
    log.debug("fill steps (ms since start)", { name: target.entry.name, ...marks })
    if (this.pendingDialog) return `填写 “${shown(target.entry)}” 时页面弹出了对话框：“${this.pendingDialog.message}”。用 browser_handle_dialog 处理。`
    if (dateNote) {
      if (sameDigits(now, value)) return `“${shown(target.entry)}” ← “${now}”${dateNote}，读回一致。`
      return `“${shown(target.entry)}” ← “${value}”${dateNote}，但读回为 “${now}”，和要填的日期对不上。日、月颠倒是最糟的错：不要带着它保存。换个办法（点开它的日历来选），不行就请顾问手动填这一项。`
    }
    // HKUST report P2-11: a page that upper-cases as you type (text-transform or its own script) makes every
    // read-back differ by case alone — that is the page behaving, not a mismatch.
    const caseOnly = now !== value && now.toLocaleUpperCase() === value.toLocaleUpperCase()
    const verdict = now === value ? "读回一致" : caseOnly ? `读回为 “${now}”（只差大小写，页面自动改写，可接受）` : `读回为 “${now}”（与填入的不同，可能是格式化、掩码或自动补全，请判断是否可接受）`
    return `“${shown(target.entry)}” ← “${value}”，${verdict}。${overLength}`
  }

  /**
   * flatpickr keeps its instance on the input it was attached to (sometimes a hidden one beside the visible box).
   * setDate + read back what the widget itself now holds; undefined when there is no such widget here.
   */
  private async setDateWidget(target: Resolved, iso: string): Promise<string | undefined> {
    const outcome = await this.callOn<{ picked: string; shown: string } | null>(
      target,
      `function(iso){
        const near = [this, ...(this.querySelectorAll ? this.querySelectorAll("input") : []), ...(this.parentElement ? this.parentElement.querySelectorAll("input") : []), ...(this.parentElement && this.parentElement.parentElement ? this.parentElement.parentElement.querySelectorAll("input") : [])]
        const holder = near.find((el) => el && el._flatpickr)
        if (!holder) return null
        const fp = holder._flatpickr
        fp.setDate(iso.length === 7 ? iso + "-01" : iso, true, "Y-m-d")
        fp.close && fp.close()
        const d = fp.selectedDates && fp.selectedDates[0]
        const pad = (n) => String(n).padStart(2, "0")
        return { picked: d ? d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) : "", shown: (fp.altInput || fp.input || holder).value || "" }
      }`,
      [iso],
    ).catch(() => null)
    if (!outcome) return undefined
    const wanted = iso.length === 7 ? `${iso}-01` : iso
    log.info("date set through the calendar widget", { name: target.entry.name, wanted, picked: outcome.picked, shown: outcome.shown })
    if (outcome.picked !== wanted)
      throw new BrowserError(`“${shown(target.entry)}” 的日历没有接受 ${iso}（它现在是 “${outcome.shown || "空"}”）。多半是超出了它允许的范围。不要带着错的日期保存；记进待顾问清单（待顾问.md：哪一页、哪个格子、该填什么、试过什么），跳过它接着做别的——不要为这一格停下来问顾问。`)
    return `“${shown(target.entry)}” ← ${iso}（通过日历控件设置，页面显示为 “${outcome.shown}”），核对一致。`
  }

  /** A date box that only its own calendar may write to. Many widgets still accept the value if told the way a framework would notice. */
  /**
   * A date box that only takes clicks: open its calendar and get there the way a person does — year / month dropdowns
   * if it has them; otherwise click the heading to zoom out to months and years when the date is far away, or page
   * with the arrows when it is near; then the day. Judged by what is on screen (numbers, month names, a heading with
   * a year in it), not by which library drew it. Returns undefined when no calendar could be operated.
   */
  private async pickInCalendar(target: Resolved, iso: string, note: string): Promise<string | undefined> {
    const want = parseIso(iso)
    if (!want?.day) return undefined
    type Cell = { i: number; text: string; off: boolean; x: number; y: number }
    type Panel = { open: boolean; title?: { i: number; text: string; x: number }; selects: Array<{ i: number; options: string[] }>; cells: Cell[]; arrows: Array<{ i: number; dir: string; x: number }> }
    const read = () => this.callOn<Panel>(target, CALENDAR_FN, ["read"]).catch(() => ({ open: false, selects: [], cells: [], arrows: [] }) as Panel)
    const clickEl = async (i: number) => {
      const el = await this.related(target, CALENDAR_FN, ["el", i])
      const at = el && (await this.centerOf(el))
      if (!at) return false
      await this.mouseClick(at, el.sessionId)
      await sleep(220)
      return true
    }
    await this.callOn(target, CALENDAR_FN, ["mark"]).catch(() => {})
    const point = await this.pointFor(target)
    if (!point) return undefined
    await this.mouseClick(point, target.sessionId)
    await sleep(320)
    let panel = await read()
    if (!panel.open || (!panel.cells.length && !panel.selects.length)) return undefined

    const shownIn = (text = "") => {
      const year = Number(/(?:19|20)\d{2}/.exec(text)?.[0]) || undefined
      const cn = /(\d{1,2})\s*月/.exec(text)?.[1]
      const month = cn ? Number(cn) : text.split(/[^\p{L}]+/u).map((w) => monthNumber(w)).find(Boolean) ?? (Number(/\b(\d{1,2})\s*[\/.-]\s*(?:19|20)\d{2}/.exec(text)?.[1]) || undefined)
      return { year, month }
    }
    let swapped = false
    let zoomed = 0
    for (let step = 0; step < 48; step++) {
      // Dropdowns in the calendar's head: the quickest way, and the one a person reaches for first.
      let viaSelect = false
      for (const sel of panel.selects) {
        const years = sel.options.filter((o) => /^(19|20)\d{2}$/.test(o.trim()))
        const isYear = years.length >= 3, isMonth = !isYear && sel.options.length >= 12 && sel.options.length <= 13
        const el = isYear || isMonth ? await this.related(target, CALENDAR_FN, ["el", sel.i]) : undefined
        if (!el) continue
        const current = await this.callOn<string>(el, "function(){ return this.options[this.selectedIndex] ? this.options[this.selectedIndex].text : '' }").catch(() => "")
        const wanted = isYear ? String(want.year) : sel.options.find((o) => monthNumber(o.trim()) === want.month || Number(o) === want.month)
        if (!wanted || current.trim() === wanted.trim()) continue
        await this.selectLine({ ...el, entry: { ...target.entry, role: "combobox", name: isYear ? "year" : "month" } }, [wanted]).catch(() => {})
        viaSelect = true
      }
      if (viaSelect) { await sleep(200); panel = await read() }

      const live = panel.cells.filter((c) => !c.off)
      const days = panel.cells.filter((c) => /^\d{1,2}$/.test(c.text) && Number(c.text) >= 1 && Number(c.text) <= 31)
      const months = live.filter((c) => monthNumber(c.text) || /^\d{1,2}\s*月$/.test(c.text))
      const years = live.filter((c) => /^(19|20)\d{2}$/.test(c.text))
      const head = shownIn(panel.title?.text)
      const arrow = (dir: "prev" | "next") => {
        const real = swapped ? (dir === "prev" ? "next" : "prev") : dir
        const named = panel.arrows.find((a) => a.dir === real)
        if (named) return named
        const side = panel.arrows.filter((a) => a.dir === "").sort((a, b) => a.x - b.x)
        return side.length >= 2 ? (real === "prev" ? side[0] : side[side.length - 1]) : undefined
      }

      if (years.length >= 6 && days.length < 28) {
        const cell = years.find((c) => Number(c.text) === want.year)
        const lowest = Math.min(...years.map((c) => Number(c.text)))
        const moved = cell ? await clickEl(cell.i) : await clickEl(arrow(want.year < lowest ? "prev" : "next")?.i ?? -1)
        if (!moved) break
      } else if (months.length >= 6 && days.length < 28) {
        if (head.year && head.year !== want.year && panel.title && zoomed < 3) { zoomed++; if (!(await clickEl(panel.title.i))) break }
        else {
          const cell = months.find((c) => (monthNumber(c.text) || Number(/\d+/.exec(c.text)?.[0])) === want.month)
          if (!cell || !(await clickEl(cell.i))) break
        }
      } else if (days.length >= 28) {
        if (!head.year || !head.month) break
        const away = (want.year - head.year) * 12 + (want.month - head.month)
        if (away === 0) {
          const mine = days.filter((c) => !c.off && Number(c.text) === want.day)
          // The grid also shows the tail of last month and the start of next: a high number belongs at the end, a low one at the start.
          const cell = mine.length > 1 ? (want.day > 15 ? mine[mine.length - 1] : mine[0]) : mine[0]
          if (!cell || !(await clickEl(cell.i))) break
          await this.settle(200)
          const after = await this.callOn<string>(target, "function(){ return String(this.value || this.innerText || '') }").catch(() => "")
          const digits = after.replace(/\D+/g, " ")
          const ok = new RegExp(`\\b0?${want.day}\\b`).test(digits) && (digits.includes(String(want.year)) || digits.includes(String(want.year).slice(2)))
          await this.key("Escape").catch(() => {})
          if (!ok) throw new BrowserError(`在 “${shown(target.entry)}” 的日历上点了 ${iso}，但框里显示的是 “${after}”，对不上。取一张带编号的截图看看日历现在的样子，手动点一遍；不要带着对不上的日期保存。`)
          log.info("date picked in calendar", { field: shown(target.entry), steps: step + 1 })
          return `“${shown(target.entry)}” ← “${after}”${note}（在日历上点选的：${iso}），读回一致。`
        }
        if (Math.abs(away) > 11 && panel.title && zoomed < 3) {
          // Far away: a person clicks the heading to get to months and years instead of paging sixty times.
          const before = JSON.stringify(panel.cells.map((c) => c.text))
          zoomed++
          await clickEl(panel.title.i)
          panel = await read()
          if (JSON.stringify(panel.cells.map((c) => c.text)) !== before) continue
        }
        const a = arrow(away < 0 ? "prev" : "next")
        if (!a || !(await clickEl(a.i))) break
        const now = shownIn((await read()).title?.text)
        // Arrows without a name were told apart by position; if that went the wrong way, they are the other way round.
        if (now.year && now.month && Math.abs((want.year - now.year) * 12 + (want.month - now.month)) > Math.abs(away)) swapped = !swapped
      } else break
      panel = await read()
      if (!panel.open) break
    }
    await this.key("Escape").catch(() => {})
    return undefined
  }

  private async setReadonlyDate(target: Resolved, wanted: string, note: string) {
    const now = await this.callOn<string>(
      target,
      `function(v){
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set
        this.focus(); setter.call(this, v)
        for (const type of ["input", "change", "blur"]) this.dispatchEvent(new Event(type, { bubbles: true }))
        return String(this.value)
      }`,
      [wanted],
    )
    await this.key("Escape").catch(() => {}) // focusing it may have opened the calendar
    await sleep(150)
    const after = await this.callOn<string>(target, "function(){ return String(this.value) }").catch(() => now)
    if (!sameDigits(after ?? "", wanted))
      throw new BrowserError(`“${shown(target.entry)}” 是只读的日期框，直接写入没有被页面接受（现在的值：“${after}”）。点开它，取一次快照，用日历上的年 / 月下拉和日期按钮来选；试几次不行就记进待顾问清单（待顾问.md：哪一页、哪个格子、该填什么、试过什么），跳过它接着做别的——不要为这一格停下来问顾问。`)
    return `“${shown(target.entry)}” ← “${after}”${note}，读回一致。这是个只读日期框，值是直接写进去的：保存之后留意这一项有没有报错。`
  }

  /**
   * A whole section in one call, whatever each control turns out to be: text is typed, anything
   * "pick one" goes through the same path as browser_choose. One field failing does not stop the rest;
   * only a blocking dialog does. Ends with one snapshot, so new fields a choice revealed are visible.
   */
  async fillForm(fields: Array<{ ref: string; value: string }>) {
    this.assertNoDialog()
    const seenBefore = this.seen
    const { lines, done, revealed } = await this.fillFields(fields)
    const skipped = fields.length - lines.length
    const head = `${fields.length} 个字段，填上 ${done} 个${lines.length - done ? `，${lines.length - done} 个没填上（✗）` : ""}${lines.some((l) => l.startsWith("⚠")) ? "，⚠ 的读回和填入不一样，判断一下能不能接受" : ""}。`
    if (this.pendingDialog)
      return `${head}\n${lines.join("\n")}\n\n页面弹出了 ${this.pendingDialog.type} 对话框：“${this.pendingDialog.message}”${skipped ? `，后面 ${skipped} 个字段还没动` : ""}。先用 browser_handle_dialog 处理。`
    const news = revealed.length ? `\n选了 ${revealed.map((n) => `“${n}”`).join("、")} 之后页面多出了新的字段，看下面的快照。` : ""
    return `${head}\n${lines.join("\n")}${news}\n\n${await this.snapshotAfter(seenBefore)}`
  }

  /** The filling itself, field by field, with no snapshot of its own — so a caller that already holds one can reuse it. */
  private async fillFields(fields: Array<{ ref: string; value: string }>, opts: { fromBank?: boolean } = {}) {
    const lines: string[] = []
    const revealed: string[] = []
    let done = 0
    for (const field of fields) {
      const name = this.describeRef(field.ref)
      // Checked whoever supplied it: the answer bank is written by the model too, and an invented address gets in there.
      const untraceable = !(await this.traceable(field.value).catch(() => true))
      const note = untraceable
        ? opts.fromBank
          ? " ⚠ 答案库的这一条在材料里找不到原文——当初写档案时可能是自己推出来的；回去核对那份材料"
          : " ⚠ 材料里找不到这个值的原文——确认它不是凭印象写的。是翻译 / 拼音，或者顾问在对话里告诉你的，就在 student_profile.md 里注明出处"
        : ""
      try {
        const target = await this.resolve(field.ref)
        const viaWidget = parseIso(field.value) ? await this.setDateWidget(target, field.value) : undefined
        if (viaWidget) {
          lines.push(`✓ ${viaWidget}${note}`)
          done++
          continue
        }
        const kind = await this.kindOf(target)
        if (!kind) break // a dialog opened under us
        if (kind.kind === "text") {
          const line = await this.fill(field.ref, field.value)
          // Corrected to something the papers do contain? Then it is no longer one of ours to stop over.
          if (untraceable) this.typedHere.set(field.ref, { value: field.value, url: this.page.getURL().split("#")[0] })
          else this.typedHere.delete(field.ref)
          lines.push(`${line.includes("读回一致") ? "✓" : "⚠"} ${line}${note}`)
        } else {
          const before = await this.countControls()
          // A value chosen from the page's own options came from the page, not from anyone's memory.
          lines.push(`✓ ${await this.chooseLine(target, field.value, kind)}`)
          if ((await this.countControls()) > before) revealed.push(name)
        }
        done++
      } catch (error) {
        lines.push(`✗ “${name}” 没填上：${error instanceof Error ? error.message : String(error)}`)
      }
      if (this.pendingDialog) break
    }
    return { lines, done, revealed }
  }

  /** Rough count of form controls in the page: if it grew, a choice revealed new fields. */
  private countControls() {
    return this.cdp
      .sendWithTimeout("Runtime.evaluate", { expression: `document.querySelectorAll('input,select,textarea,[role="combobox"],[role="radio"],[role="checkbox"]').length`, returnByValue: true }, undefined, 5_000)
      .then((r) => Number(r?.result?.value) || 0)
      .catch(() => 0)
  }

  /** Which option means `want`? Letters first, then Jev; below the 0.8 line nobody picks (docs/BROWSER.md). */
  private pick(field: string, want: string, options: string[]): Promise<Pick> {
    return pickOption(field, want, options, (state, questions) => askJev(state, questions, this.options.workspace()))
  }

  private how(want: string, chosen: string, pick: Extract<Pick, { ok: true }>) {
    return pick.how === "jev" ? `（你要的是 “${want}”，字面对不上，按意思选了 “${chosen}”，把握 ${pick.confidence?.toFixed(2)}）` : ""
  }

  /** Native <select>: set by value or visible text, fire the events frameworks listen for. */
  async select(ref: string, values: string[]) {
    this.assertNoDialog()
    const before = this.seen
    const target = await this.resolve(ref)
    const line = await this.selectLine(target, values)
    return this.pendingDialog ? line : `${line}。\n${await this.snapshotAfter(before)}`
  }

  private async selectLine(target: Resolved, values: string[]) {
    const listed = await this.callOn<{ texts: string[]; values: string[] } | null>(
      target,
      `function(){
        const el = this.tagName === "SELECT" ? this : (this.closest && this.closest("select"))
        return el ? { texts: Array.from(el.options).map((o) => o.textContent.replace(/\\s+/g, " ").trim()), values: Array.from(el.options).map((o) => o.value) } : null
      }`,
    )
    if (listed === undefined) return `选择时页面弹出了对话框：“${this.pendingDialog?.message}”。用 browser_handle_dialog 处理。`
    if (!listed) throw new BrowserError("这不是原生下拉框。用 browser_choose：它会自己点开、找选项、点选。")

    const indexes: number[] = []
    const notes: string[] = []
    for (const want of values) {
      const byValue = listed.values.indexOf(want)
      if (byValue >= 0 && want !== "") {
        indexes.push(byValue)
        continue
      }
      // The "Select…" placeholder is not an answer.
      const real = listed.texts.map((text, i) => ({ text, i })).filter((o) => listed.values[o.i] !== "" && o.text)
      const pick = await this.pick(target.entry.name, want, real.map((o) => o.text))
      if (!pick.ok) throw new BrowserError(describeMiss(want, real.length, pick))
      indexes.push(real[pick.index].i)
      notes.push(this.how(want, real[pick.index].text, pick))
    }
    const selected = await this.callOn<string[]>(
      target,
      `function(indexes){
        const el = this.tagName === "SELECT" ? this : this.closest("select")
        if (!el.multiple) el.selectedIndex = indexes[0]
        else Array.from(el.options).forEach((o, i) => { o.selected = indexes.includes(i) })
        el.dispatchEvent(new Event("input", { bubbles: true }))
        el.dispatchEvent(new Event("change", { bubbles: true }))
        return Array.from(el.selectedOptions).map((o) => o.textContent.trim())
      }`,
      [indexes],
    )
    if (!selected) return `选择时页面弹出了对话框：“${this.pendingDialog?.message}”。用 browser_handle_dialog 处理。`
    await this.settle()
    return `“${shown(target.entry)}” 已选：${selected.join("、")}${notes.join("")}`
  }

  /**
   * One call for any "pick one" control: native select, a dropdown the site drew itself (with or
   * without a search box), a radio group, a checkbox. Opens it, reads the options, matches, clicks,
   * reads back — the three model turns this used to take.
   */
  async choose(ref: string, want: string) {
    this.assertNoDialog()
    // Choosing is the action that most often changes the rest of the page; the result has to say so (and seat what appeared).
    const before = this.seen
    const target = await this.resolve(ref)
    const viaWidget = parseIso(want) ? await this.setDateWidget(target, want) : undefined
    if (viaWidget) return `${viaWidget}\n${await this.snapshotAfter(before)}`
    const kind = await this.kindOf(target)
    if (!kind) return `操作时页面弹出了对话框：“${this.pendingDialog?.message}”。用 browser_handle_dialog 处理。`
    const line = await this.chooseLine(target, want, kind)
    return this.pendingDialog ? line : `${line}。\n${await this.snapshotAfter(before)}`
  }

  private kindOf(target: Resolved) {
    return this.callOn<Kind>(
      target,
      `function(){
        if (this.tagName === "SELECT" || (this.closest && this.closest("select"))) return { kind: "select" }
        const role = this.getAttribute && this.getAttribute("role")
        if ((this.tagName === "INPUT" && this.type === "radio") || role === "radiogroup" || role === "radio") return { kind: "radio", labels: radios(this).map(labelOf) }
        if ((this.tagName === "INPUT" && this.type === "checkbox") || role === "checkbox" || role === "switch")
          return { kind: "checkbox", checked: this.tagName === "INPUT" ? this.checked : this.getAttribute("aria-checked") === "true" }
        const editable = (this.tagName === "INPUT" && !this.readOnly) || this.tagName === "TEXTAREA" || this.isContentEditable
        const popup = role === "combobox" || this.hasAttribute("aria-haspopup") || this.hasAttribute("aria-autocomplete") || this.hasAttribute("aria-expanded") || this.hasAttribute("list")
        if (editable) return { kind: popup ? "search" : "text" }
        // A read-only text box with no popup of its own is usually a date box fed by a calendar; fill() knows what to do with it.
        if (this.tagName === "INPUT" && !popup && !["button", "submit", "reset", "image", "file"].includes(this.type)) return { kind: "text" }
        return { kind: "button", popup }
        ${RADIO_HELPERS}
      }`,
    )
  }

  /** One short line saying what was chosen; throws a BrowserError that says why not. */
  private chooseLine(target: Resolved, want: string, kind: Kind): Promise<string> {
    log.debug("choose", { name: target.entry.name, role: target.entry.role, kind: kind.kind, want })
    if (kind.kind === "select") return this.selectLine(target, [want])
    if (kind.kind === "checkbox") return this.setChecked(target, want, kind.checked === true)
    if (kind.kind === "radio") return this.chooseRadio(target, want, kind.labels ?? [])
    // Opening a dropdown means clicking it. An ordinary button is not ours to click from here: that is browser_click, with its reserved-action check.
    // The exception is something the site never declared as anything (a drawn picker is just a clickable box): try it, under the same rule.
    if (kind.kind === "button" && !kind.popup && target.entry.role !== "clickable") throw new BrowserError(`“${shown(target.entry)}” 是个普通按钮，不是能填或能选的字段。要点它请用 browser_click。`)
    // Asked to choose in a plain text box: treat it as search-as-you-type, the model knows something we do not.
    return this.chooseCustom(target, want, kind.kind !== "button")
  }

  private async setChecked(target: Resolved, want: string, checked: boolean): Promise<string> {
    const on = /^(yes|y|true|on|checked|1|是|对|有|勾选|选中)$/i.test(want.trim())
    const off = /^(no|n|false|off|unchecked|0|否|不|没有|无|不勾选|取消)$/i.test(want.trim())
    // Models often answer a checkbox with its own label ("Graduated with honors"): they mean "tick it".
    const flat = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "")
    if (!on && !off && flat(want).length >= 3 && (flat(target.entry.name).includes(flat(want)) || flat(want).includes(flat(target.entry.name)))) return this.setChecked(target, "yes", checked)
    if (!on && !off) throw new BrowserError(`“${shown(target.entry)}” 是个勾选框，值请给 “是” 或 “否”。`)
    if (checked !== on) {
      // Sites love to draw their own box on top of the real one; the click still has to land there.
      const point = await this.pointFor(target).catch(() => this.centerOf(target))
      if (point) await this.mouseClick(point, target.sessionId)
      else await this.callOn(target, "function(){ this.click() }")
      await this.settle(150)
    }
    let now = await this.checkedOf(target).catch(() => undefined)
    let byKeys = false
    if (now !== on) {
      // The pointer never reached it (seen on Common App: a whole group of drawn boxes ignores every mouse path,
      // keyboard and hand both work). What a keyboard user does next, with no knowledge of the site.
      now = (await this.focusAndSpace(target)) ?? now
      byKeys = now === on
    }
    if (now !== on) throw new BrowserError(`“${shown(target.entry)}” 试了鼠标点击和键盘空格，仍然是${now ? "勾选" : "未勾选"}状态。取一次快照看看它是不是被别的东西控制着。`)
    return `“${shown(target.entry)}” 现在是${on ? "勾选" : "未勾选"}状态${byKeys ? "（鼠标点不动，是用键盘空格勾上的）" : ""}`
  }

  private async chooseRadio(target: Resolved, want: string, labels: string[]) {
    const group = target.entry.role === "radiogroup" ? target.entry.name : "单选"
    // "Yes" handed to one particular radio means "this one" — unless Yes is itself one of the answers.
    const own = await this.callOn<number>(target, `function(){ return radios(this).indexOf(this); ${RADIO_HELPERS} }`).catch(() => -1)
    const affirm = /^(yes|y|true|on|checked|selected|1|是|对|选中|勾选|选这个)$/i.test(want.trim()) && !labels.some((l) => l.trim().toLowerCase() === want.trim().toLowerCase())
    const pick: Pick = affirm && own !== undefined && own >= 0 ? { ok: true, index: own, how: "literal" } : await this.pick(group, want, labels)
    if (!pick.ok) throw new BrowserError(describeMiss(want, labels.length, pick))
    const radio = await this.related(target, `function(i){ return radios(this)[i]; ${RADIO_HELPERS} }`, [pick.index])
    if (!radio) throw new BrowserError("单选项在页面上找不到了，请重新 browser_snapshot。")
    const point = await this.pointFor(radio).catch(() => this.centerOf(radio))
    if (point) await this.mouseClick(point, radio.sessionId)
    else await this.callOn(radio, "function(){ this.click() }")
    await this.settle()
    const now = await this.callOn<boolean>(radio, 'function(){ return this.tagName === "INPUT" ? this.checked : this.getAttribute("aria-checked") === "true" }').catch(() => undefined)
    if (now === false) throw new BrowserError(`点了 “${labels[pick.index]}” 但它没有变成选中状态。取一次快照看看。`)
    return `${group === "单选" ? "" : `“${group}” `}已选：${labels[pick.index]}${this.how(want, labels[pick.index], pick)}`
  }

  /** A dropdown the site drew itself: open it, (type to filter,) read what appeared, click the match, read back. */
  /**
   * A drawn dropdown, operated the way a person does it and judged by behaviour, not by which library drew it:
   * click it open → look only at what APPEARED → if there is a box to type in (the control itself or one inside the
   * panel), type first → pick → and then demand evidence that the pick took (the panel closed or the control now shows
   * something else). No evidence: once more with the keyboard. Still none: say so instead of claiming success.
   */
  private async chooseCustom(target: Resolved, want: string, editable: boolean) {
    const name = shown(target.entry)
    // Opening it is a click like any other: the one hard rule comes first.
    const reserved = await this.reserved(target)
    if (reserved) await this.guard(reserved)
    const axBefore = new Set((await this.optionNodes(target.entry)).map((o) => o.backendNodeId))
    const shownBefore = await this.callOn<string>(target, POPUP_FN, ["mark"]).catch(() => "")
    const open = async () => {
      const point = await this.pointFor(target)
      if (point) await this.mouseClick(point, target.sessionId)
      else await this.callOn(target, "function(){ this.click() }")
      await sleep(280)
    }
    type Option = { name: string; at: () => Promise<Resolved | undefined> }
    type Panel = { options: Option[]; search: boolean; scrollable: boolean; box?: { x: number; y: number } }
    const read = async (): Promise<Panel> => {
      const ax = (await this.optionNodes(target.entry)).filter((o) => !axBefore.has(o.backendNodeId))
      const dom = await this.callOn<{ options: string[]; search: boolean; scrollable: boolean; box?: { x: number; y: number } }>(target, POPUP_FN, ["read"]).catch(() => ({ options: [] as string[], search: false, scrollable: false, box: undefined }))
      // Sites that declare their options get exact nodes; the rest are read off what appeared on screen.
      if (ax.length) return { ...dom, options: ax.map((o) => ({ name: o.name, at: async () => ({ sessionId: target.sessionId, backendNodeId: o.backendNodeId, entry: { ...target.entry, role: "option", name: o.name } }) })) }
      return { ...dom, options: dom.options.map((text, i) => ({ name: text, at: () => this.related(target, POPUP_FN, ["option", i]) })) }
    }

    await open()
    let panel = await read()
    if (!panel.options.length && !panel.search && !editable) {
      // It was already open and our click closed it (or it is slow): once more, and take what is there.
      await this.callOn(target, POPUP_FN, ["mark"]).catch(() => {})
      await open()
      panel = await read()
      if (!panel.options.length) panel = { ...panel, options: (await this.optionNodes(target.entry)).map((o) => ({ name: o.name, at: async () => ({ sessionId: target.sessionId, backendNodeId: o.backendNodeId, entry: { ...target.entry, role: "option", name: o.name } }) })) }
    }

    const searchable = editable || panel.search
    if (searchable) {
      // Long lists only render what matches what you typed. Type first; if that filters everything away
      // (a Chinese value against English options), clear the box and read the unfiltered list instead.
      const box = editable ? target : ((await this.related(target, POPUP_FN, ["search"])) ?? target)
      if (box !== target) { const at = await this.centerOf(box); if (at) await this.mouseClick(at, box.sessionId) }
      await this.replaceText(box, want)
      await sleep(480)
      panel = await read()
      if (!panel.options.length) {
        await this.replaceText(box, "")
        await sleep(480)
        panel = await read()
      }
    }
    if (!panel.options.length) {
      await this.key("Escape").catch(() => {})
      throw new BrowserError(`点开 “${name}” 之后没有看到选项。取一张带编号的截图（browser_screenshot marks）看看它展开成了什么样，再用 browser_click 点选。`)
    }

    let pick = await this.pick(target.entry.name, want, panel.options.map((o) => o.name))
    // A list that draws a few rows at a time: what is wanted may simply not be on screen yet. Scroll it like a person.
    for (let page = 0; !pick.ok && panel.scrollable && panel.box && !searchable && page < 12; page++) {
      const seen = panel.options.map((o) => o.name).join("|")
      await this.input("Input.dispatchMouseEvent", { type: "mouseWheel", x: panel.box.x, y: panel.box.y, deltaX: 0, deltaY: 220 }, target.sessionId)
      await sleep(220)
      panel = await read()
      if (panel.options.map((o) => o.name).join("|") === seen) break
      pick = await this.pick(target.entry.name, want, panel.options.map((o) => o.name))
    }
    if (!pick.ok) {
      await this.key("Escape").catch(() => {})
      // Jev cannot write, so it cannot guess what to type into a search box; the big model can.
      const hint = searchable ? `这是个要打字搜索的下拉，只显示匹配的前几项：按 “${want}” 搜不到。换一种它可能的写法再试（比如英文全称、去掉 University of 这类前缀）；列表里真的没有时，看看有没有 “Other / Not listed / 手动添加” 的入口。` : ""
      throw new BrowserError(hint + describeMiss(want, panel.options.length, pick))
    }
    const chosen = panel.options[pick.index]
    const risk = classifyRisk(chosen.name)
    if (risk) await this.guard(risk)
    const option = await chosen.at()
    if (!option) throw new BrowserError(`选项 “${chosen.name}” 刚才还在，现在找不到了。重新取一次快照再试。`)
    const at = await this.centerOf(option)
    if (at) await this.mouseClick(at, option.sessionId)
    else await this.callOn(option, "function(){ this.click() }")
    await this.settle()
    if (this.pendingDialog) return `选了 “${chosen.name}” 之后页面弹出对话框：“${this.pendingDialog.message}”。用 browser_handle_dialog 处理。`

    // Evidence, the way a person checks: did the list go away, or does the control show something new?
    const took = async () => {
      const shownNow = await this.callOn<string>(target, POPUP_FN, ["shown"]).catch(() => undefined)
      if (shownNow === undefined) return true // the control itself was re-drawn; the snapshot will tell
      if (shownNow !== shownBefore) return true
      return (await read()).options.length === 0
    }
    if (await took()) return `“${name}” 已选：${chosen.name}${this.how(want, chosen.name, pick)}`
    // The click did not register (some lists only listen to the keyboard): type-ahead, arrow, Enter.
    await open()
    if (searchable) await this.replaceText(editable ? target : ((await this.related(target, POPUP_FN, ["search"])) ?? target), chosen.name)
    await sleep(350)
    await this.key("ArrowDown").catch(() => {})
    await this.key("Enter").catch(() => {})
    await this.settle()
    if (await took()) return `“${name}” 已选：${chosen.name}（鼠标点选没生效，改用键盘选上的）${this.how(want, chosen.name, pick)}`
    await this.key("Escape").catch(() => {})
    throw new BrowserError(`在 “${name}” 里点了 “${chosen.name}”，但控件显示的内容没有变，列表也没有收起——不能算选上了。取一张带编号的截图看看它现在的样子，换一种人的操作方式（点开后逐个用 browser_click，或 browser_press_key 方向键 + Enter）。`)
  }

  /** Options a custom dropdown has put on screen — not the options of native <select>s, which sit in the same tree. */
  private async optionNodes(entry: RefEntry) {
    const { nodes } = await this.cdp.send<{ nodes: AXNode[] }>("Accessibility.getFullAXTree", entry.frameId ? { frameId: entry.frameId } : {}, entry.sessionId)
    const byId = new Map(nodes.map((n) => [n.nodeId, n]))
    const native = (n: AXNode) => {
      for (let p = n.parentId ? byId.get(n.parentId) : undefined, hops = 0; p && hops < 4; p = p.parentId ? byId.get(p.parentId) : undefined, hops++)
        if (roleOf(p) === "MenuListPopup") return true
      return roleOf(n) === "MenuListOption"
    }
    return nodes
      .filter((n) => !n.ignored && n.backendDOMNodeId !== undefined && ["option", "menuitem", "menuitemradio", "treeitem"].includes(roleOf(n)) && nameOf(n) && !native(n))
      .map((n) => ({ backendNodeId: n.backendDOMNodeId!, name: nameOf(n) }))
  }

  private async replaceText(target: Resolved, text: string) {
    await this.callOn(target, `function(){
      this.focus()
      if (typeof this.select === "function") this.select()
      else if (this.isContentEditable) { const r = document.createRange(); r.selectNodeContents(this); const s = getSelection(); s.removeAllRanges(); s.addRange(r) }
    }`)
    if (text) await this.input("Input.insertText", { text })
    else await this.key("Backspace")
  }

  /** An element reached from `target` by a page function (the 2nd radio of its group, …), as something we can click. */
  private async related(target: Resolved, fn: string, args: unknown[] = []): Promise<Resolved | undefined> {
    const { object } = await this.cdp.send("DOM.resolveNode", { backendNodeId: target.backendNodeId }, target.sessionId)
    try {
      const result = await this.cdp.sendWithTimeout(
        "Runtime.callFunctionOn",
        { objectId: object.objectId, functionDeclaration: fn, arguments: args.map((value) => ({ value })), returnByValue: false },
        target.sessionId,
        10_000,
      )
      const objectId = result?.result?.objectId as string | undefined
      if (!objectId) return undefined
      const described = await this.cdp.send("DOM.describeNode", { objectId }, target.sessionId)
      void this.cdp.send("Runtime.releaseObject", { objectId }, target.sessionId).catch(() => {})
      const backendNodeId = described?.node?.backendNodeId as number | undefined
      return backendNodeId === undefined ? undefined : { sessionId: target.sessionId, backendNodeId, entry: target.entry }
    } finally {
      void this.cdp.send("Runtime.releaseObject", { objectId: object.objectId }, target.sessionId).catch(() => {})
    }
  }

  async pressKey(key: string) {
    this.assertNoDialog()
    const parts = key.split("+")
    const name = parts.pop()!
    let modifiers = 0
    for (const m of parts) modifiers |= { alt: 1, ctrl: 2, control: 2, meta: 4, cmd: 4, command: 4, shift: 8 }[m.toLowerCase()] ?? 0
    if (/^(enter|return)$/i.test(name)) await this.guardEnter()
    await this.key(name, modifiers)
    await this.settle(150)
    return `已按 ${key}。${this.pendingDialog ? `页面弹出对话框：“${this.pendingDialog.message}”` : ""}${this.drainNotes()}`
  }

  async type(text: string) {
    this.assertNoDialog()
    // Same rule as fill: whatever has focus, if it is a password box the model may not type into it (2026-10-09).
    const focused = await this.cdp.send<{ result?: { value?: unknown } }>("Runtime.evaluate", { expression: "document.activeElement && document.activeElement.type === 'password'", returnByValue: true }).catch(() => undefined)
    if (focused?.result?.value === true) {
      log.info("type into focused password field refused")
      throw new BrowserError("当前焦点是密码框：密码不经这个工具。登录用 browser_login（任务开了自动登录它自己取密码），否则把登录交给顾问。")
    }
    await this.input("Input.insertText", { text })
    await this.settle(150)
    return `已在当前焦点处输入 “${text}”。`
  }

  /**
   * Auto-login (ROADMAP 2026-10-09 B / 2026-10-12 模型递参): type the username + password and press sign-in.
   * Two ways in: no arguments — the door scans materials and the machine store, the password never goes near
   * the model; or `explicit`, a pair the consultant handed the model in chat (the model parses the paste, we
   * never do) — the door caches that pair so the next call can be argument-free again, and drops it again if
   * this attempt is denied. This method never
   * echoes the password into its result or a log line (the password box read-back is a length, not a value).
   * The store door only opens while the task opted in; CAPTCHA / 2FA / a wrong password still stop and go to
   * the consultant, unchanged.
   */
  async login(explicit?: ExplicitCredentials): Promise<string> {
    this.assertNoDialog()
    const cred = await this.autoLoginCredentials(explicit)
    if (!cred) throw new BrowserError("自动登录没找到这个站点的凭据：任务没开【允许自动登录】，或学生的资料和本机里都没有这一站的记录（软件只认资料里写得清的记录）。顾问要是刚给了这站的账号密码，调 browser_login 时把它们当 username/password 参数带过来；除此之外登录照旧交给顾问——验证码和密码框这条路归人，不由你代填。")
    await this.snapshot() // fresh refs + the bot-gate check
    // The password box is invisible to field evidence (its value is never read), so find it by asking each box.
    const boxes = [...this.refs.values()].filter((e) => e.role === "textbox")
    // A page under human hands answers nothing — that has to travel as "等人", not as "没有密码框"
    // (2026-10-11 review P1-2: the probe loop swallowed the handoff signal the account fill no longer swallows).
    const pw = (
      await Promise.all(
        boxes.map(async (e) => ({
          e,
          t: await this.callOn<string>({ sessionId: e.sessionId, backendNodeId: e.backendNodeId, entry: e }, "function(){ return this.type }").catch((error) => {
            if (error instanceof HumanHeldError) throw error
            return undefined
          }),
        })),
      )
    ).find((x) => x.t === "password")?.e
    if (!pw) throw new BrowserError("这页上没有密码框——多半已经登录了，或还没到登录页。先 browser_snapshot 看清现在在哪；确实已登录就直接接着填表，别重复登录。")
    const lines: string[] = []
    // Username: the box before the password that looks like an account; else the box right before it; else none (password-only step).
    const order = [...this.refs.values()]
    const before = order.slice(0, order.indexOf(pw)).filter((e) => e.role === "textbox")
    const candidate = before.find((e) => /user|e-?mail|account|login|账号|帐号|邮箱|用户名/i.test(e.name)) ?? before.at(-1)
    const userRef = cred.username ? candidate?.ref : undefined
    if (userRef && cred.username) {
      // A handoff state under the fill is not a bad box to shrug at and keep clicking: while a human
      // holds the page, login stops there (2026-10-10 review P2-9).
      lines.push(
        await this.fill(userRef, cred.username).catch((error) => {
          if (error instanceof HumanHeldError) throw error
          return `账号那一格没填上：${error instanceof Error ? error.message : error}`
        }),
      )
    } else lines.push(cred.username ? "这一页没找到账号框，密码框之前也没有可当账号的格子——只填了密码。" : "本机没存这个平台的账号，只填了密码。")
    // Password: fill's own focus → select → insertText, but the value is never read back to text — only that it took.
    const pwTarget = await this.resolve(pw.ref)
    const point = await this.pointFor(pwTarget)
    if (point) await this.mouseClick(point, pwTarget.sessionId)
    else await this.callOn(pwTarget, "function(){ this.focus() }")
    await this.callOn(pwTarget, "function(){ if (typeof this.select === 'function') this.select() }")
    await this.input("Input.insertText", { text: cred.password })
    const took = await this.callOn<number>(pwTarget, "function(){ return String(this.value || '').length }").catch(() => 0)
    if (!took) throw new BrowserError("密码框没有接受输入（可能被网站挡住或禁用了）。不要硬试——交给顾问登录，或记进待顾问清单。")
    log.info("auto-login: password typed (value never leaves here)", { url: this.page.getURL().slice(0, 120) })
    // Submit: click a button that says sign-in/log-in if one is here, else Enter where the password box sits.
    const signIn = order.slice(order.indexOf(pw)).find((e) => e.role === "button" && /^\s*(log\s?in|sign\s?in|登录|登入|下一步|continue)\s*$/i.test(e.name))
    if (signIn) await this.click(signIn.ref)
    else { await this.key("Enter"); await this.settle(400) }
    await this.settle(600)
    const page = await this.snapshot()
    const note = `${lines.length ? `\n\n（账号框：${lines.join("；")}）` : ""}${cred.loose ? "\n\n（这条凭据是从资料里挑的唯一一条——记录本身没写明是哪个站的。如果登录被拒，别拿它再猜别的站：记进待顾问.md，请顾问把「哪个账号对应哪个网站」写清楚，软件下次就会认名字用对的那条。）" : ""}`
    // Where did it land? 2FA asks for a human (code), a rejection is a human question, otherwise: report and don't loop.
    if (/verification code|one[-\s]?time|enter the code|check your (e-?mail|phone|inbox)|emailed (you|us)|sent.{0,20}code|验证码|动态码|短信码|邮箱验证码/i.test(page)) return `账号密码这一关过了，但页面接下来要验证码/一次性码——这是人的动作。停下来告诉顾问（说清是邮箱还是手机），等他输入并点【我操作完了，交回 AI】，你再接着填。${note}`
    if (/incorrect|invalid|wrong|does not match|no account with|too many failed|密码.{0,6}(错误|不正确|不对)|账号或密码|登录失败/i.test(page)) {
      // A pair that arrived this call was denied: it must not stay cached (2026-10-12 review P2) — the door
      // cached it on receipt, so without this a wrong password would ride again on the next zero-arg call.
      if (explicit?.password) await this.discardDeniedExplicit()
      return `点了登录，页面说账号密码不对（没接受）。不要重试轰炸（连错会被锁）：记进待顾问.md 请顾问核实密码；这一份先做不碰登录的事。${note}`
    }
    return `已替顾问登录（密码本机代填，不经对话），页面现在：\n\n${page.slice(0, 1500)}\n如果这看着还是登录页，别重复点登录——先看清它报了什么，或交顾问。${note}`
  }

  /**
   * Hand files to the page the way a person does: click the thing, and whatever opens — the system's file chooser
   * (caught, never shown) or the site's own upload panel — take it from there. Only when the click opens nothing does
   * the shortcut of finding the hidden <input type=file> behind the button come into play.
   */
  async upload(ref: string, paths: string[]) {
    this.assertNoDialog()
    const before = this.seen
    const { files, notes } = await this.uploadable(paths)
    const target = await this.resolve(ref)
    const give = async (input: { backendNodeId: number; sessionId?: string }, how: string) => {
      await this.cdp.send("DOM.setFileInputFiles", { files, backendNodeId: input.backendNodeId }, input.sessionId)
      log.info("upload", { how, files: files.map((f) => basename(f)) })
      return how
    }
    let how: string
    const waiting = this.pendingChooser && Date.now() - this.pendingChooser.at < 120_000 ? this.pendingChooser : undefined
    this.pendingChooser = undefined
    if (waiting) how = await give(waiting, "交给了刚才点开的文件选择框")
    else if (await this.callOn<boolean>(target, 'function(){ return this.tagName === "INPUT" && this.type === "file" }')) {
      // HKUST report P1-5: an input without `multiple` silently drops every path after the first — the
      // honest answer is to give the first and say the rest were ignored, not "已选择文件：a、b".
      const shape = await this.callOn<{ multiple: boolean }>(target, "function(){ return { multiple: !!this.multiple } }")
      if (files.length > 1 && !shape.multiple) {
        await this.cdp.send("DOM.setFileInputFiles", { files: files.slice(0, 1), backendNodeId: target.backendNodeId }, target.sessionId)
        log.info("upload", { how: "single-file input, first path only", files: [basename(files[0])] })
        await this.settle(800)
        return `这格只收一个文件（没有 multiple），而给了 ${files.length} 个：只交了第一个 ${basename(files[0])}，其余的（${files.slice(1).map((f) => basename(f)).join("、")}）被忽略——不要当作全都传上了。要传多份，找分开的格子、或分批传。\n${await this.snapshotAfter(before)}`
      }
      how = await give(target, "交给了页面的文件框")
    }
    else {
      const risk = await this.reserved(target)
      if (risk) await this.guard(risk)
      await this.callOn(target, `function(){ document[Symbol.for("neo.fileInputs")] = new Set(document.querySelectorAll('input[type="file"]')) }`).catch(() => {})
      const chooser = await this.clickForChooser(target)
      if (chooser) how = await give(chooser, "点开了文件选择框，交给了它")
      else {
        await this.settle(400)
        // The site opened its own panel instead: a file box that was not there before the click is where the file goes.
        const fresh = await this.related(target, `function(){ const old = document[Symbol.for("neo.fileInputs")] || new Set(); const now = Array.from(document.querySelectorAll('input[type="file"]')).filter((el) => !old.has(el)); return now.length === 1 ? now[0] : null }`).catch(() => undefined)
        if (fresh) how = await give(fresh, "点了之后页面打开了自己的上传界面，文件交给了里面新出现的文件框")
        else {
          const listing = await this.snapshotAfter(before)
          const changed = !/页面还是原来那一页，元素没有增减/.test(listing)
          if (changed) return `点了 “${shown(target.entry)}”，没有出现文件选择框，页面自己打开了新的界面。在里面找到选文件的那个控件（Browse / Choose file / 选择文件 / 拖拽区），对它再调一次 browser_upload。\n${listing}`
          // Nothing opened at all: the button is a façade for a hidden file box next to it.
          const hidden = await this.related(target, HIDDEN_FILE_INPUT).catch(() => undefined)
          if (!hidden) throw new BrowserError("点了之后既没有出现文件选择框，页面也没有变化，附近也找不到文件框。取一张带编号的截图（browser_screenshot marks）看看真正的上传入口在哪。")
          how = await give(hidden, "点它没有反应，文件直接交给了它背后隐藏的文件框")
        }
      }
    }
    await this.settle(800)
    // HKUST report P1-3: old CGI sites show a "please wait" window that never closes while the upload is
    // already under way. One honest probe for that shape — no blind sleeps, no claimed completion.
    const busy = await this.cdp
      .sendWithTimeout(
        "Runtime.evaluate",
        { expression: `(()=>{const t=(document.body&&document.body.innerText)||"";return /please wait|do not interrupt|處理中|处理中|上傳中|上传中|正在上传|正在上傳/i.test(t)})()`, returnByValue: true },
        undefined,
        3_000,
      )
      .then((r) => r?.result?.value === true, () => false)
    const wait = busy ? `\n页面正在显示「请稍候 / 上传中」一类的提示（这类老系统的进度窗经常自己不关）：上传多半已经在后台进行——不要打断、不要反复点。等 15–20 秒后 browser_navigate 回原来的页（或它的列表页），读 File Name / Uploaded on / 文件大小确认真的传上了。\n` : "\n"
    const head = `已选择文件：${files.map((f) => basename(f)).join("、")}（${how}）。${notes.join("")}`
    if (this.pendingDialog) return `${head}\n页面随即弹出对话框：“${this.pendingDialog.message}”。用 browser_handle_dialog 处理。`
    return `${head}${wait}选了文件不等于传上了：页面要是接着出现裁剪 / 预览 / 确认 / Save / Upload，照着一步步点完；要是报错（格式、大小、文件名），按它说的换文件或改名再来。\n${await this.snapshotAfter(before)}`
  }

  /** Upload entry points already served on this page — a button does not show that a file went in, so we remember. */
  private uploadedHere = new Set<string>()
  private pendingChooser: { backendNodeId: number; sessionId?: string; at: number } | undefined

  /** A real click with the file-chooser trap armed; the trap is lifted again so the consultant's own clicks still open the system panel. */
  private async clickForChooser(target: Resolved, waitMs = 2_500) {
    await this.cdp.sendWithTimeout("Page.setInterceptFileChooserDialog", { enabled: true }, target.sessionId, 3_000).catch(() => {})
    try {
      const opened = this.cdp.once("Page.fileChooserOpened", waitMs)
      const point = await this.pointFor(target)
      if (point) await this.mouseClick(point, target.sessionId)
      else await this.callOn(target, "function(){ this.click() }")
      const evt = await opened
      return evt ? { backendNodeId: evt.params.backendNodeId as number, sessionId: evt.sessionId } : undefined
    } finally {
      void this.cdp.sendWithTimeout("Page.setInterceptFileChooserDialog", { enabled: false }, target.sessionId, 5_000).catch(() => {})
    }
  }

  /**
   * Many application systems refuse file names with non-English characters or more than ~50 characters — and say so
   * badly. A person would rename a copy; so do we, inside the workspace, and say that we did.
   */
  private async uploadable(paths: string[]) {
    const files: string[] = []
    const notes: string[] = []
    for (const given of paths) {
      const file = isAbsolute(given) ? given : resolve(this.options.workspace(), given)
      if (!existsSync(file)) throw new BrowserError(`找不到文件：${given}。先在工作区里确认路径（materials/ 下）。`)
      const name = basename(file)
      const ext = extname(name)
      if (/^[\x20-\x7e]+$/.test(name) && name.length <= 50) { files.push(file); continue }
      const stem = name.slice(0, name.length - ext.length).replace(/[^\x21-\x7e]+/g, "_").replace(/[^A-Za-z0-9._-]+/g, "_").replace(/_+/g, "_").replace(/^[_.-]+|[_.-]+$/g, "")
      const safe = `${(stem.length >= 3 ? stem : `file_${stem}`).replace(/_$/, "").slice(0, 40)}${ext.toLowerCase()}`
      const copy = join(this.options.workspace(), ".cache", "uploads", safe)
      await mkdir(join(this.options.workspace(), ".cache", "uploads"), { recursive: true })
      await copyFile(file, copy)
      files.push(copy)
      notes.push(`\n（“${name}” 的文件名${name.length > 50 ? "太长" : "含非英文字符"}，很多申请系统拒收，已改用内容相同的副本 “${safe}” 上传。）`)
    }
    return { files, notes }
  }

  async evaluate(expression: string) {
    this.assertNoDialog()
    const command = this.cdp.sendWithTimeout("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture: true }, undefined, 20_000)
    command.catch(() => {})
    const result = await Promise.race([command, this.dialogOpened.promise.then(() => undefined)])
    if (!result) return `脚本触发了 ${this.pendingDialog?.type} 对话框：“${this.pendingDialog?.message}”。用 browser_handle_dialog 处理。`
    if (result.exceptionDetails) throw new BrowserError(result.exceptionDetails.exception?.description || result.exceptionDetails.text)
    await this.settle(100)
    const value = result.result?.value
    return (typeof value === "string" ? value : JSON.stringify(value ?? null, null, 2)) + this.drainNotes()
  }

  async waitFor(opts: { text?: string; textGone?: string; seconds?: number }) {
    const deadline = Date.now() + Math.min(opts.seconds ?? 10, 60) * 1000
    if (!opts.text && !opts.textGone) {
      await sleep(Math.min(opts.seconds ?? 1, 60) * 1000)
      return "等待结束。"
    }
    // A person reading the screen does not care about capitals (CSS text-transform changes them) or line breaks.
    const loose = (text: string) => text.toLowerCase().replace(/\s+/g, " ").trim()
    while (Date.now() < deadline) {
      if (this.pendingDialog) this.assertNoDialog()
      const body = await this.cdp
        .sendWithTimeout("Runtime.evaluate", { expression: "document.body ? document.body.innerText : ''", returnByValue: true }, undefined, 5_000)
        .then((r) => loose(String(r.result?.value || "")))
        .catch(() => "")
      if (opts.text && body.includes(loose(opts.text))) return `已出现：“${opts.text}”。`
      if (opts.textGone && !body.includes(loose(opts.textGone))) return `已消失：“${opts.textGone}”。`
      await sleep(400)
    }
    throw new BrowserError("等待超时，页面没有出现预期变化。取一次快照看看现在的状态。")
  }
}

function countFrames(tree: { children: Map<number, any> }): number {
  let n = 1
  for (const child of tree.children.values()) n += countFrames(child)
  return n
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Same string, stripped of everything that changes between a document and a form: case, spacing, punctuation. */
/** Buttons that take the consultant off this page: saving, or moving to the next step. */
const MOVING_ON = /\b(save|next|continue|proceed|forward)\b|保存|暂存|存草稿|下一步|继续|下一页/i

const normalizeForSearch = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "")

/** What to call an element when talking to the model or the consultant. */
const shown = (entry: RefEntry) => entry.label || entry.name || entry.role

/**
 * What a click made appear. "mark" remembers everything visible (and returns what the control shows); "read" finds what
 * is visible now and was not before — the panel — and in it: a box to type in, whether it scrolls, and the things one
 * could pick (declared options if the site declares them, otherwise the deepest elements holding a short text that are
 * really on top at their centre). "option" i / "search" hand back the element; "shown" is the control's displayed text.
 */
const POPUP_FN = `function(mode, index){
  const KEY = Symbol.for("neo.popup")
  const visible = (el) => { const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return false; const s = getComputedStyle(el); return s.visibility !== "hidden" && s.display !== "none" && Number(s.opacity) > 0.05 }
  const display = () => { const host = this.closest("[role=combobox], [class*=select i], [class*=dropdown i], [class*=picker i]") || this.parentElement || this; return ((this.value || "") + "|" + (host.innerText || "")).replace(/\\s+/g, " ").trim().slice(0, 400) }
  if (mode === "mark") { document[KEY] = { before: new Set(Array.from(document.querySelectorAll("body *")).filter(visible)), options: [], search: null }; return display() }
  const state = document[KEY] || { before: new Set(), options: [], search: null }
  if (mode === "shown") return display()
  if (mode === "option") return state.options[index] || null
  if (mode === "search") return state.search || null
  const fresh = Array.from(document.querySelectorAll("body *")).filter((el) => !state.before.has(el) && visible(el) && !el.closest("#__neo_marks__, #__neo_grid__"))
  const set = new Set(fresh)
  const onTop = (el) => { const r = el.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + r.width / 2, r.top + Math.min(r.height / 2, 12)); return !!hit && (hit === el || el.contains(hit) || hit.contains(el)) }
  const text = (el) => (el.innerText || "").replace(/\\s+/g, " ").trim()
  let options = fresh.filter((el) => /^(option|menuitem|menuitemradio|menuitemcheckbox|treeitem)$/.test(el.getAttribute("role") || "") || el.tagName === "LI")
  if (!options.length) {
    // Rows of a list look alike and sit side by side: the element with the most text-bearing children holds the rows.
    let rows = null
    for (const el of fresh) { const kids = Array.from(el.children).filter((c) => set.has(c) && text(c) && text(c).length <= 100 && !c.matches("input, textarea, select, label")); if (kids.length > (rows ? rows.length : 1)) rows = kids }
    options = rows || fresh.filter((el) => { const t = text(el); return t && t.length <= 100 && !el.matches("input, textarea, select, label") && !Array.from(el.children).some((c) => set.has(c) && text(c)) })
  }
  const seen = new Set()
  options = options.filter((el) => { const t = text(el); if (!t || t.length > 100 || seen.has(t) || el.getAttribute("aria-disabled") === "true" || !onTop(el)) return false; seen.add(t); return true }).slice(0, 200)
  const search = fresh.find((el) => (el.tagName === "INPUT" && /^(text|search|)$/.test(el.type || "")) && el !== this) || null
  const scroller = fresh.find((el) => el.scrollHeight > el.clientHeight + 8 && /auto|scroll/.test(getComputedStyle(el).overflowY))
  const rect = scroller ? scroller.getBoundingClientRect() : null
  state.options = options; state.search = search; document[KEY] = state
  return { options: options.map(text), search: !!search, scrollable: !!scroller, box: rect ? { x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2) } : undefined }
}`

/**
 * A calendar, read off the screen. "mark" before the click; "read" afterwards gives what appeared: the heading (the
 * shortest new text with a year in it), dropdowns, the small cells (day numbers, month names, years — `off` when
 * disabled or belonging to the neighbouring month) and the arrows (named by label where the site says so, else by side).
 */
const CALENDAR_FN = `function(mode, index){
  const KEY = Symbol.for("neo.calendar")
  const visible = (el) => { const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return false; const s = getComputedStyle(el); return s.visibility !== "hidden" && s.display !== "none" && Number(s.opacity) > 0.05 }
  if (mode === "mark") { document[KEY] = { before: new Set(Array.from(document.querySelectorAll("body *")).filter(visible)), els: [] }; return true }
  const state = document[KEY] || { before: new Set(), els: [] }
  if (mode === "el") return state.els[index] || null
  const fresh = Array.from(document.querySelectorAll("body *")).filter((el) => !state.before.has(el) && visible(el))
  const set = new Set(fresh), els = [], keep = (el) => els.push(el) - 1
  const text = (el) => (el.innerText || el.textContent || "").replace(/\\s+/g, " ").trim()
  const leaf = (el) => !Array.from(el.children).some((c) => set.has(c) && text(c))
  const mid = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) } }
  const OFF = /(^|[-_ ])(disabled|other|outside|adjacent|old|new|prev|next|muted|off|out)([-_ ]|$)|other-month|not-current/i
  let title
  for (const el of fresh) { const t = text(el); if (t.length <= 28 && /(19|20)\\d{2}/.test(t) && !/^\\d{4}$/.test(t) && el.tagName !== "SELECT" && el.tagName !== "OPTION" && (!title || t.length <= text(title).length)) title = el }
  const selects = fresh.filter((el) => el.tagName === "SELECT").map((el) => ({ i: keep(el), options: Array.from(el.options).map((o) => o.text.trim()) }))
  const cells = [], arrows = []
  for (const el of fresh) {
    if (el === title || el.tagName === "SELECT" || el.tagName === "OPTION" || el.closest("select") || !leaf(el)) continue
    const t = text(el), hint = ((el.getAttribute("aria-label") || "") + " " + (el.getAttribute("title") || "") + " " + (el.className && el.className.baseVal === undefined ? el.className : "")).toLowerCase()
    const clickable = el.closest("button, a, [role=button], [onclick]") || getComputedStyle(el).cursor === "pointer"
    if (/^[‹›<>«»←→◀▶❮❯]$/.test(t) || (!t && clickable && el.getBoundingClientRect().width < 60) || (/prev|next|previous|forward|back|上一|下一|上个|下个/.test(hint) && t.length <= 8)) {
      arrows.push({ i: keep(el), dir: /prev|previous|back|上一|上个|^[‹<«←◀❮]$/.test(hint + " " + t) ? "prev" : /next|forward|下一|下个|^[›>»→▶❯]$/.test(hint + " " + t) ? "next" : "", ...mid(el) })
      continue
    }
    if (!t || t.length > 12) continue
    const off = el.getAttribute("aria-disabled") === "true" || el.disabled === true || OFF.test(String(el.className && el.className.baseVal === undefined ? el.className : "")) || OFF.test(String(el.parentElement && el.parentElement.className || ""))
    cells.push({ i: keep(el), text: t, off, ...mid(el) })
  }
  state.els = els; document[KEY] = state
  return { open: fresh.length > 0, title: title ? { i: keep(title), text: text(title), ...mid(title) } : undefined, selects, cells, arrows }
}`

const BLIND_REGIONS = `(() => {
  const out = []
  for (const el of document.querySelectorAll("canvas, embed, object")) {
    const r = el.getBoundingClientRect(), s = getComputedStyle(el)
    if (r.width < 200 || r.height < 100 || s.visibility === "hidden" || s.display === "none" || s.pointerEvents === "none") continue
    if (r.bottom < 0 || r.top > innerHeight * 3) continue
    // A canvas that is a picture (a chart, a signature pad with a label) is not a form; one that takes keys or clicks is.
    out.push({ kind: el.tagName.toLowerCase() === "canvas" ? "canvas 画出来的区域" : "内嵌文档", x: Math.round(r.left), y: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) })
  }
  return JSON.stringify(out.slice(0, 4))
})()`

type Bitmap = { pixels: Buffer; width: number; height: number; scale: number } | undefined

/** "Did that do anything?" — by looking, like a person: where the picture changed between two moments, in page pixels. */
function describeChange(before: Bitmap, after: Bitmap) {
  if (!before || !after || before.width !== after.width || before.height !== after.height) return "（没能对比点击前后的画面。）"
  let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1, changed = 0
  for (let y = 0; y < after.height; y += 2)
    for (let x = 0; x < after.width; x += 2) {
      const i = (y * after.width + x) * 4
      if (Math.abs(before.pixels[i] - after.pixels[i]) + Math.abs(before.pixels[i + 1] - after.pixels[i + 1]) + Math.abs(before.pixels[i + 2] - after.pixels[i + 2]) < 48) continue
      changed++
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
  if (changed < 6) return "画面没有任何变化——多半没点中，或者这里点了没反应。"
  const k = after.scale
  const share = (changed * 4) / (after.width * after.height)
  return `画面变了：变化集中在 x ${Math.round(x0 * k)}–${Math.round(x1 * k)}、y ${Math.round(y0 * k)}–${Math.round(y1 * k)} 这一块${share > 0.4 ? "（大面积变化，像是换了一屏）" : ""}。`
}

/** The file box a drawn button stands in front of: its own control, or the only one within a few levels up, or the only one on the page. */
const HIDDEN_FILE_INPUT = `function(){
  if (this.control && this.control.type === "file") return this.control
  for (let el = this, hops = 0; el && hops < 5; el = el.parentElement, hops++) {
    const found = el.querySelectorAll ? el.querySelectorAll('input[type="file"]') : []
    if (found.length === 1) return found[0]
    if (found.length > 1) return null
  }
  const all = document.querySelectorAll('input[type="file"]')
  return all.length === 1 ? all[0] : null
}`

const UPLOAD_ENTRY = /\b(upload|attach|browse|choose\s+(a\s+)?file|select\s+(a\s+)?file|add\s+(a\s+)?(photo|file|document|attachment))\b|上传|上傳|选择文件|選擇檔案|添加附件|添加文件/i

const SIGNATURE_TEXT = /\b(e-?|electronic\s+|digital\s+)?signature\b|\bsign(ed)?\s+(here|below|by)\b|\btype\s+(in\s+)?your\s+(full\s+|legal\s+)?name\s+(to|as)\b|签名|簽名|签署|簽署|署名|签字|簽字/i

/** Page-side helpers shared by the radio functions (function declarations, so they hoist above the `return`). */
const RADIO_HELPERS = `
  function radios(el){
    const group = el.getAttribute && el.getAttribute("role") === "radiogroup" ? el : (el.closest && el.closest('[role="radiogroup"]'))
    if (group) return Array.from(group.querySelectorAll('input[type="radio"], [role="radio"]'))
    const root = el.form || el.getRootNode()
    return el.name ? Array.from(root.querySelectorAll('input[type="radio"]')).filter((r) => r.name === el.name) : [el]
  }
  function labelOf(r){
    const text = (r.labels && r.labels[0] && r.labels[0].innerText) || r.getAttribute("aria-label") || r.innerText || r.value || ""
    return String(text).replace(/\\s+/g, " ").trim()
  }
`

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((r) => (resolve = r))
  return { promise, resolve }
}
