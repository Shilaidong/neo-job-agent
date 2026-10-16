import type { WebContents } from "electron"
import type { Cdp } from "./cdp"

/**
 * "The page" as the controller and the toolbar know it — nothing beyond these few things.
 * Two things can wear this face: the embedded view (Electron `WebContents`) and, since Plan 2
 * stage 3, a tab inside ego lite (`EgoPage` in ../ego-host). The CDP side of a host comes from
 * `CdpTransport` (cdp.ts); this is the small synchronous remainder the UI reads every frame.
 */
export interface Page {
  getURL(): string
  getTitle(): string
  isLoading(): boolean
  canGoBack(): boolean
  canGoForward(): boolean
  reload(): void
  loadURL(url: string): Promise<void>
  goBack(): void
  goForward(): void
  /** A main-frame navigation (re)started; returns the unsubscribe. */
  onNavStart(handler: () => void): () => void
  /** Anything the page's address/title/loading changed to; returns the unsubscribe. */
  onChanged(handler: () => void): () => void
}

/** The pair the controller acts on: a page's surface and its CDP wire. The controller can be
 * re-bound to another host (embedded view ⇄ an ego lite tab) when a task opens somewhere else. */
export type BrowserHost = { page: Page; cdp: Cdp }

export function electronPage(contents: WebContents): Page {
  return {
    getURL: () => contents.getURL(),
    getTitle: () => contents.getTitle(),
    isLoading: () => contents.isLoading(),
    canGoBack: () => contents.navigationHistory.canGoBack(),
    canGoForward: () => contents.navigationHistory.canGoForward(),
    reload: () => contents.reload(),
    loadURL: (url) => contents.loadURL(url),
    goBack: () => contents.navigationHistory.goBack(),
    goForward: () => contents.navigationHistory.goForward(),
    onNavStart: (handler) => {
      const listener = (_e: unknown, url: string, _inPlace: boolean, isMainFrame: boolean) => isMainFrame && handler()
      contents.on("did-start-navigation", listener)
      return () => contents.removeListener("did-start-navigation", listener)
    },
    onChanged: (handler) => {
      // Same loop the toolbar state used to subscribe with (index.ts) — the event-name union is too wide for the overloads.
      const events = ["did-navigate", "did-navigate-in-page", "did-start-loading", "did-stop-loading", "page-title-updated"] as const
      for (const evt of events) contents.on(evt as any, handler)
      return () => {
        for (const evt of events) contents.removeListener(evt as any, handler)
      }
    },
  }
}
