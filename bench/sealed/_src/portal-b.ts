// Portal B (sealed): single-page app, tabs inside one URL, floating / placeholder-only labels,
// searchable popup selects that render ten rows at a time, drawer editors, save-then-validate.

import type { SiteSpec, Instance, FInst } from "../../gen/build";
import type { Rng } from "../../gen/rng";
import { f, educationList, employmentList, flatTests, mailBlock, reviewCfg, texts, type ListKinds } from "../../gen/common";
import { renderEngine, type EngineProfile } from "../../gen/render-engine";

const K: ListKinds = {
  text: ["text"],
  select: ["select", "sselect", "radio"],
  country: ["sselect"],
  month: ["month-mask", "month-2sel"],
  date: ["date-mask"],
  bool: ["check"],
  phone: ["phone"],
  institution: ["lookup2"],
  long: ["textarea"],
};
const DOB = { minD: "1950-01-01", maxD: "2012-12-31" };

export const spec: SiteSpec = {
  id: "portal-b",
  names: ["Kestrel Institute of Technology", "Kestrel Tech", "KIT Graduate School"],
  dateFmts: ["DD/MM/YYYY", "YYYY-MM-DD", "DD.MM.YYYY"],
  idStyleWeights: [3, 5, 2],
  sections: [
    {
      id: "identity",
      titles: ["Identity", "Personal data", "Who you are"],
      items: [
        f("title", ["select", "radio"], false),
        [f("given_name", K.text, true), f("family_name", K.text, true)],
        f("preferred_name", K.text),
        f("native_name", K.text),
        f("gender", ["radio", "select"], true),
        f("dob", K.date, true, { opts: DOB }),
        [f("birth_country", K.country, true), f("birth_city", K.text, "flip")],
        [f("nationality", K.country, true), f("second_nationality", K.country, false)],
      ],
    },
    {
      id: "passport",
      titles: ["Travel document", "Passport", "Identity document"],
      items: [[f("passport_no", K.text, true, { opts: { upper: true, max: 12 } }), f("passport_country", K.country, true), f("passport_issue", K.date, "flip", { opts: { maxD: "2026-09-20", minD: "2010-01-01" } }), f("passport_expiry", K.date, true, { opts: { minD: "2026-09-21" } })]],
    },
    {
      id: "contact",
      titles: ["Contact", "Contact data", "Reach me at"],
      items: [
        [f("email", ["email"], true), f("alt_email", ["email"], false)],
        [f("phone", K.phone, true, { opts: { intl: true, re: "^\\+?[\\d\\s-]{8,20}$", reMsg: "Use digits, spaces or hyphens; start with + and the country code" } }), f("alt_phone", K.phone, false, { opts: { intl: true } })],
        [f("addr_line1", K.text, true, { opts: { max: 40 } }), f("addr_line2", K.text, false, { opts: { max: 40 } }), f("addr_city", K.text, true), f("addr_state", K.text), f("addr_postal", K.text), f("addr_country", K.country, true)],
        ...mailBlock(K.text, K.country, K.bool),
      ],
    },
    { id: "kin", titles: ["Emergency contact", "In case of emergency"], items: [f("ec_name", K.text, true), f("ec_relation", ["select", "sselect"], true), f("ec_phone", K.phone, true, { opts: { intl: true } }), f("ec_email", ["email"], false)] },
    { id: "education", titles: ["Education", "Higher education"], items: [educationList(K, ["drawer"])] },
    { id: "tests", titles: ["Language and aptitude tests", "Tests"], items: flatTests({ text: K.text, select: ["select", "sselect"], date: K.date, yesno: ["radio"] }) },
    { id: "work", titles: ["Work experience", "Professional experience"], items: [employmentList(K, ["drawer", "inline"])] },
    {
      id: "choice",
      titles: ["Programme choice", "Your programme"],
      items: [f("prog", ["sselect"], true), f("intake", ["select", "radio"], true), f("mode", ["radio"], true), f("funding", ["select", "sselect"], true), f("scholarship", ["radio"], "flip"), f("conviction", ["radio"], true), f("hear_about", ["select"]), f("languages", ["checks"], "flip", { opts: { wide: true } })],
    },
    {
      id: "motivation",
      titles: ["Motivation", "Motivation letter", "Statement"],
      fixedOrder: true,
      items: [f("research_title", K.text, "flip", { opts: { max: 80, wide: true } }), f("essay", ["textarea"], true, { opts: { max: 1500, count: true, rows: 12, ascii: true, wide: true } })],
    },
    {
      id: "files",
      titles: ["Attachments", "Files"],
      items: [f("doc_cv", ["file"], true, { opts: { types: ["pdf"], maxKB: 2048, plainTrigger: true, accept: ".pdf" } }), f("doc_transcript", ["file"], true, { opts: { types: ["pdf"], maxKB: 2048, plainTrigger: true, accept: ".pdf" } }), f("doc_passport", ["file"], "flip", { opts: { types: ["pdf"], maxKB: 2048, plainTrigger: true, accept: ".pdf" } })],
    },
  ],
  splits: [
    [
      { t: ["Personal", "You"], s: ["identity", "passport"] },
      { t: ["Contact"], s: ["contact", "kin"] },
      { t: ["Education"], s: ["education"] },
      { t: ["Tests & work", "Experience"], s: ["tests", "work"] },
      { t: ["Programme"], s: ["choice", "motivation"] },
      { t: ["Attachments"], s: ["files"] },
    ],
    [
      { t: ["Programme"], s: ["choice"] },
      { t: ["Personal"], s: ["identity"] },
      { t: ["Passport & contact"], s: ["passport", "contact", "kin"] },
      { t: ["Background"], s: ["education", "work"] },
      { t: ["Tests"], s: ["tests"] },
      { t: ["Motivation & files"], s: ["motivation", "files"] },
    ],
    [
      { t: ["Profile"], s: ["identity", "contact"] },
      { t: ["Documents"], s: ["passport", "kin"] },
      { t: ["Studies"], s: ["education", "tests"] },
      { t: ["Career"], s: ["work"] },
      { t: ["Application"], s: ["choice", "motivation", "files"] },
    ],
  ],
};

const profile: EngineProfile = {
  theme: { px: "kx", font: "'Helvetica Neue', Helvetica, Arial, sans-serif", bg: "#f5f7fb", panel: "#ffffff", ink: "#16202e", accent: "#1f5eff", accentInk: "#ffffff", line: "#b8c2d3", radius: 8, headBg: "#0e1726", headInk: "#ffffff", underline: true },
  kit: ["gen/kit/core.js", "gen/kit/w-basic.js", "gen/kit/w-repeater.js", "gen/kit/w-upload.js", "sealed/_src/widgets.js"],
  ui: { label: "float", nav: "tabs", aria: true, confirmLeave: true, repLabel: "float" },
  sub: ["Application portal", "Apply online"],
  footer: ["Kestrel Institute of Technology - Admissions. Need help? Use the chat in the corner."],
  tx: texts,
  review: (r: Rng) => reviewCfg(r, { ck: "native" }),
  labelMode: (fi: FInst, r: Rng) => (["text", "email", "phone"].includes(fi.kind) && r.bool(0.3) ? "ph" : undefined),
  fieldX: (fi: FInst) => (fi.kind === "lookup2" ? { t: {} } : undefined),
};

export function render(inst: Instance): Record<string, string> {
  return renderEngine(inst, profile);
}
