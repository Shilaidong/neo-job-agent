import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import { readFile, rename, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { app } from "electron"
import { DEFAULT_SCHEDULE, DEFAULT_SOURCES, type FeedOverview, type FeedSchedule, type JobEntry, type JobSource, type JobTarget, type StudentFeed } from "../../shared/jobs"
import { createLogger } from "../log"
import { fetchSource } from "./sources"
import { matchEntry } from "./feed-core"
import { listStudents } from "../tasks/tasks"

const log = createLogger("feed")

// ------------------------------------------------------------------ storage (per machine, in userData)

const dir = () => {
  const d = join(app.getPath("userData"), "feed")
  mkdirSync(d, { recursive: true })
  return d
}
const file = (name: string) => join(dir(), name)

function readJson<T>(path: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T
  } catch {
    return fallback
  }
}

function writeJsonSync(path: string, value: unknown) {
  const tmp = `${path}.tmp`
  writeFileSync(tmp, JSON.stringify(value, null, 2))
  renameSync(tmp, path)
}

export function listSources(): JobSource[] {
  return readJson<JobSource[]>(file("sources.json"), DEFAULT_SOURCES).map((s, i) => ({ ...DEFAULT_SOURCES[i], ...s, id: s.id || `s${i}` }))
}
export function saveFeedSources(sources: JobSource[]) {
  writeJsonSync(file("sources.json"), sources)
}
export function loadSchedule(): FeedSchedule {
  return { ...DEFAULT_SCHEDULE, ...readJson<Partial<FeedSchedule>>(file("schedule.json"), {}) }
}
export function saveFeedSchedule(schedule: FeedSchedule) {
  writeJsonSync(file("schedule.json"), schedule)
}
/** When the last snapshot finished (null = never) — the scheduler's catch-up keys on it. */
export function feedRunFinishedAt(): string | null {
  return loadSnapshot().lastRun?.finishedAt ?? null
}

type Snapshot = { entries: JobEntry[]; fetchedAt: string; lastRun: { startedAt: string; finishedAt: string; fetched: number; new: number; failed: string[] } | null }
function emptySnapshot(): Snapshot {
  return { entries: [], fetchedAt: new Date().toISOString(), lastRun: null }
}
function loadSnapshot(): Snapshot {
  return { ...emptySnapshot(), ...readJson<Partial<Snapshot>>(file("snapshot.json"), {}) }
}
function saveSnapshot(snap: Snapshot) {
  writeJsonSync(file("snapshot.json"), snap)
}

// ------------------------------------------------------------------ student targets (in their workspace)

export async function readJobTarget(studentDir: string): Promise<JobTarget> {
  const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map((s) => String(s).trim()).filter(Boolean) : [])
  const bool = (v: unknown): boolean => v === true || v === "true" || v === 1
  try {
    const raw = JSON.parse(await readFile(join(studentDir, "job_target.json"), "utf8")) as Record<string, unknown>
    // The AI writes whatever profile-keys.json said. We documented both spellings at various times,
    // so BOTH camelCase and snake_case are accepted (2026-10-17 real-run: model wrote role_keywords).
    return {
      roles: arr(raw.roles),
      roleKeywords: arr(raw.roleKeywords ?? raw.role_keywords),
      companies: arr(raw.companies),
      locations: arr(raw.locations),
      locationExclude: arr(raw.locationExclude ?? raw.location_exclude),
      internshipsOnly: bool(raw.internshipsOnly ?? raw.internships_only),
      fullTimeOnly: bool(raw.fullTimeOnly ?? raw.full_time_only),
      skills: arr(raw.skills),
    }
  } catch {
    return { roles: [], roleKeywords: [], companies: [], locations: [], locationExclude: [], internshipsOnly: false, skills: [] }
  }
}

export async function writeJobTarget(studentDir: string, target: JobTarget) {
  const cleaned: JobTarget = {
    roles: (target.roles ?? []).map((s) => s.trim()).filter(Boolean),
    roleKeywords: (target.roleKeywords ?? []).map((s) => s.trim().toLocaleLowerCase()).filter(Boolean),
    companies: (target.companies ?? []).map((s) => s.trim()).filter(Boolean),
    locations: (target.locations ?? []).map((s) => s.trim()).filter(Boolean),
    locationExclude: (target.locationExclude ?? []).map((s) => s.trim()).filter(Boolean),
    internshipsOnly: target.internshipsOnly ? true : false,
    fullTimeOnly: target.fullTimeOnly ? true : false,
    skills: (target.skills ?? []).map((s) => s.trim()).filter(Boolean),
  }
  const tmp = `${join(studentDir, "job_target.json")}.tmp`
  await writeFile(tmp, JSON.stringify(cleaned, null, 2))
  await rename(tmp, join(studentDir, "job_target.json"))
  return cleaned
}

/** The IPC-side name (what index.ts and the renderer expect). */
export function saveJobTarget(studentDir: string, target: JobTarget) {
  return writeJobTarget(studentDir, target)
}

/** The per-student feed: the latest snapshot matched against the student's current target. */
export async function feedForStudent(studentDir: string): Promise<StudentFeed> {
  const { entries } = loadSnapshot()
  const target = await readJobTarget(studentDir)
  const matches: StudentFeed["matches"] = {}
  for (const entry of entries) matches[entry.id] = matchEntry(entry, target)
  return { entries, matches, generatedAt: loadSnapshot().fetchedAt }
}

// ------------------------------------------------------------------ the run

let running = false

/**
 * The daily snapshot: fetch every enabled source, de-duplicate (newest wins on a sha1(url)), keep the
 * most recent 500 postings, and drop entries that are more than ~60 days old. Everything is local.
 */
export async function runOnceNow(): Promise<FeedOverview> {
  if (running) return overview()
  running = true
  const startedAt = new Date().toISOString()
  const before = loadSnapshot()
  const byId = new Map<string, JobEntry>(before.entries.map((e) => [e.id, e]))
  const base = new Map(before.entries.map((e) => [e.id, e]))
  const failed: string[] = []
  let fetched = 0
  try {
    const sources = listSources().filter((s) => s.enabled)
    const batches = await Promise.allSettled(sources.map((s) => fetchSource(s)))
    batches.forEach((result, index) => {
      if (result.status === "rejected") {
        const name = sources[index]?.name ?? "?"
        failed.push(`${name}：${result.reason instanceof Error ? result.reason.message : String(result.reason).slice(0, 140)}`)
        log.warn("source failed", { name, error: result.reason })
        return
      }
      for (const entry of result.value) {
        fetched++
        const existing = byId.get(entry.id)
        if (!existing) byId.set(entry.id, entry)
        else if (!base.has(entry.id) || existing.fetchedAt < entry.fetchedAt) byId.set(entry.id, entry)
      }
    })
    const cutoff = Date.now() - 60 * 24 * 60 * 60 * 1000
    const entries = [...byId.values()]
      .filter((e) => !e.postedAt || Date.parse(e.postedAt) > cutoff || isNaN(Date.parse(e.postedAt)))
      .sort((a, b) => (b.postedAt ?? b.fetchedAt).localeCompare(a.postedAt ?? a.fetchedAt))
      .slice(0, 500)
    const newCount = entries.filter((e) => !before.entries.some((old) => old.id === e.id && old.fetchedAt === e.fetchedAt)).length
    saveSnapshot({ entries, fetchedAt: new Date().toISOString(), lastRun: { startedAt, finishedAt: new Date().toISOString(), fetched, new: newCount, failed } })
    log.info("feed run finished", { fetched, new: newCount, failed: failed.length, kept: entries.length })
  } catch (error) {
    log.error("feed run crashed", { error })
    saveSnapshot({ ...before, lastRun: { startedAt, finishedAt: new Date().toISOString(), fetched, new: 0, failed: [...failed, `整体：${error instanceof Error ? error.message : String(error)}`] } })
  } finally {
    running = false
  }
  return overview()
}

export async function overview(): Promise<FeedOverview> {
  const snap = loadSnapshot()
  const groups = await listStudents()
  const students: FeedOverview["students"] = []
  const feeds: FeedOverview["feeds"] = {}
  for (const group of groups) {
    const target = await readJobTarget(group.studentDir)
    students.push({ studentName: group.studentName, studentDir: group.studentDir, target })
    feeds[group.studentDir] = await feedForStudent(group.studentDir)
  }
  return { sources: listSources(), schedule: loadSchedule(), lastRun: snap.lastRun, running, students, feeds }
}

export function feedRunning() {
  return running
}

/** Smoke seam: overwrite the snapshot with a fixed entry list — offline tests need no network. */
export async function seedFeedSnapshot(entries: JobEntry[], lastRun: Snapshot["lastRun"] = null) {
  saveSnapshot({ entries, fetchedAt: new Date().toISOString(), lastRun })
}
