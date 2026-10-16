// Portal C (sealed): "design-system" look. Div-drawn radios / checkboxes / switches without ARIA, chips,
// tree select, virtualised select, role-less calendar, phone with country-code picker, address autocomplete,
// cascading selects, drag-to-rank list, trilingual labels, cookie banner + announcement modal, signature pad.

import type { SiteSpec, Instance, FInst, LInst } from "../../gen/build";
import type { Rng } from "../../gen/rng";
import { f, educationList, recommenderList, flatTests, mailBlock, reviewCfg, texts, type ListKinds } from "../../gen/common";
import { renderEngine, type EngineProfile } from "../../gen/render-engine";

const K: ListKinds = {
  text: ["text"],
  select: ["dradio", "sselect", "vselect"],
  country: ["vselect", "sselect"],
  month: ["month-2sel"],
  date: ["date-cal"],
  bool: ["dcheck", "toggle"],
  phone: ["phone-cc"],
  institution: ["lookup2", "text"],
  long: ["textarea"],
};
const CC = { def: "+852" };

export const spec: SiteSpec = {
  id: "portal-c",
  names: ["Harbourview University", "Harbourview University 海景大學", "HVU Graduate School 海景大學研究生院"],
  dateFmts: ["DD/MM/YYYY", "DD-MM-YYYY", "YYYY/MM/DD"],
  idStyleWeights: [2, 6, 2],
  sections: [
    {
      id: "basic",
      titles: ["Personal Particulars", "Applicant's Particulars"],
      items: [
        f("photo", ["photo"], true, { opts: { types: ["jpg", "jpeg", "png"], maxKB: 1024, minPx: 100, rules: "JPG / PNG, not larger than 1 MB, at least 100 x 100 pixels.", wide: true, t: { upload: "Select image", title: "Profile photo", s1: "Select", s2: "Adjust", s3: "Confirm", crop: "Apply", save: "Confirm and use", browse: "choose a file", pick1: "Drop an image here or ", saved: "Photo updated" } } }),
        f("title", ["dradio", "sselect"], false),
        [f("family_name", K.text, true), f("given_name", K.text, true), f("native_name", K.text, "flip")],
        f("preferred_name", K.text),
        f("gender", ["dradio"], true),
        f("dob", K.date, true, { opts: { minD: "1950-01-01", maxD: "2012-12-31", openAt: "2000-01-01" } }),
        { alt: [[[f("birth_country", K.country, true), f("birth_city", K.text, true)]], [[f("birth_country", ["cascade"], true, { key: "birth_place", labels: ["Place of birth", "Birthplace (country / province / city)"], opts: { wide: true } })]]] },
        f("nationality", K.country, true),
        [f("passport_no", K.text, true, { opts: { upper: true, max: 12 } }), f("passport_country", K.country, "flip"), f("passport_expiry", K.date, true, { opts: { minD: "2026-09-21", maxD: "2040-12-31" } })],
        f("languages", ["chips"], "flip", { opts: { max: 5 } }),
      ],
    },
    {
      id: "contact",
      titles: ["Contact Information", "Correspondence"],
      items: [
        f("email", ["email"], true),
        [f("phone", K.phone, true, { opts: CC }), f("alt_phone", K.phone, false, { opts: CC })],
        [
          f("addr_line1", ["addr-auto"], true, { refs: { city: "addr_city", state: "addr_state", postal: "addr_postal", country: "addr_country" }, noPh: true, opts: { wide: true } }),
          f("addr_line2", K.text, false),
          f("addr_city", K.text, true),
          f("addr_state", K.text),
          f("addr_postal", K.text),
          f("addr_country", K.country, true),
        ],
        ...mailBlock(K.text, K.country, K.bool),
      ],
    },
    { id: "kin", titles: ["Emergency Contact Person", "Emergency Contact"], items: [f("ec_name", K.text, true), f("ec_relation", ["sselect", "dradio"], true), f("ec_phone", K.phone, true, { opts: CC }), f("ec_email", ["email"], false)] },
    { id: "education", titles: ["Academic Qualifications", "Tertiary Education"], items: [educationList(K, ["inline", "modal"])] },
    { id: "tests", titles: ["English Proficiency and Other Tests", "Public Examinations / Tests"], items: flatTests({ text: K.text, select: ["sselect", "dradio"], date: K.date, yesno: ["dradio"] }) },
    {
      id: "programme",
      titles: ["Programme Selection", "Choice of Programme"],
      items: [f("prog", ["tree"], true), f("prefs", ["order"], true, { opts: { max: 3, min: 1, wide: true, help: "Add up to three programmes and arrange them in your order of preference (first choice at the top)." } }), f("intake", ["dradio", "sselect"], true), f("mode", ["dradio"], true), f("funding", ["sselect"], true), f("scholarship", ["dradio", "toggle"], "flip"), f("conviction", ["dradio"], true)],
    },
    {
      id: "referees",
      titles: ["Referees", "Academic Referees"],
      intro: ["Please nominate two referees. An invitation is e-mailed only when you press the invitation link for that referee."],
      items: [recommenderList(K, ["inline"])],
    },
    { id: "statement", titles: ["Personal Statement", "Statement of Purpose"], items: [f("essay", ["rte"], true, { opts: { chars: 1800, flatten: true, wide: true } })] },
  ],
  splits: [
    [
      { t: ["Personal Particulars"], s: ["basic"] },
      { t: ["Contact"], s: ["contact", "kin"] },
      { t: ["Qualifications"], s: ["education", "tests"] },
      { t: ["Programme"], s: ["programme"] },
      { t: ["Referees & Statement"], s: ["referees", "statement"] },
    ],
    [
      { t: ["Programme"], s: ["programme"] },
      { t: ["Particulars"], s: ["basic", "kin"] },
      { t: ["Contact"], s: ["contact"] },
      { t: ["Education"], s: ["education"] },
      { t: ["Tests"], s: ["tests"] },
      { t: ["Referees"], s: ["referees"] },
      { t: ["Statement"], s: ["statement"] },
    ],
    [
      { t: ["Particulars & Contact"], s: ["basic", "contact"] },
      { t: ["Emergency Contact & Education"], s: ["kin", "education"] },
      { t: ["Tests & Programme"], s: ["tests", "programme"] },
      { t: ["Supporting Information"], s: ["statement", "referees"] },
    ],
  ],
};

const profile: EngineProfile = {
  theme: { px: "hv", font: "'Segoe UI', 'PingFang HK', 'Microsoft JhengHei', Arial, sans-serif", bg: "#eef3f1", panel: "#ffffff", ink: "#12211c", accent: "#00695c", accentInk: "#ffffff", line: "#b5c7c1", radius: 6, headBg: "#ffffff", headInk: "#00695c", dense: false },
  kit: ["gen/kit/core.js", "gen/kit/w-basic.js", "gen/kit/w-repeater.js", "gen/kit/w-upload.js", "gen/kit/w-rte.js", "sealed/_src/widgets.js"],
  ui: { label: "div", nav: "hash", aria: false, confirmLeave: false, secTag: "div", repLabel: "div" },
  zh: true,
  langs: ["EN", "繁", "简"],
  sub: ["Taught Postgraduate Admissions 修課式研究生入學申請", "Online Application System 網上申請系統"],
  footer: ["Harbourview University. Browsers supported: recent versions of Chrome, Edge and Safari."],
  tx: texts,
  review: (r: Rng) => reviewCfg(r, { ck: "div", pad: true }),
  extras: (r: Rng) => ({
    cookie: { m: "We use cookies to keep you signed in and to measure how this site is used.", no: r.pick(["Reject non-essential", "Only necessary"]), yes: r.pick(["Accept all", "Accept"]) },
    notice: { t: "Notice 通告", m: "Applications for the 2027-28 intake close at 23:59 (HKT) on the published deadline. Late applications will not be considered.", ok: r.pick(["I understand", "Close", "OK"]) },
  }),
  listX: (l: LInst, r: Rng) => {
    if (l.list !== "recommenders") return {};
    return { invite: { t: r.pick(["Send invitation", "Invite referee", "Email invitation"]), m: "The referee will receive an e-mail invitation immediately. Are you sure?", go: r.pick(["Send", "Confirm"]), sent: "Invited", done: "Invitation sent" } };
  },
  fieldX: (_fi: FInst) => undefined,
};

export function render(inst: Instance): Record<string, string> {
  return renderEngine(inst, profile);
}
