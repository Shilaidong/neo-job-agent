/**
 * The embedded stage hosting several pages at once (2026-10-16 多标签): tab 0 is the application
 * page itself, and every `window.open` a site does lands as another tab instead of topping it —
 * the consultant SEES the agent switch (the strip is in the toolbar), and the application page is
 * still there afterwards. All tabs share the one persistent profile, so a login made in one is a
 * login in the others.
 *
 * What a tab does NOT have is `window.opener`: we build the tab ourselves, Chromium never created
 * the relationship. Snapshots of popup tabs say so in so many words, and `browser_open_in_window`
 * re-opens a URL through the parent's own `window.open` as a REAL window — the one shape where
 * opener write-back works (HKUST-style institution pickers). That escape is per-call, on purpose:
 * a real window is a real window, visible to the consultant, and it rebinding back when it closes.
 */
import type { BrowserWindow } from "electron"
import { WebContentsView } from "electron"
import { createLogger } from "../log"
import { Cdp, electronTransport } from "./cdp"
import { electronPage, type BrowserHost } from "./page"

const pageLog = createLogger("page")

export type TabInfo = { id: string; title: string; url: string; active: boolean; popup: boolean }
type Tab = { id: string; view: WebContentsView; host: BrowserHost; popup: boolean; realWindowOnce: boolean; lastUrl: string }

/** Schemes a tab can host; anything else (devtools, chrome-*) is denied like before. */
const TAB_SCHEMES = /^https?:|^file:|^blob:|^about:/i

const CLOSE_TAB_MARKER = "[neo-close-tab]"
/** Popped-up pages self-close with window.close() — a no-op in a tab the app built, so popup tabs get this shim instead (see the console-message wiring). */
const CLOSE_TAB_SHIM = `window.close = new Proxy(window.close, { apply() { console.info("${CLOSE_TAB_MARKER}") } })`

/** NTU refuses Electron outright; on those hosts (only) the UA is Chrome-ified (docs/BROWSER.md). Same rule as the main view has always had. */
const chromeLikeHosts = ["ntu.edu.sg"]
function applyUaFor(contents: import("electron").WebContents, url: string) {
  const nativeUa = (contents as any).__nativeUa as string | undefined
  const chromeLikeUa = (contents as any).__chromeLikeUa as string | undefined
  if (!nativeUa || !chromeLikeUa) return
  let chromeLike = false
  try {
    const host = new URL(url).hostname
    chromeLike = chromeLikeHosts.some((h) => host === h || host.endsWith("." + h))
  } catch {
    /* not a URL: leave as is */
  }
  const want = chromeLike ? chromeLikeUa : nativeUa
  if (contents.getUserAgent() !== want) contents.setUserAgent(want)
}

export class TabsHost {
  private tabs: Tab[] = []
  private activeId = ""
  private seq = 0
  /** Wired by index.ts. */
  onStateChanged: () => void = () => {}
  /** Things the model must hear about with the next tool result (browser.addNote). */
  onNote: (text: string) => void = () => {}
  /** The active tab's host changed (switch / self-close / destroyed): rebind the controller. */
  onActiveChanged: (host: BrowserHost) => void = () => {}
  /** A real BrowserWindow came out of an allowed window.open — index.ts positions, rebinds, watches it. */
  onRealWindow: (win: BrowserWindow, fromTabId: string) => void = () => {}
  /** New views must join the window's contentView; removal takes them back out. */
  onNewView: (view: WebContentsView) => void = () => {}
  onRemoveView: (view: WebContentsView) => void = () => {}
  /** Real windows are hidden under smoke; a consultant run shows them. */
  showRealWindows = true
  /** Set on app quit: the destroyed events firing during teardown must not trigger a rebuild (native SIGTRAP). */
  quitting = false

  /** The frame every tab shares (the stage under the toolbar). */
  private frame: { x: number; y: number; width: number; height: number } = { x: 0, y: 0, width: 0, height: 0 }
  private visible = false
  /** Set while the controller is bound to a real window opened by `browser_open_in_window`. */
  private realWindowHeldFor: string | undefined

  get mainView(): WebContentsView {
    return this.tabs[0].view
  }

  /** Tab 0 — the application page. Its host pair is the one the app already made. */
  adoptMain(view: WebContentsView, host: BrowserHost) {
    const tab: Tab = { id: "main", view, host, popup: false, realWindowOnce: false, lastUrl: view.webContents.getURL() }
    this.tabs.push(tab)
    this.activeId = tab.id
    this.wire(tab)
  }

  /** All views share the stage frame; only the active one is visible. */
  setFrame(frame: { x: number; y: number; width: number; height: number }, visible: boolean) {
    this.frame = frame
    this.visible = visible
    for (const tab of this.tabs) {
      tab.view.setBounds(frame)
      tab.view.setVisible(visible && tab.id === this.activeId)
    }
  }

  list(): TabInfo[] {
    return this.tabs.map((t) => ({ id: t.id, title: t.view.webContents.getTitle() || (t.popup ? "新标签页" : "申请页"), url: t.view.webContents.getURL(), active: t.id === this.activeId, popup: t.popup }))
  }

  /** The model-facing list: ids are what browser_switch_tab takes. */
  formatList(): string {
    const rows = this.list().map((t, i) => `${i + 1}. ${t.active ? "★ " : ""}[${t.id}] ${t.title}${t.popup ? "（弹窗标签，没有 window.opener）" : ""}\n   ${t.url}`)
    return `当前标签页（★ = 工具正作用的那页）：\n${rows.join("\n")}`
  }

  hostById(id: string): BrowserHost | undefined {
    return this.tabs.find((t) => t.id === id)?.host
  }

  /** What the snapshot header says about the CURRENT tab — the honest opener situation. */
  introForActive(): string | undefined {
    if (this.realWindowHeldFor)
      return "\n〔当前在 browser_open_in_window 打开的真窗口里：window.opener 可用，回写父页的表单直接填就行；窗口一关就自动回到标签页。〕"
    const tab = this.tabs.find((t) => t.id === this.activeId)
    if (!tab) return undefined
    if (tab.popup)
      return "\n〔这是一个弹窗标签页，由本应用自己开出——它没有 window.opener。要是这一页需要回写父页（勾选后自动关闭、父页自动填充的那种），在这里填了也不会生效：用 browser_open_in_window 从父页重新开一个真窗口，或记待办交顾问。自己打开就能完成的（搜索、列表、预览）照常操作。〕"
    return undefined
  }

  /** index.ts calls these around binding the controller to the real window. */
  realWindowOpened(fromTabId: string) {
    this.realWindowHeldFor = fromTabId
  }

  realWindowClosed() {
    this.realWindowHeldFor = undefined
  }

  private hostOf(id: string): BrowserHost | undefined {
    return this.tabs.find((t) => t.id === id)?.host
  }

  /** Switch tabs (consultant click or agent tool): one path, so both see the same state. */
  async activate(id: string): Promise<BrowserHost | undefined> {
    const tab = this.tabs.find((t) => t.id === id)
    if (!tab || id === this.activeId) return undefined
    this.activeId = id
    for (const t of this.tabs) t.view.setVisible(this.visible && t.id === this.activeId)
    this.onStateChanged()
    return tab.host
  }

  async close(id: string): Promise<BrowserHost | undefined> {
    if (id === "main" || !this.tabs.some((t) => t.id === id)) return undefined
    const tab = this.tabs.find((t) => t.id === id)!
    if (id === this.activeId) return this.destroyTab(tab) // removal re-activates main and returns its host
    this.destroyTab(tab)
    return undefined
  }

  private destroyTab(tab: Tab): BrowserHost | undefined {
    if (tab.id === "main") return undefined // the application tab is rebuilt (rebuildMain), never just dropped
    const wasActive = tab.id === this.activeId
    this.tabs = this.tabs.filter((t) => t.id !== tab.id)
    if (wasActive) {
      this.activeId = this.tabs[0].id
      for (const t of this.tabs) t.view.setVisible(this.visible && t.id === this.activeId)
    }
    this.onRemoveView(tab.view)
    try {
      tab.view.webContents.close()
    } catch {
      /* already gone */
    }
    this.onStateChanged()
    if (wasActive) this.onNote(`弹窗标签页自己关掉了（或被站点销毁），工具已回到申请页。`)
    return wasActive ? this.tabs[0].host : undefined
  }

  /**
   * A site's window.open becomes a tab. The opener page stays exactly where it is — that is the whole
   * point; the old "load it in place" policy is what topped the application page. The new tab does NOT
   * steal the view: the visible tab and the bound host must stay the same page, so the model switches
   * explicitly (browser_switch_tab) or the consultant clicks the chip.
   */
  openPopup(url: string): void {
    const view = new WebContentsView({ webPreferences: { partition: "persist:application", contextIsolation: true, sandbox: true } })
    const host: BrowserHost = { page: electronPage(view.webContents), cdp: new Cdp(electronTransport(view.webContents)) }
    const tab: Tab = { id: `tab${++this.seq}`, view, host, popup: true, realWindowOnce: false, lastUrl: url }
    this.tabs.push(tab)
    view.setBounds(this.frame)
    view.setVisible(false)
    this.onNewView(view)
    this.wire(tab)
    void view.webContents.loadURL(url).catch(() => {})
    this.onStateChanged()
    this.onNote(`页面开了一个新窗口，已作为新标签页接住（标签栏里点它或用 browser_switch_tab 过去）：${url}。原来那页原样在原地。`)
  }

  /** Opening a task (or handing the page to ego) starts from the application tab again. */
  resetToMain(): BrowserHost {
    this.activeId = "main"
    for (const t of this.tabs) t.view.setVisible(this.visible && t.id === "main")
    this.onStateChanged()
    return this.tabs[0].host
  }

  /**
   * The escape hatch for opener write-back: let the NEXT window.open on this tab through as a real
   * BrowserWindow. `browser_open_in_window` runs `window.open(url)` on the caller's behalf — the
   * browser itself creates the window, so `window.opener` is real.
   */
  allowRealWindowOnce(tabId: string): boolean {
    const tab = this.tabs.find((t) => t.id === tabId)
    if (!tab) return false
    tab.realWindowOnce = true
    return true
  }

  private realWindowFlag(tab: Tab): boolean {
    if (!tab.realWindowOnce) return false
    tab.realWindowOnce = false
    return true
  }

  private wire(tab: Tab) {
    const c = tab.view.webContents
    // Same identity rule as the main view has always had: Electron's own UA, Chrome-ified only on listed hosts.
    const nativeUa = c.getUserAgent()
    ;(c as any).__nativeUa = nativeUa
    ;(c as any).__chromeLikeUa = nativeUa.replace(/\s(?!Mozilla|AppleWebKit|Chrome|Safari)[^\s/()]+\/[^\s]+/g, "")
    c.on("will-navigate", (_e, url) => applyUaFor(c, String(url)))
    c.on("did-start-navigation", (_e, url, _inPlace, isMainFrame) => isMainFrame && applyUaFor(c, String(url)))
    c.setWindowOpenHandler(({ url }) => {
      if (this.realWindowFlag(tab)) return { action: "allow", overrideBrowserWindowOptions: { width: 980, height: 760, show: this.showRealWindows, autoHideMenuBar: true, backgroundColor: "#f6f1e7" } }
      if (TAB_SCHEMES.test(url)) {
        this.openPopup(url)
        return { action: "deny" }
      }
      return { action: "deny" }
    })
    c.on("did-create-window", (window) => {
      // Only reached when the handler above allowed it — the opener relationship is Chromium's own.
      window.webContents.setWindowOpenHandler(() => ({ action: "deny" }))
      window.webContents.on("will-navigate", (_e, url) => applyUaFor(window.webContents, String(url)))
      this.onRealWindow(window, tab.id)
    })
    const notify = () => this.onStateChanged()
    for (const evt of ["did-navigate", "did-navigate-in-page", "did-start-loading", "did-stop-loading", "page-title-updated"] as const) c.on(evt as any, notify)
    c.on("did-navigate", (_e, url, code) => {
      tab.lastUrl = String(url)
      pageLog.info("navigated", { url, httpStatus: code, tab: tab.id })
      if (tab.popup) void c.executeJavaScript(CLOSE_TAB_SHIM, false).catch(() => {})
      this.onStateChanged()
    })
    c.on("did-fail-load", (_e, code, description, url, isMainFrame) => code !== -3 && pageLog.warn("load failed", { code, description, url, isMainFrame, tab: tab.id }))
    c.on("unresponsive", () => pageLog.warn("page unresponsive", { url: c.getURL(), tab: tab.id }))
    c.on("console-message", (event: any) => {
      // Popups that close themselves call window.close() — a no-op in a tab we built (Chromium only
      // lets script close windows script opened), so popup tabs get a shim that turns the call into
      // this marker, and the marker closes the tab for real.
      if (event.level === "info" && event.message === CLOSE_TAB_MARKER && tab.popup) {
        const wasActive = tab.id === this.activeId
        const back = this.destroyTab(tab)
        if (wasActive && back) this.onActiveChanged(back) // the tools ride back to the application tab
        if (!wasActive) this.onNote("一个后台的弹窗标签页自己关掉了，已从标签栏移除。")
        return
      }
      // The site's own console: usually noise, occasionally the reason a form would not save.
      if (event.level === "error" || event.level === "warning") pageLog.debug(`console ${event.level}`, { message: event.message, source: event.sourceId, line: event.lineNumber, tab: tab.id })
    })
    // P0-1: a popup that dies (cascade, crash) just leaves; the MAIN tab coming apart is the one that
    // must not take the session with it — rebuild it in place on the same profile and say what happened.
    c.on("destroyed", () => {
      if (this.quitting || !this.tabs.some((t) => t.id === tab.id)) return
      if (tab.popup) {
        this.destroyTab(tab)
        this.onNote(`弹窗标签页自己关掉了（或被站点销毁），已从标签栏移除。`)
      } else {
        this.rebuildMain()
      }
    })
    c.on("render-process-gone", (_e, details) => {
      if (tab.popup || this.quitting) return // a dead popup is removed with its destroyed event; nothing to keep alive
      this.onNote(`页面渲染进程崩了（${details.reason}），正在原地恢复——内容会重新加载，进度在服务器上，不丢。`)
      void tab.host.cdp
        .attach() // the crash took the debugger session with it; the tools need it back on the fresh page
        .catch((error) => pageLog.warn("re-attach after crash failed", { error, tab: tab.id }))
      void c.loadURL(tab.lastUrl || "about:blank").catch(() => {})
    })
  }

  /** P0-1 for the main tab: same id, same slot, fresh contents — the session record is on disk, not in the page. */
  private rebuildMain() {
    const old = this.tabs[0]
    if (!old) return
    this.onRemoveView(old.view)
    const view = new WebContentsView({ webPreferences: { partition: "persist:application", contextIsolation: true, sandbox: true } })
    const host: BrowserHost = { page: electronPage(view.webContents), cdp: new Cdp(electronTransport(view.webContents)) }
    const tab: Tab = { id: "main", view, host, popup: false, realWindowOnce: false, lastUrl: old.lastUrl }
    this.tabs[0] = tab
    this.onNewView(view)
    view.setBounds(this.frame)
    view.setVisible(this.visible && this.activeId === "main")
    this.wire(tab)
    void view.webContents.loadURL(old.lastUrl || "about:blank").catch(() => {})
    this.onStateChanged()
    this.onNote(`申请页被站点整个销毁了（弹窗级联或崩溃），已经原地重建并回到 ${old.lastUrl}。登录态在本机档案里多半还在；若页面要求重新登录，直接调 browser_login。`)
    if (this.activeId === "main") this.onActiveChanged(host)
  }

  /** P0-1 smoke hook: pretend the site destroyed a tab. */
  destroyForTests(id: string) {
    const tab = this.tabs.find((t) => t.id === id)
    if (tab) this.destroyTab(tab)
  }

  /** The active tab's host — what the toolbar and (via onActiveChanged) the controller act on. */
  activeHost(): BrowserHost {
    return this.tabs.find((t) => t.id === this.activeId)?.host ?? this.tabs[0].host
  }
}
