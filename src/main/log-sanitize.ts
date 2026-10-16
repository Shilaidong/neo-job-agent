const MAX_STRING = 2_000
// `tokens` (usage counts) is not a secret; `accessToken` / `refresh_token` / `token` are.
const SECRET_KEY = /pass(word)?|secret|authorization|api[-_]?key|anon[-_]?key|cookie|credential|(^|[a-z_-])token$/i

/**
 * Links carry secrets too: a magic login link is a password in a URL. Keep what helps debugging (host, path,
 * parameter NAMES) and drop the values, the fragment's values and any long random-looking path segment.
 */
export function maskUrls(text: string) {
  return text.replace(/\bhttps?:\/\/[^\s"'<>）)】]+/g, (url) => {
    const [beforeHash, hash] = url.split(/#(.*)/s)
    const [base, query] = beforeHash.split(/\?(.*)/s)
    const maskPairs = (part: string) => part.replace(/=([^&;]+)/g, "=…")
    const path = base.replace(/\/([A-Za-z0-9_\-.~%]{24,})(?=\/|$)/g, (segment, token: string) => (/\d/.test(token) && /[A-Za-z]/.test(token) && !/\.[a-z]{2,5}$/i.test(token) ? "/…" : segment))
    return path + (query ? `?${maskPairs(query)}` : "") + (hash ? `#${hash.includes("=") ? maskPairs(hash) : hash.length > 24 ? "…" : hash}` : "")
  })
}

/**
 * For the browser tools' START line specifically: whatever text the model sends toward the page or
 * toward the outside world is input data — usually fine, but one of those boxes may be one the
 * consultant typed in CHAT instead of on the PAGE, or a search query carrying a student's name and
 * passport number (2026-10-10 and the web.ts promise that "the query never reaches the log" — the
 * tool-entry line was quietly breaking it, review P2-1 2026-10-11). Coordinates, refs and counts
 * stay; anything that IS the data goes.
 */
const FREE_TEXT_KEYS = new Set(["value", "text", "query", "want", "promptText"])
const TEXT_ARRAY_KEYS = new Set(["values"])
export function scrubFillValues(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(scrubFillValues)
  if (value === null || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value).map(([k, v]) => {
      if (FREE_TEXT_KEYS.has(k)) return [k, typeof v === "string" ? "[omitted]" : v]
      if (TEXT_ARRAY_KEYS.has(k) && Array.isArray(v)) return [k, v.map((item) => (typeof item === "string" ? "[omitted]" : scrubFillValues(item)))]
      return [k, scrubFillValues(v)]
    }),
  )
}

/** Values safe to put in a log line: secrets masked, long strings clipped, errors flattened, cycles cut. */
export function sanitize(value: unknown, key = "", depth = 0, seen = new WeakSet<object>()): unknown {
  if (key && SECRET_KEY.test(key) && value !== undefined && value !== null && value !== "") return "[redacted]"
  if (typeof value === "string") {
    const text = value.includes("://") ? maskUrls(value) : value
    return text.length > MAX_STRING ? `${text.slice(0, MAX_STRING)}…(+${text.length - MAX_STRING})` : text
  }
  if (typeof value === "bigint") return String(value)
  if (typeof value === "function") return undefined
  if (value === null || typeof value !== "object") return value
  if (value instanceof Error) return { name: value.name, message: value.message, stack: value.stack?.split("\n").slice(0, 8).join("\n") }
  if (seen.has(value)) return "[circular]"
  if (depth >= 5) return "[deep]"
  seen.add(value)
  if (Array.isArray(value)) {
    const head = value.slice(0, 30).map((item) => sanitize(item, key, depth + 1, seen))
    return value.length > 30 ? [...head, `…(+${value.length - 30})`] : head
  }
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitize(v, k, depth + 1, seen)]))
}

