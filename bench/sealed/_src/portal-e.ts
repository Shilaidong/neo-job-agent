// Portal E (sealed, hostile): one section inside a closed shadow root, one inside a cross-origin iframe,
// one painted on a <canvas> (text entry through an off-screen textarea, like canvas-rendered UI toolkits),
// the rest ordinary DOM. State of every part is mirrored into the page-level store via closures / postMessage.

import type { SiteSpec, Instance } from "../../gen/build";
import type { Rng } from "../../gen/rng";
import { f, flatTests, reviewCfg, texts, SCORE, ENG_SUB } from "../../gen/common";
import { renderEngine, type EngineProfile } from "../../gen/render-engine";

const T = ["text"];
const ED = "education.0";
const eng = { key: "eng_test_type", codes: ENG_SUB };

export const spec: SiteSpec = {
  id: "portal-e",
  names: ["Meridian Pacific University", "Meridian Pacific University - Graduate Admissions"],
  dateFmts: ["DD/MM/YYYY", "YYYY-MM-DD"],
  idStyleWeights: [3, 6, 1],
  sections: [
    {
      id: "person",
      host: "shadow",
      titles: ["Personal particulars", "Applicant details"],
      items: [
        f("title", ["select", "radio"], false),
        [f("family_name", T, true), f("given_name", T, true)],
        f("native_name", T),
        f("gender", ["radio", "dradio", "select"], true),
        f("dob", ["date-mask", "date-3sel"], true, { opts: { minD: "1950-01-01", maxD: "2012-12-31", yFrom: 1950, yTo: 2012 } }),
        [f("nationality", ["sselect", "select"], true), f("birth_country", ["select", "sselect"], true), f("birth_city", T, "flip")],
        [f("passport_no", T, true, { opts: { upper: true, max: 12 } }), f("passport_expiry", ["date-mask", "date-3sel"], true, { opts: { minD: "2026-09-21", yFrom: 2026, yTo: 2040 } })],
      ],
    },
    {
      id: "contact",
      host: "frame",
      titles: ["Contact details", "Contact and address"],
      items: [
        f("email", ["email"], true),
        f("phone", ["phone"], true, { opts: { intl: true, help: "Include the country code." } }),
        [f("addr_line1", T, true, { opts: { max: 50 } }), f("addr_line2", T, false, { opts: { max: 50 } }), f("addr_city", T, true), f("addr_state", T), f("addr_postal", T), f("addr_country", ["select"], true)],
        [f("ec_name", T, true), f("ec_relation", ["select"], true), f("ec_phone", ["phone"], true, { opts: { intl: true } })],
      ],
    },
    {
      id: "academic",
      host: "canvas",
      titles: ["Highest / current qualification", "Most recent university-level qualification"],
      intro: ["Give details of your most recent degree-level study (completed or in progress)."],
      items: [
        [f("institution", T, true, { path: ED, noPh: true }), f("inst_country", ["select"], true, { path: ED })],
        f("level", ["select"], true, { path: ED }),
        f("major", T, true, { path: ED, noPh: true }),
        [f("start", ["month-mask"], true, { path: ED }), f("end", ["month-mask"], true, { path: ED })],
        f("in_progress", ["check"], false, { path: ED }),
        [f("gpa", T, true, { path: ED, noPh: true }), f("gpa_scale", ["select"], true, { path: ED })],
      ],
    },
    {
      id: "english",
      host: "canvas",
      titles: ["English language test", "English proficiency"],
      items: [
        [
          f("eng_test_type", ["select"], true),
          f("eng_test_date", ["date-mask"], true, { when: eng }),
          f("eng_overall", T, true, { when: eng, opts: SCORE, noPh: true }),
          f("eng_l", T, true, { when: eng, opts: SCORE }),
          f("eng_r", T, true, { when: eng, opts: SCORE }),
          f("eng_w", T, true, { when: eng, opts: SCORE }),
          f("eng_s", T, true, { when: eng, opts: SCORE }),
        ],
      ],
    },
    { id: "gre", titles: ["Graduate admissions test", "GRE"], items: [flatTests({ text: T, select: ["select"], date: ["date-mask"], yesno: ["radio", "select"] })[1]] },
    {
      id: "programme",
      titles: ["Programme applied for", "Programme"],
      items: [f("prog", ["select", "sselect"], true), f("intake", ["select", "radio"], true), f("mode", ["radio", "select"], true), f("funding", ["select"], true), f("conviction", ["radio"], true)],
    },
    { id: "statement", titles: ["Statement", "Personal statement"], fixedOrder: true, items: [f("research_title", T, "flip", { opts: { max: 120, wide: true } }), f("essay", ["rte"], true, { opts: { words: 350, wide: true } })] },
    { id: "files", titles: ["Documents", "Uploads"], items: [f("doc_transcript", ["file"], true, { opts: { types: ["pdf"], maxKB: 4096, accept: ".pdf" } }), f("doc_cv", ["file"], true, { opts: { types: ["pdf"], maxKB: 4096, accept: ".pdf" } })] },
  ],
  splits: [
    [
      { t: ["Personal"], s: ["person"] },
      { t: ["Contact"], s: ["contact"] },
      { t: ["Qualification"], s: ["academic"] },
      { t: ["Tests"], s: ["english", "gre"] },
      { t: ["Programme"], s: ["programme", "statement"] },
      { t: ["Documents"], s: ["files"] },
    ],
    [
      { t: ["Programme"], s: ["programme"] },
      { t: ["Personal"], s: ["person"] },
      { t: ["Contact"], s: ["contact"] },
      { t: ["Qualification"], s: ["academic"] },
      { t: ["English test"], s: ["english"] },
      { t: ["Other tests and statement"], s: ["gre", "statement"] },
      { t: ["Documents"], s: ["files"] },
    ],
  ],
};

const profile: EngineProfile = {
  theme: { px: "mp", font: "Arial, 'Helvetica Neue', sans-serif", bg: "#f2f4f7", panel: "#ffffff", ink: "#1f2a37", accent: "#0b63ce", accentInk: "#ffffff", line: "#98a2b3", radius: 4, headBg: "#0b3a6e", headInk: "#ffffff" },
  kit: ["gen/kit/core.js", "gen/kit/w-basic.js", "gen/kit/w-upload.js", "gen/kit/w-rte.js", "sealed/_src/widgets.js", "sealed/_src/hosts.js"],
  ui: { label: "for", nav: "side", aria: false, confirmLeave: false },
  sub: ["Graduate application", "Application for admission"],
  footer: ["Meridian Pacific University. For technical support contact the admissions helpdesk."],
  tx: texts,
  review: (r: Rng) => reviewCfg(r, { ck: "div", pad: true, cap: true }),
  hasFrame: true,
};

export function render(inst: Instance): Record<string, string> {
  return renderEngine(inst, profile);
}
