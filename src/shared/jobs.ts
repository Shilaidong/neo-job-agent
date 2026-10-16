/**
 * The daily job feed — everything it needs to say to the renderer. The heavy lifting lives in
 * src/main/feed (sources, matcher, store, scheduler); these are the shapes that cross the IPC.
 */

/** How a source is fetched. `rss`/`json` are plain XML/JSON over HTTP; the board kinds hit public ATS APIs. */
export type JobSourceKind = "rss" | "greenhouse" | "lever" | "ashby" | "json"

export type JobSource = {
  id: string
  name: string
  enabled: boolean
  kind: JobSourceKind
  /** For `greenhouse`/`lever`/`ashby` this is the company slug; for `rss`/`json` the full endpoint URL. */
  url: string
  keywords?: string[]
  location?: string
}

/** One job posting, normalised from whatever a source returned. */
export type JobEntry = {
  /** Canonical id: digest of (source, url) — de-duplication key across runs. */
  id: string
  source: string
  title: string
  company: string
  location: string
  url: string
  description: string
  postedAt?: string
  tags: string[]
  internship: boolean
  fullTime: boolean
  salary?: string
  fetchedAt: string
}

/** One job against one student's target — rule-based, no model needed (and fully unit-testable). */
export type JobMatchResult = {
  score: number
  matched: boolean
  reasons: string[]
}

/** The student's target, derived by the AI (对话) but editable by hand in the JobCenter. */
export type JobTarget = {
  roles: string[]
  roleKeywords: string[]
  companies: string[]
  locations: string[]
  locationExclude: string[]
  internshipsOnly?: boolean
  fullTimeOnly?: boolean
  skills: string[]
}

/** A persisted, matched feed for one student. */
export type StudentFeed = {
  entries: JobEntry[]
  matches: Record<string, JobMatchResult> // entry id → match against the student's current target
  generatedAt: string
}

/** What the renderer needs to render the whole feed screen. */
export type FeedOverview = {
  sources: JobSource[]
  schedule: FeedSchedule
  lastRun: { startedAt: string; finishedAt: string; fetched: number; new: number; failed: string[] } | null
  running: boolean
  /** Students that have a target already — the feed subsets per student. */
  students: Array<{ studentName: string; studentDir: string; target: JobTarget }>
  /** The latest snapshot, keyed by studentDir; empty strings mean "no target yet". */
  feeds: Record<string, StudentFeed>
}

export type FeedSchedule = {
  enabled: boolean
  /** "13:00" style, in the given zone (empty = off for that zone). */
  beijing: string
  eastern: string
  /** A catch-up on app start: run a missed slot on launch. */
  catchUpOnLaunch: boolean
}

export const DEFAULT_SOURCES: JobSource[] = [
  { id: "linkedin-us", name: "LinkedIn（美国）", enabled: true, kind: "rss", url: "https://www.linkedin.com/jobs-guest/jobs/api/rss/v2/", location: "United States" },
  { id: "indeed-us", name: "Indeed（美国）", enabled: true, kind: "rss", url: "https://www.indeed.com/rss", location: "United States" },
  { id: "hn", name: "Hacker News Who's Hiring", enabled: false, kind: "json", url: "https://hn.algolia.com/api/v1/search_by_date?query=who%20is%20hiring&tags=story&hitsPerPage=1" },
]

export const DEFAULT_SCHEDULE: FeedSchedule = { enabled: true, beijing: "13:00", eastern: "13:00", catchUpOnLaunch: true }

/** Recognised resume formats (the LaTeX template keys). */
export const RESUME_TRACKS = ["general", "data", "engineering", "marketing", "finance", "accounting"] as const
export type ResumeTrack = (typeof RESUME_TRACKS)[number]

export const RESUME_TRACK_LABELS: Record<ResumeTrack, string> = {
  general: "通用",
  data: "数据分析",
  engineering: "工程技术",
  marketing: "市场营销",
  finance: "金融",
  accounting: "会计",
}
