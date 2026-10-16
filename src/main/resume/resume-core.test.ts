import { describe, expect, test } from "bun:test"
import { buildLatex, cap, esc, slugName, trackArg, type Profile } from "./resume-core"

const sample: Profile = {
  name: { given: "Haotian", family: "Chen" },
  contact: { city: "Hangzhou", phone: "+86 138 1234 5678", email: "haotian.chen@example.com", github: "https://github.com/haotian" },
  summary: "Undergraduate CS student targeting data science internships.",
  education: [
    { institution: "Zhejiang University", degree: "BSc", major: "Computer Science", start_date: "2023-09", end_date: "2027-06", gpa: "3.8/4.0", honours: ["Dean's List 2024"], courses: "Machine Learning, Statistics" },
  ],
  experience: [
    { company: "Ant Group", position: "Data Analyst Intern", city: "Hangzhou", start_date: "2025-06", end_date: "2025-09", bullets: ["Built dashboards, +40% reporting speed", "Ran A/B tests on 2,000+ users"] },
  ],
  project: [{ name: "Resume Parser", role: "Solo", time: "2026-01", bullets: ["Parsed 10k resumes with Python & SQL"] }],
  leadership: [{ name: "ACM Club", role: "President", organisation: "Zhejiang University", time: "2024-09 -- 2025-08", bullets: ["Grew membership by 30%"] }],
  skill: { technical: "Python, SQL, Tableau", languages: "English (IELTS 7.5)" },
}

describe("resume core", () => {
  test("builds a complete document with every section", () => {
    const tex = buildLatex(sample, { roles: [], roleKeywords: [], companies: [], locations: [], locationExclude: [], skills: [] }, "data")
    expect(tex).toContain("\\documentclass[a4paper,10pt]{article}")
    expect(tex).toContain("\\usepackage{charter}")
    expect(tex).toContain("Haotian Chen")
    expect(tex).toContain("\\section{Professional Experience}")
    expect(tex).toContain("Ant Group -- Data Analyst Intern")
    expect(tex).toContain("\\section{Academic Projects}")
    expect(tex).toContain("\\section{Education}")
    expect(tex).toContain("Zhejiang University")
    expect(tex).toContain("GPA 3.8/4.0")
    expect(tex).toContain("\\section{Leadership \\& Activities}") // present even if empty section is dropped
    expect(tex).toContain("\\section{Skills}")
    expect(tex).toContain("\\begin{document}")
    expect(tex).toContain("\\end{document}")
  })

  test("escapes LaTeX special characters from untrusted profile text", () => {
    const evil: Profile = { name: { given: "A&B C++", family: "D_1" }, contact: {}, experience: [{ company: "X", bullets: ["100% #1 $price^ {x} \\boom"] }] }
    const tex = buildLatex(evil, { roles: [], roleKeywords: [], companies: [], locations: [], locationExclude: [], skills: [] }, "general")
    expect(tex).toContain("A\\&B C++")
    expect(tex).toContain("100\\% \\#1 \\$price\\^ \\{x\\} \\\\boom")
    // no raw special char from the profile survives into the document
    expect(tex).not.toContain("A&B C++")
    expect(tex).not.toContain(" 100% ")
  })

  test("drops sections with no data and keeps a minimal document valid", () => {
    const tx = buildLatex({ name: { given: "A", family: "B" }, contact: {} }, { roles: [], roleKeywords: [], companies: [], locations: [], locationExclude: [], skills: [] }, "general")
    expect(tx).toContain("\\begin{document}")
    expect(tx).not.toContain("\\section{Professional Experience}")
    // \begin{itemize} unbalanced within the summary helper never appears alone
    expect((tx.match(/\\begin\{itemize\}/g) ?? []).length).toBe((tx.match(/\\end\{itemize\}/g) ?? []).length)
  })

  test("track and name helpers", () => {
    expect(trackArg("data")).toBe("data")
    expect(trackArg("nonsense")).toBe("general")
    expect(slugName(sample)).toBe("HaotianChen")
    expect(cap("data")).toBe("Data")
  })
})
