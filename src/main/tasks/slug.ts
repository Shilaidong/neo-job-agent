/** Folder names the consultant can recognise in Finder: keep CJK and letters, drop what file systems dislike. */
export function slugPart(value: string, max = 40) {
  const cleaned = value
    .normalize("NFKC")
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/[\x00-\x1f]/g, " ")
    .replace(/[.\s]+/g, " ")
    .trim()
    .replace(/\s/g, "-")
  return [...cleaned].slice(0, max).join("").replace(/-+$/g, "") || "未命名"
}

export const taskSlug = (company: string, jobTitle: string) => `${slugPart(company, 32)}_${slugPart(jobTitle, 40)}`

export const comparable = (value?: string) => (value ?? "").normalize("NFKC").trim().toLocaleLowerCase().replace(/\s+/g, " ")

type Application = { studentName: string; company: string; jobTitle: string }

/** Same student, company and job title = the same application; creating it again reopens it. */
export function sameApplication(a: Application, b: Application) {
  return comparable(a.studentName) === comparable(b.studentName) && comparable(a.company) === comparable(b.company) && comparable(a.jobTitle) === comparable(b.jobTitle)
}
