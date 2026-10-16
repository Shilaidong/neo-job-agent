import type { JobEntry, JobSource } from "../../shared/jobs"
import { createLogger } from "../log"
import { normalizeEntry, parseRss, type RawFeedItem } from "./feed-core"

const log = createLogger("feed-source")

/**
 * One source → a batch of normalised postings. Every adapter is best-effort: a source that refuses,
 * times out or changes shape fails loudly (so the scheduler can report it) but never blocks the others.
 */

type Raw = { title: string; link: string; description?: string; company?: string; location?: string; postedAt?: string; salary?: string }

async function getJson(url: string, timeoutMs = 25_000): Promise<unknown> {
  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) TerraEduNeoJobAgent/0.1", accept: "application/json, text/xml, application/xml, */*" },
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return text // RSS / XML rides the same path
  }
}

function fetchRss(source: JobSource): Promise<Raw[]> {
  return getJson(source.url).then((body) => {
    if (typeof body !== "string") throw new Error(`RSS 源回应了 JSON，不是 XML（${source.url}）`)
    const items = parseRss(body)
    if (!items.length) throw new Error("RSS 里没有找到任何岗位条目")
    return items.map((it: RawFeedItem) => ({ title: it.title, link: it.link, description: it.description, postedAt: it.pubDate }))
  })
}

function urlWithKeyword(source: JobSource, suffix: string): string {
  const sep = source.url.includes("?") ? "&" : "?"
  const kw = (source.keywords ?? []).join(" ")
  const loc = source.location
  const params = new URLSearchParams()
  if (kw) params.set("keywords", kw)
  if (loc) params.set("location", loc)
  return `${source.url}${sep}${suffix}${params.size ? `&${params.toString()}` : ""}`
}

function fetchGreenhouse(source: JobSource): Promise<Raw[]> {
  const slug = source.url.split("/").filter(Boolean).pop() ?? source.url
  return getJson(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs?content=true`).then((data: any) => {
    const jobs = data?.jobs
    if (!Array.isArray(jobs)) throw new Error(`Greenhouse 板 ${slug} 没有返回 jobs 数组`)
    return jobs.map((j: any) => ({
      title: j.title,
      link: j.absolute_url || `https://boards.greenhouse.io/${slug}/jobs/${j.id}`,
      description: j.content,
      company: source.name,
      location: j.location?.name,
      postedAt: j.updated_at,
    }))
  })
}

function fetchLever(source: JobSource): Promise<Raw[]> {
  const slug = source.url.split("/").filter(Boolean).pop() ?? source.url
  return getJson(`https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`).then((data: any) => {
    if (!Array.isArray(data)) throw new Error(`Lever 板 ${slug} 没有返回数组`)
    return data.map((j: any) => ({
      title: j.text,
      link: j.hostedUrl,
      description: j.description,
      company: source.name,
      location: [j.categories?.allLocations ?? "", j.categories?.location ?? ""].filter(Boolean).join(", ") || j.categories?.team,
      postedAt: j.createdAt || j.updatedAt,
    }))
  })
}

function fetchAshby(source: JobSource): Promise<Raw[]> {
  const slug = source.url.split("/").filter(Boolean).pop() ?? source.url
  return getJson(`https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(slug)}`).then((data: any) => {
    const jobs = data?.jobs
    if (!Array.isArray(jobs)) throw new Error(`Ashby 板 ${slug} 没有返回 jobs 数组`)
    return jobs.map((j: any) => ({
      title: j.title,
      link: j.jobUrl,
      description: j.descriptionHtml,
      company: source.name,
      location: j.location,
      postedAt: j.publishedAt,
      salary: [j.compensation?.compensationTierSummary].filter(Boolean).join(" "),
    }))
  })
}

function fetchSimpleJson(source: JobSource): Promise<Raw[]> {
  return getJson(source.url).then((data: any) => {
    const list = Array.isArray(data) ? data : Array.isArray(data?.jobs) ? data.jobs : Array.isArray(data?.items) ? data.items : null
    if (!list) throw new Error(`JSON 源没有给出数组/items（${source.url}）`)
    return list.map((it: any) => ({
      title: it.title ?? it.name ?? it.headline,
      link: it.url ?? it.link ?? it.applyUrl ?? it.permalink,
      description: it.description ?? it.content ?? it.text,
      company: it.company ?? it.author,
      location: it.location ?? it.locations?.join?.(', '),
      postedAt: it.pubDate ?? it.publishedAt ?? it.createdAt ?? it.created_at,
    })).filter((r: Raw) => r.title && r.link)
  })
}

/** Checked ahead of the run so the sidebar can say "this source is malformed" without a fetch. */
export function validateSource(source: JobSource): string | null {
  if (!source.name.trim()) return "来源名不能为空"
  if (source.kind === "rss" || source.kind === "json") {
    if (!URL.canParse(source.url)) return "需要完整的网址（https://…）"
    return null
  }
  if (!source.url.trim()) return "需要公司的板名（Greenhouse/Lever/Ashby slug）"
  return null
}

export async function fetchSource(source: JobSource): Promise<JobEntry[]> {
  if (!source.enabled) return []
  const problem = validateSource(source)
  if (problem) throw new Error(problem)
  let raw: Raw[]
  if (source.kind === "rss") raw = await fetchRss(source)
  else if (source.kind === "greenhouse") raw = await fetchGreenhouse(source)
  else if (source.kind === "lever") raw = await fetchLever(source)
  else if (source.kind === "ashby") raw = await fetchAshby(source)
  else raw = await fetchSimpleJson(source)
  return raw.filter((r) => r.title && r.link).map((r) => normalizeEntry(source, r))
}
