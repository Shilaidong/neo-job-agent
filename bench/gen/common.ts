// Spec-building helpers and text pools shared by portal definitions.

import type { FSpec, Item, LSpec } from "./build";
import type { Rng } from "./rng";

export function f(sem: string, kinds: string[], req: boolean | "flip" = false, extra: Partial<FSpec> = {}): FSpec {
  return { sem, kinds, req, ...extra };
}

export const ENG_SUB = ["IELTS", "TOEFL", "PTE", "DET", "CAE"];
export const SCORE = { re: "^\\d{1,3}(\\.\\d{1,2})?$", reMsg: "Enter a number, for example 6.5 or 95" };

export interface ListKinds {
  text: string[];
  select: string[];
  country: string[];
  month: string[];
  date: string[];
  bool: string[];
  phone: string[];
  institution: string[];
  long: string[];
}

export function educationList(k: ListKinds, editors: string[], extra: Partial<LSpec> = {}): LSpec {
  return {
    list: "education",
    labels: ["Education history", "Academic qualifications", "Post-secondary education", "Universities and colleges attended"],
    itemLabels: ["qualification", "institution", "education record"],
    editors,
    summary: ["institution", "level", "end"],
    min: 1,
    req: true,
    items: [
      [f("institution", k.institution, true, { refs: { city: "inst_city", country: "inst_country" }, noPh: true }), f("inst_country", k.country, true), f("inst_city", k.text, "flip")],
      f("level", k.select, true),
      f("degree_title", k.text, "flip"),
      f("major", k.text, true),
      [f("start", k.month, true), f("end", k.month, true)],
      f("in_progress", k.bool),
      [f("gpa", k.text, false), f("gpa_scale", k.select, false)],
      f("instr_lang", k.select, "flip"),
    ],
    ...extra,
  };
}

export function employmentList(k: ListKinds, editors: string[], extra: Partial<LSpec> = {}): LSpec {
  return {
    list: "employment",
    labels: ["Employment history", "Work experience", "Professional experience"],
    itemLabels: ["position", "employment record", "job"],
    editors,
    summary: ["employer", "job_title", "emp_start"],
    items: [
      f("employer", k.text, true),
      f("job_title", k.text, true),
      [f("emp_country", k.country, true), f("emp_city", k.text, false)],
      [f("emp_current", k.bool), f("emp_start", k.month, true), f("emp_end", k.month, true, { when: { key: "emp_current", codes: [false] } })],
      f("emp_type", k.select, "flip"),
      f("duties", k.long, false, { opts: { max: 600, count: true, rows: 4, wide: true } }),
    ],
    ...extra,
  };
}

export function testsList(k: ListKinds, editors: string[], extra: Partial<LSpec> = {}): LSpec {
  const eng = { key: "t_kind", codes: ENG_SUB };
  const grad = { key: "t_kind", codes: ["GRE", "GMAT"] };
  return {
    list: "tests",
    labels: ["Test scores", "Standardised tests", "English language and admissions tests"],
    itemLabels: ["test", "test result", "score report"],
    editors,
    summary: ["t_kind", "t_date"],
    items: [
      [f("t_kind", k.select, true), f("t_date", k.date, true, { opts: { maxD: "2026-09-20", minD: "2021-01-01" } })],
      [f("t_overall", k.text, true, { when: eng, opts: SCORE }), f("t_l", k.text, true, { when: eng, opts: SCORE }), f("t_r", k.text, true, { when: eng, opts: SCORE }), f("t_w", k.text, true, { when: eng, opts: SCORE }), f("t_s", k.text, true, { when: eng, opts: SCORE })],
      [f("t_v", k.text, true, { when: grad, opts: { num: [130, 170] } }), f("t_q", k.text, true, { when: grad, opts: { num: [130, 170] } }), f("t_aw", k.text, true, { when: grad, opts: { num: [0, 6] } })],
      f("t_ref", k.text, false),
    ],
    ...extra,
  };
}

export function recommenderList(k: ListKinds, editors: string[], extra: Partial<LSpec> = {}): LSpec {
  return {
    list: "recommenders",
    labels: ["Referees", "Recommenders", "References"],
    itemLabels: ["referee", "recommender", "reference"],
    editors,
    summary: ["r_family", "r_org", "r_email"],
    min: 2,
    max: 3,
    req: true,
    items: [
      f("r_title", k.select, false),
      [f("r_family", k.text, true), f("r_given", k.text, true)],
      f("r_org", k.text, true),
      f("r_position", k.text, true),
      f("r_email", ["email"], true),
      f("r_phone", k.phone, false, { opts: { intl: true } }),
      f("r_relation", k.select, true),
    ],
    ...extra,
  };
}

export function flatTests(k: { text: string[]; select: string[]; date: string[]; yesno: string[] }): Item[] {
  const eng = { key: "eng_test_type", codes: ENG_SUB };
  const gre = { key: "gre_taken", codes: ["Y"] };
  return [
    [
      f("eng_test_type", k.select, true),
      f("eng_test_date", k.date, true, { when: eng, opts: { maxD: "2026-09-20", minD: "2021-01-01" } }),
      f("eng_overall", k.text, true, { when: eng, opts: SCORE }),
      f("eng_l", k.text, true, { when: eng, opts: SCORE }),
      f("eng_r", k.text, true, { when: eng, opts: SCORE }),
      f("eng_w", k.text, true, { when: eng, opts: SCORE }),
      f("eng_s", k.text, true, { when: eng, opts: SCORE }),
      f("eng_ref", k.text, "flip", { when: eng }),
    ],
    [
      f("gre_taken", k.yesno, true),
      f("gre_date", k.date, true, { when: gre, opts: { maxD: "2026-09-20", minD: "2021-01-01" } }),
      f("gre_v", k.text, true, { when: gre, opts: { num: [130, 170] } }),
      f("gre_q", k.text, true, { when: gre, opts: { num: [130, 170] } }),
      f("gre_aw", k.text, true, { when: gre, opts: { num: [0, 6] } }),
    ],
  ];
}

export function mailBlock(text: string[], country: string[], bool: string[]): Item[] {
  const w = { key: "mail_same", codes: [false] };
  return [
    [
      f("mail_same", bool),
      f("mail_line1", text, true, { when: w }),
      f("mail_line2", text, false, { when: w }),
      f("mail_city", text, true, { when: w }),
      f("mail_state", text, false, { when: w }),
      f("mail_postal", text, false, { when: w }),
      f("mail_country", country, true, { when: w }),
    ],
  ];
}

export const CONSENTS = [
  "I declare that the information given in this application is true, complete and accurate to the best of my knowledge.",
  "I have read and agree to the Terms and Conditions and the Privacy Notice.",
  "I understand that giving false or incomplete information may lead to the withdrawal of any offer.",
  "I authorise the University to verify my qualifications with the awarding institutions.",
  "I consent to the processing of my personal data for the purposes of admission.",
];

export function reviewCfg(r: Rng, o: { ck?: string; pad?: boolean; cap?: boolean } = {}): Record<string, unknown> {
  const n = 2 + r.int(2);
  const cs = r.shuffle(CONSENTS).slice(0, n);
  return {
    t: r.pick(["Declaration", "Declaration and signature", "Applicant's declaration"]),
    intro: r.pick(["Please read the statements below carefully. They must be completed by the applicant in person.", "The applicant must personally confirm each of the following statements before the application can be submitted."]),
    cs,
    ids: cs.map((_, i) => r.pick(["agree", "chkDecl", "consent", "c"]) + (i + 1)),
    ck: o.ck ?? "native",
    sigId: r.pick(["signature", "txtSign", "fullNameSign", "s_77"]),
    sigL: r.pick(["Type your full legal name as your electronic signature", "Electronic signature (full name)", "Signed (type full name)"]),
    pad: !!o.pad,
    cap: !!o.cap,
    fee: r.pick(["A non-refundable application fee of 75.00 will be charged to your card.", "Application fee: 120.00 (non-refundable)."]),
    need: "You must confirm every statement and sign before submitting.",
    doneT: "Application submitted",
    doneM: "Thank you. Your application has been submitted and can no longer be edited.",
  };
}

export function texts(r: Rng): Record<string, string> {
  return {
    save: r.pick(["Save draft", "Save", "Save for later", "Save progress"]),
    next: r.pick(["Save and continue", "Save & next", "Continue", "Next"]),
    back: r.pick(["Back", "Previous"]),
    submit: r.pick(["Submit application", "Submit", "Submit my application"]),
    pay: r.pick(["Pay application fee", "Pay fee", "Proceed to payment"]),
    review: r.pick(["Review and submit", "Review & submit", "Summary and declaration"]),
    savedMsg: r.pick(["Draft saved", "Your progress has been saved", "Saved"]),
  };
}
