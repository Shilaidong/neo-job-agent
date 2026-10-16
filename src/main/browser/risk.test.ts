import { describe, expect, test } from "bun:test"
import { classifyRisk } from "./risk"

// The keyword rule is the whole fence since 2026-10-07: submission, payment, recommender invitations.
// The second pair of eyes (Jev over the surrounding text) was removed with it — see risk.ts.
describe("classifyRisk", () => {
  test("flags the three reserved actions", () => {
    expect(classifyRisk("Submit Application")?.kind).toBe("final_submit")
    expect(classifyRisk("Submit")?.kind).toBe("final_submit")
    expect(classifyRisk("提交申请")?.kind).toBe("final_submit")
    expect(classifyRisk("Pay Now")?.kind).toBe("payment")
    expect(classifyRisk("Proceed to Payment")?.kind).toBe("payment")
    expect(classifyRisk("支付申请费")?.kind).toBe("payment")
    expect(classifyRisk("Send to Recommender")?.kind).toBe("recommender_invite")
    expect(classifyRisk("Send Recommendation Request")?.kind).toBe("recommender_invite")
    expect(classifyRisk("邀请推荐人")?.kind).toBe("recommender_invite")
  })

  test("leaves ordinary form controls alone", () => {
    for (const label of ["Save", "Save & Continue", "Next", "Continue", "Add Institution", "Upload", "保存", "下一步", "Save and submit later", ""]) {
      expect(classifyRisk(label)).toBeUndefined()
    }
  })

  // Wordings a 36-label comparison against Jev showed the first version missed (docs/BROWSER.md).
  test("catches the same three actions under other names", () => {
    for (const label of ["Finish", "Complete Application", "I confirm – lodge my application", "确认无误，完成申请", "确认并递交"]) expect(classifyRisk(label)?.kind).toBe("final_submit")
    for (const label of ["Confirm order", "去缴费", "立即支付 ¥800", "Proceed to checkout"]) expect(classifyRisk(label)?.kind).toBe("payment")
    for (const label of ["Send Request", "Resend", "Notify referee", "发送邀请"]) expect(classifyRisk(label)?.kind).toBe("recommender_invite")
  })

  test("still leaves look-alikes alone", () => {
    for (const label of ["Save recommender", "Add Recommender", "保存推荐人信息", "Done", "Confirm", "Start new application", "Agree and continue", "Log in"]) {
      expect(classifyRisk(label)).toBeUndefined()
    }
  })

  test("saving wording does not excuse an application submit", () => {
    expect(classifyRisk("Save and Submit Application")?.kind).toBe("final_submit")
  })

  test("the accepted gap, pinned (2026-10-07): a bare “Continue” is not held up — the words on the button are all the fence reads", () => {
    expect(classifyRisk("Continue")).toBeUndefined()
  })
})
