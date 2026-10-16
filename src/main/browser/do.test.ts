import { describe, expect, test } from "bun:test"
import type { JevAnswers } from "../jev-core"
import { clickables, decide, doQuestions, scrubPageText } from "./do"

const snapshot = `页面：Programme
- main
  - heading "MSc FinTech" [level=1]
  - link "Apply now" [ref=e3]
  - button "Save" [ref=e4] [disabled]
  - textbox "Email" [ref=e5]
  - combobox "Country" [ref=e6]: China
  - tab "Contact Information" [ref=e7] [selected]
  - button "Highest degree Choose" [ref=e8] [下拉，用 fill_form / choose 选]`

const answer = (operation: string, op: number, target?: string, t = 0.95): JevAnswers => ({
  operation: { type: "choice", choice: operation, confidence: op, probabilities: { [operation]: op } },
  ...(target ? { click_target: { type: "choice", choice: target, confidence: t, probabilities: { [target]: t, e7: 1 - t } } } : {}),
})

describe("browser_do", () => {
  const elements = clickables(snapshot)
  test("offers what can be clicked — not text boxes, not dropdown values, not disabled buttons", () => {
    expect(elements.map((e) => e.ref)).toEqual(["e3", "e7", "e8"])
    expect(elements[1].flags).toBe("[selected]")
  })
  test("one request carries both questions; with nothing to click, only the first", () => {
    expect(Object.keys(doQuestions("reach the portal", elements))).toEqual(["operation", "click_target"])
    expect(Object.keys(doQuestions("reach the portal", []))).toEqual(["operation"])
    expect(Object.keys((doQuestions("x", []).operation as any).criteria)).not.toContain("CLICK")
  })
  test("a confident click, and the two ways of not being sure", () => {
    expect(decide(answer("CLICK", 0.97, "e3"), elements)).toMatchObject({ kind: "click", ref: "e3" })
    expect(decide(answer("CLICK", 0.97, "e3", 0.55), elements)).toMatchObject({ kind: "unsure", about: "target" }) // 0.55 vs 0.45: a coin toss
    expect(decide(answer("CLICK", 0.97, "e3", 0.69), elements)).toMatchObject({ kind: "click", ref: "e3" }) // 0.69 vs 0.31: clearly ahead
    // Leaning towards a click with a sure target is a click; the line is on the target and on DONE.
    expect(decide(answer("CLICK", 0.6, "e3"), elements)).toMatchObject({ kind: "click", ref: "e3" })
    expect(decide(answer("DONE", 0.7), elements)).toMatchObject({ kind: "unsure", about: "operation" })
    expect(decide(answer("BLOCKED", 0.4), elements)).toMatchObject({ kind: "unsure", about: "operation" })
    expect(decide(answer("CLICK", 0.97, "e99"), elements)).toMatchObject({ kind: "unsure", about: "target" })
  })
  test("done, blocked, wait; and no answer at all", () => {
    expect(decide(answer("DONE", 0.9), elements)).toMatchObject({ kind: "done" })
    expect(decide(answer("BLOCKED", 0.9), elements)).toMatchObject({ kind: "blocked" })
    expect(decide(answer("WAIT", 0.9), elements)).toMatchObject({ kind: "wait" })
    expect(decide(undefined, elements)).toBeUndefined()
  })
  test("page text goes out without e-mail addresses or long numbers", () => {
    expect(scrubPageText("Welcome  huang@163.com\npassport P352232518 year 2026")).toBe("Welcome # passport P# year #")
  })
})
