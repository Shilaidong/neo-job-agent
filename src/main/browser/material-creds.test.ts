import { mkdtemp, mkdir, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, test } from "bun:test"
import { decide, findCredentialLines, hostKeywords, scanMaterialsForLogin } from "./material-creds"

const UA = ["commonapp"]

describe("hostKeywords", () => {
  test("strips the noisy labels and keeps the one a material note would use", () => {
    expect(hostKeywords("https://apply.commonapp.org/login")).toContain("commonapp")
    expect(hostKeywords("https://www.ucas.com/")).toContain("ucas")
  })
  test("a material that writes it with a space still hits", () => {
    // keyword "commonapp" has to match the block "Common App" — spaces are normalized out.
    expect(findCredentialLines("Common App\n密码: hunter2!!", ["commonapp"], "x.md")[0].matched).toBe(true)
  })
  test("unrelated URLs give no keywords, not garbage", () => {
    expect(hostKeywords("not-a-url")).toEqual([])
    expect(hostKeywords("https://accounts.exampleportal.org").join(" ")).toContain("exampleportal")
  })
  test("three-letter school portals keep their keyword (P1-3: ntu/lse/mit used to be filtered out)", () => {
    expect(hostKeywords("https://www.lse.ac.uk/study-at-lse")).toContain("lse")
    expect(hostKeywords("https://approxy.nus.edu.sg/")).toEqual(["approxy", "nus"]) // .edu/.sg drop as country noise
  })
  test("generic labels in the host do not masquerade as site names (P1-3)", () => {
    // "admission" as the only name-bearing label must not match every paragraph that mentions admissions.
    expect(hostKeywords("https://admission.example.net/")).toEqual(["example"])
    expect(hostKeywords("https://test.nuist.edu.cn/")).toEqual(["nuist"])
  })
})

describe("findCredentialLines", () => {
  test("the block that names the site matches", () => {
    const text = ["Common App 账号", "账号: stu@mail.com", "密码: su3rm3!x"].join("\n")
    const found = findCredentialLines(text, UA, "login.md")
    expect(found).toHaveLength(1)
    expect(found[0].matched).toBe(true)
    expect(found[0].password).toBe("su3rm3!x")
    expect(found[0].username).toBe("stu@mail.com")
  })
  test("JSON from the answer bank parses", () => {
    const text = ['{', '  "Common App password": "hunter2",', '  "note": "x"', "}"].join("\n")
    const found = findCredentialLines(text, UA, "student_profile.json")
    expect(found[0].password).toBe("hunter2")
  })
  test("a masked note is not a password, and the line without any site above stays unattributed", () => {
    expect(findCredentialLines("密码: ****", UA, "f.md")).toHaveLength(0)
    const bare = findCredentialLines("邮箱: a@b.com\n密码: letmein1", UA, "f.md")
    expect(bare).toHaveLength(1)
    expect(bare[0].matched).toBe(false)
  })
  test("short site words attribute only as whole words (P1-3)", () => {
    expect(findCredentialLines("LSE 申请账号\n密码: lsepw2026x", ["lse"], "f.md")[0].matched).toBe(true)
    expect(findCredentialLines("That is false. Really\n密码: lsepw2026x", ["lse"], "f.md")[0].matched).toBe(false)
  })
  test("a Chinese character touching the word is a word edge, not a wall (2026-10-11 review P2-3)", () => {
    // 三字校名紧挨中文的备忘写法——"LSE申请材料"里 lse 就是一个词，不是某个英文单词的内馅。
    expect(findCredentialLines("LSE申请材料\n密码: lsepw2026x", ["lse"], "f.md")[0].matched).toBe(true)
  })
  test("the redaction marker never becomes the password (2026-10-11 review P1-1)", () => {
    expect(findCredentialLines("LSE 登录\n密码: ［已隐去］", ["lse"], "f.md")).toHaveLength(0)
    expect(findCredentialLines("密码: 已隐去", ["lse"], "f.md")).toHaveLength(0)
  })
  test("signposts and placeholder values never count as the password (P1-3)", () => {
    for (const junk of ["None", "N/A", "tbd", "20262026", "见资料库", "待定项"]) {
      expect(findCredentialLines(`LSE 登录\n密码: ${junk}`, ["lse"], "f.md")).toHaveLength(0)
    }
  })
})

describe("decide", () => {
  const cand = (password: string, matched: boolean, file = "a.md"): import("./material-creds").CredentialCandidate =>
    ({ password, file, line: 1, matched })

  test("one clear record for the site", () => {
    expect(decide([cand("pw1234", true)]).kind).toBe("found")
  })
  test("two different sites recorded — refuse to guess", () => {
    const d = decide([cand("pw1234", true, "common.md"), cand("ox1234", true, "ucas.md")])
    expect(d.kind).toBe("ambiguous")
  })
  test("nothing at all", () => {
    expect(decide([]).kind).toBe("none")
  })
  test("the single unattributed password in the whole folder is accepted — but flagged loose, it is a guess", () => {
    const d = decide([cand("pw1234", false)])
    expect(d.kind === "found" && d.loose === true).toBe(true)
  })
  test("a record that DOES name the site is found without the loose flag (the caller caches it only in that case)", () => {
    const d = decide([cand("pw1234", true)])
    expect(d.kind === "found" && d.loose === undefined).toBe(true)
  })
  test("several that name nothing are not this site's business — say none, not guess", () => {
    // (they belong to other platforms; the "which one is mine" stop is the confirmed-contradiction shape)
    expect(decide([cand("pw1234", false), cand("ox5678", false)]).kind).toBe("none")
  })
  test("one named record beats an unnamed noise line", () => {
    const d = decide([cand("pw1234", true), cand("zz9999", false)])
    expect(d.kind === "found" && d.cred.password).toBe("pw1234")
  })
})

describe("scanMaterialsForLogin", () => {
  test("walks materials_text and the student json", async () => {
    const dir = await mkdtemp(join(tmpdir(), "neomc-"))
    await mkdir(join(dir, "materials_text", "sub"), { recursive: true })
    await writeFile(join(dir, "materials_text", "账户信息.md"), "UCAS\n账号: stu@mail.com\n密码: p@ss2026xx\n")
    await writeFile(join(dir, "materials_text", "sub", "杂项.txt"), "Common App 登录\n密码: commonapp!pw\n")
    await writeFile(join(dir, "student.json"), "{}")
    const ucas = await scanMaterialsForLogin(dir, "https://apply.ucas.com/signin")
    expect(ucas.kind === "found" && ucas.cred.password).toBe("p@ss2026xx")
    const app = await scanMaterialsForLogin(dir, "https://commonapp.org/apply")
    expect(app.kind === "found" && app.cred.password).toBe("commonapp!pw")
    const none = await scanMaterialsForLogin(dir, "https://portal.applyweb.edu/login")
    expect(none.kind).toBe("none")
  })
  test("a password the extractor already blanked says 「record there, withheld」, not 「nothing found」 (P1-1)", async () => {
    const dir = await mkdtemp(join(tmpdir(), "neomc-"))
    await mkdir(join(dir, "materials_text"), { recursive: true })
    await writeFile(join(dir, "materials_text", "备忘.md"), "NUS 研究生院申请\n账号: stu@nus.sg\n密码: ［已隐去］\n")
    await writeFile(join(dir, "student.json"), "{}")
    const hit = await scanMaterialsForLogin(dir, "https://admission.nus.edu.sg/apply")
    expect(hit.kind === "none" && hit.redacted === true).toBe(true)
    // And a site no line names still stays a plain none — the marker is not a wildcard.
    const elsewhere = await scanMaterialsForLogin(dir, "https://apps.education.gov.uk/apply")
    expect(elsewhere.kind === "none" && elsewhere.redacted === undefined).toBe(true)
  })
})
