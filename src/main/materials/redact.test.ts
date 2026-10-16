import { describe, expect, test } from "bun:test"
import { redactSecrets } from "./redact"

describe("passwords in consultants' notes", () => {
  test("the value after 'password:' is blanked, the rest of the line stays", () => {
    const { text, found } = redactSecrets("账户：someone@163.com 密码：Abc12345!\nPassword = hunter2 (mailbox)")
    expect(found).toBe(2)
    expect(text).toBe("账户：someone@163.com 密码：［已隐去］\nPassword = ［已隐去］ (mailbox)")
  })
  test("a sentence that merely mentions passwords is left alone", () => {
    const line = "申请平台没有密码，通过邮箱发送验证码登录"
    expect(redactSecrets(line)).toEqual({ text: line, found: 0 })
  })
})
