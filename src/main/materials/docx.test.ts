import { describe, expect, test } from "bun:test"
import { docxXmlToText } from "./docx"

describe("docx text", () => {
  test("paragraphs, tables and entities survive; markup does not", () => {
    const xml =
      '<w:document><w:body><w:p><w:r><w:t>学生信息表</w:t></w:r></w:p>' +
      '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>姓名</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>陈昊天</w:t></w:r></w:p></w:tc></w:tr>' +
      '<w:tr><w:tc><w:p><w:r><w:t>邮箱</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>chen&amp;co@x.com</w:t></w:r></w:p></w:tc></w:tr></w:tbl>' +
      '<w:p><w:r><w:t>GPA</w:t><w:tab/><w:t>3.85 &lt; 4.0</w:t></w:r></w:p></w:body></w:document>'
    const text = docxXmlToText(xml)
    expect(text).toContain("学生信息表")
    expect(text).toMatch(/姓名\s*\|\s*陈昊天/)
    expect(text).toContain("chen&co@x.com")
    expect(text).toContain("GPA\t3.85 < 4.0")
    expect(text).not.toContain("<w:")
  })
})
