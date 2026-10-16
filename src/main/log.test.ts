import { describe, expect, test } from "bun:test"
import { maskUrls, sanitize, scrubFillValues } from "./log-sanitize"

describe("log sanitize", () => {
  test("masks secrets by key, at any depth", () => {
    const out = sanitize({ email: "a@b.c", password: "hunter2", nested: { accessToken: "xyz", Authorization: "Bearer 1", note: "ok" } }) as any
    expect(out.email).toBe("a@b.c")
    expect(out.password).toBe("[redacted]")
    expect(out.nested.accessToken).toBe("[redacted]")
    expect(out.nested.Authorization).toBe("[redacted]")
    expect(out.nested.note).toBe("ok")
    expect((sanitize({ refresh_token: "r", token: "t", tokens: { input: 12 } }) as any)).toEqual({ refresh_token: "[redacted]", token: "[redacted]", tokens: { input: 12 } })
  })

  test("clips long strings and long arrays", () => {
    const out = sanitize({ text: "x".repeat(5000), list: Array.from({ length: 100 }, (_, i) => i) }) as any
    expect(out.text.length).toBeLessThan(2100)
    expect(out.text).toContain("…(+3000)")
    expect(out.list.length).toBe(31)
  })

  test("flattens errors and survives cycles", () => {
    const loop: any = { name: "loop" }
    loop.self = loop
    const out = sanitize({ error: new Error("boom"), loop }) as any
    expect(out.error.message).toBe("boom")
    expect(out.loop.self).toBe("[circular]")
  })

  test("a login link is a password in a URL: parameter values, fragments and token-like path segments never reach the log", () => {
    expect(maskUrls("https://apply.example.edu/login?email=a%40b.c&hash=9f8e7d6c5b4a39281706f5e4d3c2b1a0")).toBe("https://apply.example.edu/login?email=…&hash=…")
    expect(maskUrls("opened https://apply.example.edu/magic/9f8e7d6c5b4a39281706f5e4d3c2b1a0/start then waited")).toBe("opened https://apply.example.edu/magic/…/start then waited")
    expect(maskUrls("https://apply.example.edu/app#access_token=abc123&state=xyz")).toBe("https://apply.example.edu/app#access_token=…&state=…")
    expect(maskUrls("https://apply.example.edu/programmes/master-of-science-in-artificial-intelligence#/p3")).toBe("https://apply.example.edu/programmes/master-of-science-in-artificial-intelligence#/p3")
    expect((sanitize({ url: "https://x.example/a?token=secret" }) as any).url).toBe("https://x.example/a?token=…")
  })

  test("the fill/type start line keeps coordinates, not content (2026-10-10 review: a password pasted into chat must not survive in the log)", () => {
    const scrubbed = scrubFillValues({ ref: "e24", value: "hunter2-then-a-chat-password" }) as Record<string, unknown>
    expect(scrubbed.value).toBe("[omitted]")
    expect(scrubbed.ref).toBe("e24")
    const batch = scrubFillValues({ fields: [{ ref: "e1", value: "a secret typed" }, { ref: "e2", value: 7 }] }) as any
    expect(batch.fields[0].value).toBe("[omitted]")
    expect(batch.fields[1].value).toBe(7) // 数字不是输入内容，留着 debug 有用
    const typed = scrubFillValues({ text: "typed straight into the focused box" }) as Record<string, unknown>
    expect(typed.text).toBe("[omitted]")
    // click/navigate 的形状不受波及
    expect(JSON.stringify(scrubFillValues({ ref: "e3", url: "https://x.example/path" }))).not.toContain("omitted")
    // web.ts 早说「query 不进日志」——入口行别再打脸它（2026-10-11 review P2-1）
    const search = scrubFillValues({ query: "张三 护照号 E12345678" }) as Record<string, unknown>
    expect(search.query).toBe("[omitted]")
    const chooser = scrubFillValues({ ref: "e9", want: "China, People's Republic of" }) as Record<string, unknown>
    expect(chooser.want).toBe("[omitted]")
    const multi = scrubFillValues({ ref: "e10", values: ["Meiling", 12] }) as any
    expect(multi.values[0]).toBe("[omitted]")
    expect(multi.values[1]).toBe(12)
    const dialog = scrubFillValues({ promptText: "姓名拼音" }) as Record<string, unknown>
    expect(dialog.promptText).toBe("[omitted]")
  })
})
