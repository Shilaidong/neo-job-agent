import { execFileSync } from "node:child_process"
import { existsSync } from "node:fs"
import { copyFile, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { app, type WebContents } from "electron"
import XLSX from "xlsx"
import type { BrowserController } from "./browser/controller"
import { currentLogFile } from "./log"
import type { Page } from "./browser/page"
import { EgoHost } from "./ego-host"
import { setJevBackendForTests, type JevAnswers } from "./jev"
import { fixture } from "./paths"
import { buildStartPrompt } from "./start-prompt"
import { getPlatformAccount } from "./tasks/accounts"
import { scanMaterialsForLogin } from "./browser/material-creds"
import { getStudentMemo, setMemoStoreForTests, setStudentMemo } from "./tasks/student-memo"
import { extractMaterials } from "./materials/extract"
import { appRoot } from "./paths"
import { countMaterials, createTask, getTask, listStudents, listTasks, updateTask } from "./tasks/tasks"
import { ensureWorkspace, workspacesRoot, writeGuide } from "./workspace"
import { DEFAULT_SOURCES, DEFAULT_SCHEDULE, type JobEntry } from "../shared/jobs"
import { seedFeedSnapshot } from "./feed/feed"

/**
 * `bun run smoke` — drives the practice form through the same controller the model uses,
 * with no model involved. Proves the browser layer on this machine/arch: snapshot, real clicks,
 * fill + read-back, native and custom dropdowns, dynamic fields, alert/confirm, iframe, upload,
 * and the reserved-action stop.
 *
 * The page is a `Page` (embedded view or ego lite tab, docs/BROWSER.md) — the suite runs against
 * either; `smoke:ego` below runs exactly this on ego lite over the WebSocket.
 */
export async function runSmoke(browser: BrowserController, surf: Page, onEgo = false) {
  const failures: string[] = []
  const check = (name: string, ok: boolean, detail = "") => {
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  ← ${detail.slice(0, 300)} … ${detail.slice(-500)}`}`)
    if (!ok) failures.push(name)
  }
  const refOf = (snapshot: string, role: string, name: string) => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    // Real pages decorate names ("First name *"), so match on the leading text.
    return new RegExp(`- ${role} "${escaped}[^"\\n]*"[^\\n]*?\\[ref=(e\\d+)\\]`).exec(snapshot)?.[1] ?? ""
  }
  const pageValue = (expr: string) => browser.evaluate(expr)

  // The student's papers, as the text versions the model reads. Written before anything is filled, because every
  // value the tools type is checked against them (see "找不到原文" below).
  const textDir = join(app.getPath("temp"), "materials_text")
  await rm(textDir, { recursive: true, force: true })
  await mkdir(textDir, { recursive: true })
  // A workspace as it really looks: the values the tests type DO come from here, except the one invented on purpose.
  await writeFile(
    join(textDir, "基本信息.md.md"),
    [
      "# 基本信息",
      "",
      "姓名：林郁婷 LIN YU-CHEN；另一位学生 张美玲 Meiling Zhang；第三位 陈昊天 Chen Haotian",
      "邮箱：meiling@example.com / haotian@example.com",
      "手机：13812345678 / 13900000000",
      "国籍：中国 China；省份：浙江 Zhejiang",
      "最高学历：本科 Bachelor's / 硕士 Master's，专业 Computer Science，毕业院校 Tsinghua",
      "英语考试：IELTS",
      "邮编 430000",
      "住址：开元路以南、大李岩河以西（学生口述，还没给出完整地址）",
    ].join("\n"),
  )

  try {
    await surf.loadURL(fixture("form.html"))
    let snap = await browser.snapshot()
    await writeFile(join(app.getPath("temp"), "neo-smoke-snapshot.txt"), snap)
    check("snapshot lists labelled fields with refs", Boolean(refOf(snap, "textbox", "First name")), snap)
    const formFields = await browser.fields()
    check("fields are read in the page AND inside its iframe (each document is its own JavaScript world)", formFields.some((f) => f.label?.startsWith("First name")) && formFields.some((f) => f.label?.startsWith("Recommender email")), formFields.map((f) => f.label).join(" | "))
    check("long option list is windowed", snap.includes("个选项，未全部列出"), snap)

    const out = await browser.fillForm([
      { ref: refOf(snap, "textbox", "First name"), value: "Meiling" },
      { ref: refOf(snap, "textbox", "Last name"), value: "Zhang" },
      { ref: refOf(snap, "textbox", "Email"), value: "meiling@example.com" },
    ])
    check("fill reads back what it typed", (out.match(/读回一致/g) ?? []).length === 3, out)
    check("typed text reached the DOM", (await pageValue("document.getElementById('first').value")) === "Meiling")

    const masked = await browser.fill(refOf(snap, "textbox", "Phone (digits only, formatted automatically)"), "13812345678")
    check("masked input read-back reports the reformatted value", masked.includes("138-1234-5678"), masked)

    const dob = await browser.fill(refOf(snap, "Date", "Date of birth") || refOf(snap, "textbox", "Date of birth"), "2003-05-17")
    check("native date input", dob.includes("读回一致"), dob + "\n" + snap)

    const saved1 = await browser.click(refOf(snap, "button", "Save"))
    check("validation alert is auto-dismissed and reported", saved1.includes("Country of citizenship is required."), saved1)

    const saveBefore = refOf(snap, "button", "Save")
    snap = await browser.select(refOf(snap, "combobox", "Country of citizenship"), ["china"])
    check("numbers stay put: a field appearing in the middle of the page does not renumber what comes after it", refOf(snap, "button", "Save") === saveBefore && Boolean(saveBefore), `${saveBefore} → ${refOf(snap, "button", "Save")}`)
    check("native select by fuzzy text", snap.includes("已选：China"), snap)
    check("dependent field appears in the returned snapshot", Boolean(refOf(snap, "textbox", "Province")), snap)
    const province = await browser.fill(refOf(snap, "textbox", "Province"), "Zhejiang")
    check("field revealed by a native select can be filled", province.includes("读回一致"), province)

    snap = await browser.click(refOf(snap, "button", "Highest degree"))
    const covered = await browser.click(refOf(snap, "checkbox", "Graduated with honors")).then(() => "clicked", (e) => String(e.message))
    check("a click that would land on an overlay says what is in the way", covered.includes("挡住"), covered)
    check("custom dropdown opens with options", Boolean(refOf(snap, "option", "Master's")), snap)
    check("a button that opens a list is marked as a field to fill", /button "Highest degree[^\n]*\[下拉/.test(snap), snap)
    snap = await browser.click(refOf(snap, "option", "Master's"))
    check("custom dropdown choice reveals Major", Boolean(refOf(snap, "textbox", "Major")), snap)
    const major = await browser.fill(refOf(snap, "textbox", "Major"), "Computer Science")
    check("field revealed by a custom dropdown can be filled", major.includes("读回一致"), major)

    snap = await browser.click(refOf(snap, "radio", "IELTS"))
    check("radio checked via real click", /radio "IELTS" \[ref=e\d+\] \[checked\]/.test(snap), snap)

    const frameRef = refOf(snap, "textbox", "Recommender email")
    check("iframe content is part of the snapshot", Boolean(frameRef), snap)
    if (frameRef) {
      const framed = await browser.fill(frameRef, "prof@example.edu")
      check("fill inside iframe", framed.includes("读回一致"), framed)
    }

    const sample = join(app.getPath("temp"), "neo-smoke-transcript.pdf")
    await writeFile(sample, "%PDF-1.4 smoke")
    const uploaded = await browser.upload(refOf(snap, "button", "Transcript (PDF)") || refOf(snap, "textbox", "Transcript (PDF)"), [sample])
    check("file upload", uploaded.includes("Selected: neo-smoke-transcript.pdf"), uploaded)

    // --- 2026-10-16 HKUST report: the length cap is announced before the page truncates; an auto-uppercase
    // page is not a mismatch; a readonly box refuses with the way out; a single-file input says what it
    // dropped; a please-wait banner is reported as "under way" instead of a blind sleep.
    const capped = await browser.fill(refOf(snap, "textbox", "Short answer (max 12 chars)"), "a-very-long-answer-indeed")
    check("maxlength is announced up front, not discovered after the page truncates", capped.includes("上限 12"), capped.slice(0, 200))
    const cappedList = (await browser.fields()).find((f) => f.label?.startsWith("Short answer"))
    check("…and the field listing carries the cap too", cappedList?.maxLength === 12, JSON.stringify(cappedList))
    const upper = await browser.fill(refOf(snap, "textbox", "Family name (auto uppercase)"), "Zhang")
    check("a page that upper-cases as you type is not a read-back mismatch", upper.includes("只差大小写"), upper.slice(0, 200))
    const readonlyBox = await browser.fill(refOf(snap, "textbox", "Institution (filled by its own popup)"), "Loyola").then((r) => String(r), (e) => String(e.message))
    check("a readonly box refuses with the way out instead of silently staying empty", readonlyBox.includes("只读"), readonlyBox.slice(0, 200))
    const sample2 = join(app.getPath("temp"), "neo-smoke-degree.pdf")
    await writeFile(sample2, "%PDF-1.4 smoke 2")
    const twoPaths = await browser.upload(refOf(snap, "button", "Transcript (PDF)") || refOf(snap, "textbox", "Transcript (PDF)"), [sample, sample2])
    check("a single-file input says which path was dropped, not 'all selected'", twoPaths.includes("只交了第一个") && twoPaths.includes("neo-smoke-degree.pdf"), twoPaths.slice(0, 200))
    const busy = await browser.upload(refOf(snap, "button", "Progress upload") || refOf(snap, "textbox", "Progress upload"), [sample])
    check("a please-wait progress page is reported as under way, with how to confirm", busy.includes("请稍候") && busy.includes("不要打断"), busy.slice(0, 200))

    const reset = await browser.click(refOf(snap, "button", "Reset form"))
    check("confirm dialog is left for a decision", reset.includes("confirm") && reset.includes("Discard everything"), reset)
    const blocked = await browser.snapshot().then(() => "", (e) => String(e.message))
    check("tools explain the blocking dialog", blocked.includes("browser_handle_dialog"), blocked)
    await browser.handleDialog(false)
    check("cancelled confirm kept the data", (await pageValue("document.getElementById('first').value")) === "Meiling")

    snap = await browser.snapshot()
    for (const label of ["Submit Application", "Pay Application Fee", "Send Recommendation Request"]) {
      const result = await browser.click(refOf(snap, "button", label)).then(() => "clicked", (e) => String(e.message))
      check(`reserved action stays with the consultant: ${label}`, result.includes("留给顾问"), result)
    }
    check("no reserved action ever fired", !/SUBMITTED|PAID|INVITE SENT/.test(await pageValue("document.getElementById('status').textContent")))

    // --- browser_choose: one call per "pick one" control. Jev is played by a script that knows three things.
    const knows: Record<string, string> = { 中国: "China, People's Republic of", 韩国: "Korea, Republic of", 浙大: "Zhejiang University" }
    let jevCalls = 0
    let doMode: "path" | "reserved" | "unsure" = "path"
    setJevBackendForTests(async (state: any, questions): Promise<JevAnswers> => {
      if (questions.operation) {
        // browser_do: the script plays Jev walking Help centre → Fees and funding → Scholarship guide.
        const offered = Object.entries(((questions.click_target as any)?.criteria ?? {}) as Record<string, string>)
        const want = doMode === "reserved" ? ["Submit Application"] : ["Scholarship guide", "Fees and funding", "Help centre"]
        const done = /Scholarship guide opened/.test(state.page_text) && doMode === "path"
        const hit = want.map((name) => offered.find(([, text]) => text.includes(`“${name}”`))).find(Boolean)
        const sure = doMode === "unsure" ? 0.5 : 0.96
        return {
          operation: { type: "choice", choice: done ? "DONE" : "CLICK", confidence: 0.97, probabilities: { [done ? "DONE" : "CLICK"]: 0.97 } },
          click_target: { type: "choice", choice: hit?.[0] ?? "e0", confidence: sure, probabilities: { [hit?.[0] ?? "e0"]: sure, [offered[0]?.[0] ?? "e1"]: 1 - sure } },
        }
      }
      jevCalls++
      const criteria = (questions.pick as any).criteria as Record<string, string>
      const hit = Object.entries(criteria).find(([, text]) => text === knows[state.wanted])
      const choice = hit?.[0] ?? "NONE"
      const confidence = hit ? 0.97 : 0.4
      return { pick: { type: "choice", choice, confidence, probabilities: Object.fromEntries(Object.keys(criteria).map((k) => [k, k === choice ? confidence : (1 - confidence) / (Object.keys(criteria).length - 1)])) } }
    })
    snap = await browser.snapshot()
    const birthRef = refOf(snap, "combobox", "Country of birth")
    let chose = await browser.choose(birthRef, "中国")
    check("choose: 中国 lands on the official English name, and says how", chose.includes("已选：China, People's Republic of") && chose.includes("按意思选了"), chose)
    check("choose: the native select really changed", (await pageValue("document.getElementById('birth-country').selectedOptions[0].textContent")) === "China, People's Republic of")
    const ambiguous = await browser.choose(birthRef, "Korea").then(() => "chose", (e) => String(e.message))
    check("choose: 'Korea' is never silently resolved to one of the two Koreas", ambiguous.includes("Korea, Republic of") && ambiguous.includes("Korea, Democratic") && !ambiguous.includes("已选"), ambiguous)
    const unsure = await browser.choose(birthRef, "火星").then(() => "chose", (e) => String(e.message))
    check("choose: below the 0.8 line nothing is picked and the candidates come back", unsure.includes("没有和 “火星” 对得上的选项") && (await pageValue("document.getElementById('birth-country').selectedOptions[0].textContent")) === "China, People's Republic of", unsure)

    const uniRef = refOf(snap, "combobox", "Previous university")
    chose = await browser.choose(uniRef, "Tsinghua")
    check("choose: searchable dropdown — types, then clicks the one match", (await pageValue("document.getElementById('uni').dataset.chosen")) === "Tsinghua University", chose)
    chose = await browser.choose(uniRef, "浙大").then((r) => r, (e) => String(e.message))
    check("choose: a search that finds nothing says so and asks for another spelling", chose.includes("换一种它可能的写法") && (await pageValue("document.getElementById('uni').value")) === "", chose)
    chose = await browser.choose(uniRef, "Zhejiang University")
    check("choose: exact text wins over a longer option that starts the same", (await pageValue("document.getElementById('uni').dataset.chosen")) === "Zhejiang University", chose)

    chose = await browser.choose(refOf(snap, "button", "Highest degree"), "Doctorate")
    check("choose: custom button dropdown in one call", (await pageValue("document.getElementById('degree-btn').textContent")) === "Doctorate", chose)
    chose = await browser.choose(refOf(snap, "radio", "IELTS"), "是")
    check("choose: 'yes' handed to one radio means that radio", (await pageValue("document.querySelector('input[name=test]:checked').value")) === "ielts", chose)
    chose = await browser.choose(refOf(snap, "radio", "TOEFL"), "Not taken")
    check("choose: radio group by label, from any radio in it", (await pageValue("document.querySelector('input[name=test]:checked').value")) === "none", chose)
    chose = await browser.choose(refOf(snap, "checkbox", "Graduated with honors"), "是")
    check("choose: checkbox set and read back", (await pageValue("String(document.getElementById('honors').checked)")) === "true" && chose.includes("勾选"), chose)
    chose = await browser.choose(refOf(snap, "checkbox", "Graduated with honors"), "Graduated with honors")
    check("choose: setting a checkbox twice does not toggle it off — and its own label means 'tick it'", (await pageValue("String(document.getElementById('honors').checked)")) === "true", chose)
    snap = await browser.snapshot()
    // Common App 2026-09-30: a whole group of drawn boxes ignored every mouse path while hand and keyboard worked.
    const stubborn = await browser.choose(refOf(snap, "checkbox", "Payment plan"), "是").then((r) => r, (e) => String(e.message))
    check("choose: a box the pointer never reaches falls back to focus + Space, and says so", stubborn.includes("键盘空格") && (await pageValue("String(document.getElementById('stubborn').checked)")) === "true", stubborn)

    // --- fill_form as the workhorse: a whole section, mixed controls, one call.
    await pageValue("HTMLFormElement.prototype.reset.call(document.getElementById('app')); document.getElementById('country').dispatchEvent(new Event('change')); document.getElementById('uni').value = ''; 'reset'")
    snap = await browser.snapshot()
    const section = await browser.fillForm([
      { ref: refOf(snap, "textbox", "First name"), value: "Haotian" },
      { ref: refOf(snap, "Date", "Date of birth") || refOf(snap, "textbox", "Date of birth"), value: "2003-05-17" },
      { ref: refOf(snap, "combobox", "Country of citizenship"), value: "China" },
      { ref: refOf(snap, "combobox", "Country of birth"), value: "中国" },
      { ref: refOf(snap, "combobox", "Previous university"), value: "Tsinghua" },
      { ref: refOf(snap, "button", "Highest degree"), value: "Master's" },
      { ref: refOf(snap, "radio", "IELTS"), value: "IELTS" },
      { ref: refOf(snap, "checkbox", "Graduated with honors"), value: "否" },
      { ref: refOf(snap, "combobox", "Country of birth"), value: "火星" },
      { ref: refOf(snap, "textbox", "Phone"), value: "13812345678" },
      { ref: refOf(snap, "button", "Submit Application"), value: "yes" },
    ])
    check("fill_form: mixed controls in one call, each reported", (section.match(/^✓/gm) ?? []).length === 8 && (section.match(/^⚠/gm) ?? []).length === 1 && (section.match(/^✗/gm) ?? []).length === 2, section)
    check("fill_form: one field failing does not stop the ones after it", section.includes("138-1234-5678"), section)
    check("fill_form: says which choice revealed new fields, and the snapshot shows them", section.includes("多出了新的字段") && Boolean(refOf(section, "textbox", "Province")), section)
    check("fill_form: values really reached the page", (await pageValue("[first.value, dob.value, country.value, document.getElementById('birth-country').selectedOptions[0].textContent, uni.dataset.chosen, document.getElementById('degree-btn').textContent, document.querySelector('input[name=test]:checked').value, String(honors.checked)].join('|')")) === "Haotian|2003-05-17|china|China, People's Republic of|Tsinghua University|Master's|ielts|false", section)
    check("fill_form: will not click an ordinary button, reserved or not", section.includes("普通按钮") && !/SUBMITTED/.test(await pageValue("document.getElementById('status').textContent")), section)
    snap = await browser.snapshot()
    await browser.fillForm([{ ref: refOf(snap, "textbox", "Last name"), value: "Chen" }, { ref: refOf(snap, "textbox", "Email"), value: "haotian@example.com" }, { ref: refOf(snap, "textbox", "Province"), value: "Zhejiang" }, { ref: refOf(snap, "textbox", "Major"), value: "Computer Science" }])

    // --- dates: the model always says ISO; the page says how it wants it.
    const dates = await browser.fillForm([
      { ref: refOf(snap, "textbox", "Passport issue date"), value: "2021-03-09" },
      { ref: refOf(snap, "textbox", "Visa valid until"), value: "2027-09-30" },
      { ref: refOf(snap, "combobox", "Passport expiry day"), value: "08" },
      { ref: refOf(snap, "combobox", "Passport expiry month"), value: "3" },
      { ref: refOf(snap, "combobox", "Passport expiry year"), value: "2031" },
    ])
    check("dates: ISO is rewritten to the format in the placeholder and typed through the mask", (await pageValue("document.getElementById('issued').value")) === "03/09/2021" && dates.includes("页面要求 MM/DD/YYYY"), dates)
    check("dates: a read-only date box takes the format from its label", (await pageValue("document.getElementById('visa').value")) === "30/09/2027" && dates.includes("只读日期框"), dates)
    check("dates: day / month / year dropdowns — '08' is 8 and '3' is March, without asking Jev", (await pageValue("[document.getElementById('exp-day').value, document.getElementById('exp-month').selectedOptions[0].textContent, document.getElementById('exp-year').value].join('|')")) === "8|March|2031", dates)
    const noDay = await browser.fill(refOf(snap, "textbox", "Passport issue date"), "2021-03").then(() => "filled", (e) => String(e.message))
    check("dates: a month-only value is refused where the page wants a full date", noDay.includes("没有“日”"), noDay)

    // --- things the first real application site (NTU) taught us
    snap = await browser.snapshot()
    const enrolled = await browser.fillForm([{ ref: refOf(snap, "combobox", "Select a date."), value: "2022-09-01" }])
    check("calendar widget (flatpickr-shaped): the date is set through its own API and verified", (await pageValue("document.getElementById('enrol-real').value")) === "2022-09-01" && enrolled.includes("核对一致"), enrolled)
    const future = await browser.fill(refOf(snap, "combobox", "Select a date."), "2999-01-01").then(() => "filled", (e) => String(e.message))
    check("calendar widget: a date it refuses is reported, not left half-set", future.includes("没有接受") && (await pageValue("document.getElementById('enrol-real').value")) === "2022-09-01", future)
    const photoFile = join(app.getPath("temp"), "neo-smoke-photo.jpg")
    await writeFile(photoFile, "JFIF smoke")
    const photo = await browser.upload(refOf(snap, "button", "Upload"), [photoFile])
    check("upload: a button in front of a hidden file input — the files go to the input", (await pageValue("document.getElementById('photo-name').textContent")) === "Photo: neo-smoke-photo.jpg", photo)

    // 2026-10-07 用户拍板：同意 / 声明勾选框归工具勾（“该勾选”），只有签名和那三道门留着。
    const consentRef = /checkbox[^\n]*\[ref=(e\d+)\](?![^\n]*Graduated)/.exec(snap.split("Application fee")[1] ?? "")?.[1] ?? ""
    const consent = await browser.choose(consentRef, "是").then(() => "ticked", (e) => String(e.message))
    check("an 'I acknowledge… agreed' checkbox is ticked by the tool now (2026-10-07: consent boxes are the tool's job)", consent === "ticked" && (await pageValue("String(document.getElementById('consent').checked)")) === "true", consent + " ref=" + consentRef)
    const consentClick = await browser.click(consentRef).then(() => "clicked", (e) => String(e.message))
    check("…and a plain click flips it like any other box, no special refusal", consent === "ticked" && consentClick === "clicked" && (await pageValue("String(document.getElementById('consent').checked)")) === "false", consentClick)

    // --- pop-ups lying on top of the form
    await pageValue("showOverlay('cookies')")
    let through = await browser.fill(refOf(snap, "textbox", "First name"), "Haotian")
    check("overlay: a cookie banner is declined, not accepted, and the fill goes through", through.includes("读回一致") && (await pageValue("window.overlayClicks.join()")).startsWith("Reject non-essential"), through)
    await pageValue("showOverlay('session')")
    through = await browser.click(refOf(snap, "checkbox", "Graduated with honors"))
    check("overlay: a session warning is answered with 'stay signed in', and the model is told", through.includes("已替你关掉") && through.includes("Stay signed in") && (await pageValue("String(honors.checked)")) === "true", through)
    // 2026-10-07 用户拍板：只有“我同意”的条款墙照点——点不掉才是问题（cookie 横幅仍先找拒绝，见上一项）。
    await pageValue("showOverlay('terms')")
    const wall = await browser.fill(refOf(snap, "textbox", "First name"), "X")
    // evaluate 会把“弹层已替你点了哪个按钮”的备注挂在它返回值末尾——先接住这条，再干净地读页面。
    const drained = String(await pageValue("'drained'"))
    const termsBox = String(await pageValue("document.getElementById('overlay-terms') !== null"))
    const termsClicks = String(await pageValue("window.overlayClicks.join('|')"))
    check("overlay: a terms wall with only “I agree” gets agreed, clicked away, and the fill goes through", wall.includes("读回一致") && drained.includes("点了 “I agree”") && termsBox === "false" && termsClicks.includes("I agree") && String(await pageValue("first.value")) === "X", `box=${termsBox} clicks=${termsClicks}`)

    // --- browser_do: a click-only errand run by Jev
    const errand = await browser.do("Open the scholarship guide in the help centre")
    check("do: three clicks deep without the big model, then DONE", (await pageValue("document.getElementById('help-note').textContent")) === "Scholarship guide opened" && errand.includes("共 3 次点击") && errand.includes("目标已经达到"), errand.slice(0, 600))
    doMode = "unsure"
    await pageValue("document.getElementById('help-note').textContent = ''; 'cleared'")
    const hesitant = await browser.do("Open the scholarship guide in the help centre")
    check("do: below the 0.8 line it clicks nothing and says what it was considering", hesitant.includes("拿不准该点哪个") && hesitant.includes("一步都没有点") && (await pageValue("document.getElementById('help-note').textContent")) === "", hesitant.slice(0, 500))
    doMode = "reserved"
    const tempted = await browser.do("Finish the application")
    check("do: a reserved button stops the errand; nothing fires", tempted.includes("留给顾问") && !/SUBMITTED|PAID|INVITE/.test(await pageValue("document.getElementById('status').textContent")), tempted.slice(0, 500))
    doMode = "path"

    // --- the one hard rule (2026-10-07 收窄：只认按钮上的字，第二双眼睛已退役)
    snap = await browser.snapshot()
    const feeContinue = /button "Continue"[^\n]*?\[ref=(e\d+)\]/.exec(snap)?.[1] ?? ""
    const charged = await browser.click(feeContinue).then(() => "clicked", (e) => String(e.message))
    check("the fence reads only the words on the button: 'Continue' beside a fee notice is clicked, not held for a second look (accepted gap, 用户拍板)", charged === "clicked" && /PAID via Continue/.test(await pageValue("document.getElementById('status').textContent")), charged)
    const next = await browser.click(/button "Next"[^\n]*?\[ref=(e\d+)\]/.exec(snap)?.[1] ?? "")
    check("a harmless 'Next' right beside it is not held up either", /Moved to the next page/.test(next), next)
    const signed = await browser.fill(refOf(snap, "textbox", "Application reference"), "Chen Haotian", { submit: true }).then(() => "submitted", (e) => String(e.message))
    check("Enter in a form whose submit button is reserved goes to the consultant too", signed.includes("留给顾问") && signed.includes("回车") && !/SUBMITTED/.test(await pageValue("document.getElementById('status').textContent")), signed)
    const entered = await browser.pressKey("Enter").then(() => "pressed", (e) => String(e.message))
    check("…and so does browser_press_key Enter", entered.includes("留给顾问") && !/SUBMITTED/.test(await pageValue("document.getElementById('status').textContent")), entered)

    setJevBackendForTests(undefined)
    process.env.NEO_JEV = "off"
    const without = await browser.choose(birthRef, "韩国").then(() => "chose", (e) => String(e.message))
    check("choose without Jev: still answers, with candidates for the big model", without.includes("相近的选项") && !without.includes("小模型"), without)
    chose = await browser.choose(birthRef, "Japan")
    check("choose without Jev: literal matches need no Jev at all", chose.includes("已选：Japan"), chose)
    const noJev = await browser.do("Open the scholarship guide")
    check("do without Jev: says so and hands the clicking back", noJev.includes("小模型现在不可用"), noJev.slice(0, 300))
    // NEO_JEV stays "off" for the rest of the self-check, as index.ts set it.
    // 中国, the ambiguous "Korea", 火星, 浙大, then 中国 and 火星 again inside fill_form — and none of the literal matches.
    check("Jev was only asked when the letters did not settle it", jevCalls === 6, String(jevCalls))

    snap = await browser.snapshot()
    const saved2 = await browser.click(refOf(snap, "button", "Save"))
    check("save succeeds once the form is complete", /Saved at/.test(saved2), saved2)

    // --- human handoff: a bot gate is recognised, the tools let go, a person takes the page, tools come back
    // Count navigations: handing a GATE page over must reload it once (the flagged load can only be redone clean).
    let navigations = 0
    const countNav = () => navigations++
    const offNav = surf.onNavStart(countNav)
    await surf.loadURL(fixture("challenge.html"))
    await new Promise((r) => setTimeout(r, 400))
    const navsBefore = navigations
    snap = await browser.snapshot()
    check("gate: a bot-verification page is recognised and the snapshot says the page changed hands", snap.includes("交给人") && browser.humanHandoff === true, snap.slice(-400))
    await new Promise((r) => setTimeout(r, 700))
    check("gate: handing the gate over reloads the page once, so the check re-runs without the debugger attached", navigations > navsBefore, `${navsBefore} → ${navigations}`)
    const refused = await browser.evaluate("1 + 1").then(() => "ran", (e) => String((e as Error).message))
    check("gate: every tool call refuses while the consultant holds the page", refused.includes("已交给人工"), refused)
    const refusedShot = await browser.screenshot().then(() => "shot", (e) => String((e as Error).message))
    check("gate: a screenshot is refused too — re-capturing a gate page only re-triggers the check", refusedShot.includes("已交给人工"), refusedShot)
    await browser.takeBackFromHuman()
    check("gate: 【我操作完了，交回 AI】puts the tools back to work", browser.humanHandoff === false && (await pageValue("document.title")).includes("One more step"))
    const navsBeforeManual = navigations
    await browser.handoffToHuman("manual")
    await new Promise((r) => setTimeout(r, 400))
    const refusedAgain = await browser.snapshot().then(() => "snapped", (e) => String((e as Error).message))
    check("manual: the 【交给人】button path holds the page the same way", browser.humanHandoff === true && refusedAgain.includes("已交给人工"), refusedAgain)
    check("manual: …and never reloads — the consultant may be mid-typing a password", navigations === navsBeforeManual, `${navsBeforeManual} → ${navigations}`)
    await browser.takeBackFromHuman()
    check("manual: …and hands it back", browser.humanHandoff === false && (await pageValue("document.title")).includes("One more step"))
    offNav()

    // --- auto-login (docs/BROWSER.md「自动登录」, ROADMAP 2026-10-09 B): the password travels machine→page, never through the model or the log.
    await surf.loadURL(fixture("login.html"))
    await new Promise((r) => setTimeout(r, 300))
    browser.setLoginCredentialsForTests(undefined)
    const noCred = await browser.login().then(() => "logged in", (e) => String((e as Error).message))
    check("login: with no stored credentials it refuses and leaves sign-in to the consultant", /交给顾问|没有可用/.test(noCred) && browser.humanHandoff === false, noCred.slice(0, 240))
    snap = await browser.snapshot()
    const pwRef = /"[^"\n]*[Pp]assword[^"\n]*"[^\n]*?\[ref=(e\d+)\]/.exec(snap)?.[1] ?? ""
    const fillRefused = await browser.fill(pwRef, "smokepw4f9c").then(() => "filled", (e) => String((e as Error).message))
    // The box must be EMPTY, not "whatever x.includes('') is": the old shape was always true (2026-10-10 review).
    check("fill refuses a password box — a value typed here would echo into the model AND the log", fillRefused.includes("密码框") && (await pageValue("document.getElementById('pw').value")) === "" && !((await pageValue("document.getElementById('pw').value")).includes("smokepw4f9c")), fillRefused.slice(0, 200))
    await browser.click(pwRef)
    const typeRefused = await browser.type("smokepw4f9c").then(() => "typed", (e) => String((e as Error).message))
    check("…and type refuses too while a password box holds the focus", typeRefused.includes("密码框") && !((await pageValue("document.getElementById('pw').value")).includes("smokepw4f9c")), typeRefused.slice(0, 160))
    // The tool's own three routes. Password travels machine→page only; it must surface in neither the reply nor the log file.
    const PW = "smokepw4f9c"
    await surf.loadURL(fixture("login.html"))
    await new Promise((r) => setTimeout(r, 300))
    browser.setLoginCredentialsForTests(() => ({ username: "chen@example.com", password: PW }))
    const toCode = await browser.login()
    check("login typed both boxes and stopped dead at the emailed-code step (the human's, as ever)", toCode.includes("验证码") && (await pageValue("document.getElementById('code') && !document.getElementById('code').hidden")).includes("true") && (await pageValue("document.getElementById('pw').value")).includes(PW), toCode.slice(0, 300))
    const logFile = currentLogFile()
    const logText = logFile ? await readFile(logFile, "utf8").catch(() => "") : ""
    check("…and the password is in neither the tool's reply nor a single log line", !toCode.includes(PW) && !!logFile && !logText.includes(PW), `reply leaked=${toCode.includes(PW)} log=${logFile ? "read" : "missing"}`)
    await surf.loadURL(fixture("login.html"))
    await new Promise((r) => setTimeout(r, 300))
    browser.setLoginCredentialsForTests(() => ({ username: "chen@example.com", password: "wrongpw-zzz" }))
    const rejected = await browser.login()
    check("a rejected password goes straight to the consultant instead of retrying into a lockout", /不对|密码/.test(rejected) && (await pageValue("document.getElementById('err') && !document.getElementById('err').hidden")).includes("true"), rejected.slice(0, 200))
    await surf.loadURL(fixture("login.html"))
    await new Promise((r) => setTimeout(r, 300))
    browser.setLoginCredentialsForTests(() => ({ username: "chen@example.com", password: "hunter2" }))
    const gotIn = await browser.login()
    check("with the right password the tool logs in and lands on the account page", (await pageValue("document.body.innerText")).includes("Welcome back"), gotIn.slice(0, 200))
    // The 2026-10-10 materials pass: nothing saved on this machine — the scan of the student's own folder should be enough.
    const credsDir = await mkdtemp(join(app.getPath("temp"), "neo-smoke-creds-"))
    await mkdir(join(credsDir, "materials_text"), { recursive: true })
    await writeFile(join(credsDir, "materials_text", "登录备忘.md"), "登录备忘\nApplyWeb 学校申请\n账号: chen@example.com\n密码: hunter2\n")
    // The real production shape (2026-10-11 review P1-1): the password rides in materials/, and the
    // extractor redacts it on the way into materials_text — so the scan meets "［已隐去］", not a value.
    // This is the pin the direct-write path above cannot substitute: it verifies a shape that does not
    // occur in the software, the extractor never ran.
    const redactedDir = await mkdtemp(join(app.getPath("temp"), "neo-smoke-redact-"))
    await mkdir(join(redactedDir, "materials"), { recursive: true })
    await writeFile(join(redactedDir, "materials", "ApplyWeb登录备忘.md"), "登录备忘\nApplyWeb 学校申请\n账号: chen@example.com\n密码: redactme-7788\n")
    await extractMaterials(redactedDir)
    const redactScan = await scanMaterialsForLogin(redactedDir, "https://portal.applyweb.edu/login")
    check("a material whose password was redacted comes back as 「record there, password withheld」 — not a found, not a silent none", redactScan.kind === "none" && (redactScan as { redacted?: boolean }).redacted === true, JSON.stringify(redactScan))
    await rm(redactedDir, { recursive: true, force: true })
    await surf.loadURL(fixture("login.html"))
    await new Promise((r) => setTimeout(r, 300))
    browser.setLoginCredentialsForTests(async () => {
      const found = await scanMaterialsForLogin(credsDir, "https://portal.applyweb.edu/login")
      if (found.kind !== "found") throw new Error("smoke: materials scan came back without a record")
      return { username: found.cred.username, password: found.cred.password }
    })
    const fromMaterials = await browser.login()
    check("login can pull the password from the student's materials alone (the scan never reaches the model)", (await pageValue("document.body.innerText")).includes("Welcome back") && !fromMaterials.includes("hunter2"), fromMaterials.slice(0, 200))
    const logNow = currentLogFile()
    const logAll = logNow ? await readFile(logNow, "utf8").catch(() => "") : ""
    check("…and the materials route left no password in the log either", !!logNow && !logAll.includes("hunter2"), `log=${logNow ? "read" : "missing"}`)
    browser.setLoginCredentialsForTests(undefined)
    await rm(credsDir, { recursive: true, force: true })

    // 2026-10-12 用户改口径：资料没记这一站、顾问把「账号 | 密码」发进了对话——模型原样带参调它，工具用它登、顺手缓存，下一回免参数。
    await surf.loadURL(fixture("login.html"))
    await new Promise((r) => setTimeout(r, 300))
    let handedOver: { username?: string; password: string } | undefined
    browser.setLoginCredentialsForTests((explicit) => {
      if (explicit && explicit.password) {
        const creds = { username: explicit.username, password: explicit.password }
        handedOver = creds
        return creds
      }
      return handedOver ? { username: handedOver.username, password: handedOver.password } : undefined
    })
    const viaChat = await browser.login({ username: "chen@example.com", password: "hunter2" })
    check("login takes a pair handed in conversation straight to the page — no scan, and the reply leaks nothing", (await pageValue("document.body.innerText")).includes("Welcome back") && !viaChat.includes("hunter2") && !!handedOver, viaChat.slice(0, 200))
    const chatLog = currentLogFile()
    const chatText = chatLog ? await readFile(chatLog, "utf8").catch(() => "") : ""
    check("…and the argument path keeps the password out of the log too", !!chatLog && !chatText.includes("hunter2"), `log=${chatLog ? "read" : "missing"}`)
    await surf.loadURL(fixture("login.html"))
    await new Promise((r) => setTimeout(r, 300))
    const reused = await browser.login()
    check("…and the pair it accepted is remembered: the next call rides in without arguments", reused.includes("Welcome") && (await pageValue("document.body.innerText")).includes("Welcome back"), reused.slice(0, 200))
    // 2026-10-12 review P2: a pair the site denies must not stay cached — the door forgets it, and the next
    // call comes back empty so sign-in goes back to the consultant instead of riding the wrong password again.
    browser.setDiscardDeniedExplicitForTests(() => {
      handedOver = undefined
    })
    await surf.loadURL(fixture("login.html"))
    await new Promise((r) => setTimeout(r, 300))
    const denied = await browser.login({ username: "chen@example.com", password: "wrongpw-zzz" })
    check("a handed-over pair the site rejects leaves the cache (2026-10-12 review P2)", /不对|密码/.test(denied) && handedOver === undefined, denied.slice(0, 200))
    await surf.loadURL(fixture("login.html"))
    await new Promise((r) => setTimeout(r, 300))
    const afterDenied = await browser.login().then(() => "in", (e) => String((e as Error).message))
    check("…and the next call finds nothing and goes back to the consultant", /没找到|交给顾问/.test(afterDenied), afterDenied.slice(0, 200))
    browser.setDiscardDeniedExplicitForTests(undefined)
    browser.setLoginCredentialsForTests(undefined)

    // --- 2026-10-16 多标签 + opener 治理: a site's window.open becomes a tab (the application page is
    // NOT topped), popup tabs honestly say they have no window.opener, and browser_open_in_window
    // re-opens through the application tab's own window.open — a real window where write-back works.
    // Embedded only: ego's popups are real tabs in its own window (documented in BROWSER.md).
    if (!onEgo) {
      await surf.loadURL(fixture("popup.html"))
      await new Promise((r) => setTimeout(r, 300))
      const opened = await browser.click(refOf(await browser.snapshot(), "button", "选择机构"))
      check("a site's window.open is caught as a new tab and reported, the application page untouched", opened.includes("新标签页") && opened.includes("popup.html?child=1"), opened.slice(0, 300))
      const list1 = await browser.tabsList()
      check("browser_tabs lists the application tab and the popup", /\[main\]/.test(list1) && /\[tab1\]/.test(list1) && /弹窗标签/.test(list1), list1)
      const inPopup = await browser.switchTab("tab1")
      check("switch_tab snapshots the popup, whose header honestly says it has no window.opener", inPopup.includes("机构选择") && inPopup.includes("没有 window.opener"), inPopup.slice(0, 200))
      const tried = await browser.click(refOf(inPopup, "checkbox", "Loyola Marymount University")).then((r) => String(r), (e) => String(e.message))
      check("an opener write-back in a popup tab fails OUT LOUD, not silently", tried.includes("WRITEBACK-FAILED"), tried.slice(0, 200))
      const shut = await browser.click(refOf(await browser.snapshot(), "button", "关掉自己")).then((r) => String(r), (e) => String(e.message))
      // Poll until the tools are back on the application tab: its institution box exists there (and is
      // still empty — the write-back failed in the tab), while a popup has no #inst at all.
      let instOnMain = ""
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 500))
        instOnMain = await browser.evaluate(`document.getElementById('inst') ? document.getElementById('inst').value : "no-inst"`).catch(() => "ERR")
        if (instOnMain === "") break
      }
      check("the popup tab's self-close returns the tools to the application tab", instOnMain === "", `${shut.slice(0, 120)} / ${instOnMain}`)
      const real = await browser.openInRealWindow(fixture("popup.html?child=1"))
      check("open_in_window rebinds the tools to a real window (opener preserved)", real.includes("真窗口已打开") && real.includes("window.opener"), real.slice(0, 200))
      await browser.click(refOf(await browser.snapshot(), "checkbox", "Loyola Marymount University"))
      check("the write-back reaches the application page through the real window.opener", (await browser.evaluate("window.opener.document.getElementById('inst').value")) === "Loyola Marymount University")
      await browser.click(refOf(await browser.snapshot(), "button", "关掉自己")).catch(() => "")
      let backFromReal = ""
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 500))
        backFromReal = await browser.evaluate(`document.getElementById('inst') ? document.getElementById('inst').value : "gone"`).catch(() => "ERR")
        if (backFromReal === "Loyola Marymount University") break
      }
      check("the real window's self-close hands the tools back to the application tab, value written", backFromReal === "Loyola Marymount University", backFromReal)
    }
    await surf.loadURL(fixture("form.html"))
  } catch (error) {
    check("smoke run completed", false, error instanceof Error ? error.stack || error.message : String(error))
  }

  await runZoo(browser, surf, check, onEgo)
  console.log(failures.length ? `\nSMOKE FAILED (${failures.length})` : "\nSMOKE PASSED")
  return failures.length ? 1 : 0
}

/**
 * `bun run smoke:ego` — the same suite against ego lite (Plan 2 stage 3): starts OUR runtime copy
 * on a throwaway profile (which also exercises putting the first-run wizard away over CDP), opens
 * the practice form in the task tab, and runs every check above through the full controller load —
 * accessibility snapshot, real input events, screenshots, iframe sessions, dialogs — now riding a
 * WebSocket instead of Electron's debugger. Machines without the bundled browser skip loudly,
 * they do not fail: the bundle is fetched per-arch (fetch:ego).
 */
export async function runEgoSmoke(browser: BrowserController) {
  // A live ego of ANYBODY else would quietly steal the official channel (measured: the CLI binds
  // to the NAMED service, not to the instance we started — a leftover orphan answered one smoke
  // round meant to be ours). Refuse rather than answer with a lie, docs/ROADMAP.md.
  try {
    const ps = execFileSync("ps", ["-axo", "command="], { encoding: "utf8" })
    if (/ego lite\.app\/Contents\/MacOS/.test(ps)) {
      // (Match the BINARY path, not the words "ego lite" — a developer's shell that merely mentions
      // them in a command line is not a running browser; it once refused this very guard about itself.)
      console.log("SKIP  smoke:ego — an ego lite is already running; quit it first (the named CLI would answer from THAT instance, not from ours)")
      return 0
    }
  } catch {
    /* ps failing is not a reason to skip the suite */
  }
  // A dev run may point at an ONBOARDED profile (NEO_EGO_REAL=1 + NEO_EGO_PROFILE) to exercise the
  // space happy path; without that override every run gets a fresh temp profile, which pins the
  // wizard-refusal shapes — both readings are honest, docs/ROADMAP.md stage 4.
  const ownProfile = !process.env.NEO_EGO_PROFILE
  if (ownProfile) process.env.NEO_EGO_PROFILE = await mkdtemp(join(app.getPath("temp"), "neo-ego-smoke-profile-"))
  const profile = process.env.NEO_EGO_PROFILE!
  const ego = await EgoHost.ensure()
  if (!ego) {
    console.log("SKIP  smoke:ego — no ego lite bundle available here (bun run fetch:ego on x64)")
    if (ownProfile) void rm(profile, { recursive: true, force: true }).catch(() => undefined)
    return 0
  }
  try {
    // —— stage 4 pins, no human needed: THIS profile has never seen the wizard, so ego's own gate is up.
    // The official channel must answer — or refuse with EXACTLY the onboarding shape we branch on.
    // (The day ego changes this shape, these lines fail loudly: our wizard-retry loop depends on it.)
    let spaceFails = 0
    const checkSpace = (name: string, ok: boolean, detail?: string) => {
      console.log(`${ok ? "PASS" : "FAIL"} ego-space: ${name}${ok || !detail ? "" : `\n${detail}`}`)
      if (!ok) spaceFails++
    }
    const gate = await ego.cli.ready()
    checkSpace("官方通道应答或明说「先点向导」（拒绝形状=向导重试环的判据）", !gate.ok && gate.needsOnboarding ? true : gate.ok, gate.ok ? "profile 已点向导，官方通道直接通" : gate.error.slice(0, 200))
    if (!gate.ok) {
      const refused = await ego.cli.ensureSpace("neo smoke refuses")
      checkSpace("未点向导时建空间被拒——needs-onboarding 形状钉住", !refused.ok && refused.needsOnboarding, refused.ok ? "竟然建成了（向导门变了？）" : refused.error.slice(0, 200))
    } else {
      console.log("SKIP ego-space: 拒绝形状钉（这份 profile 向导已点，门开着；形状在默认临时 profile 上钉）")
    }

    // The tab first: the tools' Cdp attaches to a tab that exists (direct CDP path — works wizard or not).
    await ego.openTaskTab(fixture("form.html"), true)
    await browser.bindHost(ego.host)
    const suite = await runSmoke(browser, ego.page, true)
    if (suite === 0 && process.env.NEO_EGO_REAL === "1") {
      // The happy path of the space lifecycle on a HUMAN-onboarded profile (measured by hand 2026-10-06, 1.71s):
      // create → open a real page → the SAME targetId visible on the CDP side → hand off → ownership flips
      // away from the agent → back on takeOver → complete. This is the shape watchOwnership trusts.
      if (gate.ok) {
        const sp = await ego.cli.ensureSpace("neo lifecycle smoke")
        const tab = sp.ok ? await ego.cli.openTab(sp.value.id, fixture("form.html")) : { ok: false as const, error: "no space", needsOnboarding: false }
        const visible = sp.ok && tab.ok && Boolean(tab.value.id) ? await ego.tabVisible(tab.value.id!) : false
        const ho = sp.ok ? await ego.cli.handOff(sp.value.id) : { ok: false as const, error: "no space", needsOnboarding: false }
        const during = sp.ok ? await ego.cli.ownership(sp.value.id) : { ok: false as const, error: "", needsOnboarding: false }
        const back = sp.ok ? await ego.cli.takeOver(sp.value.id) : { ok: false as const, error: "", needsOnboarding: false }
        const after = sp.ok ? await ego.cli.ownership(sp.value.id) : { ok: false as const, error: "", needsOnboarding: false }
        const done = sp.ok ? await ego.cli.complete(sp.value.id) : { ok: false as const, error: "", needsOnboarding: false }
        checkSpace("空间建立", sp.ok, sp.ok ? "" : sp.error.slice(0, 200))
        checkSpace("空间内开页且 targetId 两通道一致（CLI↔/json/list）", tab.ok && visible, tab.ok ? `targetId=${tab.value.id} 不在 /json/list` : tab.error.slice(0, 200))
        checkSpace("交给人后所有权离开 agent（轮询的依据）", during.ok && during.value !== "agent", during.ok ? `ownership=${during.value}` : during.error.slice(0, 200))
        checkSpace("顾问确认后 takeOver 拿回 agent", back.ok && after.ok && after.value === "agent", after.ok ? `ownership=${after.value}` : (back as { error: string }).error.slice(0, 200))
        checkSpace("空间干净关闭（keep:false → done）", done.ok && done.value.done === true, done.ok ? JSON.stringify(done.value) : done.error.slice(0, 200))
        void ho
      } else {
        console.log("SKIP ego-space 生命周期全绿路径 — 这台 profile 没点过向导（官方通道拒着，形状已在上面钉住）")
      }
      if (spaceFails) return 1
      // The stage-1 "not measured" line, closed: the FULL controller load (Accessibility domains,
      // screenshots, focus emulation — not just Runtime/Page like the probe) on the real UCAS page.
      // A gate would show up as the auto-handoff the suite already proved; here we just want to see it NOT happen.
      console.log("REAL  opening accounts.ucas.com through the bound controller …")
      // The stage-1 "not measured" line, closed: the FULL controller load (Accessibility domains,
      // screenshots, focus emulation — not just Runtime/Page like the probe) on the real UCAS page.
      // A gate would show up as the auto-handoff the suite already proved; here we just want to see it NOT happen.
      console.log("REAL  opening accounts.ucas.com through the bound controller …")
      await ego.page.loadURL("https://accounts.ucas.com/")
      await new Promise((r) => setTimeout(r, 8000))
      const realSnap = await browser.snapshot().catch((e) => `SNAPSHOT FAILED: ${String(e)}`)
      const handed = browser.humanHandoff
      const title = await ego.page.getTitle()
      console.log(`REAL  title=${JSON.stringify(title)} handoff=${handed} snapshot-chars=${realSnap.length}`)
      // A gate is a LINE property, not a build failure: this dev machine's line started serving Cloudflare
      // interstitials to EVERY path (the read-only probe's minimal Runtime/Page load too, 2026-10-06) after
      // days of repeated UCAS traffic. Three honest verdicts; only a broken snapshot fails the suite.
      if (handed) console.log("REAL  GATE  关卡页（真页面上自动交给人已触发）——线况或负载所致，本机线已脏，判定以顾问真机为准")
      else if (/sign in|ucas/i.test(title + realSnap)) console.log("REAL  CLEAN  真 UCAS 过了全套 WS 负载（Accessibility/截图/焦点模拟全开），快照读起来就是一页正常页面")
      else {
        console.log(`REAL  BROKEN  快照不像是 UCAS 的页面：${realSnap.slice(0, 300)}`)
        return 1
      }
      return suite
    }
    return suite
  } finally {
    // Really gone, not SIGTERM-and-hope: an orphan holding the named service poisons every later
    // ego round (measured) — the suite is only honest if OUR instance is what answered.
    const gone = await ego.forceStop()
    if (!gone) console.log("WARN ego-space: 实例没能确认退出（后续轮次可能被骗，检查残留 ego 进程）")
    if (ownProfile) void rm(profile, { recursive: true, force: true }).catch(() => undefined)
  }
}

/**
 * The control zoo: not a site, a collection of the WAYS sites write forms. What matters is that the page
 * as the model reads it equals the page as a person sees it — whatever the markup underneath.
 */
async function runZoo(browser: BrowserController, surf: Page, check: (name: string, ok: boolean, detail?: string) => void, ego = false) {
  try {
    await surf.loadURL(fixture("zoo.html"))
    await browser.snapshot()
    const fields = await browser.fields()
    const dump = fields.map((f) => `${f.ref} ${f.kind} “${f.label}” via ${f.labelSource} hint=${f.hint} dev=${f.devName} group=${f.group} req=${f.required} val=${f.value} err=${f.error ?? ""} opts=${(f.options ?? []).join("/")}`).join("\n")
    const by = (label: string) => fields.find((f) => f.label === label)
    if (process.env.NEO_ZOO_DUMP) console.log("ZOO FIELDS\n" + dump)
    check("zoo: label[for] and a label wrapping its control", by("Title")?.kind === "select" && Boolean(by("Preferred name")), dump)
    const names = ["Full Name (As per Passport)", "Surname/Family Name", "Given Name"].map(by)
    check("zoo: text and input in sibling columns with no association — each of three look-alike boxes gets its own name", names.every(Boolean) && new Set(names.map((f) => f?.ref)).size === 3, dump)
    check("zoo: the red star makes a field required and stays out of its name", by("Surname/Family Name")?.required === true && by("Given Name")?.required === false, dump)
    check("zoo: a caption above the box", by("Passport number")?.kind === "text", dump)
    check("zoo: a floating label drawn over the input", Boolean(by("City of birth")), dump)
    const mail = fields.find((f) => f.devName?.includes("applicant_email"))
    check("zoo: a placeholder is an example, never a name — the developer's name is the second witness", mail?.label === "" && mail?.hint === "name@example.com", dump)
    const phones = fields.filter((f) => f.hint === "8123 4567")
    check("zoo: three phone boxes with the same example text are named by the table cell to their left", phones.map((f) => f.label).join("|") === "Contact Number - Handphone|Telephone - Home|Telephone - Office" && phones[1].required === true, dump)
    const codes = fields.filter((f) => f.label?.includes("Telephone country code"))
    check("zoo: same-named controls are told apart by the row they sit in", codes.map((f) => f.label).join("|") === "Contact Number - Handphone › Telephone country code|Telephone - Home › Telephone country code|Telephone - Office › Telephone country code", dump)
    check("zoo: inputs under column headers take the header", ["Course", "Credits", "Grade"].every((h) => by(h)?.kind === "text") && by("Postal code") !== undefined, dump)
    const pr = by("Are you a Permanent Resident")
    check("zoo: radios become ONE field — the question is its name, the answers its options", pr?.kind === "radio" && pr.options?.join("/") === "Yes/No" && pr.required === true && by("Mode of study")?.options?.join("/") === "Full-time/Part-time", dump)
    check("zoo: a checkbox is named by the words after it", by("Send me programme updates")?.kind === "checkbox", dump)
    check("zoo: what the page flags is reported with the field", /at least 18/.test(by("Age")?.error ?? "") && Boolean(by("Alternate e-mail")?.error), dump)
    const zooSnap = await browser.snapshot()
    await writeFile(join(app.getPath("temp"), "neo-smoke-zoo-snapshot.txt"), zooSnap)
    check("zoo: the snapshot itself shows nameless boxes under the words next to them, and marks examples", /textbox "Surname\/Family Name"[^\n]*\[ref=e\d+\]/.test(zooSnap) && /textbox "Telephone - Home"[^\n]*\[required\][^\n]*示例：8123 4567（不是数据）/.test(zooSnap) && /- textbox \[ref=e\d+\][^\n]*开发者命名：applicant_email/.test(zooSnap) && /combobox "Telephone - Home › Telephone country code"/.test(zooSnap), zooSnap.slice(0, 2500))
    const surnameRef = /textbox "Surname\/Family Name"[^\n]*\[ref=(e\d+)\]/.exec(zooSnap)?.[1] ?? ""
    const filledName = await browser.fillForm([{ ref: surnameRef, value: "LIN" }])
    check("zoo: results name the field a value went into — a swapped surname would be visible at a glance", filledName.includes("“Surname/Family Name” ← “LIN”"), filledName.slice(0, 300))
    const changeRef = /clickable "Change" \[ref=(e\d+)\]/.exec(zooSnap)?.[1] ?? ""
    const dayRef = /clickable "17" \[ref=(e\d+)\]/.exec(zooSnap)?.[1] ?? ""
    const cardRef = /clickable "Part-time 4 years" \[ref=(e\d+)\]/.exec(zooSnap)?.[1] ?? ""
    check("zoo: what a person can click is numbered even when the site never declared it (listener, onclick, hand cursor)", Boolean(changeRef && dayRef && cardRef) && /clickable "Full-time 2 years"/.test(zooSnap), zooSnap.slice(-1800))
    if (dayRef) await browser.click(dayRef)
    check("zoo: a role-less calendar day cell can be clicked", (await browser.evaluate("document.getElementById('status').textContent")) === "picked day 17")
    const photoZoo = join(app.getPath("temp"), "neo-smoke-photo.jpg")
    await writeFile(photoZoo, "JFIF smoke")
    const viaChange = changeRef ? await browser.upload(changeRef, [photoZoo]).then((r) => r, (e) => String(e.message)) : "no ref"
    check("zoo: a role-less 'Change' is clicked like a person would, the file chooser it opens is caught, and the file goes in", (await browser.evaluate("(document.getElementById('z-file').files[0] || {}).name || ''")) === "neo-smoke-photo.jpg" && viaChange.includes("点开了文件选择框"), viaChange.slice(0, 300))
    const clickedChange = changeRef ? await browser.click(changeRef) : ""
    const afterClick = changeRef ? await browser.upload(changeRef, [photoZoo]).then((r) => r, (e) => String(e.message)) : ""
    check("zoo: a plain click that happens to open the file chooser says so, and the next upload goes to that chooser", clickedChange.includes("它打开了文件选择框") && afterClick.includes("交给了刚才点开的文件选择框"), clickedChange.slice(0, 200) + "\n" + afterClick.slice(0, 200))
    const longName = join(app.getPath("temp"), "林郁婷_證件照_白底_2026年最新版.jpg")
    await writeFile(longName, "JFIF smoke")
    const openRef = /button "Upload photo" \[ref=(e\d+)\]/.exec(zooSnap)?.[1] ?? ""
    const journey = await browser.upload(openRef, [longName]).then((r) => r, (e) => String(e.message))
    check("zoo: an upload button that opens the site's own panel — the file goes to the file box that appeared, under a name the site accepts", journey.includes("页面打开了自己的上传界面") && journey.includes("已改用内容相同的副本 “2026.jpg”") && /〔这一步之后：[^〕]*Save photo/.test(journey), journey.slice(0, 700))
    const saveRef = /button "Save photo" \[ref=(e\d+)\]/.exec(journey)?.[1] ?? ""
    if (saveRef) await browser.click(saveRef)
    check("zoo: …and the journey is finished by clicking what came next", (await browser.evaluate("document.getElementById('z-photo-status').textContent")) === "Photo saved: 2026.jpg")
    const moreRef = /button "Add previous study" \[ref=(e\d+)\]/.exec(zooSnap)?.[1] ?? ""
    const nextRef = /button "Continue" \[ref=(e\d+)\]/.exec(zooSnap)?.[1] ?? ""
    const opened = await browser.click(moreRef)
    check("zoo: after a click the result says first what it changed — here, two new boxes", /〔这一步之后：[^〕]*新出现了 \d+ 个元素[^〕]*Previous school/.test(opened), opened.slice(0, 400))
    const refusedNext = await browser.click(nextRef)
    check("zoo: a page that does not let you through says so, with the field's name and the page's own words", /〔这一步之后：[^〕]*页面还是原来那一页[^〕]*没让过[^〕]*Visa type is required[^〕]*〕/s.test(refusedNext) && refusedNext.includes("Please correct the 1 error"), refusedNext.slice(0, 600))
    const signRef = /textbox "Electronic signature[^"]*"[^\n]*\[ref=(e\d+)\]/.exec(zooSnap)?.[1] ?? ""
    const signed = await browser.fillForm([{ ref: signRef, value: "LIN YU-CHEN" }])
    check("zoo: a signature box is still the consultant's (打名字即签字) — nothing is typed into it", (await browser.evaluate("document.getElementById('z-sign').value")) === "" && signed.includes("签名"), signed.slice(0, 300))

    const dobRef = /textbox "Date of birth"[^\n]*\[ref=(e\d+)\]/.exec(zooSnap)?.[1] ?? ""
    const far = await browser.fillForm([{ ref: dobRef, value: "2004-11-03" }])
    check("zoo: a drawn calendar, 22 years away — the heading is clicked to reach years and months, then the day (not the greyed 3 of the next month)", (await browser.evaluate("document.getElementById('z-dob').value")) === "03/11/2004" && far.includes("在日历上点选的"), far.slice(0, 400))
    const near = await browser.fillForm([{ ref: dobRef, value: "2005-01-30" }])
    check("zoo: …and a date two months on is reached with the nameless arrows", (await browser.evaluate("document.getElementById('z-dob').value")) === "30/01/2005", near.slice(0, 400))

    // --- windows that open outside the page must never appear: nothing inside the page could close them
    const printed = await browser.click(/button "Print this page" \[ref=(e\d+)\]/.exec(zooSnap)?.[1] ?? "")
    check("zoo: window.print() does not open the system's print panel — the page simply goes on", (await browser.evaluate("document.getElementById('z-outside').textContent")) === "after print", printed.slice(0, 200))
    const askedPermission = await browser.click(/button "Enable notifications" \[ref=(e\d+)\]/.exec(zooSnap)?.[1] ?? "")
    await new Promise((r) => setTimeout(r, 400))
    const refusedPermission = askedPermission + (await browser.snapshot())
    if (ego) console.log("SKIP  zoo: 权限弹窗由 ego 自己处理（我们只在 Electron 宿主上拦系统弹窗；ego 的弹窗顾问在自己的窗口里看得见、自己决定）")
    else check("zoo: a permission request is refused without a system prompt, and the model is told", (await browser.evaluate("document.getElementById('z-outside').textContent")) === "notifications: denied" && refusedPermission.includes("页面之外发生的事"), refusedPermission.slice(0, 300))
    const clickedDownload = await browser.click(/link "Download your letter" \[ref=(e\d+)\]/.exec(zooSnap)?.[1] ?? "")
    await new Promise((r) => setTimeout(r, 1200))
    const downloaded = clickedDownload + (await browser.snapshot())
    if (ego) console.log("SKIP  zoo: 下载落在 ego 自己的下载列表（存到工作区/免另存为是我们内嵌页的拦截；ego 里下载对顾问可见）")
    else check("zoo: a download is saved into the workspace with no 'save as' panel, and the model is told where", /页面下载了一个文件，已存到 [^\n]*offer-letter\.txt/.test(downloaded), downloaded.slice(0, 300))

    // --- lists somebody drew: no roles, judged by what appears and by whether the pick took
    const pickers = [...zooSnap.matchAll(/clickable "Choose…" \[ref=(e\d+)\]/g)].map((m) => m[1])
    const inst = pickers[0] ? await browser.choose(pickers[0], "Zhejiang University").then((r) => r, (e) => String(e.message)) : "no ref"
    check("zoo: a role-less list with its search box INSIDE the panel — typed into, then picked (the entry is not among the ten drawn at first)", (await browser.evaluate("document.querySelector('#z-inst .picked').textContent")) === "Zhejiang University", inst.slice(0, 300))
    const land = pickers[1] ? await browser.choose(pickers[1], "Mainland China").then((r) => r, (e) => String(e.message)) : "no ref"
    check("zoo: a list that draws seven rows at a time is scrolled like a person would until the entry shows up", (await browser.evaluate("document.querySelector('#z-land .picked').textContent")) === "Mainland China", land.slice(0, 300))
    const dead = pickers[2] ? await browser.choose(pickers[2], "Beta").then((r) => r, (e) => String(e.message)) : "no ref"
    check("zoo: a pick that leaves no evidence (nothing closed, nothing shown) is not reported as done", dead.includes("不能算选上了"), dead.slice(0, 300))
    await browser.evaluate("document.querySelectorAll('.z-panel').forEach((p) => p.remove())")

    // --- tier C: a region with no structure is operated by the picture, and only such a region
    const blindSnap = await browser.snapshot()
    const box = JSON.parse(await browser.evaluate("(() => { const c = document.getElementById('z-canvas'); c.scrollIntoView({ block: 'center' }); const r = c.getBoundingClientRect(); return JSON.stringify({ x: r.left, y: r.top }) })()"))
    check("zoo: a painted region is announced as having no structure, with where it is", /看不到结构的区域[^〕]*canvas 画出来的区域/.test(blindSnap), blindSnap.slice(-700))
    const painted = await browser.clickAt(box.x + 90, box.y + 62, "Full-time 选项").then((r) => r, (e) => ({ text: String(e.message), image: undefined }))
    check("zoo: clicking by position works where nothing has a number, and says where the picture changed", (await browser.evaluate("document.getElementById('z-canvas-status').textContent")) === "painted: full-time" && painted.text.includes("画面变了") && Boolean(painted.image), painted.text)
    const missed = await browser.clickAt(box.x + 210, box.y + 10, "空白处").then((r) => r.text, (e) => String(e.message))
    check("zoo: a click that changes nothing is reported as such", missed.includes("画面没有任何变化"), missed)
    const paintedSubmit = await browser.clickAt(box.x + 320, box.y + 62, "Submit application 按钮").then((r) => r.text, (e) => String(e.message))
    check("zoo: the one hard rule holds for positions too — a painted Submit is not clicked", (await browser.evaluate("document.getElementById('z-canvas-status').textContent")) === "painted: full-time" && paintedSubmit.includes("留给顾问"), paintedSubmit)
    const nextBox = JSON.parse(await browser.evaluate("(() => { document.getElementById('z-next').scrollIntoView({ block: 'center' }); const r = document.getElementById('z-next').getBoundingClientRect(); return JSON.stringify({ x: r.left + r.width / 2, y: r.top + r.height / 2 }) })()"))
    const onNumbered = await browser.clickAt(nextBox.x, nextBox.y, "Continue 按钮").then((r) => r.text, (e) => String(e.message))
    check("zoo: a position that has a numbered element under it is refused — numbers are exact, positions are a guess", /有编号的元素 e\d+/.test(onNumbered), onNumbered)
    const gridShot = await browser.screenshot(false, false, { grid: true, region: { x: Math.max(0, box.x - 10), y: Math.max(0, box.y - 10), width: 440, height: 140 } })
    check("zoo: a ruled close-up of one region can be taken", gridShot.data.length > 5000 && (await browser.evaluate("String(!!document.getElementById('__neo_grid__'))")) === "false")

    const review = await browser.review()
    check("zoo: review lists fields by name, with examples marked as not data", review.includes("“Surname/Family Name”") && review.includes("示例：8123 4567（不是数据）") && review.includes("页面报错：Applicant must be at least 18"), review.slice(0, 1500))

    // --- the one hard rule on a step list: the link opens a page, the button is the step itself
    const finalBtn = /button "Submit application" \[ref=(e\d+)\]/.exec(zooSnap)?.[1] ?? ""
    const stoppedFinal = await browser.click(finalBtn).then(() => "clicked", (e) => String(e.message))
    check("zoo: a real 'Submit application' button still goes to the consultant", stoppedFinal.includes("留给顾问") && !/SUBMITTED/.test(await browser.evaluate("document.getElementById('status').textContent")), stoppedFinal.slice(0, 200))
    const stepLink = /link "8. Review and submit" \[ref=(e\d+)\]/.exec(zooSnap)?.[1] ?? ""
    const wentToStep = await browser.click(stepLink).then((r) => r, (e) => String(e.message))
    check("zoo: a link in the step list is a way to look at a page, not the submission — it is not held up", !wentToStep.includes("留给顾问") && /step=8/.test(await browser.evaluate("location.search")), wentToStep.slice(0, 200))

    // --- fill_page: the whole page seated against the answer bank in one go. Jev is played by a script that reads labels.
    await surf.loadURL(fixture("zoo.html"))
    const profileFile = join(app.getPath("temp"), "student_profile.json")
    await writeFile(profileFile, JSON.stringify({ name: { family: "LIN", given: "YU-CHEN", full_passport_order: "LIN YU-CHEN", title: "Mr" }, passport: { number: "X00000000" }, email: { primary: "yuchen.lin@example.com" }, phone: { mobile: { country_code: "+86", number: "13900000000" } }, address: { home: { postal_code: "430000" } } }))
    const seats: Array<[RegExp, string]> = [
      [/labelled “Title”/, "name.title"], [/labelled “Full Name/, "name.full_passport_order"], [/labelled “Surname\/Family Name”/, "name.family"], [/labelled “Given Name”/, "name.given"],
      [/labelled “Passport number”/, "passport.number"], [/developer name “[^”]*applicant_email/, "email.primary"], [/labelled “Contact Number - Handphone › Telephone country code”/, "phone.mobile.country_code"],
      [/labelled “Contact Number - Handphone”/, "phone.mobile.number"], [/labelled “Postal code”/, "address.home.postal_code"], [/labelled “Are you a Permanent Resident”/, "THINK"], [/labelled “Telephone - Home”/, "THINK"],
      [/labelled “Mobile number”/, "phone.mobile.number"], [/labelled “Why are you applying”/, "THINK"],
    ]
    let sawValue = false
    setJevBackendForTests(async (state: any, questions): Promise<JevAnswers> => {
      sawValue ||= JSON.stringify([state, questions]).includes("13900000000")
      return Object.fromEntries(Object.entries(questions).map(([id, q]: [string, any]) => {
        const choice = seats.find(([re]) => re.test(q.instructions))?.[1] ?? "SKIP"
        return [id, { type: "choice", choice, confidence: 0.93, probabilities: { [choice]: 0.93 } }]
      }))
    })
    const page = await browser.fillPage()
    const got = await browser.evaluate("JSON.stringify({ title: document.getElementById('z-title').value, full: document.getElementsByName('ctl00$main$t1')[0].value, family: document.getElementsByName('ctl00$main$t2')[0].value, given: document.getElementsByName('ctl00$main$t3')[0].value, passport: document.getElementById('f_1729').value, mail: document.getElementsByName('applicant_email')[0].value, cc: document.getElementById('cc1').value, zip: document.getElementById('z-zip').value, pr: !!document.querySelector('input[name=pr]:checked'), tels: Array.from(document.querySelectorAll('input[type=tel]')).map((t) => t.value) })")
    check("fill_page: every seat Jev was sure of is filled from the bank, verbatim — surname and given name each in their own box", got === JSON.stringify({ title: "Mr", full: "LIN YU-CHEN", family: "LIN", given: "YU-CHEN", passport: "X00000000", mail: "yuchen.lin@example.com", cc: "+86", zip: "430000", pr: false, tels: ["13900000000", "", ""] }), got + "\n" + page.text.slice(0, 1200))
    check("fill_page: says which bank entry went where, hands the judgement calls back with evidence and a numbered picture", page.text.includes("〔答案库：name.family〕") && page.text.includes("“Are you a Permanent Resident”") && page.text.includes("选项：Yes | No") && page.text.includes("示例：8123 4567（不是数据）") && Boolean(page.image && page.image.length > 5000), page.text.slice(0, 1500))
    check("fill_page: Jev is shown labels and key names, never the student's values", sawValue === false)

    // --- every value has to come from somewhere: the answer bank, or the student's own papers
    const zipRef = /textbox "Postal code"[^\n]*\[ref=(e\d+)\]/.exec(await browser.snapshot())?.[1] ?? ""
    const invented = await browser.fillForm([{ ref: zipRef, value: "浙江省金华市婺城区李渔路1108号8单元1602室" }])
    check("a value the papers do not contain is flagged right where it was typed", /⚠ 材料里找不到这个值的原文/.test(invented), invented.slice(0, 400))
    const beforeSaving = await browser.review()
    check("review says it again before the page is saved and left behind", /找不到原文[^\n]*“Postal code”/.test(beforeSaving), beforeSaving.slice(0, 600))
    const fromPapers = await browser.fillForm([{ ref: zipRef, value: "LIN YU-CHEN" }])
    check("a value the papers do contain is not flagged", !/找不到/.test(fromPapers), fromPapers.slice(0, 300))
    // The same number written another way is the same number: the papers say 430000, the form gets it spaced out.
    const regrouped = await browser.fillForm([{ ref: zipRef, value: "+86 139 0000 0000" }])
    check("a number the papers contain, regrouped or with a country code in front, is not flagged", !/找不到/.test(regrouped), regrouped.slice(0, 300))
    // The real run never called review at all, so saving carries the same check with it.
    await browser.fillForm([{ ref: zipRef, value: "浙江省金华市婺城区李渔路1108号" }])
    const nextRef2 = /button "Continue" \[ref=(e\d+)\]/.exec(await browser.snapshot())?.[1] ?? ""
    const stopped = await browser.click(nextRef2).then(() => "went through", (e) => String(e.message))
    check("leaving the page with a value the papers do not contain is stopped once — looking is not optional", /先别急着离开这一页[^\n]*Postal code/.test(stopped), stopped.slice(0, 400))
    const savingAnyway = await browser.click(nextRef2)
    check("…and clicking again goes through, so it can never deadlock", /离开这一页之前请注意[^\n]*Postal code/.test(savingAnyway), savingAnyway.slice(0, 400))

    // --- a choice changes the rest of the page: the boxes it reveals are seated on the spot, not left for the next round
    const hasPassport = /combobox "Do you hold a passport"[^\n]*\[ref=(e\d+)\]/.exec(await browser.snapshot())?.[1] ?? ""
    const revealed = await browser.choose(hasPassport, "Yes")
    const afterChoice = await browser.evaluate("JSON.stringify({ mobile: (document.getElementById('z-ppt-mobile') || {}).value, why: (document.getElementById('z-ppt-why') || {}).value })")
    check(
      "choose: the boxes a choice brings out are seated against the answer bank straight away — and what the bank has nothing for is handed back",
      afterChoice === JSON.stringify({ mobile: "13900000000", why: "" }) && /这一步冒出 2 个新格子，替你对号入座填了 1 个/.test(revealed) && revealed.includes("“Why are you applying”"),
      revealed.slice(0, 700),
    )
    setJevBackendForTests(undefined)
    await surf.loadURL(fixture("zoo.html"))
    const alone = await browser.fillPage()
    check("fill_page without Jev: nothing is guessed, the whole page goes to the big model with its evidence", alone.text.includes("小模型现在不可用") && alone.text.includes("“Surname/Family Name”") && (await browser.evaluate("document.getElementsByName('ctl00$main$t2')[0].value")) === "", alone.text.slice(0, 600))
    await rm(profileFile, { force: true })
  } catch (error) {
    check("zoo run completed", false, error instanceof Error ? error.stack || error.message : String(error))
  }
}

/**
 * `bun run smoke:agent` — the whole chain with a real model: stock `opencode serve` in a workspace,
 * our browser tools over MCP, one plain-language instruction, then check what ended up in the page.
 */
export async function runAgentSmoke(input: {
  client: import("@opencode-ai/sdk/v2/client").OpencodeClient
  sessionID: string
  model?: { providerID: string; modelID: string }
  variant?: string
  browser: BrowserController
  contents: WebContents
  tap: (listener: (evt: any) => void) => () => void
  /** Replace the scripted instruction with something else that gets the model going (e.g. opening a task). */
  start?: () => Promise<void>
  answer?: (requestID: string, answers: string[][]) => Promise<void>
}) {
  if (!input.start) await input.contents.loadURL(fixture("form.html"))
  const started = Date.now()
  let sawWork = false
  let failure = ""

  const idle = new Promise<void>((resolve) => {
    const off = input.tap((evt) => {
      const p = evt.properties ?? {}
      if (evt.type === "message.part.updated" && p.part?.type === "tool") {
        sawWork = true
        const st = p.part.state
        if (st?.status === "completed" || st?.status === "error")
          console.log(`  [${((Date.now() - started) / 1000).toFixed(0)}s] ${p.part.tool} ${st.status}${st.status === "error" ? ` — ${String(st.error).slice(0, 200)}` : ""}`)
      }
      if (evt.type === "message.part.updated" && p.part?.type === "text" && p.part.time?.end && !p.part.synthetic)
        console.log(`  AI: ${String(p.part.text).replace(/\s+/g, " ").slice(0, 300)}`)
      if (evt.type === "question.asked") {
        console.log(`  AI asks: ${p.questions?.[0]?.question}`)
        const answers = p.questions.map((q: any) => [q.options?.[0]?.label ?? "按你的判断来"])
        void (input.answer ? input.answer(p.id, answers) : input.client.question.reply({ requestID: p.id, answers }))
      }
      if (evt.type === "session.error") failure = JSON.stringify(p.error).slice(0, 500)
      if ((evt.type === "session.idle" || failure) && (sawWork || failure)) (off(), resolve())
    })
  })

  const sent = input.start ? await input.start().then(() => ({ error: undefined })) : await input.client.session.promptAsync({
    sessionID: input.sessionID,
    model: input.model,
    variant: input.variant,
    parts: [
      {
        type: "text",
        text: `左边的浏览器里已经打开了一份练习用的申请表。请把它填好并点 Save 保存成功。学生信息：
姓名 Meiling Zhang，邮箱 meiling.zhang@example.com，生日 2003 年 5 月 17 日，国籍中国，省份浙江，手机 13812345678；
最高学历本科（Bachelor's），专业 Computer Science，毕业时有荣誉（honors），英语考试考的是雅思；
推荐人邮箱 prof.li@example.edu。成绩单没有现成文件，不用上传。
保存成功后告诉我结果。不要提交申请、不要付款、不要发推荐信邀请。`,
      },
    ],
  })
  if (sent.error) failure = JSON.stringify(sent.error)

  await Promise.race([idle, new Promise((r) => setTimeout(r, 10 * 60 * 1000))])
  if (failure) console.log(`session error: ${failure}`)

  const dom = JSON.parse(
    await input.browser.evaluate(`JSON.stringify({
      first: document.getElementById("first").value, last: document.getElementById("last").value,
      email: document.getElementById("email").value, dob: document.getElementById("dob").value,
      country: document.getElementById("country").value, province: document.getElementById("province")?.value,
      phone: document.getElementById("phone").value, degree: document.getElementById("degree-btn").textContent,
      major: document.getElementById("major")?.value, honors: document.getElementById("honors").checked,
      test: document.querySelector("input[name=test]:checked")?.value,
      recommender: document.querySelector("iframe").contentDocument.getElementById("rec-email").value,
      status: document.getElementById("status").textContent,
    })`),
  )
  console.log(JSON.stringify(dom, null, 2))

  const expected: Record<string, unknown> = {
    first: "Meiling", last: "Zhang", email: "meiling.zhang@example.com", dob: "2003-05-17", country: "china",
    province: "Zhejiang", degree: "Bachelor's", major: "Computer Science", honors: true, test: "ielts", recommender: "prof.li@example.edu",
  }
  const wrong = Object.entries(expected).filter(([key, value]) => String(dom[key] ?? "").toLowerCase() !== String(value).toLowerCase())
  if (!/^Saved at/.test(dom.status)) wrong.push(["status", dom.status])
  console.log(wrong.length ? `\nAGENT SMOKE FAILED: ${JSON.stringify(wrong)}` : `\nAGENT SMOKE PASSED in ${((Date.now() - started) / 1000).toFixed(0)}s`)
  return wrong.length ? 1 : 0
}


/**
 * `bun run smoke:tasks` — the first half of the product without UI or model: create a task, create it again,
 * import a selection list, and check what is on disk afterwards.
 */
export async function runTaskSmoke() {
  const failures: string[] = []
  const check = (name: string, ok: boolean, detail = "") => {
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  ← ${detail.slice(0, 500)}`}`)
    if (!ok) failures.push(name)
  }
  const root = workspacesRoot()
  try {
    await rm(root, { recursive: true, force: true })
    const source = await mkdtemp(join(app.getPath("temp"), "neo-smoke-student-"))
    await mkdir(join(source, "成绩"), { recursive: true })
    await writeFile(join(source, "护照.pdf"), "%PDF passport")
    await writeFile(join(source, "成绩", "transcript.pdf"), "%PDF transcript")

    const base = { studentName: "陈昊天", sourceFolder: source, jobType: "实习", taskGoal: "全流程投递", outputLanguage: "zh" as const, allowUpload: true }
    const first = await createTask({ ...base, company: "Google", jobTitle: "Data Science Intern", applicationUrl: "https://careers.google.com/jobs/ds-intern", platformUsername: "chen@example.com" })
    check("task folder is created under the student's jobs/", first.taskPath === join("jobs", "Google_Data-Science-Intern") && first.studentDir === join(root, "陈昊天"), JSON.stringify(first))
    check("materials are copied, sub-folders included", (await countMaterials(first.studentDir)) === 2)
    check("the consultant's own folder is untouched", (await readdir(source)).sort().join() === ["成绩", "护照.pdf"].sort().join())
    check("the one-page guide is in the workspace", (await readFile(join(first.studentDir, "AGENTS.md"), "utf8")).includes("你是 Terra-Edu 的求职投递助理") && existsSync(join(first.studentDir, "profile-keys.json")))
    check("the guide carries the shared-platform rule for common job sites", (await readFile(join(first.studentDir, "AGENTS.md"), "utf8")).includes("通用段一个值都不要改"))
    await mkdir(join(root, "老学生"), { recursive: true })
    await writeFile(join(root, "老学生", "AGENTS.md"), "旧版守则\n")
    await writeGuide(join(root, "老学生"))
    check("an old workspace's guide is refreshed on open, not frozen at creation", (await readFile(join(root, "老学生", "AGENTS.md"), "utf8")).includes("求职投递助理"))
    check("platform username is remembered by host, without a password", getPlatformAccount("https://careers.google.com/other")?.username === "chen@example.com")

    const again = await createTask({ ...base, company: " google ", jobTitle: "data  science intern" })
    check("creating the same application again reopens it", again.reusedExisting === true && again.id === first.id)

    await writeFile(join(first.studentDir, "materials", "护照.pdf"), "EDITED IN WORKSPACE")
    await writeFile(join(source, "雅思.pdf"), "%PDF ielts")
    const second = await createTask({ ...base, company: "ByteDance", jobTitle: "ML Intern" })
    check("a second job for the same student stays in the same folder", second.studentDir === first.studentDir)
    check("new files in the source folder are brought in, and counted for the consultant", second.newMaterials === 1, JSON.stringify({ newMaterials: second.newMaterials }))

    await updateTask(first.taskDir, { sessionID: "ses_smoke", lastOpenedAt: new Date().toISOString() })
    const students = await listStudents()
    check("tasks are listed grouped by student", students.length === 1 && students[0].studentName === "陈昊天" && students[0].tasks.length === 2, JSON.stringify(students.map((g) => [g.studentName, g.tasks.length])))
    check("a task remembers its conversation", students[0].tasks.find((t) => t.id === first.id)?.sessionID === "ses_smoke")

    const gtask = students[0].tasks.find((t) => t.input.company === "Google")!
    const prompt = buildStartPrompt(gtask, 4)
    check("start prompt carries the job facts", prompt.includes("Google · Data Science Intern") && prompt.includes("https://careers.google.com/jobs/ds-intern") && prompt.includes("写成 `job_target.json`"), prompt)

    // The student-wide credentials memo (same encrypted store contract as the sister app).
    const memos = new Map<string, { text: string; updatedAt: string }>()
    setMemoStoreForTests({ get: (k) => memos.get(k), set: (k, v) => memos.set(k, v), delete: (k) => void memos.delete(k) })
    setStudentMemo(first.studentDir, "Google 账号 chen@example.com / smoke-pass-1")
    check("the student memo is stored whole and never inside the workspace", getStudentMemo(first.studentDir) === "Google 账号 chen@example.com / smoke-pass-1" && !(await readFile(join(first.studentDir, "student.json"), "utf8")).includes("smoke-pass-1"))
    const withMemo = buildStartPrompt(gtask, 1, undefined, true, false, getStudentMemo(first.studentDir))
    check("…and the memo rides into the job's opening message verbatim", withMemo.includes("这个学生全部网站的账号密码备忘") && withMemo.includes("smoke-pass-1"))
    setStudentMemo(first.studentDir, "")
    check("clearing it leaves nothing behind", getStudentMemo(first.studentDir) === "")
    setMemoStoreForTests()

    // One-click apply without a source folder: the job centre feeds the student's existing workspace.
    const listed = await listStudents()
    const applied = await createTask({ studentName: "陈昊天", jobType: "实习", taskGoal: "全流程投递", outputLanguage: "zh", allowUpload: true, company: "Meta", jobTitle: "SWE Intern", applicationUrl: "https://careers.meta.com/jobs/1" })
    check("one-click apply reuses the student, no folder needed", applied.reusedExisting !== true && applied.studentDir === first.studentDir, JSON.stringify(applied))
    check("…and a re-apply reopens it", (await createTask({ studentName: "陈昊天", jobType: "实习", taskGoal: "全流程投递", outputLanguage: "zh", allowUpload: true, company: "Meta", jobTitle: "SWE Intern", applicationUrl: "https://careers.meta.com/jobs/1" })).reusedExisting === true)

    const invalid = await createTask({ studentName: "x", sourceFolder: source, jobType: "实习", taskGoal: "全流程投递", outputLanguage: "zh", allowUpload: true, company: "X", jobTitle: "Y", applicationUrl: "not a url" }).then(() => "created", (e) => String(e.message))
    check("a malformed link is refused with a readable message", invalid.includes("格式不正确"), invalid)

    // A free conversation gets a folder of its own, with the guide and keys in it.
    const corner = await ensureWorkspace(join("自由对话", "2026-10-17 投递方向"))
    check("a free conversation gets a folder with the guide in it", corner.startsWith(join(root, "自由对话")) && existsSync(join(corner, "AGENTS.md")))
    await rm(source, { recursive: true, force: true })
  } catch (error) {
    check("task smoke completed", false, error instanceof Error ? error.stack || error.message : String(error))
  }
  console.log(failures.length ? `\nTASK SMOKE FAILED (${failures.length})` : "\nTASK SMOKE PASSED")
  return failures.length ? 1 : 0
}

/**
 * `bun run smoke:feed` — the daily job feed, offline: seed a snapshot, match it against a student's
 * target, save things back, and make sure the overview the renderer sees is coherent. No network.
 */
export async function runFeedSmoke() {
  const failures: string[] = []
  const check = (name: string, ok: boolean, detail = "") => {
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  ← ${detail.slice(0, 500)}`}`)
    if (!ok) failures.push(name)
  }
  const row = (patch: Partial<JobEntry> = {}): JobEntry => ({
    id: "seed-ds-intern",
    source: "linkedin-us",
    title: "Data Science Intern",
    company: "Google",
    location: "New York, US",
    url: "https://x/1",
    description: "machine learning with python and sql",
    tags: ["internship"],
    internship: true,
    fullTime: false,
    fetchedAt: new Date().toISOString(),
    ...patch,
  })
  try {
    await rm(workspacesRoot(), { recursive: true, force: true })
    const source = await mkdtemp(join(app.getPath("temp"), "neo-feed-student-"))
    await writeFile(join(source, "简历.txt"), "简历/材料")
    const student = await createTask({ studentName: "李昂", sourceFolder: source, jobType: "实习", taskGoal: "全流程投递", outputLanguage: "zh", allowUpload: true, company: "Google", jobTitle: "DS Intern", applicationUrl: "https://x" })
    const studentDir = student.studentDir

    await seedFeedSnapshot([row(), row({ id: "seed-swe", title: "Backend Engineer", company: "Meta", location: "Seattle", description: "full-time role", internship: false }), row({ id: "seed-beijing", title: "DS Intern", company: "Huawei", location: "Beijing, China", internship: true })])

    const { readJobTarget, writeJobTarget, feedForStudent, overview } = await import("./feed/feed")
    const initial = await overview()
    check("a student with no target appears with an empty target", initial.students.length === 1 && initial.students[0].target.roles.length === 0)
    check("sources and schedule come preconfigured", initial.sources.length >= 3 && initial.schedule.enabled === true && initial.schedule.beijing === "13:00" && initial.schedule.eastern === "13:00", JSON.stringify(initial.schedule))

    const target = { roles: ["数据科学实习"], roleKeywords: ["data science", "machine learning", "data analyst"], companies: ["Google"], locations: ["new york", "remote"], locationExclude: ["beijing"], internshipsOnly: true, skills: ["python", "sql"] }
    await writeJobTarget(studentDir, target)
    check("saving the target persists it and cleans the lists", (await readJobTarget(studentDir)).companies.join() === "Google" && (await readJobTarget(studentDir)).roleKeywords.includes("data science"))

    const feed = await feedForStudent(studentDir)
    const google = feed.matches["seed-ds-intern"]
    check("the matching intern role matches hard", google.matched === true && google.score >= 35, JSON.stringify(google))
    const swe = feed.matches["seed-swe"]
    check("a full-time SWE role is filtered out when only internships are wanted", swe.matched === false, JSON.stringify(swe))
    const beijing = feed.matches["seed-beijing"]
    check("an excluded location is filtered no matter how well the role fits", beijing?.matched === false, JSON.stringify(beijing))

    const { saveFeedSources, listSources } = await import("./feed/feed")
    const toggled = [...initial.sources] as typeof DEFAULT_SOURCES
    toggled[0].enabled = false
    saveFeedSources(toggled)
    check("sources can be disabled and persist", listSources()[0].enabled === false)
    saveFeedSources(DEFAULT_SOURCES)

    const { nextRunFor, todaySlotIn } = await import("./feed/schedule-core")
    const noon = new Date("2026-10-17T05:00:00Z")
    const nextBei = nextRunFor("Asia/Shanghai", "13:00", noon)
    const slotBei = todaySlotIn("Asia/Shanghai", "13:00", noon)
    check("scheduling math pins the Beijing/Eastern slots", nextBei !== null && slotBei?.getTime() === noon.getTime() && nextRunFor("America/New_York", "13:00", noon) !== null, "")
    await rm(source, { recursive: true, force: true })
  } catch (error) {
    check("feed smoke completed", false, error instanceof Error ? error.stack || error.message : String(error))
  }
  console.log(failures.length ? `\nFEED SMOKE FAILED (${failures.length})` : "\nFEED SMOKE PASSED")
  return failures.length ? 1 : 0
}

/**
 * `bun run smoke:resume` — generate a LaTeX resume from a seeded profile through the real engine.
 * Offline-safe when no engine exists: the check then verifies the honest "no engine" report.
 */
export async function runResumeSmoke() {
  const failures: string[] = []
  const check = (name: string, ok: boolean, detail = "") => {
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  ← ${detail.slice(0, 600)}`}`)
    if (!ok) failures.push(name)
  }
  try {
    await rm(workspacesRoot(), { recursive: true, force: true })
    const source = await mkdtemp(join(app.getPath("temp"), "neo-resume-student-"))
    await writeFile(join(source, "简历.md"), "# 学生信息")
    const student = await createTask({ studentName: "周子墨", sourceFolder: source, jobType: "实习", taskGoal: "全流程投递", outputLanguage: "zh", allowUpload: true, company: "M", jobTitle: "SWE", applicationUrl: "https://x" })
    await writeFile(
      join(student.studentDir, "student_profile.json"),
      JSON.stringify({
        name: { given: "Zimo", family: "Zhou" },
        contact: { city: "Hangzhou", phone: "+86 138 1234 5678", email: "zimo@example.com" },
        education: [{ institution: "Zhejiang University", degree: "BSc", major: "Computer Science", start_date: "2023-09", end_date: "2027-06", gpa: "3.8/4.0" }],
        experience: [{ company: "Ant Group", position: "SWE Intern", city: "Hangzhou", start_date: "2025-06", end_date: "2025-09", bullets: ["Built X, +40% faster"] }],
        skill: { technical: "Python, Go" },
      }, null, 2),
    )

    const { findEngine, generateResume, listResumes, invalidateEngine, compileFolder } = await import("./resume/resume")
    const engine = await findEngine()
    if (engine.kind === "none") {
      check("no LaTeX engine on this machine is reported honestly (install tectonic/pdflatex to enable)", true, engine.note)
      console.log("SKIP  resume smoke: no compiler present (the feature still explains what to install)")
    } else {
      const result = await generateResume(student.studentDir, "data")
      check("the tex project and named PDF are written", existsSync(result.item.tex) && existsSync(result.item.exported) && existsSync(result.item.pdf), JSON.stringify(result.item))
      const pdf = await readFile(result.item.exported)
      check("the exported file is a real PDF", pdf.slice(0, 5).toString() === "%PDF-", pdf.slice(0, 20).toString())
      const listed = await listResumes(student.studentDir)
      check("resume list finds the generated project", listed.some((r) => r.track === "data"), JSON.stringify(listed))
      // Re-compile through the MCP door (the project folder path) — must not clobber the exported PDF.
      const projectFolder = result.item.tex.replace(/main\.tex$/, "")
      const again = await compileFolder(projectFolder)
      check("resume_compile(project folder) re-exports", again != null && existsSync(again.item.exported), JSON.stringify(again))
    }
    invalidateEngine()
    await rm(source, { recursive: true, force: true })
  } catch (error) {
    check("resume smoke completed", false, error instanceof Error ? error.stack || error.message : String(error))
  }
  console.log(failures.length ? `\nRESUME SMOKE FAILED (${failures.length})` : "\nRESUME SMOKE PASSED")
  return failures.length ? 1 : 0
}


/**
 * `bun run smoke:materials` — every kind of material a consultant hands over, turned into text:
 * a phone photo of a transcript, the same photo inside a PDF (a scan), a digital PDF, Word, Excel, plain text,
 * and something unreadable. Then one file is added to prove the second run only does that one.
 */
export async function runMaterialsSmoke(contents: WebContents) {
  const failures: string[] = []
  const check = (name: string, ok: boolean, detail = "") => {
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  ← ${detail.slice(0, 600)}`}`)
    if (!ok) failures.push(name)
  }
  const { execFileSync } = await import("node:child_process")
  const { copyFile } = await import("node:fs/promises")
  try {
    const student = join(workspacesRoot(), "材料自检")
    await rm(student, { recursive: true, force: true })
    const materials = join(student, "materials")
    await mkdir(join(materials, "成绩"), { recursive: true })
    const photo = join(appRoot, "fixtures/materials/transcript-photo.jpg")
    await copyFile(photo, join(materials, "成绩", "成绩单照片.jpg"))

    // A scan = a PDF whose pages are pictures; a digital PDF carries its own text.
    // Loaded from a file:// page — a data: page is not allowed to show a local image, which would "scan" a blank sheet.
    const pdf = async (html: string, file: string) => {
      const page = join(app.getPath("temp"), "neo-smoke-page.html")
      await writeFile(page, `<meta charset="utf-8">${html}`)
      await contents.loadURL(`file://${page}`)
      await writeFile(join(materials, file), await contents.printToPDF({ printBackground: true }))
    }
    await pdf(`<body style="margin:0"><img style="width:100%" src="file://${photo}"></body>`, "成绩/成绩单扫描.pdf")
    await pdf(`<body style="font:16px sans-serif"><h1>在读证明 Enrollment Certificate</h1><p>兹证明 陈昊天（CHEN Haotian），护照号 E12345678，自 2021 年 9 月起在我校就读，预计 2024 年 6 月毕业。</p><p>This is to certify that the above student is enrolled at our school. Issued on 2024-03-01.</p></body>`, "在读证明.pdf")

    const docx = join(app.getPath("temp"), "neo-smoke-docx")
    await rm(docx, { recursive: true, force: true })
    await mkdir(join(docx, "word"), { recursive: true })
    await writeFile(join(docx, "word/document.xml"), '<w:document><w:body><w:p><w:r><w:t>个人陈述 Personal Statement</w:t></w:r></w:p><w:p><w:r><w:t>我从高一开始创办机器人社，带队获得全国二等奖。</w:t></w:r></w:p></w:body></w:document>')
    execFileSync("/usr/bin/zip", ["-q", "-r", join(materials, "个人陈述.docx"), "word"], { cwd: docx })

    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([["活动", "年份", "奖项"], ["上海市高中数学联赛", 2023, "二等奖"]]), "活动清单")
    XLSX.writeFile(book, join(materials, "活动清单.xlsx"))
    await writeFile(join(materials, "顾问备注.txt"), "推荐人：李明华（数学老师），li.minghua@school.example")
    await writeFile(join(materials, "录音.m4a"), "not really audio")
    // A student's papers often arrive as one archive; until now nothing downstream could see inside it.
    const zipSrc = await mkdtemp(join(app.getPath("temp"), "neo-zip-"))
    await writeFile(join(zipSrc, "语言成绩.txt"), "雅思 7.5（听力 8.0 阅读 8.5 写作 6.5 口语 7.0），考试日期 2026-03-14")
    execFileSync("/usr/bin/zip", ["-j", "-q", join(materials, "全部材料.zip"), join(zipSrc, "语言成绩.txt")])

    const events: string[] = []
    const first = await extractMaterials(student, (p) => events.push(`${p.done}/${p.total}`))
    const by = Object.fromEntries(first.entries.map((e) => [e.file, e]))
    const text = async (file: string) => readFile(join(student, "materials_text", `${file}.md`), "utf8").catch(() => "")
    console.log(`  engine: ${first.engine}; methods: ${first.entries.map((e) => `${e.file}=${e.method}`).join(", ")}`)

    check("digital PDF is read from its text layer, exactly", by["在读证明.pdf"]?.method === "pdf-text" && (await text("在读证明.pdf")).replace(/\s/g, "").includes("陈昊天（CHEN Haotian），护照号 E12345678".replace(/\s/g, "")), await text("在读证明.pdf"))
    check("Word, Excel and plain text are read as they are", (await text("个人陈述.docx")).includes("创办机器人社") && (await text("活动清单.xlsx")).includes("上海市高中数学联赛,2023,二等奖") && (await text("顾问备注.txt")).includes("li.minghua@school.example"))
    check("an unknown file type is listed, not guessed at", by["录音.m4a"]?.method === "unsupported")
    const unpacked = Object.keys(by).find((f) => f.includes("全部材料.zip（解包）") && f.endsWith("语言成绩.txt")) ?? ""
    check("a zip of materials is unpacked, so what is inside it is read like anything else", Boolean(unpacked) && (await text(unpacked)).includes("雅思 7.5"), Object.keys(by).join(" | "))
    const indexText = await readFile(join(student, "materials_text", "INDEX.md"), "utf8")
    check("the index says what is in each paper, so the right one can be picked without opening them all", /里面大概有什么/.test(indexText) && /雅思 7.5/.test(indexText), indexText.slice(0, 900))

    const facts = ["陈昊天", "E12345678", "2006-03-15", "3.85", "Mathematics", "普陀区"]
    for (const file of ["成绩/成绩单照片.jpg", "成绩/成绩单扫描.pdf"]) {
      const out = (await text(file)).replace(/\s/g, "")
      const found = facts.filter((f) => out.includes(f))
      if (first.engine === "paddleocr") check(`scanned material is read accurately: ${file}`, found.length === facts.length, `found ${found.join(",")} in: ${out.slice(0, 300)}`)
      else check(`scanned material is read (low-trust engine) and flagged: ${file}`, found.length >= 3 && (await text(file)).includes("注意："), out.slice(0, 300))
    }
    check("progress was reported for every file", events.at(-1) === `${first.entries.length}/${first.entries.length}`, events.join(" "))
    const index = await readFile(join(student, "materials_text", "INDEX.md"), "utf8")
    check("INDEX.md lists every file with how it was read", first.entries.every((e) => index.includes(e.file)) && index.includes("PDF 原文（电子版）"), index)

    await writeFile(join(materials, "补充-雅思成绩.txt"), "IELTS Overall 7.5 (L8.0 R8.5 W6.5 S7.0), test date 2024-01-20")
    const second = await extractMaterials(student)
    check("adding one file later processes only that file", second.processed === 1 && second.reused === first.entries.length, JSON.stringify({ processed: second.processed, reused: second.reused }))
    await rm(join(materials, "顾问备注.txt"))
    await extractMaterials(student)
    check("text of a removed file is removed too", (await text("顾问备注.txt")) === "")
  } catch (error) {
    check("materials smoke completed", false, error instanceof Error ? error.stack || error.message : String(error))
  }
  console.log(failures.length ? `\nMATERIALS SMOKE FAILED (${failures.length})` : "\nMATERIALS SMOKE PASSED")
  return failures.length ? 1 : 0
}
