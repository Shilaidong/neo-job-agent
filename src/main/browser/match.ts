import { isConfident, type JevAnswers, type JevQuestion } from "../jev-core"
import { monthNumber } from "./dates"

/**
 * "The profile says 中国; which of these 65 options is that?" — first by the letters, and when the
 * letters do not settle it, by asking Jev. Below the 0.8 line nothing is picked: the caller hands
 * the candidates back to the big model. See docs/BROWSER.md.
 */
export type Ask = (state: unknown, questions: Record<string, JevQuestion>) => Promise<JevAnswers | undefined>

export type Pick =
  | { ok: true; index: number; how: "literal" | "jev"; confidence?: number }
  | { ok: false; candidates: string[]; leaning?: { option: string; confidence: number } }

const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase()

/** Exact text wins. A looser rule only counts when it points at exactly one option — "Korea" must not quietly become North Korea. */
export function literalMatch(want: string, options: string[]): number | undefined {
  const w = norm(want)
  if (!w) return undefined
  const texts = options.map(norm)
  const exact = texts.indexOf(w)
  if (exact >= 0) return exact
  // Day / month / year dropdowns: "05" is "5", and in a list of months "5" is "May" and "九月" is "September".
  if (/^\d+$/.test(w)) {
    const same = texts.flatMap((t, i) => (/^\d+$/.test(t) && Number(t) === Number(w) ? [i] : []))
    if (same.length === 1) return same[0]
  }
  const months = texts.map(monthNumber)
  if (months.filter((m) => m !== undefined).length >= 12 && monthNumber(w) !== undefined) {
    const same = months.flatMap((m, i) => (m === monthNumber(w) ? [i] : []))
    if (same.length === 1) return same[0]
  }
  for (const rule of [(t: string) => t.startsWith(w), (t: string) => t.includes(w)]) {
    const hits = texts.flatMap((t, i) => (rule(t) ? [i] : []))
    if (hits.length === 1) return hits[0]
    if (hits.length > 1) return undefined
  }
  return undefined
}

export async function pickOption(field: string, want: string, options: string[], ask?: Ask): Promise<Pick> {
  const literal = literalMatch(want, options)
  if (literal !== undefined) return { ok: true, index: literal, how: "literal" }

  const near = nearest(want, options)
  if (!ask || options.length < 2) return { ok: false, candidates: near }

  const criteria: Record<string, string> = Object.fromEntries(options.map((text, i) => [`o${i}`, text]))
  criteria.NONE = "None of the options means this; someone has to decide"
  const answers = await ask(
    { field, wanted: want },
    { pick: { type: "choice", instructions: "A form field must be set to `wanted`. Pick the option that means the same thing, in whatever language or wording it is written.", criteria } },
  )
  const answer = answers?.pick
  if (answer?.type !== "choice") return { ok: false, candidates: near }
  const index = answer.choice === "NONE" ? -1 : Number(answer.choice.slice(1))
  if (index >= 0 && index < options.length && isConfident(answer)) return { ok: true, index, how: "jev", confidence: answer.confidence }

  const ranked = Object.entries(answer.probabilities)
    .filter(([key]) => key !== "NONE")
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([key]) => options[Number(key.slice(1))])
    .filter(Boolean)
  const candidates = [...new Set([...ranked, ...near])].slice(0, 12)
  return { ok: false, candidates, leaning: index >= 0 ? { option: options[index], confidence: answer.confidence } : undefined }
}

function nearest(want: string, options: string[]) {
  const words = norm(want).split(" ").filter(Boolean)
  const near = options.filter((o) => words.some((w) => norm(o).includes(w)))
  return (near.length ? near : options).slice(0, 12)
}

/** What a tool says when nothing was picked: enough for the big model to decide in one more turn. */
export function describeMiss(want: string, total: number, pick: Extract<Pick, { ok: false }>) {
  const leaning = pick.leaning ? `小模型倾向 “${pick.leaning.option}”，但把握只有 ${pick.leaning.confidence.toFixed(2)}，没有替你选。` : ""
  return `没有和 “${want}” 对得上的选项（共 ${total} 个）。${leaning}相近的选项：${pick.candidates.join(" | ") || "无"}。请判断后用选项的原文再选一次；都不合适就记进待顾问清单（待顾问.md：哪一页、哪个格子、该填什么、试过什么），跳过它接着做别的——不要为这一格停下来问顾问。`
}
