import { createHash } from "node:crypto"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname } from "node:path"

/**
 * Jev answers multiple-choice questions in about half a second. It cannot write a word — so the big
 * model still decides WHAT goes into a field, and Jev settles the small "which one?" questions a tool
 * runs into on the way (which option means 中国, which button closes this banner). See docs/BROWSER.md.
 *
 * This file is the part that has no Electron in it, so it can be unit-tested.
 */
export type JevQuestion =
  | { type: "choice"; instructions: string; criteria: Record<string, string> }
  | { type: "boolean"; instructions: string; criteria?: { true: string; false: string } }

export type JevAnswer =
  | { type: "choice"; choice: string; confidence: number; probabilities: Record<string, number> }
  | { type: "boolean"; probability: number }

export type JevAnswers = Record<string, JevAnswer>

/** Does the actual asking. Throws on any failure; an error with `statusCode: 429` means "rate limited". */
export type JevBackend = (state: unknown, questions: Record<string, JevQuestion>, signal: AbortSignal) => Promise<JevAnswers>

type MiniLog = { info: (msg: string, data?: Record<string, unknown>) => void; warn: (msg: string, data?: Record<string, unknown>) => void }

/** At or above this, a tool acts on Jev's pick. Below it, the candidates go back to the big model. */
export const CONFIDENT = 0.8

export const isConfident = (answer: JevAnswer | undefined): answer is Extract<JevAnswer, { type: "choice" }> =>
  answer?.type === "choice" && answer.confidence >= CONFIDENT

const RATE_LIMIT_PAUSE_MS = 60_000
const FAILURES_BEFORE_PAUSE = 3

export function createJev(options: { backend: () => JevBackend | undefined; log: MiniLog; timeoutMs?: number; now?: () => number }) {
  const now = options.now ?? Date.now
  let pausedUntil = 0
  let failures = 0
  let saidUnavailable = false

  /**
   * Ask several questions about one piece of state in a single round trip.
   * Returns `undefined` whenever Jev cannot answer right now — the caller then does whatever it did
   * before Jev existed. Jev is an accelerator, never a dependency.
   */
  async function ask(state: unknown, questions: Record<string, JevQuestion>, cacheFile?: string): Promise<JevAnswers | undefined> {
    const ids = Object.keys(questions)
    if (!ids.length) return {}
    const backend = options.backend()
    if (!backend) {
      if (!saidUnavailable) options.log.info("unavailable: no key configured, tools fall back to the big model")
      saidUnavailable = true
      return undefined
    }

    const cache = cacheFile ? await readCache(cacheFile) : {}
    const keyOf = (id: string) => createHash("sha1").update(JSON.stringify([state, questions[id]])).digest("hex")
    const answers: JevAnswers = {}
    const missing: Record<string, JevQuestion> = {}
    for (const id of ids) {
      const hit = cache[keyOf(id)]
      if (hit) answers[id] = hit
      else missing[id] = questions[id]
    }
    const cached = ids.length - Object.keys(missing).length
    if (!Object.keys(missing).length) {
      options.log.info("ask ok", { questions: ids.length, cached, ms: 0, picks: describe(answers) })
      return answers
    }

    if (now() < pausedUntil) return undefined
    const started = now()
    try {
      const fresh = await inBatches(backend, state, missing, options.timeoutMs ?? 3_000)
      failures = 0
      for (const id of Object.keys(missing)) {
        if (!fresh[id]) throw new Error(`no answer for question ${id}`)
        answers[id] = fresh[id]
        cache[keyOf(id)] = fresh[id]
      }
      if (cacheFile) await writeCache(cacheFile, cache)
      options.log.info("ask ok", { questions: ids.length, cached, ms: now() - started, picks: describe(answers) })
      return answers
    } catch (error) {
      const limited = (error as { statusCode?: number })?.statusCode === 429
      failures += 1
      // Free tier lets ~5 calls through per 5 minutes. Do not make every field of a form wait for a refusal.
      if (limited || failures >= FAILURES_BEFORE_PAUSE) pausedUntil = now() + RATE_LIMIT_PAUSE_MS
      options.log.warn(limited ? "rate limited, pausing" : "ask failed", {
        questions: ids.length,
        ms: now() - started,
        pausedMs: pausedUntil > now() ? pausedUntil - now() : 0,
        reason: error instanceof Error ? error.message.slice(0, 200) : String(error).slice(0, 200),
      })
      return undefined
    }
  }

  return { ask }
}

/**
 * One request has a size limit (a whole page of fields × a hundred answer-bank keys goes over it), so a big set of
 * questions travels as several requests side by side. A batch that is still refused for its size is halved once more.
 */
const BATCH_BYTES = 60_000

async function inBatches(backend: JevBackend, state: unknown, questions: Record<string, JevQuestion>, timeoutMs: number): Promise<JevAnswers> {
  const batches: Record<string, JevQuestion>[] = [{}]
  let size = 0
  for (const [id, q] of Object.entries(questions)) {
    const bytes = JSON.stringify(q).length
    if (size + bytes > BATCH_BYTES && Object.keys(batches[batches.length - 1]).length) (batches.push({}), (size = 0))
    batches[batches.length - 1][id] = q
    size += bytes
  }
  const send = async (batch: Record<string, JevQuestion>): Promise<JevAnswers> => {
    try {
      return await backend(state, batch, AbortSignal.timeout(timeoutMs))
    } catch (error) {
      const ids = Object.keys(batch)
      if ((error as { tooLarge?: boolean })?.tooLarge !== true || ids.length < 2) throw error
      const half = Math.ceil(ids.length / 2)
      const parts = await Promise.all([ids.slice(0, half), ids.slice(half)].map((part) => send(Object.fromEntries(part.map((id) => [id, batch[id]])))))
      return Object.assign({}, ...parts)
    }
  }
  return Object.assign({}, ...(await Promise.all(batches.map(send))))
}

/** Jev is an "evaluation" model: reachable only through the AI SDK's evaluate(), not the OpenAI-style endpoints. */
export function gatewayBackend(apiKey: () => string | undefined, model = "typesafe-ai/jev"): JevBackend {
  return async (state, questions, signal) => {
    const [{ experimental_evaluate: evaluate }, { createGateway }] = await Promise.all([import("ai"), import("@ai-sdk/gateway")])
    const result = await evaluate({ model: createGateway({ apiKey: apiKey() }).evaluationModel(model), state: state as never, questions, maxRetries: 0, abortSignal: signal })
    const answers: JevAnswers = {}
    for (const [id, raw] of Object.entries(result.answers as Record<string, any>)) {
      if (raw.type === "choice") {
        const probabilities: Record<string, number> = raw.probabilities ?? { [raw.choice]: 1 }
        answers[id] = { type: "choice", choice: raw.choice, confidence: probabilities[raw.choice] ?? 0, probabilities }
      } else if (raw.type === "boolean") answers[id] = { type: "boolean", probability: raw.probability }
    }
    return answers
  }
}

/**
 * TypeSafe's own endpoint. About 0.3 s a round trip once the connection is warm — a third of the
 * gateway's — which is what makes a step-by-step loop (browser_do) worth having.
 */
/** `url` is the door to knock on — the official one by default, another `…/v1/systemone` when a LAN cluster serves the same spec (2026-10-08). `model`/`url` may be getters, read when the request is built. */
export function typesafeBackend(apiKey: () => string | undefined, model: string | (() => string) = "jev-latest", url: string | (() => string) = "https://api.typesafe.ai/v1/systemone"): JevBackend {
  return async (state, questions, signal) => {
    const body = {
      model: typeof model === "function" ? model() : model,
      state,
      // Their name for a yes/no question is "noul".
      questions: Object.fromEntries(Object.entries(questions).map(([id, q]) => [id, q.type === "boolean" ? { type: "noul", instructions: q.instructions } : q])),
    }
    const response = await fetch(typeof url === "function" ? url() : url, {
      method: "POST",
      redirect: "error",
      signal,
      headers: { ...(apiKey() ? { Authorization: `Bearer ${apiKey()}` } : {}), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      const detail = (await response.text().catch(() => "")).slice(0, 160)
      throw Object.assign(new Error(`TypeSafe HTTP ${response.status} ${detail}`), { statusCode: response.status, tooLarge: /max_tokens|too large|too long/i.test(detail) || response.status === 413 })
    }
    const result = (await response.json()) as { answers?: Record<string, any> }
    const answers: JevAnswers = {}
    for (const [id, raw] of Object.entries(result.answers ?? {})) {
      if (raw?.type === "choice" && typeof raw.choice === "string") {
        const probabilities: Record<string, number> = raw.probabilities ?? { [raw.choice]: 1 }
        answers[id] = { type: "choice", choice: raw.choice, confidence: probabilities[raw.choice] ?? 0, probabilities }
      } else if (raw?.type === "noul" && typeof raw.noul === "number") answers[id] = { type: "boolean", probability: raw.noul }
    }
    return answers
  }
}

function describe(answers: JevAnswers) {
  return Object.fromEntries(
    Object.entries(answers).map(([id, a]) => [id, a.type === "choice" ? `${a.choice} ${a.confidence.toFixed(2)}` : a.probability.toFixed(2)]),
  )
}

async function readCache(file: string): Promise<Record<string, JevAnswer>> {
  try {
    return JSON.parse(await readFile(file, "utf8"))
  } catch {
    return {}
  }
}

async function writeCache(file: string, cache: Record<string, JevAnswer>) {
  try {
    await mkdir(dirname(file), { recursive: true })
    await writeFile(file, JSON.stringify(cache))
  } catch {
    // the cache only saves time
  }
}

/**
 * Stand-in for self-checks (`NEO_JEV=fake`): no network, deterministic. Picks the option whose text
 * shares the most words with the state. Good enough for "china" → "China"; a self-check that needs
 * real judgement ("中国" → "China, People's Republic of") installs its own scripted backend.
 */
export const fakeJev: JevBackend = async (state, questions) => {
  const words = (value: unknown) => new Set(JSON.stringify(value ?? "").toLowerCase().match(/[a-z0-9]+|\p{Script=Han}/gu) ?? [])
  const have = words(state)
  const answers: JevAnswers = {}
  for (const [id, q] of Object.entries(questions)) {
    if (q.type === "boolean") {
      answers[id] = { type: "boolean", probability: 0.5 }
      continue
    }
    const scored = Object.entries(q.criteria).map(([key, text]) => {
      const mine = words(text)
      const shared = [...mine].filter((w) => have.has(w)).length
      return { key, score: mine.size ? shared / mine.size : 0 }
    })
    scored.sort((a, b) => b.score - a.score)
    const [best, second] = scored
    const confidence = best.score === 0 ? 1 / scored.length : second && second.score === best.score ? 0.5 : 0.95
    const rest = scored.length > 1 ? (1 - confidence) / (scored.length - 1) : 0
    answers[id] = { type: "choice", choice: best.key, confidence, probabilities: Object.fromEntries(scored.map((s) => [s.key, s === best ? confidence : rest])) }
  }
  return answers
}
