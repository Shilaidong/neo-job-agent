import type { WebContents } from "electron"
import { createLogger } from "../log"
import { HumanHeldError, HUMAN_HANDOFF_MSG } from "./challenge"

const log = createLogger("cdp")

export type CdpEvent = { method: string; params: any; sessionId?: string }
type Listener = (event: CdpEvent) => void

/**
 * The wire a Cdp session rides on. Electron's `webContents.debugger` for the embedded view;
 * a WebSocket to ego lite's DevTools port for Plan 2. Both speak the same protocol against a
 * PAGE target, so the conventions are identical: root commands carry no sessionId, and
 * cross-origin iframe sessions ride alongside with theirs.
 */
export interface CdpTransport {
  /** Bring the wire up (attach / connect). Safe to call again while up. */
  open(): Promise<void>
  /** Physically let go of the page. */
  close(): void
  post<T = any>(method: string, params?: Record<string, unknown>, sessionId?: string): Promise<T>
  onEvent(handler: (event: CdpEvent) => void): () => void
  /** The wire vanished on its own (devtools socket closed, debugger stolen). */
  onLost(handler: () => void): () => void
}

/** The embedded application page: Electron's own debugger channel, unchanged semantics from before Plan 2. */
export function electronTransport(contents: WebContents): CdpTransport {
  const handlers = new Set<(event: CdpEvent) => void>()
  const losts = new Set<() => void>()
  // Listeners belong to the debugger object, not to one attach: re-hooking after a handoff must not double them.
  let wired = false
  const wire = () => {
    if (wired) return
    wired = true
    contents.debugger.on("message", (_event, method, params, sessionId) => {
      const evt: CdpEvent = { method, params, sessionId: sessionId || undefined }
      for (const handler of handlers) handler(evt)
    })
    contents.debugger.on("detach", (_event, reason) => {
      log.warn("debugger detached", { reason })
      for (const lost of losts) lost()
    })
  }
  return {
    async open() {
      wire()
      if (!contents.isDestroyed()) {
        if (!contents.debugger.isAttached()) contents.debugger.attach("1.3")
      }
    },
    close: () => {
      try {
        if (!contents.isDestroyed() && contents.debugger.isAttached()) contents.debugger.detach()
      } catch (error) {
        log.warn("detach failed", { error })
      }
    },
    post: <T>(method: string, params: Record<string, unknown> = {}, sessionId?: string) => contents.debugger.sendCommand(method, params, sessionId) as Promise<T>,
    onEvent(handler) {
      handlers.add(handler)
      return () => handlers.delete(handler)
    },
    onLost(handler) {
      losts.add(handler)
      return () => losts.delete(handler)
    },
  }
}

/**
 * ego lite (Plan 2): a plain WebSocket to the page's DevTools endpoint, opened through the
 * `--remote-debugging-port` ego happily answers on. The A/B probe (docs/BROWSER.md) measured
 * that attaching this way does NOT bring Cloudflare's flag back — the Electron host was the
 * problem, not the debugger — so this needs no cleverness, just the protocol.
 *
 * `resolveEndpoint` is asked for the page's `webSocketDebuggerUrl` on every (re)open, because
 * ego tabs come and go between the calls.
 */
export function wsTransport(resolveEndpoint: () => Promise<string>): CdpTransport {
  const handlers = new Set<(event: CdpEvent) => void>()
  const losts = new Set<() => void>()
  let ws: WebSocket | null = null
  let connecting: Promise<void> | null = null
  let nextId = 1
  const waiting = new Map<number, { resolve: (value: any) => void; reject: (error: any) => void }>()
  const failAll = (why: string) => {
    for (const waiter of waiting.values()) waiter.reject(new Error(why))
    waiting.clear()
  }
  const drop = (why: string) => {
    failAll(why)
    const gone = ws
    ws = null
    connecting = null
    if (gone) {
      try {
        gone.close()
      } catch {
        /* already closing */
      }
      for (const lost of losts) lost()
    }
  }
  const open = async () => {
    if (ws) return
    if (connecting) return connecting
    connecting = (async () => {
      const url = await resolveEndpoint()
      const socket = new WebSocket(url)
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("the DevTools socket took too long to open")), 10_000)
        socket.addEventListener("open", () => (clearTimeout(timer), resolve()))
        socket.addEventListener("error", () => (clearTimeout(timer), reject(new Error(`cannot reach the DevTools endpoint (${url.split("?")[0]})`))))
      })
      socket.addEventListener("message", (event) => {
        let message: any
        try {
          message = JSON.parse(String(event.data))
        } catch {
          return
        }
        if (typeof message.id === "number") {
          const waiter = waiting.get(message.id)
          if (waiter) {
            waiting.delete(message.id)
            message.error ? waiter.reject(new Error(`${message.error.message ?? JSON.stringify(message.error)}`)) : waiter.resolve(message.result)
          }
          return
        }
        if (!message.method) return
        const evt: CdpEvent = { method: message.method, params: message.params, sessionId: message.sessionId || undefined }
        for (const handler of handlers) handler(evt)
      })
      socket.addEventListener("close", () => ws === socket && drop("the DevTools socket closed"))
      socket.addEventListener("error", () => ws === socket && drop("the DevTools socket failed"))
      ws = socket
    })()
    try {
      await connecting
    } finally {
      connecting = null
    }
  }
    return {
      open,
      close() {
        if (ws) drop("closed on purpose")
      },
      async post<T>(method: string, params: Record<string, unknown> = {}, sessionId?: string): Promise<T> {
      await open()
      const id = nextId++
      return new Promise<T>((resolve, reject) => {
        if (!ws) return reject(new Error("the DevTools socket is not open"))
        waiting.set(id, { resolve, reject })
        ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
      })
    },
    onEvent(handler) {
      handlers.add(handler)
      return () => handlers.delete(handler)
    },
    onLost(handler) {
      losts.add(handler)
      return () => losts.delete(handler)
    },
  }
}

/**
 * Thin wrapper over a CDP transport: the paused gate for human handoff, the flattened iframe
 * sessions, the domains every tool call expects enabled, and a timeout on everything.
 */
export class Cdp {
  private listeners = new Set<Listener>()
  /** frameId (== targetId for iframe targets) → child sessionId */
  readonly frameSessions = new Map<string, string>()

  /**
   * True while the consultant holds the page (human handoff): every command refuses instead.
   * On the embedded page the debugger is taken off as well (Cloudflare reads an attached CDP
   * as a machine there); on ego lite the wire stays open — the probe measured that the attach
   * itself is not what triggers the check — and "handing over" means just not sending.
   */
  paused = false
  private wired = false

  constructor(private readonly transport: CdpTransport) {}

  async attach() {
    if (!this.wired) {
      this.wired = true
      this.transport.onEvent((evt) => {
        if (evt.method === "Target.attachedToTarget") void this.onAttached(evt.params)
        if (evt.method === "Target.detachedFromTarget") this.onDetached(evt.params)
        for (const listener of this.listeners) listener(evt)
      })
      this.transport.onLost(() => this.frameSessions.clear())
    }
    await this.transport.open()
    await this.enableDomains()
  }

  /** Let a person use the page: every command refuses until `resumeTools`. */
  releaseToHuman() {
    this.paused = true
    this.transport.close()
  }

  /** Take the page back: bring the wire up and re-enable what a tool call expects to find running. */
  async resumeTools() {
    this.paused = false
    await this.attach()
  }

  private async enableDomains(sessionId?: string) {
    // Sequential and time-boxed: a domain that never answers must not wedge startup.
    for (const method of ["Page.enable", "DOM.enable", "Runtime.enable", "Accessibility.enable"]) {
      await this.sendWithTimeout(method, {}, sessionId, 5_000).catch((error) => log.warn("enable failed", { method, sessionId, error }))
    }
    // window.print() opens the system's print panel — a window outside the page that nothing in the page can close.
    await this.sendWithTimeout("Page.addScriptToEvaluateOnNewDocument", { source: "window.print = () => console.info('[neo] print request ignored')" }, sessionId, 5_000).catch(() => {})
    // The consultant's cursor lives in the sidebar, so the page never has real focus. Without this,
    // every injected mouse event waits ~5s for a focus ack, and blur handlers close dropdowns mid-task.
    await this.sendWithTimeout("Emulation.setFocusEmulationEnabled", { enabled: true }, sessionId, 5_000).catch((error) =>
      log.warn("enable failed", { method: "Emulation.setFocusEmulationEnabled", sessionId, error }),
    )
    await this.sendWithTimeout(
      "Target.setAutoAttach",
      { autoAttach: true, waitForDebuggerOnStart: false, flatten: true },
      sessionId,
      5_000,
    ).catch((error) => log.warn("enable failed", { method: "Target.setAutoAttach", sessionId, error }))
  }

  private async onAttached(params: any) {
    const info = params?.targetInfo
    if (!info || info.type !== "iframe") return
    this.frameSessions.set(info.targetId, params.sessionId)
    log.debug("iframe session attached", { frameId: info.targetId, url: info.url })
    await this.enableDomains(params.sessionId)
  }

  private onDetached(params: any) {
    for (const [frameId, sessionId] of this.frameSessions) {
      if (sessionId === params?.sessionId) this.frameSessions.delete(frameId)
    }
  }

  /** The one gate every page command passes: while the consultant holds the page, nothing goes through. */
  send<T = any>(method: string, params: Record<string, unknown> = {}, sessionId?: string): Promise<T> {
    if (this.paused) return Promise.reject(new HumanHeldError(HUMAN_HANDOFF_MSG))
    return this.transport.post<T>(method, params, sessionId)
  }

  /** Like `send` but never hangs: a blocked renderer (open JS dialog) would otherwise stall forever. */
  sendWithTimeout<T = any>(method: string, params: Record<string, unknown>, sessionId: string | undefined, ms: number) {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        log.warn("command timed out", { method, ms, sessionId })
        reject(new Error(`${method} timed out after ${ms}ms`))
      }, ms)
      this.send<T>(method, params, sessionId).then(
        (value) => (clearTimeout(timer), resolve(value)),
        (error) => (clearTimeout(timer), reject(error)),
      )
    })
  }

  on(listener: Listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  once(method: string, timeoutMs: number): Promise<CdpEvent | undefined> {
    return new Promise((resolve) => {
      const off = this.on((evt) => {
        if (evt.method !== method) return
        clearTimeout(timer)
        off()
        resolve(evt)
      })
      const timer = setTimeout(() => (off(), resolve(undefined)), timeoutMs)
    })
  }
}
