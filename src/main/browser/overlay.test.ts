import { describe, expect, test } from "bun:test"
import type { JevAnswers } from "../jev-core"
import { chooseOverlayButton } from "./overlay"

const says = (choice: string, confidence = 0.95) => async (): Promise<JevAnswers> => ({ pick: { type: "choice", choice, confidence, probabilities: { [choice]: confidence } } })

describe("what to click on a pop-up that covers the form", () => {
  test("cookie banner: the most private option, never 'accept'", async () => {
    expect(await chooseOverlayButton("We use cookies to improve…", ["Accept all", "Reject non-essential", "Settings"])).toMatchObject({ index: 1 })
    expect(await chooseOverlayButton("我们使用 Cookie", ["全部接受", "仅使用必要 Cookie"])).toMatchObject({ index: 1 })
    expect(await chooseOverlayButton("We use cookies", ["Accept necessary cookies only", "Accept all"])).toMatchObject({ index: 0 })
  })
  // 2026-10-07 用户拍板：挡路的“我同意”现在归工具点——点不掉才是问题；decline 永远优先（上一条钉着）。
  test("a consent wall with no way to decline gets agreed — a wall the tool cannot click just stalls the form", async () => {
    expect(await chooseOverlayButton("By continuing you agree to our privacy policy", ["I agree"], says("b0"))).toEqual({ ok: true, index: 0, how: "literal" })
    expect(await chooseOverlayButton("This site uses cookies", ["OK"], says("b0"))).toMatchObject({ ok: true, index: 0 })
    // …and merely closing the notice still comes first when a close button exists (NTU's banner offers exactly this).
    expect(await chooseOverlayButton("Privacy Notice This site uses cookies… By continuing, you are agreeing", ["privacy policy", "Close"])).toMatchObject({ ok: true, index: 1 })
  })
  test("session warning: stay signed in", async () => {
    expect(await chooseOverlayButton("Your session will expire in 2 minutes", ["Log out", "Stay signed in"])).toMatchObject({ index: 1 })
    expect(await chooseOverlayButton("会话即将超时", ["退出", "继续"])).toMatchObject({ index: 1 })
  })
  test("plain notices: close", async () => {
    expect(await chooseOverlayButton("Applications for 2027 are now open!", ["Learn more", "×"])).toMatchObject({ index: 1 })
    expect(await chooseOverlayButton("系统将于周六维护", ["知道了"])).toMatchObject({ index: 0 })
  })
  test("unfamiliar wording goes to Jev; a confident pick is used, an unsure one is not", async () => {
    expect(await chooseOverlayButton("Take our survey?", ["Sure", "Nope"], says("b1"))).toEqual({ ok: true, index: 1, how: "jev" })
    expect(await chooseOverlayButton("Take our survey?", ["Sure", "Nope"], says("b1", 0.6))).toMatchObject({ ok: false })
    expect(await chooseOverlayButton("Take our survey?", ["Sure", "Nope"])).toMatchObject({ ok: false })
    // Consent wording never reaches Jev now: the literal rule agrees to it before the ask (2026-10-07).
    expect(await chooseOverlayButton("New terms of use", ["Accept and continue", "Read"], says("b0"))).toEqual({ ok: true, index: 0, how: "literal" })
  })
  test("'continue' only means 'stay' when the pop-up is about the session", async () => {
    expect(await chooseOverlayButton("You have unsaved changes. Leave this page?", ["Continue", "Cancel"])).toMatchObject({ ok: false })
  })
})
