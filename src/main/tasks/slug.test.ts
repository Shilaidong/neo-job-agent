import { describe, expect, test } from "bun:test"
import { sameApplication, slugPart, taskSlug } from "./slug"

describe("slugs", () => {
  test("keeps names readable and file-system safe", () => {
    expect(slugPart("  陈昊天 ")).toBe("陈昊天")
    expect(slugPart("University of Oxford")).toBe("University-of-Oxford")
    expect(slugPart('MSc: "AI" / ML?')).toBe("MSc-AI-ML")
    expect(slugPart("...")).toBe("未命名")
    expect(taskSlug("Google", "Data Science Intern")).toBe("Google_Data-Science-Intern")
    expect([...slugPart("长".repeat(100))].length).toBe(40)
  })

  test("the same application is recognised despite case, width and spacing", () => {
    expect(sameApplication({ studentName: "陈昊天", company: "Google", jobTitle: "Data  Science Intern" }, { studentName: " 陈昊天", company: "google", jobTitle: "data science intern" })).toBe(true)
    expect(sameApplication({ studentName: "陈昊天", company: "Google", jobTitle: "Data Science Intern" }, { studentName: "陈昊天", company: "Google", jobTitle: "SWE Intern" })).toBe(false)
  })
})
