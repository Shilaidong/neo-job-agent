import { isConfident } from "../jev-core"
import type { Ask } from "./match"

/**
 * Something is lying on top of the form: a cookie banner, a notice, "your session is about to expire".
 * Which of its buttons gets it out of the way? Letters first, then Jev.
 * 2026-10-07 (用户拍板): a wall of "I agree" the tool cannot click just stalls the whole form —
 * agreeing to a notice is now an ordinary button to press. Cookie banners still prefer "decline /
 * necessary only": no reason to accept more tracking when there is a way to accept less.
 */
const DECLINE = /^(reject|decline|refuse|deny)\b|\b(necessary|essential|required)\b.*\b(only|cookies)\b|^only\b.*\b(necessary|essential)\b|^拒绝|仅.*必要|只.*必要/i
const STAY = /^(stay|keep me) (signed|logged) in$|^(continue|extend)( my)?( session)?$|^i'?m still here$|^保持登录$|^继续(会话|使用|操作)?$|^延长/i
const DISMISS = /^(×|✕|✖|x|close|dismiss|got it|ok(ay)?|no,? thanks?|not now|maybe later|skip|关闭|知道了|我知道了|好的?|暂不|以后再说|跳过)$/i
const CONSENT = /accept|agree|allow|consent|opt.?in|同意|接受|允许/i
const ABOUT_PRIVACY = /cookie|privacy|consent|tracking|gdpr|隐私|追踪/i
const ABOUT_SESSION = /session|timed? ?out|expire|inactiv|signed out|logged out|会话|超时|过期|登录状态/i

export type OverlayChoice = { ok: true; index: number; how: "literal" | "jev" } | { ok: false; why: string }

export async function chooseOverlayButton(text: string, buttons: string[], ask?: Ask): Promise<OverlayChoice> {
  const labels = buttons.map((b) => b.replace(/\s+/g, " ").trim())
  const find = (re: RegExp) => labels.findIndex((l) => re.test(l))
  const privacy = ABOUT_PRIVACY.test(text)

  const decline = find(DECLINE)
  if (decline >= 0) return { ok: true, index: decline, how: "literal" }
  // Closing a notice is not agreeing to it (NTU: "privacy policy" | "Close"). "OK" / "Got it" on a privacy notice is.
  const close = privacy ? find(/^(×|✕|✖|x|close|dismiss|关闭)$/i) : -1
  if (close >= 0) return { ok: true, index: close, how: "literal" }
  if (ABOUT_SESSION.test(text)) {
    const stay = find(STAY)
    if (stay >= 0) return { ok: true, index: stay, how: "literal" }
  }
  const dismiss = find(DISMISS)
  if (dismiss >= 0) return { ok: true, index: dismiss, how: "literal" }
  // Nothing else to click: saying yes gets the form back, and saying yes is something the tool may now do.
  const accept = find(CONSENT)
  if (accept >= 0) return { ok: true, index: accept, how: "literal" }

  if (ask && labels.length) {
    const criteria: Record<string, string> = Object.fromEntries(labels.map((l, i) => [`b${i}`, `Click “${l}”`]))
    criteria.NONE = "None of them just gets the form back: it needs a decision about the application itself, or it discards work in progress"
    const answers = await ask(
      { overlay_text: text.slice(0, 600), buttons: labels },
      { pick: { type: "choice", instructions: "A pop-up is covering a form that an assistant is filling in for someone. Pick the button that gets the form back: closing or postponing the pop-up, keeping the session alive, or agreeing to its notice (terms, cookies, privacy — fine to accept). Never one that submits, pays, deletes, or abandons what is being filled in.", criteria } },
    )
    const answer = answers?.pick
    if (answer?.type === "choice" && answer.choice !== "NONE" && isConfident(answer)) {
      const index = Number(answer.choice.slice(1))
      if (labels[index]) return { ok: true, index, how: "jev" }
    }
  }
  return { ok: false, why: "看不出哪个按钮只是把它关掉" }
}
