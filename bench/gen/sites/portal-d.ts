// Portal D (dev set): conventional, well-labelled markup, but almost everything important happens in
// secondary interfaces: lookup modal, repeater editors, recommender sub-form, photo dialog, multi-file upload.

import type { SiteSpec, Instance, FInst, LInst } from "../build";
import type { Rng } from "../rng";
import { f, educationList, employmentList, testsList, recommenderList, mailBlock, reviewCfg, texts, type ListKinds } from "../common";
import { renderEngine, type EngineProfile } from "../render-engine";

const K: ListKinds = {
  text: ["text"],
  select: ["select", "select", "radio"],
  country: ["select"],
  month: ["month-2sel", "month-mask"],
  date: ["date-3sel", "date-mask", "date-native"],
  bool: ["check"],
  phone: ["phone"],
  institution: ["lookup"],
  long: ["textarea"],
};
const DOB = { minD: "1950-01-01", maxD: "2012-12-31", yFrom: 1950, yTo: 2012 };

export const spec: SiteSpec = {
  id: "portal-d",
  names: ["Aldermoor University", "University of Aldermoor", "Aldermoor University - Postgraduate Admissions"],
  dateFmts: ["DD/MM/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"],
  idStyleWeights: [6, 3, 1],
  sections: [
    {
      id: "profile",
      titles: ["About you", "Personal details", "Your details"],
      items: [
        f("photo", ["photo"], true, { opts: { types: ["jpg", "jpeg", "png"], maxKB: 2048, asciiName: true, maxName: 50, rules: "JPG or PNG, up to 2 MB. The file name may contain English letters, digits, spaces, hyphens and underscores only and must not exceed 50 characters.", wide: true } }),
        f("title", ["select", "radio"], "flip"),
        [f("family_name", K.text, true), f("given_name", K.text, true)],
        f("preferred_name", K.text),
        f("native_name", K.text, "flip"),
        f("former_name", K.text),
        f("gender", ["select", "radio"], true),
        f("dob", K.date, true, { opts: DOB }),
        [f("birth_country", K.country, true), f("birth_city", K.text, "flip")],
        f("nationality", K.country, true),
        [f("passport_no", K.text, true, { opts: { upper: true, max: 12 } }), f("passport_country", K.country, "flip"), f("passport_issue", K.date, "flip", { opts: { maxD: "2026-09-20", minD: "2010-01-01", yFrom: 2010, yTo: 2026 } }), f("passport_expiry", K.date, true, { opts: { minD: "2026-09-21", yFrom: 2026, yTo: 2040 } })],
      ],
    },
    {
      id: "contact",
      titles: ["Contact details", "How we can reach you", "Address and contact"],
      items: [
        f("email", ["email"], true),
        f("phone", K.phone, true, { opts: { intl: true, help: "Include the country code, for example +44 7400 123456." } }),
        f("alt_phone", K.phone, false, { opts: { intl: true } }),
        [f("addr_line1", K.text, true, { opts: { max: 60 } }), f("addr_line2", K.text, false, { opts: { max: 60 } }), f("addr_city", K.text, true), f("addr_state", K.text), f("addr_postal", K.text), f("addr_country", K.country, true)],
        ...mailBlock(K.text, K.country, K.bool),
      ],
    },
    {
      id: "kin",
      titles: ["Emergency contact", "Next of kin", "Person to contact in an emergency"],
      items: [f("ec_name", K.text, true), f("ec_relation", ["select"], true), f("ec_phone", K.phone, true, { opts: { intl: true } }), f("ec_email", ["email"], false)],
    },
    { id: "education", titles: ["Education", "Your qualifications", "Academic background"], items: [educationList(K, ["modal"])] },
    { id: "tests", titles: ["Tests", "Test results", "Language and admissions tests"], items: [testsList(K, ["modal", "inline"])] },
    { id: "employment", titles: ["Employment", "Work experience", "Employment history"], items: [employmentList(K, ["inline", "modal"])] },
    {
      id: "referees",
      titles: ["Referees", "References", "Your referees"],
      intro: ["Provide two referees. You may send the reference request now or at any time before you submit.", "Two references are required. Requests are e-mailed to referees only when you choose to send them."],
      items: [recommenderList(K, ["modal"])],
    },
    {
      id: "programme",
      titles: ["Programme", "Your programme", "Course selection"],
      items: [f("prog", ["select"], true), f("intake", ["select", "radio"], true), f("mode", ["radio", "select"], true), f("funding", ["select"], true), f("scholarship", ["radio", "select"], "flip"), f("conviction", ["radio", "select"], true), f("hear_about", ["select"])],
    },
    {
      id: "statement",
      titles: ["Personal statement", "Supporting statement", "Statement of purpose"],
      items: [f("research_title", K.text, "flip", { opts: { max: 120, wide: true } }), f("essay", ["rte"], true, { opts: { words: 300, ascii: true, wide: true } })],
      fixedOrder: true,
    },
    {
      id: "documents",
      titles: ["Documents", "Supporting documents", "Upload documents"],
      intro: ["Upload your transcript, a copy of your passport and your CV. Choose a document type for each file. PDF only, up to 4 MB each."],
      items: [f("docs", ["files"], true, { opts: { types: ["pdf"], maxKB: 4096, maxFiles: 6, accept: ".pdf", wide: true } })],
    },
  ],
  splits: [
    [
      { t: ["Personal details", "About you"], s: ["profile"] },
      { t: ["Contact", "Contact details"], s: ["contact", "kin"] },
      { t: ["Education"], s: ["education"] },
      { t: ["Tests and experience", "Experience"], s: ["tests", "employment"] },
      { t: ["Referees", "References"], s: ["referees"] },
      { t: ["Programme and statement", "Your application"], s: ["programme", "statement"] },
      { t: ["Documents", "Uploads"], s: ["documents"] },
    ],
    [
      { t: ["You", "Applicant"], s: ["profile", "contact", "kin"] },
      { t: ["Background", "Education and tests"], s: ["education", "tests"] },
      { t: ["Experience and referees"], s: ["employment", "referees"] },
      { t: ["Programme"], s: ["programme"] },
      { t: ["Statement and documents", "Supporting material"], s: ["statement", "documents"] },
    ],
    [
      { t: ["Programme", "Course"], s: ["programme"] },
      { t: ["Personal details"], s: ["profile"] },
      { t: ["Contact details"], s: ["contact", "kin"] },
      { t: ["Education and employment"], s: ["education", "employment"] },
      { t: ["Tests"], s: ["tests"] },
      { t: ["Referees, statement and documents", "Final sections"], s: ["referees", "statement", "documents"] },
    ],
  ],
};

const profile: EngineProfile = {
  theme: { px: "ad", font: "Georgia, 'Times New Roman', serif", bg: "#f3f1ec", panel: "#ffffff", ink: "#1c2430", accent: "#7a1f3d", accentInk: "#ffffff", line: "#c9c3b8", radius: 3, headBg: "#7a1f3d", headInk: "#ffffff" },
  kit: ["gen/kit/core.js", "gen/kit/w-basic.js", "gen/kit/w-repeater.js", "gen/kit/w-lookup.js", "gen/kit/w-upload.js", "gen/kit/w-rte.js"],
  ui: { label: "for", nav: "side", aria: true, confirmLeave: true, navNum: true },
  sub: ["Postgraduate application", "Online application for taught postgraduate study"],
  footer: ["Aldermoor University Admissions Office. This is a secure service."],
  tx: texts,
  review: (r: Rng) => reviewCfg(r, { cap: r.bool(0.5) }),
  extras: (r: Rng) => ({
    idle: { after: 240, grace: 60, t: "Are you still there?", m: "For your security you will be signed out in {0} seconds. Unsaved changes will be lost.", ok: r.pick(["Stay signed in", "Continue working", "I'm still here"]), lost: "Your session timed out. Unsaved changes were discarded." },
  }),
  fieldX: (fi: FInst) => {
    if (fi.kind === "date-3sel") return { monNum: false };
    return undefined;
  },
  listX: (l: LInst, r: Rng) => {
    if (l.list !== "recommenders") return {};
    const word = l.itemLabel;
    return {
      invite: {
        t: r.pick(["Send request", "Send invitation", "Email " + word]),
        saveSend: r.pick(["Save and send request", "Save & invite", "Save and email " + word]),
        m: "An e-mail with a personal link will be sent to this " + word + " immediately. This cannot be undone. Continue?",
        go: r.pick(["Send now", "Yes, send"]),
        sent: "Request sent",
        done: "Request sent to " + word,
      },
    };
  },
};

export function render(inst: Instance): Record<string, string> {
  return renderEngine(inst, profile);
}
