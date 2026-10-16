import { describe, expect, test } from "bun:test"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { CONFIDENT, createJev, fakeJev, isConfident, typesafeBackend, type JevBackend, type JevQuestion } from "./jev-core"

const quiet = { info() {}, warn() {} }
const q: Record<string, JevQuestion> = { pick: { type: "choice", instructions: "pick", criteria: { o0: "China", o1: "Chile" } } }
const china: JevBackend = async () => ({ pick: { type: "choice", choice: "o0", confidence: 0.97, probabilities: { o0: 0.97, o1: 0.03 } } })

describe("askJev", () => {
  test("no backend (no key, or NEO_JEV=off) means undefined, not an error", async () => {
    const jev = createJev({ backend: () => undefined, log: quiet })
    expect(await jev.ask({ want: "中国" }, q)).toBeUndefined()
  })

  test("answers are cached per question and survive a restart", async () => {
    const dir = await mkdtemp(join(tmpdir(), "jev-"))
    const file = join(dir, ".cache", "jev.json")
    let calls = 0
    const counting: JevBackend = (...args) => (calls++, china(...args))
    expect((await createJev({ backend: () => counting, log: quiet }).ask({ want: "中国" }, q, file))?.pick).toMatchObject({ choice: "o0" })
    expect((await createJev({ backend: () => counting, log: quiet }).ask({ want: "中国" }, q, file))?.pick).toMatchObject({ choice: "o0" })
    expect(calls).toBe(1)
    await createJev({ backend: () => counting, log: quiet }).ask({ want: "智利" }, q, file)
    expect(calls).toBe(2)
    await rm(dir, { recursive: true, force: true })
  })

  test("a page too big for one request travels as several, and a refused batch is halved — every question still gets its answer", async () => {
    const keys = Object.fromEntries(Array.from({ length: 110 }, (_, i) => [`key.k${i}`, `Entry number ${i} of the answer bank, described at some length`]))
    const many: Record<string, JevQuestion> = Object.fromEntries(Array.from({ length: 38 }, (_, i) => [`f${i}`, { type: "choice", instructions: `field ${i}`, criteria: keys }]))
    const sizes: number[] = []
    const picky: JevBackend = async (_state, questions) => {
      sizes.push(Object.keys(questions).length)
      if (Object.keys(questions).length > 5) throw Object.assign(new Error("HTTP 400 max_tokens_exceeded"), { statusCode: 400, tooLarge: true })
      return Object.fromEntries(Object.keys(questions).map((id) => [id, { type: "choice", choice: "key.k1", confidence: 0.9, probabilities: { "key.k1": 0.9 } }]))
    }
    const answers = await createJev({ backend: () => picky, log: quiet }).ask({}, many)
    expect(Object.keys(answers ?? {}).length).toBe(38)
    expect(sizes[0]).toBeLessThan(38)
    expect(Math.max(...sizes.filter((n) => n <= 5))).toBeLessThanOrEqual(5)
  })

  test("a rate limit pauses asking instead of making every field wait for a refusal", async () => {
    let t = 0
    let calls = 0
    const limited: JevBackend = async () => {
      calls++
      throw Object.assign(new Error("rate limited"), { statusCode: 429 })
    }
    const jev = createJev({ backend: () => limited, log: quiet, now: () => t })
    expect(await jev.ask({}, q)).toBeUndefined()
    expect(await jev.ask({}, q)).toBeUndefined()
    expect(calls).toBe(1)
    t += 61_000
    await jev.ask({}, q)
    expect(calls).toBe(2)
  })

  test("a slow answer is abandoned", async () => {
    const slow: JevBackend = (_s, _q, signal) => new Promise((_, reject) => signal.addEventListener("abort", () => reject(new Error("timed out"))))
    const started = Date.now()
    expect(await createJev({ backend: () => slow, log: quiet, timeoutMs: 50 }).ask({}, q)).toBeUndefined()
    expect(Date.now() - started).toBeLessThan(1000)
  })

  test("a backend that skips a question counts as a failure", async () => {
    const jev = createJev({ backend: () => async () => ({}), log: quiet })
    expect(await jev.ask({}, q)).toBeUndefined()
  })
})

describe("the 0.8 line", () => {
  test("only a confident choice lets a tool act on its own", () => {
    expect(isConfident({ type: "choice", choice: "a", confidence: CONFIDENT, probabilities: {} })).toBe(true)
    expect(isConfident({ type: "choice", choice: "a", confidence: 0.67, probabilities: {} })).toBe(false)
    expect(isConfident(undefined)).toBe(false)
  })
})

describe("fake Jev for self-checks", () => {
  test("picks the literal match with confidence, and admits a tie", async () => {
    const signal = new AbortController().signal
    const sure = await fakeJev({ want: "china" }, q, signal)
    expect(sure.pick).toMatchObject({ choice: "o0", confidence: 0.95 })
    const unsure = await fakeJev({ want: "中国" }, q, signal)
    expect(isConfident(unsure.pick)).toBe(false)
  })
})

describe("typesafeBackend", () => {
  // bun tests run in one process: swap global fetch, watch the door it knocks, put it back.
  const withFetch = async (reply: unknown, run: (seen: { url: string; body: any; headers: Record<string, string> }[]) => Promise<void>) => {
    const real = globalThis.fetch
    const seen: { url: string; body: any; headers: Record<string, string> }[] = []
    globalThis.fetch = (async (input: any, init: any) => {
      seen.push({ url: String(input), body: JSON.parse(init.body), headers: init.headers })
      return { ok: true, json: async () => reply } as Response
    }) as typeof fetch
    try {
      await run(seen)
    } finally {
      globalThis.fetch = real
    }
  }

  test("the door is TypeSafe's own by default, and the cluster's /systemone when told so", async () => {
    const answers = { answers: { pick: { type: "choice", choice: "o0", probabilities: { o0: 0.97, o1: 0.03 } } } }
    await withFetch(answers, async (seen) => {
      const signal = new AbortController().signal
      await typesafeBackend(() => "k")({ want: "中国" }, q, signal)
      expect(seen.at(-1)!.url).toBe("https://api.typesafe.ai/v1/systemone")
      expect(seen.at(-1)!.body.model).toBe("jev-latest")
      expect(seen.at(-1)!.headers.Authorization).toBe("Bearer k")
      await typesafeBackend(() => undefined, () => "kev-latest", () => "http://10.0.0.109/v1/systemone")({ want: "中国" }, q, signal)
      expect(seen.at(-1)!.url).toBe("http://10.0.0.109/v1/systemone")
      expect(seen.at(-1)!.body.model).toBe("kev-latest")
      expect(seen.at(-1)!.headers.Authorization).toBeUndefined() // a server that does not ask gets no key sent
    })
  })

  test("the cluster's yes/no shape (noul) lands as a boolean answer", async () => {
    await withFetch({ answers: { kill: { type: "noul", noul: 0.4827 } } }, async () => {
      const got = await typesafeBackend(() => "k", "kev-latest", "http://10.0.0.163:8001/v1/systemone")({}, { kill: { type: "boolean", instructions: "断电吗" } }, new AbortController().signal)
      expect(got.kill).toEqual({ type: "boolean", probability: 0.4827 })
    })
  })
})
