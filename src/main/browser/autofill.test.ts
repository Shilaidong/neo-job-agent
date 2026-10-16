import { describe, expect, test } from "bun:test"
import type { JevAnswers } from "../jev-core"
import { decideMappings, mappingQuestions, offeredKeys, type FieldEvidence } from "./autofill"

const vocabulary = { "name.family": "Family name", "name.given": "Given name", "email.primary": "E-mail", "education[i].gpa": "Education #i: GPA" }
const profile = { "name.family": "LIN", "name.given": "YU-CHEN", "email.primary": "a@example.com", "education[0].gpa": "3.53", "education[1].gpa": "", "extra.ceeb_code": "694321" }
const fields: FieldEvidence[] = [
  { ref: "e1", kind: "text", label: "Surname" },
  { ref: "e2", kind: "text", label: "Given name", hint: "e.g. John" },
  { ref: "e3", kind: "text", label: "E-mail" },
  { ref: "e4", kind: "text", label: "Confirm e-mail" },
]
const pick = (choice: string, confidence = 0.95) => ({ type: "choice" as const, choice, confidence, probabilities: { [choice]: confidence } })

describe("seating a page against the answer bank", () => {
  test("only entries the profile really has are offered; indexed ones are spelled out; extras get a readable name", () => {
    const keys = offeredKeys(profile, vocabulary)
    expect(Object.keys(keys)).toEqual(["name.family", "name.given", "email.primary", "education[0].gpa", "extra.ceeb_code"])
    expect(keys["education[0].gpa"]).toBe("Education #1 (most recent): GPA")
    expect(keys["extra.ceeb_code"]).toBe("ceeb code")
  })
  test("one question per field, every question offers the same entries plus SKIP / THINK / HUMAN — and never a value", () => {
    const { state, questions } = mappingQuestions(fields, offeredKeys(profile, vocabulary))
    expect(Object.keys(questions)).toEqual(["f0", "f1", "f2", "f3"])
    expect(Object.keys((questions.f0 as any).criteria)).toEqual(["name.family", "name.given", "email.primary", "education[0].gpa", "extra.ceeb_code", "SKIP", "THINK", "HUMAN"])
    const sent = JSON.stringify([state, questions])
    expect(sent).not.toContain("YU-CHEN")
    expect(sent).not.toContain("a@example.com")
    expect(sent).toContain("an example, not data")
  })
  test("confident seats are filled with the bank's value verbatim; the rest goes to the big model with the leaning", () => {
    const answers: JevAnswers = { f0: pick("name.family"), f1: pick("name.given", 0.64), f2: pick("email.primary"), f3: pick("email.primary") }
    const m = decideMappings(fields, answers, profile)
    expect(m[0]).toMatchObject({ decision: "fill", key: "name.family", value: "LIN" })
    expect(m[1]).toMatchObject({ decision: "think", leaning: "name.given" })
    // "Confirm e-mail" may share the e-mail entry.
    expect(m[2]).toMatchObject({ decision: "fill", value: "a@example.com" })
    expect(m[3]).toMatchObject({ decision: "fill", value: "a@example.com" })
  })
  test("one entry in two ordinary boxes is how a surname lands in the given-name field: both go to the big model", () => {
    const answers: JevAnswers = { f0: pick("name.family"), f1: pick("name.family"), f2: pick("SKIP"), f3: pick("HUMAN") }
    const m = decideMappings(fields, answers, profile)
    expect(m[0]).toMatchObject({ decision: "think", leaning: "name.family" })
    expect(m[1]).toMatchObject({ decision: "think", leaning: "name.family" })
    expect(m[2].decision).toBe("skip")
    expect(m[3].decision).toBe("human")
  })
  test("no Jev, or a key it made up: everything is the big model's", () => {
    expect(decideMappings(fields, undefined, profile).every((m) => m.decision === "think")).toBe(true)
    expect(decideMappings(fields.slice(0, 1), { f0: pick("name.nickname") }, profile)[0].decision).toBe("think")
  })
})
