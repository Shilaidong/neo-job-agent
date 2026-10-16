/**
 * What browser_login uses as this platform's credential (2026-10-11 test round: this used to live inside
 * index.ts's boot closure — the "loose never gets cached" branch was pinned only by reading the code,
 * with no independent assertion. Same rules, now a pure function with a swappable store.)
 *
 * Materials first (scanMaterialsForLogin, never through the model); the encrypted platform store is the
 * fallback and the attribution cache; "loose" — the folder's only record with no site named — is used
 * but never written back: a guess must not become a fact that outranks the consultant's manual entry.
 */
import { BrowserError } from "./errors"
import type { PlatformAccount } from "../../shared/tasks"
import type { CredentialScan } from "./material-creds"

export type LoginCredentials = { username?: string; password: string; loose?: boolean }

/** Credentials the model carries back in the tool call itself (2026-10-12: the consultant's paste, or a pair sent in conversation — the model parses, we never do). */
export type ExplicitCredentials = { username?: string; password?: string }

/** The four accounts.ts exports, shaped so a fake can stand in for them under test. */
export type CredentialStore = {
  getPassword(url: string): string | undefined
  getAccount(url: string): PlatformAccount | null
  savePassword(url: string, value: string): unknown
  saveAccount(url: string, value: string): unknown
}

/**
 * The whole decision face behind browser_login, in one order:
 * 1. explicit credentials the model handed in — trust them (the consultant gave them) and cache them,
 *    because unlike a materials scan this is confirmed by a human sentence. From here the next call
 *    needs no arguments. (2026-10-12 用户拍板：直接用模型来处理.)
 * 2. otherwise the materials scan + store fallback, i.e. credentialsFromScan.
 */
export function resolveCredentials(scan: CredentialScan, url: string, store: CredentialStore, explicit?: ExplicitCredentials): LoginCredentials | undefined {
  if (explicit?.password) {
    store.savePassword(url, explicit.password)
    if (explicit.username) store.saveAccount(url, explicit.username)
    return { username: explicit.username, password: explicit.password }
  }
  return credentialsFromScan(scan, url, store)
}

export function credentialsFromScan(scan: CredentialScan, url: string, store: CredentialStore): LoginCredentials | undefined {
  if (scan.kind === "ambiguous") throw new BrowserError(`材料里这个站点的密码记录不止一处（${scan.files.join("、")}），分不清用哪条——请把那页材料写清楚，或由顾问手动登录。`)
  const saved = store.getAccount(url)
  if (scan.kind === "found") {
    // loose = the record named no site, we only used it because the folder holds one password (P1-2).
    if (!scan.loose) {
      store.savePassword(url, scan.cred.password)
      if (scan.cred.username) store.saveAccount(url, scan.cred.username)
    }
    return { username: scan.cred.username ?? saved?.username, password: scan.cred.password, ...(scan.loose ? { loose: true } : {}) }
  }
  // 资料里没有这个站：退回本机加密存储里补录过的那条。
  const password = store.getPassword(url)
  if (password) return { username: saved?.username, password }
  // 「没有这条记录」和「记录在，密码被软件隐去了」是两回事，后者直说——材料文字版的密码都过
  // redactSecrets，扫描永远只能撞见标记（2026-10-11 评审 P1-1）。
  if (scan.redacted) throw new BrowserError("这一站在学生资料里有记录，但文字版里的密码值被软件打码隐去了（redactSecrets 只留标记）。不要用打码串去试——请顾问从原件里把密码抄出来手动补录，或把密码从材料文件夹里拿掉，这条链才算接上。")
  return undefined
}
