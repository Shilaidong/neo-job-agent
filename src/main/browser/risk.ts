/**
 * The three things that always stay with the consultant: final submission, payment,
 * and sending recommender invitations. This is the only hard stop in the product —
 * a seatbelt on the click tool, not a policy engine. When a click target looks like one
 * of these, the consultant decides in the sidebar; everything else the model does freely.
 *
 * 2026-10-07 (用户拍板「该勾选、该确认按钮 make complete」): this file used to carry a second pair of
 * eyes — Jev re-judging every button the keywords let through, together with the text around it.
 * Real runs only ever logged its false positives ("French", "Use this institution", step links),
 * and the consultant asked for fewer interruptions, not more. Keywords only: the words for
 * submitting, paying and writing to a recommender are unmistakable; everything else is clicked.
 * The accepted gap: a bare "Continue" beside a fee notice now goes through unasked.
 */
export type RiskKind = "final_submit" | "payment" | "recommender_invite"

export type RiskMatch = { kind: RiskKind; label: string }

const SAFE = /\b(save|draft|next|continue|back|previous|cancel|close|add|edit|remove|delete|upload|search|log ?in|sign ?in)\b|保存|暂存|下一步|继续|上一步|返回|取消|关闭|添加|编辑|删除|上传|搜索|登录/i

const RULES: Array<{ kind: RiskKind; re: RegExp }> = [
  { kind: "payment", re: /\bpay(ment|\s+now)?\b|\bcheck\s?out\b|\bpurchase\b|\b(place|confirm|complete)\s+(your\s+|my\s+)?order\b|付款|支付|缴费|缴纳|结算|确认订单/i },
  {
    kind: "recommender_invite",
    // Bare "Send request" / "Resend" / "发送邀请": on an application site these are recommender emails far more often than anything else.
    re: /(send|invite|notify|request|email)\b.{0,40}(recommend|referee|reference)|(recommend|referee|reference).{0,40}\b(send|invite|invitation|request|notif)|\b(re-?send|send\s+(request|invitation|invite|reminder))\b|(发送|邀请|通知).{0,10}(推荐|推薦)|(推荐|推薦).{0,10}(发送|邀请|通知)|发送邀请|发送请求|重新发送|再次发送/i,
  },
  {
    kind: "final_submit",
    re: /\bsubmit\b|\bfinali[sz]e\b|\bfinish\b|\blodge\b|\bsign\s*(and|&)\s*submit\b|\bcertify\b|\b(complete|send|confirm)\s+(my\s+|your\s+|the\s+)?application\b|提交|递交|完成申请|确认申请|確認送出|确认送出/i,
  },
]

export function classifyRisk(label: string): RiskMatch | undefined {
  const text = label.replace(/\s+/g, " ").trim()
  if (!text) return undefined
  for (const rule of RULES) {
    if (!rule.re.test(text)) continue
    // "Save and submit later", "Submit search" etc. are ambiguous; payment and recommender wording is not.
    if (rule.kind === "final_submit" && SAFE.test(text) && !/\bapplication\b|申请/i.test(text)) return undefined
    return { kind: rule.kind, label: text }
  }
  return undefined
}

export const RISK_TITLES: Record<RiskKind, string> = {
  final_submit: "最终提交",
  payment: "付款",
  recommender_invite: "发送推荐信邀请",
}
