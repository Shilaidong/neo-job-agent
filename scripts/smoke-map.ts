/**
 * `bun run smoke:map` — can Jev seat a whole page of fields against the answer bank in one request?
 * Real Jev, no browser. Field lists are modelled on real portals under three evidence conditions:
 * good labels, developer names only, and labels that geometry would have to supply.
 * The number that matters: CONFIDENT-BUT-WRONG must be zero. Deferring to the big model is fine; a wrong seat is not.
 */
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { parseEnv } from "node:util"
import { createJev, gatewayBackend, typesafeBackend } from "../src/main/jev-core"
import { decideMappings, mappingQuestions, offeredKeys, type FieldEvidence, type Profile } from "../src/main/browser/autofill"

const root = join(import.meta.dir, "..")
const local = existsSync(join(root, ".env.local")) ? parseEnv(readFileSync(join(root, ".env.local"), "utf8")) : {}
const typesafe = process.env.NEO_TYPESAFE_KEY || local.NEO_TYPESAFE_KEY
const key = typesafe || process.env.NEO_JEV_KEY || local.NEO_JEV_KEY
if (!key) { console.log("MAP SMOKE FAILED  no Jev key"); process.exit(1) }
const jev = createJev({ backend: () => (typesafe ? typesafeBackend(() => key) : gatewayBackend(() => key)), log: { info() {}, warn: (m, d) => console.log("WARN", m, JSON.stringify(d)) }, timeoutMs: 20_000 })
const vocabulary = JSON.parse(readFileSync(join(root, "resources/profile-keys.json"), "utf8")).keys as Record<string, string>

// A fictional applicant. Deliberately has NO home phone, NO office phone, NO middle name, NO language test yet.
const profile: Profile = {
  "name.family": "LIN", "name.given": "YU-CHEN", "name.full_passport_order": "LIN YU-CHEN", "name.full_western_order": "Yu-Chen Lin", "name.native_script": "林宇辰", "name.title": "Mr",
  sex: "Male", "birth.date": "2003-11-02", "birth.country": "Taiwan", "birth.city": "Taichung", marital_status: "Single", "citizenship.primary": "Taiwan", "residence.country": "China",
  "passport.number": "X00000000", "passport.issue_date": "2021-03-09", "passport.expiry_date": "2031-03-08", "passport.issuing_country": "Taiwan",
  "email.primary": "yuchen.lin@example.com", "phone.mobile.country_code": "+86", "phone.mobile.number": "13900000000", "phone.mobile.full": "+86 13900000000", "messaging.wechat": "yuchen_lin",
  "address.home.line1": "No. 1 Example Road, Building 2, Unit 301", "address.home.city": "Wuhan", "address.home.state": "Hubei", "address.home.postal_code": "430000", "address.home.country": "China",
  "education[0].institution": "Example University of Economics and Law", "education[0].country": "China", "education[0].city": "Wuhan", "education[0].level": "Bachelor's", "education[0].degree": "Bachelor of Economics",
  "education[0].major": "Finance", "education[0].start_date": "2023-09", "education[0].end_date": "2027-06", "education[0].completed": "No, in progress", "education[0].gpa": "3.53", "education[0].gpa_scale": "4.0", "education[0].language_of_instruction": "Chinese",
  "education[1].institution": "Example Senior High School", "education[1].country": "China", "education[1].level": "High school", "education[1].start_date": "2020-09", "education[1].end_date": "2023-06",
  "work[0].employer": "Example Bank, Wuhan Branch", "work[0].position": "Intern", "work[0].type": "Internship", "work[0].start_date": "2025-07", "work[0].end_date": "2025-08",
  "application.programme": "MSc Financial Technology", "application.intake": "August 2027", "application.study_mode": "Full-time",
  "files.photo": "materials/photo.jpg", "files.passport": "materials/passport.pdf", "files.transcript": "materials/transcript.pdf",
}

type Case = FieldEvidence & { expect: string[] } // acceptable outcomes: a key, or SKIP / THINK / HUMAN
const F = (ref: string, kind: FieldEvidence["kind"], expect: string | string[], rest: Partial<FieldEvidence>): Case => ({ ref, kind, expect: Array.isArray(expect) ? expect : [expect], ...rest })

const pages: Record<string, Case[]> = {
  "A 标签齐全（NTU Personal Particulars 的样子）": [
    F("a1", "select", "name.title", { label: "Title", group: "Personal Particulars", options: ["Mr", "Ms", "Mdm", "Dr"] }),
    F("a2", "text", "name.full_passport_order", { label: "Full Name (As per NRIC/Passport)", group: "Personal Particulars", required: true }),
    F("a3", "text", "name.family", { label: "Surname/Family Name (As per NRIC/Passport)", group: "Personal Particulars", required: true }),
    F("a4", "text", "name.given", { label: "Given Name (As per NRIC/Passport)", group: "Personal Particulars" }),
    F("a5", "select", "citizenship.primary", { label: "Citizenship", required: true, options: ["Afghanistan", "Albania", "…"] }),
    F("a6", "text", "passport.number", { label: "Passport No.", required: true }),
    F("a7", "radio", ["THINK"], { label: "Are you a Singapore Permanent Resident", options: ["Yes", "No"], required: true }),
    F("a8", "radio", ["THINK"], { label: "Do you hold a Dependent Pass / Employment Pass / Work Permit", options: ["Dependent Pass", "Employment Pass", "Work Permit", "Long Term Visit Pass", "Not holding any pass/permit listed above"], required: true }),
    F("a9", "select", "sex", { label: "Gender", options: ["Male", "Female"], required: true }),
    F("a10", "date", "birth.date", { label: "Date of Birth", hint: "Select a date.", required: true }),
    F("a11", "select", "marital_status", { label: "Marital Status", options: ["Single", "Married", "Divorced", "Widowed"] }),
    F("a12", "file", "files.photo", { label: "Passport Size Photo", required: true }),
    F("a13", "checkbox", ["HUMAN"], { label: "I acknowledge that I have read, understood and agreed to the NTU Personal Data Privacy Statement and Consent for applicants" }),
  ],
  "B 只有开发者命名，没有可见标签（同一页，换一种烂法）": [
    F("b1", "select", "name.title", { devName: "ddlSalutation", options: ["Mr", "Ms", "Mdm", "Dr"] }),
    F("b2", "text", "name.full_passport_order", { devName: "txtFullName" }),
    F("b3", "text", "name.family", { devName: "txtSurname" }),
    F("b4", "text", "name.given", { devName: "txtGivenName" }),
    F("b5", "select", "citizenship.primary", { devName: "ddlCitizenship" }),
    F("b6", "text", "passport.number", { devName: "txtPassportNo" }),
    F("b7", "select", "sex", { devName: "ddlGender", options: ["Male", "Female"] }),
    F("b8", "date", "birth.date", { devName: "dob", hint: "Select a date." }),
    F("b9", "text", ["THINK", "SKIP"], { devName: "f_1729" }),
  ],
  "C 联系方式（NTU Contact Information：三个电话 + 示例文字陷阱）": [
    F("c1", "text", "email.primary", { label: "Email", group: "Contact Information", required: true }),
    F("c2", "select", "phone.mobile.country_code", { label: "Contact Number - Handphone › Telephone country code", group: "Contact Information" }),
    F("c3", "text", "phone.mobile.number", { label: "Contact Number - Handphone", hint: "8123 4567", group: "Contact Information" }),
    F("c4", "select", ["THINK", "SKIP"], { label: "Telephone - Home › Telephone country code", group: "Contact Information" }),
    F("c5", "text", ["THINK", "SKIP"], { label: "Telephone - Home", hint: "8123 4567", required: true, group: "Contact Information" }),
    F("c6", "select", ["SKIP", "THINK"], { label: "Telephone - Office › Telephone country code", group: "Contact Information" }),
    F("c7", "text", ["SKIP", "THINK"], { label: "Telephone - Office", hint: "8123 4567", group: "Contact Information" }),
    F("c8", "text", "messaging.wechat", { label: "WeChat/Telegram/Line", group: "Contact Information" }),
    F("c9", "radio", ["THINK"], { label: "Home Address", options: ["Singapore Home Address", "Overseas Home Address"], group: "Home Address" }),
    F("c10", "text", "address.home.line1", { label: "Address Line 1", group: "Home Address", required: true }),
    F("c11", "text", ["SKIP", "THINK"], { label: "Address Line 2", group: "Home Address" }),
    F("c12", "text", "address.home.city", { label: "City", group: "Home Address" }),
    F("c13", "text", "address.home.state", { label: "State / Province", group: "Home Address" }),
    F("c14", "text", "address.home.postal_code", { label: "Postal Code", group: "Home Address" }),
    F("c15", "search", "address.home.country", { label: "Country", hint: "Select an option", group: "Home Address", required: true }),
  ],
  "D 教育经历对话框 + 陷阱（误导性的开发者命名、确认邮箱、推荐人）": [
    F("d1", "search", "education[0].country", { label: "Country of Institution", group: "Add Study History", required: true }),
    F("d2", "search", "education[0].institution", { label: "Name of University/Institution", group: "Add Study History", required: true }),
    F("d3", "text", ["education[0].degree", "education[0].level"], { label: "Qualification", group: "Add Study History" }),
    F("d4", "text", "education[0].major", { label: "Major / Field of Study", group: "Add Study History" }),
    F("d5", "text", ["education[0].start_date", "THINK"], { label: "Year of Admission", hint: "YYYY", group: "Add Study History" }),
    F("d6", "text", ["education[0].end_date", "THINK"], { label: "Year of Graduation (or expected)", hint: "YYYY", group: "Add Study History" }),
    F("d7", "text", "education[0].gpa", { label: "CGPA obtained", group: "Add Study History" }),
    F("d8", "text", "education[0].gpa_scale", { label: "Maximum CGPA", group: "Add Study History" }),
    // A developer name that lies: the visible label says family name, the id says firstname. The label must win — or it must defer.
    F("d9", "text", ["name.family", "THINK"], { label: "Family name", devName: "firstname", group: "Applicant" }),
    F("d10", "text", "email.primary", { label: "Confirm e-mail address", group: "Applicant" }),
    F("d11", "text", ["THINK", "SKIP"], { label: "Referee 1 — E-mail", group: "Referees", required: true }),
    F("d12", "textarea", ["THINK"], { label: "Why do you wish to join this programme? (max 300 words)", group: "Statement" }),
    F("d13", "text", ["THINK", "SKIP"], { label: "IELTS overall band", group: "English proficiency" }),
    F("d14", "text", ["HUMAN"], { label: "Type your full name to sign this declaration", group: "Declaration" }),
  ],
}

const keys = offeredKeys(profile, vocabulary)
let right = 0, deferredOk = 0, deferredCould = 0, wrong = 0, total = 0
const wrongs: string[] = [], deferred: string[] = []
for (const [name, cases] of Object.entries(pages)) {
  const { state, questions } = mappingQuestions(cases, keys)
  const started = Date.now()
  const answers = await jev.ask(state, questions)
  const ms = Date.now() - started
  if (!answers) { console.log(`\n== ${name}: Jev 没有回答`); continue }
  const mappings = decideMappings(cases, answers, profile)
  let pageRight = 0
  cases.forEach((c, i) => {
    total++
    const m = mappings[i]
    const got = m.decision === "fill" ? m.key : m.decision.toUpperCase()
    const describe = `${c.label ?? c.devName} → ${got}${m.decision === "think" && m.leaning ? `（倾向 ${m.leaning}）` : ""} ${m.confidence.toFixed(2)}`
    if (c.expect.includes(got)) { right++; pageRight++; if (m.decision === "think") deferredOk++ }
    else if (m.decision === "think") { deferredCould++; deferred.push(`${describe}（本可以是 ${c.expect.join(" / ")}）`) }
    else { wrong++; wrongs.push(`${describe}（应为 ${c.expect.join(" / ")}）`) }
  })
  console.log(`\n== ${name}：${cases.length} 个格子，${ms} ms，判对 ${pageRight}`)
}
console.log(`\n合计 ${total} 个格子（键表 ${Object.keys(keys).length} 个键）：判对 ${right}；交给大模型但其实能定 ${deferredCould}；**自信却错 ${wrong}**`)
if (deferred.length) console.log("交给大模型的：\n  " + deferred.join("\n  "))
if (wrongs.length) console.log("自信却错的：\n  " + wrongs.join("\n  "))
console.log(wrong === 0 ? "\nMAP SMOKE PASSED" : "\nMAP SMOKE FAILED")
process.exit(wrong === 0 ? 0 : 1)
