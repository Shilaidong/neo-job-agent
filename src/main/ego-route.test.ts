import { expect, test } from "bun:test"
import { egoMatches } from "./ego-route"

const HOSTS = ["ucas.com"]

test("the UCAS hosts go to ego", () => {
  expect(egoMatches("https://www.ucas.com/explore/search", HOSTS)).toBe(true)
  expect(egoMatches("https://accounts.ucas.com/signin", HOSTS)).toBe(true)
  expect(egoMatches("https://ucas.com/", HOSTS)).toBe(true)
})

test("everything else stays in the embedded view", () => {
  expect(egoMatches("https://www.ntu.edu.sg/admissions", HOSTS)).toBe(false)
  expect(egoMatches("https://notucas.com.evil.test/", HOSTS)).toBe(false) // suffix trick: not a subdomain
  expect(egoMatches("https://ucas.com.evil.test/", HOSTS)).toBe(false)
  expect(egoMatches("file:///practice/form.html", HOSTS)).toBe(false)
  expect(egoMatches(undefined, HOSTS)).toBe(false)
  expect(egoMatches("", HOSTS)).toBe(false)
  expect(egoMatches("javascript:void(0)", HOSTS)).toBe(false)
})

test("an empty host list routes nothing", () => {
  expect(egoMatches("https://www.ucas.com/", [])).toBe(false)
  expect(egoMatches("https://www.ucas.com/", ["", " "])).toBe(false)
})
