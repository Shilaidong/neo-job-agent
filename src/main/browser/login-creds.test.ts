import { describe, expect, test } from "bun:test"
import type { CredentialScan } from "./material-creds"
import { BrowserError } from "./errors"
import { credentialsFromScan, resolveCredentials, type CredentialStore } from "./login-creds"

/** Fake store that counts every write — the whole point of this file is proving loose never writes. */
function fakeStore(opts: { password?: string; username?: string } = {}) {
  const writes: string[] = []
  const store: CredentialStore = {
    getPassword: (url) => (url === "https://one.example.edu" ? opts.password : undefined),
    getAccount: (url) => (url === "https://one.example.edu" ? { platformHost: "one.example.edu", username: opts.username ?? "", updatedAt: "2026-10-11T00:00:00Z" } : null),
    savePassword: (_url, value) => {
      writes.push(`password:${value}`)
      return true
    },
    saveAccount: (_url, value) => {
      writes.push(`account:${value}`)
      return null
    },
  }
  return { store, writes }
}

const URL_ONE = "https://one.example.edu"

const found = (loose?: boolean, username?: string): CredentialScan => ({
  kind: "found",
  loose,
  cred: { password: "pw-from-material", username, file: "materials/登录信息.md", line: 3, matched: !loose },
})

describe("credentialsFromScan", () => {
  test("found named at the site: used and cached into the encrypted store", () => {
    const { store, writes } = fakeStore()
    const cred = credentialsFromScan(found(false, "applicant_id"), URL_ONE, store)!
    expect(cred).toEqual({ username: "applicant_id", password: "pw-from-material" })
    expect(writes).toEqual(["password:pw-from-material", "account:applicant_id"])
  })

  test("found without a username keeps the cached account name", () => {
    const { store, writes } = fakeStore({ username: "cached_name" })
    const cred = credentialsFromScan(found(false), URL_ONE, store)!
    expect(cred).toEqual({ username: "cached_name", password: "pw-from-material" })
    expect(writes).toEqual(["password:pw-from-material"])
  })

  // P1-2 的核心钉：loose 是「文件夹里只有一条密码」的猜测，绝不能落成这个 host 的缓存——
  // 一旦写进去，一次猜错就成了永久事实，比顾问手动补录的条目还硬。
  test("loose found: used once, marked loose, never written to the store", () => {
    const { store, writes } = fakeStore({ password: "manual-entry", username: "old_name" })
    const cred = credentialsFromScan(found(true), URL_ONE, store)
    expect(cred).toEqual({ username: "old_name", password: "pw-from-material", loose: true })
    expect(writes).toEqual([])
  })

  test("loose found over an empty store: still no writes, no username invented", () => {
    const { store, writes } = fakeStore()
    const cred = credentialsFromScan(found(true), "https://never-seen.example.com", store)
    expect(cred).toEqual({ username: undefined, password: "pw-from-material", loose: true })
    expect(writes).toEqual([])
  })

  test("nothing in materials: fall back to the cached password, used as-is", () => {
    const { store, writes } = fakeStore({ password: "cached_pw", username: "cached_name" })
    const cred = credentialsFromScan({ kind: "none" }, URL_ONE, store)
    expect(cred).toEqual({ username: "cached_name", password: "cached_pw" })
    expect(writes).toEqual([])
  })

  test("nothing at all: undefined — consultant logs in manually", () => {
    const { store } = fakeStore()
    expect(credentialsFromScan({ kind: "none" }, "https://brand-new.example.org", store)).toBeUndefined()
  })

  // P1-1: 「没找到」和「找到了但值被打码」必须分开说——扫描只能撞见 redactSecrets 的标记，
  // 拿打码串去试就是拿假值试错。
  test("redacted record: throws telling the consultant to re-enter, not the cache fallback", () => {
    const { store } = fakeStore({ password: "other-site-pw" })
    expect(() => credentialsFromScan({ kind: "none", redacted: true }, "https://newsite.example.edu", store)).toThrow(BrowserError)
    expect(() => credentialsFromScan({ kind: "none", redacted: true }, "https://newsite.example.edu", store)).toThrow(/打码隐去/)
  })

  test("ambiguous: throws with the files named, hands the decision to the consultant", () => {
    const { store } = fakeStore()
    const err = () => credentialsFromScan({ kind: "ambiguous", files: ["a.md", "b.md"] }, URL_ONE, store)
    expect(err).toThrow(BrowserError)
    expect(err).toThrow("a.md、b.md")
    expect(err).toThrow(/手动登录/)
  })

  // 口径钉住：打码提醒只在「缓存里也没有」时开火——顾问已经手动补录过这条 host，就用他的。
  test("redacted plus a cached entry for this host: the cache wins, no throw", () => {
    const { store } = fakeStore({ password: "cached_pw", username: "cached_name" })
    const cred = credentialsFromScan({ kind: "none", redacted: true }, URL_ONE, store)
    expect(cred).toEqual({ username: "cached_name", password: "cached_pw" })
  })
})

describe("resolveCredentials (2026-10-12：顾问递到对话里的凭据)", () => {
  test("explicit password: trusted over any scan result, cached — a human sentence is confirmed, not a guess", () => {
    const { store, writes } = fakeStore()
    const cred = resolveCredentials(found(false, "applicant_id"), URL_ONE, store, { username: "chloe@example.com", password: "from-chat" })!
    expect(cred).toEqual({ username: "chloe@example.com", password: "from-chat" })
    expect(writes).toEqual(["password:from-chat", "account:chloe@example.com"])
  })

  test("explicit without a username: the password alone is cached, nothing else is invented", () => {
    const { store, writes } = fakeStore()
    const cred = resolveCredentials({ kind: "none" }, "https://never-seen.example.com", store, { password: "from-chat" })!
    expect(cred).toEqual({ username: undefined, password: "from-chat" })
    expect(writes).toEqual(["password:from-chat"])
  })

  test("username only, no password: that is not credentials — the scan path decides as usual", () => {
    const { store, writes } = fakeStore({ password: "cached_pw", username: "cached_name" })
    const cred = resolveCredentials({ kind: "none" }, URL_ONE, store, { username: "someone@example.com" })!
    expect(cred).toEqual({ username: "cached_name", password: "cached_pw" })
    expect(writes).toEqual([])
  })

  test("no explicit at all: byte-for-byte the old behavior, throws and all", () => {
    const { store } = fakeStore()
    expect(() => resolveCredentials({ kind: "ambiguous", files: ["a.md"] }, URL_ONE, store)).toThrow(BrowserError)
    expect(resolveCredentials({ kind: "none" }, URL_ONE, store)).toBeUndefined()
  })
})
