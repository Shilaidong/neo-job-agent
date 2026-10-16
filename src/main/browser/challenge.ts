/**
 * Cloudflare's bot gate ("One more step", "请验证您是真人") and how the app hands the page over to a person.
 *
 * Why this exists: our browser tools run over CDP, and Cloudflare detects the attached debugger and flags the
 * WHOLE embedded browser as a machine — then the checkbox challenge loops forever, for the model and for a person
 * clicking through it the same way. The fix is not to fight the gate (we do not solve captchas or touch
 * fingerprints); it is to TAKE THE DEBUGGER OFF: tools refuse, CDP detaches, the page becomes an ordinary browser
 * belonging to a human, they pass it by hand, and the tools come back afterwards.
 *
 * Detection is deliberately conservative: an actual machine-block or an embedded Turnstile widget, not any page
 * that happens to mention verifying an email.
 */

/** What the page probe reports about itself (see CHALLENGE_PROBE). */
export type ChallengeProbe = { title: string; body: string; cfGlobal: boolean; turnstile: boolean }

const CF_TITLE = /just a moment|one more step|verify you are (a\s+)?human|verify you are human|正在验证|请稍候/i
/** Only these phrases mean "a human-verification gate is standing here". "验证邮箱" on a signup form must not match. */
const CF_BODY = /请验证您是真人|验证您是真人|确认您是真人|checking your browser before accessing|cf_chl_opt|performance & security by cloudflare/i

/** True when a person, not a tool, has to handle this page. Pure — unit tested against probe shapes. */
export function challengePageHit(p: Partial<ChallengeProbe>): boolean {
  if (p.cfGlobal || p.turnstile) return true
  return CF_TITLE.test(p.title ?? "") || CF_BODY.test(p.body ?? "")
}

/**
 * In-page probe: title, a body slice, Cloudflare's challenge globals, and an embedded Turnstile widget.
 * The widget counts only when VISIBLE: invisible Turnstiles hide in every kind of ordinary form (a hidden
 * `cf-turnstile-response` input), and flagging those would hand off pages a tool can fill fine.
 */
export const CHALLENGE_PROBE = `JSON.stringify((() => {
  const body = (document.body && document.body.innerText || "").slice(0, 4000)
  const cfGlobal = !!window.cf_chl_opt || !!document.querySelector('script[src*="challenges.cloudflare.com"]')
  const shown = (el) => !!el && el.offsetWidth > 0 && el.offsetHeight > 0
  const widget = document.querySelector('input[name="cf-turnstile-response"], .cf-turnstile, iframe[src*="challenges.cloudflare.com"]')
  const turnstile = shown(widget) || shown(widget && widget.parentElement)
  return { title: document.title || "", body, cfGlobal, turnstile }
})())`

/** Thrown by the CDP gate while the consultant holds the page — an expected refusal, not a crash. */
export class HumanHeldError extends Error {}

/** What every tool call answers with while the consultant holds the page (the model reads this, so it says what to do). */
export const HUMAN_HANDOFF_MSG =
  "【已交给人工】顾问正在左侧页面亲手操作（人机验证、登录这些是人的动作，工具已断开）。现在不要再试任何浏览器工具：回一句说明你在等顾问操作，或者去做不碰左侧页面的事；顾问点完【我操作完了，交回 AI】后你再接着干。"

/** Prepended to the last snapshot the model receives before the page leaves its hands. */
export const HANDOFF_TAKEOVER =
  "\n\n〔这一页卡在机器人验证上了。这类关卡探得到我们的调试协议，谁点都会无限重验——已经切换到「交给人」模式：工具放手，顾问会亲手过验证/登录，完事后你会被叫回来。不要在这页上重试点击或截图，越试锁得越死。〕"

/** Sent into the conversation when the consultant gives the page back, so the model picks up without being told twice. */
export const TAKEBACK_RESUME_PROMPT =
  "顾问已经操作完左侧页面（验证或登录都弄好了，工具重新挂上）。先 browser_snapshot 看一眼页面现在的样子，然后接着做刚才的任务。密码和验证码不经你的手，也不要去问顾问要。"
