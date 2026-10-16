import type { PlatformAccount } from "../../shared/tasks"
import { openStore } from "../store"

/** Remembers which username goes with which application platform. Never a password — passwords have their own secret store below. */
const accounts = openStore<Record<string, PlatformAccount>>("platform-accounts")

/**
 * The auto-login password (ROADMAP 2026-10-09 B): a separate store encrypted by the OS keychain,
 * living OUTSIDE every workspace — the model's file tools cannot reach it. It never rides along on
 * a PlatformAccount (those cross the IPC to the renderer), never enters a log line, and is read
 * only inside the main process at the moment browser_login types it.
 */
const passwords = openStore<Record<string, { password: string; updatedAt: string }>>("platform-passwords", { secret: true })

export function platformHost(applicationUrl: string) {
  const parsed = URL.canParse(applicationUrl) ? new URL(applicationUrl) : undefined
  return (parsed?.host || "").trim().toLowerCase().replace(/^www\./, "")
}

export function getPlatformAccount(applicationUrl: string): PlatformAccount | null {
  const host = platformHost(applicationUrl)
  return (host && accounts.get(host)) || null
}

export function savePlatformAccount(applicationUrl: string, username: string): PlatformAccount | null {
  const host = platformHost(applicationUrl)
  if (!host || !username.trim()) return null
  const account = { platformHost: host, username: username.trim(), updatedAt: new Date().toISOString() }
  accounts.set(host, account)
  return account
}

export function clearPlatformAccount(applicationUrl: string) {
  const host = platformHost(applicationUrl)
  if (host) {
    accounts.delete(host)
    passwords.delete(host) // forgetting the account forgets its stored password too
  }
}

/** Main-process only: the only caller is browser_login; what it gets must never be logged or handed to the model. */
export function getPlatformPassword(applicationUrl: string): string | undefined {
  const host = platformHost(applicationUrl)
  return host ? passwords.get(host)?.password : undefined
}

export function savePlatformPassword(applicationUrl: string, password: string): boolean {
  const host = platformHost(applicationUrl)
  if (!host || !password) return false
  passwords.set(host, { password, updatedAt: new Date().toISOString() })
  return true
}
