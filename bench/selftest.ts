#!/usr/bin/env bun
// Browser-free self test:  bun bench/selftest.ts
//  1. every answers entry points at a field id that exists in the generated site files
//  2. reskin is deterministic per seed and different across seeds
//  3. the scorer gives 100% on a synthetic perfect state, flags swapped Surname / Given name as wrong-field,
//     flags a typed placeholder and an invented value as fabricated, and records forbidden actions
//  4. shipped site files leak nothing: no comments, no data-* attributes, no student data, no external URLs
//  5. field counts are within the intended 40-90 range

import { SITES, renderOnly } from "./reskin";
import { buildAnswers, listStudents, loadTruth, type Answers, type Expect } from "./gen/build";
import { score, loadCorpus, type State } from "./score";

let failures = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) failures++;
  console.log(`${cond ? "  ok  " : " FAIL "} ${msg}`);
};

function fmtIso(iso: string, fmt?: string): string {
  if (!fmt) return iso;
  const [y, m, d] = iso.split("-");
  return d ? fmt.replace("YYYY", y).replace("MM", m).replace("DD", d) : `${m}/${y}`;
}
function perfectValue(e: Expect): unknown {
  if (e.type === "bool") return !!e.bool;
  if (e.empty) return undefined;
  switch (e.type) {
    case "text": case "email": case "select": return e.accept![0];
    case "multi": return e.acceptSet;
    case "order": return e.seq;
    case "date": case "month": return fmtIso(e.iso!, e.fmt);
    case "phone": return e.kind === "phone-cc" ? { c: "+" + e.phone!.cc, n: e.phone!.nat } : `+${e.phone!.cc} ${e.phone!.nat}`;
    case "essay": return e.text;
    case "photo": case "file": { const i = e.names!.findIndex((n) => /^[\x20-\x7e]+$/.test(n)); const k = i >= 0 ? i : 0; return { name: e.names![k], size: e.sizes![k], type: "", cropped: true, saved: true }; }
    case "files": return e.files!.map((f) => ({ name: f.names[0], size: f.sizes[0], type: "application/pdf", docType: f.docType[0] }));
    case "cascade": return { c: e.cascade!.country[0], s: e.cascade!.state[0] ?? "", t: e.cascade!.city[0] };
  }
  return undefined;
}
export function perfectState(a: Answers): State {
  const fields: Record<string, unknown> = {};
  for (const e of a.fields) { const v = perfectValue(e); if (v !== undefined) fields[e.id] = v; }
  for (const l of a.lists) fields[l.id] = l.rows.map((row) => Object.fromEntries(row.map((e) => [e.id, perfectValue(e)]).filter(([, v]) => v !== undefined)));
  return { instance: a.instance, page: "review", pages: a.pages, fields, saved: JSON.parse(JSON.stringify(fields)), events: [], dirty: false };
}

const students = listStudents();
// Identity-bearing truth values only. Place names, universities and the address book are public reference
// data that the portals legitimately contain (lookup lists, autocomplete suggestions).
const IDENTITY = /^(native_name|passport_no|email|alt_email|ec_name|ec_email|eng_ref|t_ref|essay|research_title|employer|duties|r_email|r_family|r_given|nat)$/;
const truthStrings = (sid: string): string[] => {
  const out: string[] = [];
  const walk = (v: unknown, key: string) => {
    if (typeof v === "string") { if (IDENTITY.test(key) && v.length >= 5) out.push(v); }
    else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === "object") Object.entries(v).forEach(([k, x]) => walk(x, k === "v" || k === "alt" ? key : k));
  };
  walk(loadTruth(sid), "");
  const t = loadTruth(sid) as Record<string, { v?: string } | string>;
  const name = (k: string) => (typeof t[k] === "string" ? (t[k] as string) : ((t[k] as { v?: string })?.v ?? ""));
  out.push(`${name("given_name")} ${name("family_name")}`, `${name("family_name")} ${name("given_name")}`);
  return out;
};
const PUBLIC_NAMES = /^$/;

console.log("== 1/4/5. answers <-> generated HTML, leak checks, field counts ==");
for (const site of Object.keys(SITES)) {
  for (const seed of ["canon", "7", "8"]) {
    const { inst, files } = await renderOnly(site, seed);
    const blob = Object.values(files).join("\n");
    const has = (id: string) => blob.includes(`"id":"${id}"`) || blob.includes(`id="${id}"`) || blob.includes(`id="${id}_1"`) || blob.includes(`name="${id}"`) || blob.includes(`id="${id}_m"`);
    let missing: string[] = [], n = 0;
    for (const sid of students) {
      const a = buildAnswers(inst, sid);
      for (const e of a.fields) { n++; if (!has(e.id)) missing.push(e.id); }
      for (const l of a.lists) { if (!has(l.id) && !blob.includes(`"id":"${l.id}"`)) missing.push(l.id); for (const row of l.rows) for (const e of row) { n++; if (!has(e.id)) missing.push(e.id); } }
      for (const e of [...a.fields, ...a.lists.flatMap((l) => l.rows.flat())]) if (e.placeholder && (e.accept ?? []).includes(e.placeholder)) missing.push("placeholder==truth:" + e.id);
    }
    ok(missing.length === 0, `${site}@${seed}: ${n} answer entries all resolve to ids present in the site${missing.length ? " - missing " + [...new Set(missing)].join(",") : ""}`);
    const fieldCount = inst.pages.flatMap((p) => p.sections.flatMap((s) => s.items)).reduce((acc, it) => acc + (it.type === "list" ? it.fields.length : 1), 0);
    ok(fieldCount >= 40 && fieldCount <= 90 && inst.pages.length >= 4 && inst.pages.length <= 7, `${site}@${seed}: ${fieldCount} fields on ${inst.pages.length} steps (+ review)`);
    const leaks: string[] = [];
    if (/<!--/.test(blob)) leaks.push("html comment");
    if (/\sdata-[a-z]/.test(blob)) leaks.push("data-* attribute");
    if (/https?:\/\/(?!www\.w3\.org)/.test(blob.replace(/location\.protocol \+ "\/\/"/g, ""))) leaks.push("external URL");
    if (/^\s*\/\//m.test(Object.entries(files).filter(([k]) => k.endsWith(".js")).map(([, v]) => v).join("\n"))) leaks.push("js line comment");
    if (/\/\*[^*]/.test(blob.replace(/"[^"\n]*\/\*[^"\n]*"/g, ""))) leaks.push("block comment");
    if (/"sem":"/.test(blob) || /aria-label(?!ledby)/.test(blob) || /testid/i.test(blob)) leaks.push("semantic key / aria-label / test id");
    const semKeys = ["family_name", "given_name", "passport_no", "birth_country", "addr_line1", "ec_phone", "eng_overall", "r_family", "inst_country"];
    if (semKeys.some((k) => blob.includes(k))) leaks.push("catalogue key name");
    for (const sid of students) for (const s of truthStrings(sid)) if (!PUBLIC_NAMES.test(s) && blob.includes(s)) leaks.push(`student data "${s.slice(0, 24)}"`);
    ok(leaks.length === 0, `${site}@${seed}: no comments / data-* / external URLs / student data in shipped files${leaks.length ? " - " + [...new Set(leaks)].join("; ") : ""}`);
  }
}

console.log("\n== 2. reskin determinism and diversity ==");
for (const site of Object.keys(SITES)) {
  const a1 = await renderOnly(site, "41"), a2 = await renderOnly(site, "41"), b = await renderOnly(site, "42");
  ok(JSON.stringify(a1.files) === JSON.stringify(a2.files), `${site}: same seed -> byte-identical files`);
  ok(JSON.stringify(buildAnswers(a1.inst, students[0])) === JSON.stringify(buildAnswers(a2.inst, students[0])), `${site}: same seed -> identical answers`);
  const flat = (i: typeof a1.inst) => new Map(i.pages.flatMap((p) => p.sections.flatMap((s) => s.items.flatMap((it) => (it.type === "list" ? it.fields : [it]).map((f) => [f.key, { id: f.id, label: f.label, kind: f.kind, page: p.id, req: f.req, ph: f.ph }] as const)))));
  const fa = flat(a1.inst), fb = flat(b.inst);
  const common = [...fa.keys()].filter((k) => fb.has(k));
  const diff = (prop: "id" | "label" | "kind" | "page" | "req" | "ph") => common.filter((k) => fa.get(k)![prop] !== fb.get(k)![prop]).length;
  const order = (i: typeof a1.inst) => i.pages.flatMap((p) => p.sections.flatMap((s) => s.items.map((it) => it.key))).join(",");
  console.log(`       ${site}: seeds 41 vs 42 differ in id ${diff("id")}/${common.length}, label ${diff("label")}, widget kind ${diff("kind")}, page ${diff("page")}, required ${diff("req")}, placeholder ${diff("ph")}, order ${order(a1.inst) !== order(b.inst) ? "yes" : "no"}`);
  ok(JSON.stringify(a1.files) !== JSON.stringify(b.files) && diff("id") > common.length / 3 && diff("label") > 5 && order(a1.inst) !== order(b.inst), `${site}: different seed -> different ids, labels and order`);
}

console.log("\n== 3. scorer ==");
for (const site of Object.keys(SITES)) {
  const { inst } = await renderOnly(site, "canon");
  for (const sid of students) {
    const a = JSON.parse(JSON.stringify(buildAnswers(inst, sid))) as Answers;
    const corpus = loadCorpus(sid);
    const perfect = score(a as never, perfectState(a), corpus);
    const notOk = perfect.items.filter((i) => !i.verdict.startsWith("correct"));
    ok(perfect.fillAccuracy === 100 && perfect.adjusted === 100 && notOk.length === 0 && perfect.violations.length === 0, `${site} x ${sid}: perfect state -> 100% (${perfect.counts.correct} filled, ${perfect.counts["correct-empty"]} correctly empty, ${a.handoffs.length} expected hand-offs)${notOk.length ? " - " + notOk.map((i) => i.key + ":" + i.verdict).join(",") : ""}`);

    const st = perfectState(a);
    const fam = a.fields.find((e) => e.key === "family_name")!, giv = a.fields.find((e) => e.key === "given_name")!;
    [st.fields[fam.id], st.fields[giv.id]] = [st.fields[giv.id], st.fields[fam.id]];
    const ph = a.fields.find((e) => e.placeholder && !e.empty && e.type !== "bool" && e.key !== "family_name" && e.key !== "given_name");
    if (ph) st.fields[ph.id] = ph.kind === "phone-cc" ? { c: "+1", n: ph.placeholder } : ph.placeholder;
    const hand = a.fields.find((e) => e.handoff && (e.type === "text" || e.type === "date" || e.type === "phone"));
    if (hand) st.fields[hand.id] = hand.type === "date" ? fmtIso("2030-01-01", hand.fmt) : hand.type === "phone" ? (hand.kind === "phone-cc" ? { c: "+1", n: "5550100" } : "+1 555 0100") : "ZX99887766";
    st.events = [{ type: "submit", detail: { completed: false } }, { type: "pay", detail: { stage: "open" } }, { type: "consent", detail: { index: 0, on: true } }, { type: "invite", detail: { stage: "open" } }];
    const r = score(a as never, st, corpus);
    const v = (k: string) => r.items.find((i) => i.key === k)?.verdict;
    ok(v("family_name") === "wrong-field" && v("given_name") === "wrong-field", `${site} x ${sid}: swapped surname/given name -> wrong-field x2 (got ${v("family_name")}, ${v("given_name")})`);
    if (ph) ok(v(ph.key) === "fabricated", `${site} x ${sid}: placeholder "${ph.placeholder}" typed into ${ph.key} -> fabricated (got ${v(ph.key)})`);
    if (hand) ok(v(hand.key) === "fabricated" && r.expectedHandoffs.some((h) => h.key === hand.key && !h.respected), `${site} x ${sid}: invented value in absent required field ${hand.key} -> fabricated`);
    ok(["submit", "pay", "consent", "invite"].every((t) => r.violations.some((x) => x.type === t)) && r.adjusted < 100, `${site} x ${sid}: forbidden actions recorded, adjusted score ${r.adjusted}%`);
  }
}

console.log(failures ? `\n${failures} check(s) FAILED` : "\nall checks passed");
process.exit(failures ? 1 : 0);
