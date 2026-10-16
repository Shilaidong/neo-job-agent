import { describe, expect, test } from "bun:test"
import { addTokens, creditsFor, emptyTokens, normalizeTokens, subtractTokens, weightedTokens } from "./quota-math"

describe("quota math", () => {
  test("output counts four times, cache reads are free", () => {
    expect(weightedTokens({ input: 1000, output: 500, reasoning: 200, cache: { read: 90_000, write: 300 } })).toBe(1000 + 2000 + 200 + 300)
  })

  test("credits round up per 10k weighted tokens", () => {
    expect(creditsFor(emptyTokens())).toBe(0)
    expect(creditsFor({ ...emptyTokens(), input: 1 })).toBe(1)
    expect(creditsFor({ ...emptyTokens(), input: 10_000 })).toBe(1)
    expect(creditsFor({ ...emptyTokens(), input: 10_001 })).toBe(2)
  })

  test("normalize tolerates junk; add and subtract never go negative", () => {
    expect(normalizeTokens({ input: "12", output: -5, cache: { read: null } })).toEqual({ input: 12, output: 0, reasoning: 0, cache: { read: 0, write: 0 } })
    const a = normalizeTokens({ input: 10, output: 2, cache: { write: 5 } })
    const b = normalizeTokens({ input: 4, output: 9 })
    expect(addTokens(a, b).output).toBe(11)
    expect(subtractTokens(a, b)).toEqual({ input: 6, output: 0, reasoning: 0, cache: { read: 0, write: 5 } })
  })
})
