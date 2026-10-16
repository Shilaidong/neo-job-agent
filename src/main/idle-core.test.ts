import { expect, test } from "bun:test"
import { sleepGuardOn } from "./idle-core"

// 2026-10-07, after the consultant's machine locked mid-form: the guard follows the screen, nothing else.
test("the guard is on while a task screen is open", () => {
  expect(sleepGuardOn("task", false)).toBe(true)
})

test("the guard is off on the task list / home — the machine's idle rules resume", () => {
  expect(sleepGuardOn("home", false)).toBe(false)
})

test("a smoke run never touches the machine's power state", () => {
  expect(sleepGuardOn("task", true)).toBe(false)
})
