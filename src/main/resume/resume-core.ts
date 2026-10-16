/** Pure LaTeX-from-profile builder — no Electron, snapshotted by unit tests. */
import { RESUME_TRACKS, type JobTarget, type ResumeTrack } from "../../shared/jobs"

export type Profile = Record<string, any>

export function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/[\\{}$&%#_^~]/g, (c) => `\\${c}`)
    .replace(/\r?\n+/g, " ")
    .trim()
}

function bullets(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((b) => esc(b)).filter(Boolean)
  if (typeof value === "string" && value.trim()) return value.split(/[；;。\n]/).map((b) => esc(b)).filter(Boolean)
  return []
}

function head(profile: Profile): string {
  const given = profile.name?.given ?? ""
  const family = profile.name?.family ?? ""
  const name = esc([given, family].filter(Boolean).join(" "))
  const city = esc(profile.contact?.city)
  const phone = esc(profile.contact?.phone)
  const email = esc(profile.contact?.email)
  const linkedin = profile.contact?.linkedin ? ` LinkedIn: ${esc(profile.contact.linkedin)}` : ""
  const github = profile.contact?.github ? ` GitHub: ${esc(profile.contact.github)}` : ""
  const site = profile.contact?.website ? ` ${esc(profile.contact.website)}` : ""
  const contacts = [city, phone, email].filter(Boolean).join(" | ")
  return [
    name ? `\\begin{center}` : "",
    name ? `  \\textbf{\\Huge \\scshape ${name}} \\\\` : "",
    contacts ? `  \\vspace{2pt} \\small {${contacts}${linkedin}${github}${site}}` : "",
    name ? `\\end{center}\\vspace{-4pt}` : "",
  ].filter(Boolean).join("\n")
}

function education(profile: Profile): string {
  const list = (profile.education ?? []) as any[]
  if (!list.length) return ""
  const rows = list
    .map((e) => {
      const name = esc(e.institution)
      const dates = esc(e.start_date ? `${e.start_date} -- ${e.end_date ? (e.end_date === "Present" ? "Present" : e.end_date) : ""}` : "")
      const degree = esc([e.degree, e.major].filter(Boolean).join(", "))
      const gpa = e.gpa ? esc(`GPA ${e.gpa}`) : ""
      const honours = bullets(e.honours)
      const courses = e.courses ? esc(e.courses) : ""
      return [
        `\\resumeSubheading{${name}}{${dates}}{${degree}}{${gpa}}`,
        ...honours.map((h) => `\\resumeItem{${h}}`),
        courses ? `\\resumeItem{Relevant coursework: ${courses}}` : "",
      ].filter(Boolean).join("\n")
    })
    .join("\n")
  return section("education", "Education", rows)
}

function experience(profile: Profile): string {
  const list = (profile.experience ?? []) as any[]
  if (!list.length) return ""
  const rows = list
    .map((e) => {
      const title = esc(e.position)
      const company = esc(e.company)
      const dates = esc(e.start_date ? `${e.start_date} -- ${e.end_date ? (e.end_date === "Present" ? "Present" : e.end_date) : ""}` : "")
      const location = esc(e.city)
      const b = bullets(e.bullets)
      return [
        `\\resumeSubheading{${company}${title ? ` -- ${title}` : ""}}{${location}${dates ? ` | ${dates}` : ""}}{}{}`,
        ...b.map((x) => `\\resumeItem{${x}}`),
      ].join("\n")
    })
    .join("\n")
  return section("professional", "Professional Experience", rows)
}

function projects(profile: Profile): string {
  const list = (profile.project ?? []) as any[]
  if (!list.length) return ""
  const rows = list
    .map((p) => {
      const name = esc(p.name)
      const time = esc(p.time)
      const role = esc(p.role)
      const b = bullets(p.bullets)
      return [
        `\\resumeSubheading{${name}${role ? ` -- ${role}` : ""}}{${time}}{}{}`,
        ...b.map((x) => `\\resumeItem{${x}}`),
      ].join("\n")
    })
    .join("\n")
  return section("projects", "Academic Projects", rows)
}

function leadership(profile: Profile): string {
  const list = (profile.leadership ?? []) as any[]
  if (!list.length) return ""
  const rows = list
    .map((l) => {
      const name = esc(l.name)
      const org = esc(l.organisation)
      const time = esc(l.time)
      const role = esc(l.role)
      const b = bullets(l.bullets)
      const heading = [name, org].filter(Boolean).join(" -- ")
      return [
        `\\resumeSubheading{${heading}${role ? ` -- ${role}` : ""}}{${time}}{}{}`,
        ...b.map((x) => `\\resumeItem{${x}}`),
      ].join("\n")
    })
    .join("\n")
  return section("leadership", "Leadership \\& Activities", rows)
}

function skills(profile: Profile): string {
  const tech = profile.skill?.technical ? esc(profile.skill.technical) : ""
  const langs = profile.skill?.languages ? esc(profile.skill.languages) : ""
  const lines = [tech ? `\\resumeItemWithTitle{Technical}{${tech}}` : "", langs ? `\\resumeItemWithTitle{Languages}{${langs}}` : ""].filter(Boolean)
  if (!lines.length) return ""
  return section("skills", "Skills", lines.join("\n"))
}

function summary(profile: Profile): string {
  const s = profile.summary ? esc(profile.summary) : ""
  if (!s) return ""
  return `\\begin{itemize}[leftmargin=0.15in, label={}]\n  \\resumeItem{${s}}\n\\end{itemize}\\vspace{-12pt}`
}

function section(kind: string, title: string, body: string): string {
  if (!body) return ""
  return `\\section{${title}}\n\\resumeSubHeadingListStart\n${body
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n")}\n\\resumeSubHeadingListEnd`
}

/** The full document for a student + track. */
export function buildLatex(profile: Profile, _target: JobTarget, _track: ResumeTrack): string {
  const summaryLine = summary(profile)
  const headLine = head(profile)
  const edu = education(profile)
  const exp = experience(profile)
  const proj = projects(profile)
  const lead = leadership(profile)
  const skill = skills(profile)

  const body = [headLine, summaryLine, exp, proj, edu, lead, skill].filter(Boolean).join("\n\n")

  return `% Created by Terra-Edu Neo Job Agent (resume_compile) — edit this file by hand or through the AI chat, then re-run resume_compile.
\\documentclass[a4paper,10pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[T1]{fontenc}
\\usepackage{charter}
\\usepackage[left=0.35in, right=0.35in, top=0.5in, bottom=0.35in]{geometry}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}
\\setlength{\\footskip}{8pt}

\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

\\titleformat{\\section}{
  \\vspace{-10pt}\\scshape\\raggedright\\large\\bfseries
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-6pt}]

\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeItemWithTitle}[2]{
  \\item\\small{
    \\textbf{#1}{: #2 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-1pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & \\textbf{#2} \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-4pt}
}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}\\vspace{-8pt}}

\\newcommand{\\resumeItemListStart}{\\begin{itemize}[leftmargin=0.15in, label={\\tiny$\\bullet$}, labelsep=3pt, itemsep=0pt, topsep=0pt, parsep=0pt]}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-4pt}}

\\begin{document}
\\flushbottom
\\vspace*{\\fill}

${body}

\\vspace*{\\fill}
\\end{document}
`
}

/** Western-order name, no spaces, for folder/file names. */
export function slugName(profile: Profile): string {
  const raw = [profile.name?.given, profile.name?.family].filter(Boolean).join(" ").replace(/\s+/g, "")
  return raw || "student"
}

export function trackArg(track: string): ResumeTrack {
  return (RESUME_TRACKS as readonly string[]).includes(track) ? (track as ResumeTrack) : "general"
}

export function cap(value: string): string {
  return value ? value[0].toUpperCase() + value.slice(1) : value
}
