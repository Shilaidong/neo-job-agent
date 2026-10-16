import { describe, expect, test } from "bun:test"
import type { JevAnswers } from "../jev-core"
import { describeMiss, literalMatch, pickOption } from "./match"

const countries = ["Chile", "China, People's Republic of", "Korea, Democratic People's Republic of", "Korea, Republic of", "Taiwan (Province of China)"]
const says = (choice: string, confidence: number) => async (): Promise<JevAnswers> => ({ pick: { type: "choice", choice, confidence, probabilities: { [choice]: confidence, o0: (1 - confidence) / 2, o4: (1 - confidence) / 2 } } })

describe("literalMatch", () => {
  test("exact text beats everything, whatever the case and spacing", () => {
    expect(literalMatch("  chile ", countries)).toBe(0)
    expect(literalMatch("Zhejiang University", ["Zhejiang University of Technology", "Zhejiang University"])).toBe(1)
  })
  test("a looser match only counts when it is the only one", () => {
    expect(literalMatch("Taiwan", countries)).toBe(4)
    expect(literalMatch("Korea", countries)).toBeUndefined()
    // Only one option STARTS with "China"; that it also appears inside "Taiwan (Province of China)" does not matter.
    expect(literalMatch("China", countries)).toBe(1)
    expect(literalMatch("Republic", countries)).toBeUndefined()
    expect(literalMatch("", countries)).toBeUndefined()
  })
})

describe("pickOption", () => {
  test("letters settle it: Jev is not asked", async () => {
    let asked = 0
    const pick = await pickOption("Country", "Chile", countries, async () => (asked++, undefined))
    expect(pick).toEqual({ ok: true, index: 0, how: "literal" })
    expect(asked).toBe(0)
  })
  test("a confident Jev pick is taken", async () => {
    expect(await pickOption("Country", "中国", countries, says("o1", 0.99))).toMatchObject({ ok: true, index: 1, how: "jev" })
  })
  test("below 0.8 nothing is picked; the big model gets the leaning and the candidates", async () => {
    const pick = await pickOption("Country", "韩国", countries, says("o3", 0.67))
    expect(pick.ok).toBe(false)
    if (!pick.ok) {
      expect(pick.leaning).toEqual({ option: "Korea, Republic of", confidence: 0.67 })
      expect(pick.candidates[0]).toBe("Korea, Republic of")
      expect(describeMiss("韩国", countries.length, pick)).toContain("小模型倾向 “Korea, Republic of”")
    }
  })
  test("NONE, an option that does not exist, or no Jev at all: candidates only", async () => {
    expect((await pickOption("Country", "火星", countries, says("NONE", 0.95))).ok).toBe(false)
    expect((await pickOption("Country", "中国", countries, says("o99", 0.95))).ok).toBe(false)
    const alone = await pickOption("Country", "Korea", countries)
    expect(alone).toEqual({ ok: false, candidates: ["Korea, Democratic People's Republic of", "Korea, Republic of"] })
  })
})
