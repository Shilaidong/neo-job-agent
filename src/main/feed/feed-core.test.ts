import { describe, expect, test } from "bun:test"
import { canonicalLocation, classifyJob, entryId, matchEntry, normalizeEntry, parseRss } from "./feed-core"
import type { JobEntry, JobSource, JobTarget } from "../../shared/jobs"

const source: JobSource = { id: "s1", name: "LinkedIn（美国）", enabled: true, kind: "rss", url: "https://x", location: "United States" }

const entry = (patch: Partial<JobEntry> = {}): JobEntry => ({
  id: entryId("s1", "https://x/1"),
  source: "s1",
  title: "Data Science Intern",
  company: "Google",
  location: "New York, US",
  url: "https://x/1",
  description: "Work on ML models with Python and SQL intern friendly.",
  tags: [],
  internship: true,
  fullTime: false,
  fetchedAt: "2026-10-17T00:00:00.000Z",
  ...patch,
})

const target = (patch: Partial<JobTarget> = {}): JobTarget => ({
  roles: ["数据科学实习"],
  roleKeywords: ["data science", "machine learning", "data analyst"],
  companies: ["Google"],
  locations: ["new york", "remote"],
  locationExclude: ["beijing"],
  internshipsOnly: true,
  skills: ["python", "sql"],
  ...patch,
})

describe("feed core", () => {
  test("entry id is stable across runs and distinct per url", () => {
    expect(entryId("s1", "https://a")).toBe(entryId("s1", "https://a"))
    expect(entryId("s1", "https://a")).not.toBe(entryId("s1", "https://b"))
    expect(entryId("s1", "https://a")).not.toBe(entryId("s2", "https://a"))
  })

  test("rss items parse with entities decoded; html is stripped at normalisation", () => {
    const xml = `<?xml version="1.0"?>
    <rss><channel><title>Jobs</title>
      <item><title>Data Engineer &amp; Intern</title><link>https://x/1</link><description><![CDATA[<b>We</b> need &quot;help&quot; <br/> in US.]]></description><pubDate>Tue, 05 Nov 2026 09:00:00 GMT</pubDate></item>
      <item><title>Other</title><description>no link</description></item>
    </channel></rss>`
    const items = parseRss(xml)
    expect(items).toHaveLength(2)
    expect(items[0].title).toBe("Data Engineer & Intern")
    expect(items[0].link).toBe("https://x/1")
    // entities decoded, html left in place for the normaliser
    expect(items[0].description).toContain('need "help"')
    expect(items[0].description).toContain("<b>")
    expect(items[0].pubDate).toContain("2026")
    const norm = normalizeEntry(source, { title: items[0].title, link: items[0].link, description: items[0].description })
    expect(norm.description).toContain('We need "help" in US.')
    expect(norm.description).not.toContain("<b>")
  })

  test("classification catches internships, full-time and remote", () => {
    expect(classifyJob("Software Engineering Intern", "").internship).toBe(true)
    expect(classifyJob("Data Analyst", "full-time position").fullTime).toBe(true)
    expect(classifyJob("Engineer", "Remote anywhere").remote).toBe(true)
    expect(classifyJob("Director", "").internship).toBe(false)
  })

  test("company falls back to the ' at ' in an RSS title", () => {
    expect(normalizeEntry(source, { title: "Machine Learning Intern at ByteDance", link: "https://x/a", description: "intern" }).company).toBe("ByteDance")
    expect(normalizeEntry({ ...source, kind: "greenhouse", name: "Airbnb" }, { title: "SWE", link: "https://x/b", description: "" }).company).toBe("Airbnb")
  })

  test("canonical location maps free text to markets", () => {
    expect(canonicalLocation("New York, NY, US")).toEqual(["United States", "New York"])
    expect(canonicalLocation("Remote")).toContain("Remote")
  })

  test("matching scores a hit and reports the reasons", () => {
    const m = matchEntry(entry(), target())
    expect(m.matched).toBe(true)
    expect(m.score).toBeGreaterThanOrEqual(35)
    expect(m.reasons.join(" ")).toContain("标题命中")
    expect(m.reasons.join(" ")).toContain("目标公司")
    expect(m.reasons.join(" ")).toContain("地点符合")
  })

  test("a non-internship posting is filtered when only internships are wanted", () => {
    const junior = entry({ internship: false, title: "Data Science Full-time", company: "Meta", location: "Boston", description: "full-time role" })
    const m = matchEntry(junior, target())
    expect(m.matched).toBe(false)
    expect(m.reasons.join(" ")).toContain("不是实习")
  })

  test("an excluded location kills the score no matter how well the rest fits", () => {
    const beijing = entry({ location: "Beijing, China" })
    const m = matchEntry(beijing, target())
    expect(m.matched).toBe(false)
    expect(m.reasons.join(" ")).toContain("排除地点")
  })

  test("an empty target never matches and does not crash", () => {
    const blank: JobTarget = { roles: [], roleKeywords: [], companies: [], locations: [], locationExclude: [], skills: [] }
    expect(matchEntry(entry(), blank).matched).toBe(false)
  })

  test("description-only keyword hits still match", () => {
    const desc = entry({ title: "Business Intern", description: "we use machine learning and data science heavily", internship: true })
    const m = matchEntry(desc, target())
    expect(m.matched).toBe(true)
    expect(m.reasons.join(" ")).toContain("描述命中")
  })
})
