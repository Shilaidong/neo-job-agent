export type AuthUser = { id: string; email: string }

export type Quota = {
  creditsTotal: number
  creditsUsed: number
  creditsRemaining: number
  status: string
}

export type AuthStatus = {
  /** false = no Supabase config in this build: everything runs unlocked (local development). */
  configured: boolean
  authenticated: boolean
  user: AuthUser | null
  quota: Quota | null
  contactWechat: string
  /** Why the quota could not be read, if it could not. The consultant stays signed in. */
  quotaError?: string
}
