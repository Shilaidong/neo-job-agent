import { BrowserWindow } from "electron"
import { createLogger } from "./log"

const log = createLogger("web")

/**
 * Looking things up on the web, in a real browser the sites cannot tell from a person's.
 *
 * Two reasons this exists. OpenCode's own `webfetch` asks for a page over plain HTTP: on a real run the model pointed
 * it at Google and DuckDuckGo result pages and was refused about fifteen times out of twenty, while the same model
 * reading the same things through the browser on the left worked every time. And the page on the left is the
 * consultant's half-filled application — searching must never navigate it away. So: a page of our own, off-screen,
 * on the same browser profile (so a login the consultant already did still counts), never shown, never in the way.
 */
let page: BrowserWindow | undefined

function backgroundPage() {
  if (page && !page.isDestroyed()) return page
  page = new BrowserWindow({ show: false, webPreferences: { partition: "persist:application", contextIsolation: true, sandbox: true, backgroundThrottling: false } })
  const c = page.webContents
  // Same as the application page: to a site this is Chrome, which it is.
  c.setUserAgent(c.getUserAgent().replace(/\s(?!Mozilla|AppleWebKit|Chrome|Safari)[^\s/()]+\/[^\s]+/g, ""))
  c.setWindowOpenHandler(() => ({ action: "deny" }))
  log.info("background page created")
  return page
}

export function closeWeb() {
  if (page && !page.isDestroyed()) page.destroy()
  page = undefined
}

async function visit(url: string, seconds = 25) {
  const target = /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}`
  if (!/^https?:/i.test(target)) throw new Error(`只能打开 http / https 的网址：${url}`)
  const c = backgroundPage().webContents
  await Promise.race([
    c.loadURL(target),
    new Promise((_, fail) => setTimeout(() => fail(new Error("打开超时")), seconds * 1000)),
  ]).catch((error) => {
    if (!/ERR_ABORTED/.test(String(error))) throw error
  })
  // Give client-rendered pages a beat to put their results in the document.
  await new Promise((r) => setTimeout(r, 700))
  return c
}

/**
 * The results, read the way a person reads them: links that lead somewhere else, with the text around them. Search
 * engines route every result through a redirect of their own, so a link that carries a URL inside it is followed to
 * what it actually points at first — that is a fact about links, not a rule about any one engine.
 */
const RESULTS = `(() => { try {
  const bare = (host) => (host.indexOf("www.") === 0 ? host.slice(4) : host)
  const here = bare(location.hostname)
  const webUrl = (text) => {
    try {
      const u = new URL(text)
      return u.protocol === "http:" || u.protocol === "https:" ? u : null
    } catch (e) { return null }
  }
  const unwrap = (href) => {
    const u = webUrl(href)
    if (!u) return href
    for (const [, value] of u.searchParams) {
      if (webUrl(value)) return value
      // Some of them base64 the destination instead of escaping it: URL-safe alphabet, no padding.
      if (/^[A-Za-z0-9_-]{20,}$/.test(value)) {
        try {
          const raw = value.replace(/^a1/, "").replace(/-/g, "+").replace(/_/g, "/")
          const decoded = atob(raw + "===".slice((raw.length + 3) % 4))
          if (webUrl(decoded)) return decoded
        } catch (e) {}
      }
    }
    return href
  }
  const flat = (el) => (el.innerText || el.textContent || "").replace(/\\s+/g, " ").trim()
  const seen = new Set(), out = []
  for (const a of document.querySelectorAll("a[href]")) {
    const url = unwrap(a.href)
    const parsed = webUrl(url)
    if (!parsed) continue
    const host = bare(parsed.hostname)
    if (host === here || host.endsWith("." + here) || here.endsWith("." + host)) continue
    const title = flat(a)
    if (title.length < 8 || title.length > 200 || seen.has(url)) continue
    seen.add(url)
    let box = a, hops = 0
    while (box.parentElement && hops < 4 && flat(box).length < title.length + 40) { box = box.parentElement; hops++ }
    out.push({ title, url, snippet: flat(box).replace(title, " ").trim().slice(0, 220) })
    if (out.length >= 12) break
  }
  return JSON.stringify(out)
} catch (e) { return JSON.stringify({ error: String((e && e.message) || e) }) } })()`

const READABLE = `(() => {
  const main = document.querySelector("main, article, [role=main]") || document.body
  const text = (main.innerText || "").replace(/[ \\t]+/g, " ").replace(/\\n{3,}/g, "\\n\\n").trim()
  return JSON.stringify({ title: document.title, url: location.href, text: text.slice(0, 12000), cut: text.length > 12000 })
})()`

/** Engines in order: whichever answers with results wins. Any of them can decide to stop serving us one day. */
const ENGINES = [
  { name: "Bing", url: (q: string) => `https://www.bing.com/search?q=${encodeURIComponent(q)}&setlang=zh-hans` },
  { name: "DuckDuckGo", url: (q: string) => `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(q)}` },
]

export async function searchWeb(query: string) {
  const text = query.trim()
  if (!text) throw new Error("要搜什么？给一句话。")
  for (const engine of ENGINES) {
    const c = await visit(engine.url(text)).catch((error) => (log.warn("search could not load", { engine: engine.name, error }), undefined))
    if (!c) continue
    const results = await c
      .executeJavaScript(RESULTS)
      .then((raw: string) => {
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) throw new Error(parsed.error ?? "results were not a list")
        return parsed as Array<{ title: string; url: string; snippet: string }>
      })
      .catch((error) => (log.warn("could not read the results page", { engine: engine.name, error: String(error).slice(0, 300) }), []))
    // The query itself never reaches the log: the model writes it, and a search box is not where a student's details belong.
    log.info("search", { engine: engine.name, queryChars: text.length, results: results.length })
    if (!results.length) {
      // Worth knowing which it was: refused at the door, or a page we could not read.
      const seen = await c
        .executeJavaScript(`JSON.stringify({ title: document.title, links: document.querySelectorAll("a[href]").length, text: (document.body.innerText || "").slice(0, 200) })`)
        .catch(() => "{}")
      log.warn("search came back with nothing", { engine: engine.name, page: seen })
      continue
    }
    const lines = results.map((r, i) => `${i + 1}. ${r.title}\n   ${r.url}\n   ${r.snippet}`)
    return `搜索“${text}”（${engine.name}）找到 ${results.length} 条：\n\n${lines.join("\n")}\n\n要读哪一条就用 browser_open 打开它的网址。这次搜索在后台进行，左边顾问那一页没有动过。`
  }
  throw new Error(`搜了 ${ENGINES.map((e) => e.name).join(" 和 ")} 都没拿到结果（多半是被挡了）。换个说法再试，或者你已经知道官网网址的话直接用 browser_open 打开。`)
}

export async function openWeb(url: string) {
  const c = await visit(url)
  const page = await c
    .executeJavaScript(READABLE)
    .then((raw: string) => JSON.parse(raw) as { title: string; url: string; text: string; cut: boolean })
    .catch(() => undefined)
  if (!page) throw new Error(`打开了 ${url}，但读不出内容。`)
  log.info("open", { url: page.url, chars: page.text.length })
  if (!page.text.trim()) throw new Error(`${page.title || url} 打开了，但页面上没有文字（可能要登录，或者内容是图片）。`)
  return `${page.title}\n${page.url}\n\n${page.text}${page.cut ? "\n\n（内容太长，后面截掉了）" : ""}\n\n（这一页是在后台打开的，左边顾问那一页没有动过。）`
}
