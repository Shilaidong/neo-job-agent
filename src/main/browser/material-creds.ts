/**
 * Where does browser_login's password come from now? The student's own materials (2026-10-10 user call:
 * 「自动识别材料中记录的密码」). The consultant keeps an account notes file or a login page dump in the
 * workspace; the software walks those files itself, matches by platform name, and types the value in
 * without the record ever passing through the model. What the model sees is only the outcome: used / not
 * found / multiple records and I refuse to guess.
 *
 * This module is pure path-and-text logic (no browser, no keychain) so the rules get unit-tested.
 */
import { readdir, readFile, stat } from "node:fs/promises"
import { join } from "node:path"

/** One place a password was written down, with what the software could attribute it to. */
export type CredentialCandidate = {
  password: string
  username?: string
  file: string
  line: number
  /** True when a line mentioning the target site sits within the block above the password. */
  matched: boolean
}

export type CredentialScan =
  /**
   * loose: used the only candidate, but the record never named this site — no attribution, just the
   * folder holding one password. The caller must not cache it into the platform store as if confirmed,
   * and the login note must tell the model it's a guess (2026-10-10 review P1-2).
   */
  | { kind: "found"; cred: CredentialCandidate; loose?: boolean }
  /** redacted: the site is named right next to a password line — but the text version had the value blanked (materials/redact.ts). Not "no record"; "record, password withheld". (2026-10-11 review P1-1.) */
  | { kind: "none"; redacted?: boolean }
  | { kind: "ambiguous"; files: string[] }

const PASSWORD_LABEL = /(?:密码|口令|password|pwd)/i
const USERNAME_LABEL = /(?:账号|帐号|用户名|邮箱|email|username|account|user)/i
/** Masked characters: "****" is a redaction, not a password. */
const MASKED = /[*＊]/
/** What materials/redact.ts stamps in place of a value: "密码：［已隐去］". It is never the password. */
const REDACTED_MARK = /已隐去|已打码/
/** Words that mean "nothing written here" — note placeholders, never values (review P1-3). */
const PLACEHOLDER_WORDS = /^(?:none|null|na|n\/a|tbd|todo|placeholder|unknown|见|未知|无|暂无|待定)$/i

/** Material records sometimes wrap a value in a shell: （见资料）【N/A】 — strip it before judging. */
function cleanCredentialValue(raw: string): string {
  return raw.replace(/^[（(【\[]+/, "").replace(/[）)】\]]+$/, "").trim()
}

/**
 * Blank, masked, placeholder-word, bare-digits ("2024" is a year, "13800138000" is a phone),
 * or shorter than 4 — none of those is a password, whatever sits behind the label.
 */
function valueLooksLikePassword(value: string): boolean {
  const v = cleanCredentialValue(value)
  if (!v || v.length < 4 || MASKED.test(v) || REDACTED_MARK.test(v)) return false
  if (PLACEHOLDER_WORDS.test(v)) return false
  if (/^见/.test(v)) return false // pointer notes: 见资料库、见那份 PDF — a signpost, not the value (old BAD_VALUE caught this too)
  if (/^\d+$/.test(v)) return false
  return true
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

/**
 * Words a material record might use for this platform: "commonapp", "common app", "ucas",
 * "applyweb"… Generic labels (www/apply/accounts/login/subdomains and TLD fragments) drop out;
 * a bare hostname stays as the last resort.
 */
export function hostKeywords(url: string): string[] {
  let host: string
  try {
    host = new URL(url).hostname.toLowerCase()
  } catch {
    return []
  }
  const generic = new Set(["www", "app", "apps", "apply", "applicant", "application", "accounts", "account", "login", "signin", "secure", "portal", "my", "com", "org", "net", "edu", "gov", "ac", "co", "io", "uk", "us", "cn", "sg", "au", "ca", "nz", "hk", "tw", "jp", "kr", "in", "br", "de", "fr", "it", "es", "nl", "se", "no", "dk", "fi", "ch", "at", "be", "pt", "pl", "admission", "admissions", "test", "tests", "student", "students", "college", "university", "univ", "start", "sso"])
  const labels = host.split(".").filter((p) => p && !generic.has(p))
  const keywords = new Set<string>(labels)
  // "commonapp" also matches "common app" — split every label on the lowercase/uppercase boundary and digits.
  for (const l of labels) {
    const split = l.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase()
    if (split.includes(" ")) keywords.add(split)
    keywords.add(split)
  }
  // Short site names (ntu, lse, mit) stay as keywords — the matching side requires whole-word for them,
  // so dropping them here would make every 3-letter university portal invisible to the scan (P1-3).
  return [...keywords]
}

/**
 * One text of materials, scanned line by line. The block above a password line (up to 6 lines) decides
 * attribution: any keyword inside it marks the candidate as `matched`.
 */
/**
 * Attribution for the block above the line (up to 6 lines): long keywords (4+) substring the
 * punctuation-stripped window — that keeps "common app" ↔ "commonapp" — while short ones (ntu, lse)
 * count as whole words only. The word edge is ASCII-alphanumeric on purpose: a Chinese character
 * touching "LSE申请账号" separates the word instead of hiding it (2026-10-11 review P2-3).
 */
function windowMatched(lines: string[], i: number, kw: string[]): boolean {
  const rawWindow = lines.slice(Math.max(0, i - 6), i + 1).join("\n").toLowerCase()
  const flatWindow = rawWindow.replace(/[^\p{L}\p{N}]/gu, "")
  return kw.some((k) => {
    const flat = k.replace(/[^\p{L}\p{N}]/gu, "") // "common app" → "commonapp", spaces normalized out either way
    if (flat.length >= 4) return flatWindow.includes(flat)
    return new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(flat)}(?:[^a-z0-9]|$)`).test(rawWindow)
  })
}

/**
 * A line where materials/redact.ts blanked the value: label + marker + attribution means this site IS
 * recorded, its password is just withheld from the text version. Not "nothing found".
 */
function hasRedactedCredential(text: string, kw: string[]): boolean {
  const lines = text.split(/\r?\n/)
  return lines.some((line, i) => new RegExp(`(?:${PASSWORD_LABEL.source})["']?\\s*[:：=]`, "i").test(line) && REDACTED_MARK.test(line) && windowMatched(lines, i, kw))
}

export function findCredentialLines(text: string, keywords: string[], fileLabel: string): CredentialCandidate[] {
  const lines = text.split(/\r?\n/)
  const out: CredentialCandidate[] = []
  const kw = keywords.map((k) => k.toLowerCase())
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(new RegExp(`(?:${PASSWORD_LABEL.source})["']?\\s*[:：=]\\s*["']?([^"'，。；：\\s]+)`, "i"))
    const value = m?.[1] ? cleanCredentialValue(m[1]) : undefined
    if (!value || !valueLooksLikePassword(value)) continue
    const matched = windowMatched(lines, i, kw)
    let username: string | undefined
    for (let j = i - 1; j >= Math.max(0, i - 2); j--) {
      const u = lines[j].match(new RegExp(`(?:${USERNAME_LABEL.source})["']?\\s*[:：=]\\s*["']?([^"'，。；：\\s]+)`, "i"))?.[1]
      if (u && !MASKED.test(u) && !PLACEHOLDER_WORDS.test(cleanCredentialValue(u))) {
        username = cleanCredentialValue(u)
        break
      }
    }
    out.push({ password: value, username, file: fileLabel, line: i + 1, matched })
  }
  return out
}

/**
 * found > ambiguous > none, per the doc header. Ambiguity is a stop, not a pick.
 * Unattributed lines: a single record with no site named is taken at face value (the whole folder holds
 * one password — it has to be this platform's), but flagged `loose`: nothing here says so, and if this
 * guess gets rejected once the folder clearly does NOT hold one password for everything.
 * Two or more that name nothing are just "this site wasn't found" — the other lines belong to other
 * platforms we didn't scan for.
 */
export function decide(candidates: CredentialCandidate[]): CredentialScan {
  const confirmed = candidates.filter((c) => c.matched)
  const uniq = (cs: CredentialCandidate[]) => [...new Set(cs.map((c) => c.password))]
  if (uniq(confirmed).length > 1) return { kind: "ambiguous", files: uniqFiles(confirmed) }
  if (confirmed.length) return { kind: "found", cred: confirmed[0] }
  if (uniq(candidates).length === 1 && candidates.length) return { kind: "found", cred: candidates[0], loose: true }
  return { kind: "none" }
}

function uniqFiles(cs: CredentialCandidate[]): string[] {
  return [...new Set(cs.map((c) => c.file))]
}

/**
 * Walk the student's materials and look for this platform's password. Text sources: every extracted
 * material file plus the student's own json (answer bank / profile). Reads are whole-file — these are
 * consultant-sized documents, and this runs rarely (a login without a cached credential).
 */
export async function scanMaterialsForLogin(studentDir: string, applicationUrl: string): Promise<CredentialScan> {
  const keywords = hostKeywords(applicationUrl)
  if (!keywords.length) return { kind: "none" }
  const files: Array<{ path: string; label: string }> = []
  const textDir = join(studentDir, "materials_text")
  files.push(...(await walkMarkdown(textDir, "materials_text")))
  for (const name of ["student.json", "student_profile.json"]) {
    files.push({ path: join(studentDir, name), label: name })
  }
  const candidates: CredentialCandidate[] = []
  const kw = keywords.map((k) => k.toLowerCase())
  let sawRedacted = false
  for (const f of files) {
    let text: string
    try {
      const info = await stat(f.path)
      if (info.size > 4 * 1024 * 1024) continue
      text = await readFile(f.path, "utf8")
    } catch {
      continue
    }
    candidates.push(...findCredentialLines(text, keywords, f.label))
    if (!sawRedacted) sawRedacted = hasRedactedCredential(text, kw)
  }
  const scan = decide(candidates)
  // Nothing usable, but a redaction marker said "the password is here, withheld" — say exactly that (P1-1).
  if (scan.kind === "none" && sawRedacted) return { kind: "none", redacted: true }
  return scan
}

async function walkMarkdown(dir: string, label: string): Promise<Array<{ path: string; label: string }>> {
  const out: Array<{ path: string; label: string }> = []
  let entries: string[]
  try {
    entries = await readdir(dir)
  } catch {
    return out
  }
  for (const e of entries.sort()) {
    const path = join(dir, e)
    try {
      if ((await stat(path)).isDirectory()) {
        out.push(...(await walkMarkdown(path, `${label}/${e}`)))
      } else if (/\.(md|txt)$/i.test(e)) {
        out.push({ path, label: `${label}/${e}` })
      }
    } catch {
      /* raced away */
    }
  }
  return out
}
