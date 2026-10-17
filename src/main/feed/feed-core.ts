import { createHash } from "node:crypto"
import type { JobEntry, JobMatchResult, JobSource, JobTarget } from "../../shared/jobs"

/** Canonical id of a posting: (source, url) — survives re-fetches, kills duplicates across runs. */
export function entryId(source: string, url: string) {
  return createHash("sha1").update(`${source}\u0000${url}`).digest("hex").slice(0, 16)
}

// ------------------------------------------------------------------ html / xml helpers (no deps)

export function decodeEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
}

export function stripHtml(text: string): string {
  return text
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** The lowercase text the classifier and matcher look at. */
function norm(...parts: Array<string | undefined>): string {
  return parts.filter(Boolean).map((s) => (s as string).toLowerCase().replace(/\s+/g, " ")).join(" ")
}

/**
 * A deliberately small RSS/Atom reader (LinkedIn and Indeed both serve well-formed feeds; trying to
 * pull in an XML dependency for two endpoints is not worth it). Returns one object per <item>.
 */
export type RawFeedItem = { title: string; link: string; description: string; pubDate?: string; author?: string }

export function parseRss(xml: string): RawFeedItem[] {
  const items: RawFeedItem[] = []
  const itemRe = /<(?:item|entry)\b[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi
  // Namespaced tags (e.g. <atom:link>) still appear as <xyz:link ...> — match on the local name.
  const tag = (block: string, name: string) => {
    const m = new RegExp(`<[^>]*:?${name}\\b[^>]*>([\\s\\S]*?)</[^>]*:?${name}>`, "i").exec(block)
    return m ? decodeEntities(m[1].trim()) : ""
  }
  for (const [_full, block] of xml.matchAll(itemRe)) {
    const title = tag(block, "title")
    const link = tag(block, "link")
    const description = tag(block, "description") || tag(block, "summary")
    const pubDate = tag(block, "pubDate") || tag(block, "updated")
    const author = tag(block, "author") || tag(block, "creator")
    if (!link && !title) continue
    items.push({ title, link, description, pubDate, author })
  }
  return items
}

// ------------------------------------------------------------------ classification

export type JobFacts = { internship: boolean; fullTime: boolean; remote: boolean; tags: string[] }

/** What kind of job a posting is, from its own words — inside the core so it is unit-testable. */
export function classifyJob(title: string, description: string): JobFacts {
  const text = norm(title, description)
  const tags: string[] = []
  const internship = /intern|实习生|实习|co-?op|trainee/.test(text)
  const fullTime = /full-?time|全职|ftc/.test(text)
  const remote = /remote|远程|work from home|wfh/.test(text)
  for (const kw of ["remote", "hybrid", "onsite", "internship", "full-time", "part-time", "graduate", "new grad", "entry level"]) {
    if (text.includes(kw)) tags.push(kw)
  }
  return { internship, fullTime, remote, tags }
}

const LOCATION_HINTS = [
  ["United States", ["united states", "us", "usa", "america", "bay area", "new york", "san francisco", "washington dc", "seattle", "austin", "remote us"]],
  ["New York", ["new york", "nyc"]],
  ["San Francisco", ["san francisco", "sf"]],
  ["Seattle", ["seattle"]],
  ["Remote", ["remote", "anywhere"]],
  ["China", ["china", "中国", "beijing", "shanghai", "shenzhen", "hangzhou", "远程", "北京", "上海", "深圳", "杭州"]],
  ["United Kingdom", ["united kingdom", "uk", "london", "伦敦"]],
  ["Singapore", ["singapore", "新加坡"]],
] as const

/** Free-text location → a short canonical hint (used for matching and display). */
export function canonicalLocation(location: string): string[] {
  const hit = LOCATION_HINTS.filter(([, words]) => words.some((w) => location.toLowerCase().includes(w)))
  return hit.map(([name]) => name)
}

/** Build a JobEntry from whatever the source returned. */
export function normalizeEntry(source: JobSource, raw: { title: string; link: string; description?: string; company?: string; location?: string; postedAt?: string; salary?: string }): JobEntry {
  const title = decodeEntities(raw.title).trim()
  const description = decodeEntities(stripHtml(raw.description ?? "")).trim()
  const located = raw.location?.trim() || canonicalLocation(`${title} ${description}`).join(" / ") || ""
  const facts = classifyJob(title, description)
  return {
    id: entryId(source.id, raw.link),
    source: source.id,
    title,
    company: raw.company?.trim() || sourceNameCompany(source, title),
    location: located,
    url: raw.link,
    description: description.slice(0, 40_000),
    postedAt: raw.postedAt,
    tags: facts.tags,
    internship: facts.internship,
    fullTime: facts.fullTime,
    salary: raw.salary?.trim() || undefined,
    fetchedAt: new Date().toISOString(),
  }
}

/** Best-effort company out of the source name or a "Title at Company" title (RSS rarely says). */
function sourceNameCompany(source: JobSource, title: string): string {
  if (source.kind !== "rss") return source.name
  const at = /(?:\sat\s|\u2013\s|\u2014\s|\|)(.+)$/i.exec(title)
  const company = at?.[1]?.replace(/[\u2013\u2014|].*$/, "").trim()
  return company || source.name
}

// ------------------------------------------------------------------ matching

const MIN_SCORE = 35

/**
 * Rule-based scoring of one posting against the student's target. Pure and deterministic:
 * the feed screen shows the reasons, and the unit tests pin the weights.
 */
export function matchEntry(entry: JobEntry, target: JobTarget): JobMatchResult {
  const title = norm(entry.title)
  const desc = norm(entry.description)
  const all = ` ${title} ${desc} `
  const reasons: string[] = []
  let score = 0
  // Every array is optional at the type level (a hand-typed or AI-written target may leave one out).
  const roleKeywords = target.roleKeywords ?? []
  const companies = target.companies ?? []
  const locations = target.locations ?? []
  const locationExclude = target.locationExclude ?? []
  const skills = target.skills ?? []

  const roleHits = roleKeywords.filter((kw) => kw && title.includes(kw.trim().toLowerCase()))
  if (roleHits.length) {
    score += Math.min(70, roleHits.length * 35)
    reasons.push(`标题命中：${roleHits.slice(0, 3).join("、")}`)
  } else {
    const descHits = roleKeywords.filter((kw) => kw && all.includes(kw.trim().toLowerCase()))
    if (descHits.length) {
      score += Math.min(45, descHits.length * 15)
      reasons.push(`描述命中：${descHits.slice(0, 3).join("、")}`)
    }
  }

  const companyHit = companies.find((c) => entry.company.trim().toLowerCase().includes(c.trim().toLowerCase()))
  if (companyHit) {
    score += 30
    reasons.push(`目标公司：${entry.company}`)
  }

  if (target.internshipsOnly) {
    if (entry.internship) score += 12
    else {
      score -= 25
      reasons.push("不是实习（只看实习）")
    }
  }
  if (target.fullTimeOnly) {
    if (entry.fullTime) score += 8
    else score -= 20
  }

  const loc = norm(entry.location)
  if (locations.length) {
    const hit = locations.find((l) => loc.includes(l.trim().toLowerCase()))
    if (hit) {
      score += 25
      reasons.push(`地点符合：${hit}`)
    }
    const bad = locationExclude.find((l) => loc.includes(l.trim().toLowerCase()))
    if (bad) {
      score -= 100
      reasons.push(`排除地点：${bad}`)
    }
  }

  const skillHits = skills.filter((s) => s && all.includes(s.toLowerCase().trim()))
  if (skillHits.length) {
    score += Math.min(25, skillHits.length * 6)
    if (skillHits.length >= 2) reasons.push(`技能命中：${skillHits.slice(0, 5).join("、")}`)
  }

  return { score, matched: score >= MIN_SCORE, reasons }
}

export { MIN_SCORE }
