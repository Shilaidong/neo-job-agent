import type { AuthStatus, Quota } from "../shared/auth"
import bundledConfig from "../../resources/supabase-public.json"
import { net } from "electron"
import { createLogger } from "./log"

/**
 * Every request to the quota server goes through Electron's own network stack — NOT Node's plain fetch.
 * Node's fetch ignores the system proxy, so on a line that only reaches Supabase through a proxy
 * (measured 2026-10-05: *.supabase.co TLS-reset in 0.2s direct while the browser side, through the proxy,
 * loads fine) every send died as a bare "fetch failed". net.fetch follows the proxy the browser follows —
 * the same door the page goes out through.
 */
const http = (url: string, init?: RequestInit) => net.fetch(url, init)
import { creditsFor, emptyTokens, normalizeTokens, subtractTokens, type TokenUsage } from "./quota-math"
import { openStore } from "./store"

/**
 * Advisor sign-in and AI credits, against the same Supabase project and RPCs as 1.1.x
 * (`application_agent_get_quota`, `application_agent_consume_ai_quota`), so one account and
 * one balance work in both apps. The session lives in the OS keychain, not in a JSON file.
 */
const log = createLogger("auth")

type SupabaseConfig = { configured: boolean; url?: string; anonKey?: string; quotaContactWechat?: string }
type StoredSession = { accessToken: string; refreshToken: string; expiresAt: number; user: { id: string; email: string } }
type UsageRecord = { chargedCredits: number; lastTokens: TokenUsage }

const sessions = openStore<{ session: StoredSession }>("advisor-session", { secret: true })
const usage = openStore<Record<string, UsageRecord>>("quota-usage")

export function supabaseConfig(): SupabaseConfig {
  if (process.env.NEO_AUTH === "off") return { configured: false }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (url && anonKey) return { configured: true, url, anonKey, quotaContactWechat: "shilaidong" }
  const bundled = bundledConfig as SupabaseConfig
  return bundled.configured && bundled.url && bundled.anonKey ? bundled : { configured: false }
}

const contact = () => supabaseConfig().quotaContactWechat || "shilaidong"
const base = (config: SupabaseConfig) => String(config.url).replace(/\/+$/, "")
const headers = (config: SupabaseConfig) => ({ apikey: String(config.anonKey), "content-type": "application/json" })

function requireConfig() {
  const config = supabaseConfig()
  if (!config.configured) throw new Error("这个版本没有配置顾问登录。")
  return config
}

async function tokenRequest(grant: "password" | "refresh_token", body: Record<string, string>) {
  const config = requireConfig()
  const response = await http(`${base(config)}/auth/v1/token?grant_type=${grant}`, { method: "POST", headers: headers(config), body: JSON.stringify(body) })
  const json = (await response.json().catch(() => ({}))) as any
  return { ok: response.ok, status: response.status, json }
}

function toSession(json: any, fallbackUser?: StoredSession["user"]): StoredSession | undefined {
  const user = json?.user?.id && json?.user?.email ? { id: String(json.user.id), email: String(json.user.email) } : fallbackUser
  if (!json?.access_token || !json?.refresh_token || !user) return undefined
  return { accessToken: json.access_token, refreshToken: json.refresh_token, expiresAt: Math.floor(Date.now() / 1000) + Number(json.expires_in || 3600), user }
}

export async function login(email: string, password: string): Promise<AuthStatus> {
  const { ok, status, json } = await tokenRequest("password", { email: email.trim(), password })
  if (!ok) {
    log.warn("login rejected", { email: email.trim(), status, reason: json?.error_code || json?.error })
    throw new Error(status === 400 ? "邮箱或密码不正确。" : json?.error_description || json?.msg || "登录失败，请稍后再试。")
  }
  const session = toSession(json)
  if (!session) throw new Error("登录返回的信息不完整，请稍后再试。")
  sessions.set("session", session)
  log.info("signed in", { email: session.user.email })
  return authStatus()
}

export function logout() {
  log.info("signed out", { email: sessions.get("session")?.user.email })
  sessions.delete("session")
}

async function validSession(): Promise<StoredSession | undefined> {
  const session = sessions.get("session")
  if (!session?.accessToken || !session.refreshToken || !session.user?.id) return undefined
  if (session.expiresAt > Math.floor(Date.now() / 1000) + 90) return session
  const { ok, status, json } = await tokenRequest("refresh_token", { refresh_token: session.refreshToken })
  const next = ok ? toSession(json, session.user) : undefined
  if (!next) {
    // 4xx = the refresh token is dead: sign out. Anything else (offline, 5xx) = keep the session and try later.
    log.warn("session refresh failed", { status })
    if (status >= 400 && status < 500) sessions.delete("session")
    return undefined
  }
  sessions.set("session", next)
  return next
}

async function rpc<T>(session: StoredSession, fn: string, payload: unknown): Promise<T> {
  const config = requireConfig()
  const response = await http(`${base(config)}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { ...headers(config), authorization: `Bearer ${session.accessToken}` },
    body: JSON.stringify(payload),
  })
  const text = await response.text()
  const body = text ? JSON.parse(text) : null
  if (!response.ok) throw new Error(body?.message || body?.error_description || `${fn} 调用失败（${response.status}）`)
  return body as T
}

async function readQuota(session: StoredSession): Promise<Quota> {
  const rows = await rpc<any>(session, "application_agent_get_quota", {})
  const row = Array.isArray(rows) ? rows[0] : rows
  if (!row) throw new Error("无法读取 AI 额度")
  return {
    creditsTotal: Number(row.credits_total || 0),
    creditsUsed: Number(row.credits_used || 0),
    creditsRemaining: Number(row.credits_remaining || 0),
    status: String(row.status || "active"),
  }
}

export async function authStatus(): Promise<AuthStatus> {
  const config = supabaseConfig()
  if (!config.configured) return { configured: false, authenticated: true, user: null, quota: null, contactWechat: contact() }
  const session = await validSession().catch((error) => (log.warn("session check failed", { error }), undefined))
  if (!session) return { configured: true, authenticated: false, user: null, quota: null, contactWechat: contact() }
  try {
    return { configured: true, authenticated: true, user: session.user, quota: await readQuota(session), contactWechat: contact() }
  } catch (error) {
    log.warn("quota unavailable", { error })
    return { configured: true, authenticated: true, user: session.user, quota: null, contactWechat: contact(), quotaError: error instanceof Error ? error.message : String(error) }
  }
}

/** Called before every prompt. Throws a message the consultant can act on. */
export async function ensureQuota() {
  if (!supabaseConfig().configured) return
  try {
    const session = await validSession()
    if (!session) throw new Error("请先登录 Terra-Edu 顾问账号。")
    const quota = await readQuota(session)
    if (quota.status !== "active" || quota.creditsRemaining <= 0) throw new Error(`AI 额度已用完。请联系微信：${contact()} 获取更多额度。`)
  } catch (error) {
    // A bare "fetch failed" leaves the consultant nowhere: name the suspect. A network failure surfaces as a TypeError.
    if (error instanceof TypeError) throw new Error("连不上 Terra-Edu 的额度服务器：这条网络到不了服务器（代理/梯子没开，或线路不通）。把系统代理打开——就是左边网页能正常打开国外网站的那种——然后重发这一条即可。不是额度用完：用完会写明微信。")
    throw error
  }
}

/**
 * Report a conversation's cumulative token usage. Charges only the credits not yet charged for this
 * conversation, with an idempotency key per credit level, so retries and restarts never double-bill.
 */
export async function syncTokenUsage(sessionID: string, workspacePath: string, cumulative: TokenUsage): Promise<Quota | undefined> {
  if (!supabaseConfig().configured) return undefined
  const session = await validSession()
  if (!session) return undefined
  const key = `${session.user.id}:${sessionID}`
  const record = usage.get(key)
  const charged = Number(record?.chargedCredits || 0)
  const desired = creditsFor(cumulative)
  if (desired <= charged) return undefined

  const delta = subtractTokens(cumulative, record ? normalizeTokens(record.lastTokens) : emptyTokens())
  const rows = await rpc<any>(session, "application_agent_consume_ai_quota", {
    p_idempotency_key: `${sessionID}:tokens:${desired}`,
    p_action: "agent_token_usage",
    p_workspace_path: workspacePath,
    p_session_id: sessionID,
    p_input_tokens: Math.floor(delta.input),
    p_output_tokens: Math.floor(delta.output),
    p_reasoning_tokens: Math.floor(delta.reasoning),
    p_cache_read_tokens: Math.floor(delta.cache.read),
    p_cache_write_tokens: Math.floor(delta.cache.write),
    p_minimum_credits: desired - charged,
    p_allow_overage: true,
  })
  const row = Array.isArray(rows) ? rows[0] : rows
  usage.set(key, { chargedCredits: desired, lastTokens: cumulative })
  log.info("credits charged", { sessionID, credits: desired - charged, totalForConversation: desired, allowed: row?.allowed })
  return readQuota(session)
}
