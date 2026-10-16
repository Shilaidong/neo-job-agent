import { describe, expect, test } from "bun:test"
import { detectDateFormat, formatDate, monthNumber, sameDigits } from "./dates"
import { literalMatch } from "./match"

describe("date formats a page states", () => {
  test("found in a placeholder or a label", () => {
    expect(detectDateFormat(["", "Date of birth (MM/DD/YYYY)"])).toBe("MM/DD/YYYY")
    expect(detectDateFormat(["dd-mm-yyyy"])).toBe("dd-mm-yyyy")
    expect(detectDateFormat(["Start (mm/yyyy)"])).toBe("mm/yyyy")
    expect(detectDateFormat(["D.M.YYYY"])).toBe("D.M.YYYY")
  })
  test("not found in ordinary words, or without a year", () => {
    expect(detectDateFormat(["Comments", "Add a summary", null, undefined])).toBeUndefined()
    expect(detectDateFormat(["dd/mm"])).toBeUndefined()
    expect(detectDateFormat(["mm/mm/yyyy"])).toBeUndefined()
  })
  test("ISO is rewritten exactly as asked", () => {
    expect(formatDate("2003-05-17", "MM/DD/YYYY")).toBe("05/17/2003")
    expect(formatDate("2003-05-17", "DD/MM/YYYY")).toBe("17/05/2003")
    expect(formatDate("2003-05-07", "D.M.YY")).toBe("7.5.03")
    expect(formatDate("2003-05", "mm/yyyy")).toBe("05/2003")
    expect(formatDate("2003-05", "DD/MM/YYYY")).toBeUndefined()
    expect(formatDate("17/05/2003", "DD/MM/YYYY")).toBeUndefined()
  })
  test("read-back is compared by digits, and a swapped day and month is caught", () => {
    expect(sameDigits("05/17/2003", "05 / 17 / 2003")).toBe(true)
    expect(sameDigits("05/17/2003", "17/05/2003")).toBe(false)
    expect(sameDigits("", "")).toBe(false)
  })
})

describe("day / month / year dropdowns", () => {
  const months = ["Month", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  test("months in any spelling", () => {
    expect(monthNumber("Sep")).toBe(9)
    expect(monthNumber("Sept.")).toBe(9)
    expect(monthNumber("09")).toBe(9)
    expect(monthNumber("9月")).toBe(9)
    expect(monthNumber("十二月")).toBe(12)
    expect(monthNumber("Mayor")).toBeUndefined()
    expect(monthNumber("13")).toBeUndefined()
  })
  test("a month number picks the month name, a padded day picks the day", () => {
    expect(literalMatch("5", months)).toBe(5)
    expect(literalMatch("05", months)).toBe(5)
    expect(literalMatch("九月", months)).toBe(9)
    expect(literalMatch("05", ["1", "2", "3", "4", "5", "15", "25"])).toBe(4)
  })
})
