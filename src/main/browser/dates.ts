/**
 * The model always hands dates over as ISO (2003-05-17). Pages want them their own way; the way is
 * usually written right there in the placeholder or the label. Swapping day and month is the worst
 * mistake a form-filler can make quietly, so: convert only on a format the page states, and verify.
 */
const TOKEN = "d{1,2}|m{1,2}|y{4}|y{2}"
const FORMAT = new RegExp(`(?<![a-z])(${TOKEN})([/\\-. ])(${TOKEN})(?:\\2(${TOKEN}))?(?![a-z])`, "i")

/** "Date of birth (MM/DD/YYYY)" → "MM/DD/YYYY". Needs a year and no repeated part, or it is not a date format. */
export function detectDateFormat(hints: Array<string | null | undefined>): string | undefined {
  for (const hint of hints) {
    const m = hint ? FORMAT.exec(hint) : null
    if (!m) continue
    const parts = [m[1], m[3], m[4]].filter(Boolean).map((p) => p[0].toLowerCase())
    if (parts.includes("y") && new Set(parts).size === parts.length) return m[0]
  }
  return undefined
}

export function parseIso(value: string) {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(value.trim())
  if (!m) return undefined
  const [year, month, day] = [Number(m[1]), Number(m[2]), m[3] ? Number(m[3]) : undefined]
  if (month < 1 || month > 12 || (day !== undefined && (day < 1 || day > 31))) return undefined
  return { year, month, day }
}

/** Undefined when the format asks for a day the value does not have. */
export function formatDate(iso: string, format: string): string | undefined {
  const date = parseIso(iso)
  if (!date) return undefined
  let missing = false
  const out = format.replace(new RegExp(TOKEN, "gi"), (token) => {
    const kind = token[0].toLowerCase()
    if (kind === "y") return token.length === 2 ? String(date.year).slice(2) : String(date.year)
    const n = kind === "m" ? date.month : date.day
    if (n === undefined) return (missing = true), ""
    return token.length === 2 ? String(n).padStart(2, "0") : String(n)
  })
  return missing ? undefined : out
}

/** Masks add and drop separators as they please; the digits are what must agree. */
export const sameDigits = (a: string, b: string) => a.replace(/\D/g, "") === b.replace(/\D/g, "") && /\d/.test(a)

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]

/** 1–12 for "September", "Sep", "09", "9", "9月", "九月"; undefined for anything else. */
export function monthNumber(text: string): number | undefined {
  const t = text.trim().toLowerCase().replace(/\.$/, "")
  const numeric = /^(\d{1,2})\s*月?$/.exec(t) ?? /^(\d{1,2})\s*[-–(]/.exec(t)
  if (numeric) return Number(numeric[1]) >= 1 && Number(numeric[1]) <= 12 ? Number(numeric[1]) : undefined
  const zh = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"].indexOf(t.replace(/月$/, ""))
  if (zh >= 0) return zh + 1
  const en = MONTHS.findIndex((m) => t.length >= 3 && m.startsWith(t.slice(0, Math.max(3, Math.min(t.length, m.length)))) && (t === m || t === m.slice(0, 3) || t === m.slice(0, 4)))
  return en >= 0 ? en + 1 : undefined
}
