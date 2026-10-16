// Spec -> Instance (seeded) -> answers. Site renderers consume the Instance; nothing semantic is
// allowed to leak from the Instance into the shipped HTML/JS except through the deliberate id styles.

import { Rng } from "./rng";
import { CATALOG, OPAQUE_PREFIXES, type Sem } from "./catalog";
import { optionSet, PROGRAMMES, REGIONS, countries, COUNTRY_SCHEME_COUNT, type Opt } from "./data";
import { readFileSync, statSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

export const BENCH = join(import.meta.dir, "..");

// ---------- spec types ----------
export interface FSpec {
  sem: string;
  key?: string; // defaults to sem; must be unique within its scope
  kinds: string[];
  req?: boolean | "flip";
  when?: { key: string; codes: (string | boolean)[] };
  opts?: Record<string, unknown>;
  refs?: Record<string, string>; // name -> sibling key, resolved to ids
  labels?: string[]; // override catalogue labels
  noPh?: boolean;
  path?: string; // read truth from a nested object, e.g. "education.0"
}
export interface LSpec {
  list: string; // truth array name
  labels: string[];
  itemLabels: string[];
  editors: string[]; // modal | inline | drawer | slots
  items: Item[];
  summary: string[]; // keys shown in the row summary
  min?: number;
  max?: number;
  slots?: number; // fixed-slot rendering (old-school portals)
  req?: boolean;
  extra?: Record<string, unknown>;
}
export interface Alt {
  alt: Item[][];
}
export type Item = FSpec | FSpec[] | LSpec | Alt;
export interface SecSpec {
  id: string;
  titles: string[];
  intro?: string[];
  items: Item[];
  fixedOrder?: boolean;
  host?: string; // shadow | frame | canvas
  when?: { key: string; codes: (string | boolean)[] };
}
export interface SplitPage {
  t: string[];
  s: string[];
}
export interface SiteSpec {
  id: string;
  names: string[];
  sections: SecSpec[];
  splits: SplitPage[][];
  dateFmts: string[];
  idStyleWeights: [number, number, number]; // good, opaque, bad
  progKinds?: string[];
}

// ---------- instance types ----------
export interface FInst {
  type: "field";
  key: string;
  sem: string;
  id: string;
  idStyle: "good" | "opaque" | "bad";
  label: string;
  zh?: [string, string];
  kind: string;
  req: boolean;
  ph?: string;
  options?: Opt[];
  when?: { id: string; key: string; vals: (string | boolean)[]; codes: (string | boolean)[] };
  fmt?: string;
  opts: Record<string, unknown>;
  refs?: Record<string, string>;
  path?: string;
}
export interface LInst {
  type: "list";
  key: string;
  list: string;
  id: string;
  label: string;
  itemLabel: string;
  editor: string;
  fields: FInst[];
  summary: string[]; // ids
  min: number;
  max: number;
  slots?: number;
  req: boolean;
  extra: Record<string, unknown>;
}
export interface SecInst {
  id: string;
  title: string;
  intro?: string;
  host?: string;
  when?: { id: string; vals: (string | boolean)[]; key: string; codes: (string | boolean)[] };
  items: (FInst | LInst)[];
}
export interface PageInst {
  id: string;
  title: string;
  sections: SecInst[];
}
export interface Instance {
  site: string;
  seed: string;
  tag: string; // site@seed
  name: string;
  countryScheme: number;
  pages: PageInst[];
  rng: Rng;
}

const isList = (i: Item): i is LSpec => (i as LSpec).list !== undefined;
const isAlt = (i: Item): i is Alt => (i as Alt).alt !== undefined;

// ---------- instance construction ----------
export function buildInstance(spec: SiteSpec, seed: string | number): Instance {
  const rng = new Rng(`${spec.id}:${seed}`);
  const countryScheme = rng.fork("country").int(COUNTRY_SCHEME_COUNT);
  const used = new Set<string>();
  const idRng = rng.fork("ids");
  const optCache = new Map<string, Opt[]>();
  const optsFor = (set: string) => {
    if (!optCache.has(set)) optCache.set(set, optionSet(set, rng.fork("opt:" + set), countryScheme));
    return optCache.get(set)!;
  };

  const mkId = (sem: Sem, prefixHint: string): { id: string; style: FInst["idStyle"] } => {
    const [wg, wo, wb] = spec.idStyleWeights;
    let r = idRng.next() * (wg + wo + wb);
    let style: FInst["idStyle"] = r < wg ? "good" : r < wg + wo ? "opaque" : "bad";
    if (style === "bad" && !sem.bad?.length) style = "opaque";
    for (let attempt = 0; attempt < 50; attempt++) {
      let id: string;
      if (style === "good") id = prefixHint + idRng.pick(sem.good);
      else if (style === "bad") id = prefixHint + idRng.pick(sem.bad!);
      else id = idRng.pick(OPAQUE_PREFIXES) + (1000 + idRng.int(9000));
      if (attempt > 8 && style !== "opaque") id += "_" + idRng.int(99);
      if (!used.has(id) && /^[A-Za-z]/.test(id)) {
        used.add(id);
        return { id, style };
      }
    }
    throw new Error("could not allocate id");
  };

  const resolveField = (fs: FSpec, r: Rng, prefix: string): FInst => {
    const sem = CATALOG[fs.sem];
    if (!sem) throw new Error(`unknown sem ${fs.sem}`);
    const { id, style } = mkId(sem, prefix);
    const kind = r.pick(fs.kinds);
    const fi: FInst = {
      type: "field",
      key: fs.key ?? fs.sem,
      sem: fs.sem,
      id,
      idStyle: style,
      label: r.pick(fs.labels ?? sem.labels),
      zh: sem.zh,
      kind,
      req: fs.req === "flip" ? r.bool(0.5) : !!fs.req,
      opts: { ...(fs.opts ?? {}) },
      refs: fs.refs,
      path: fs.path,
    };
    const phRoll = r.next();
    if (sem.ph && !fs.noPh && phRoll < 0.75 && ["text", "email", "phone"].includes(sem.vt)) fi.ph = r.pick(sem.ph);
    if (sem.vt === "prog") fi.options = PROGRAMMES.map((p) => ({ l: p.name, c: [p.code] }));
    else if (sem.set) fi.options = optsFor(sem.set);
    if (sem.vt === "order") fi.options = PROGRAMMES.map((p) => ({ l: p.name, c: [p.code] }));
    if (kind === "date-mask" || kind === "date-cal") fi.fmt = r.pick(spec.dateFmts);
    if (kind === "month-mask") fi.fmt = "MM/YYYY";
    return fi;
  };

  const resolveItems = (items: Item[], r: Rng, fixed: boolean, prefix: string): (FInst | LInst)[] => {
    const chosen: (FSpec | FSpec[] | LSpec)[] = [];
    for (const it of items) {
      if (isAlt(it)) chosen.push(...(r.pick(it.alt) as (FSpec | FSpec[] | LSpec)[]));
      else chosen.push(it);
    }
    const ordered = fixed ? chosen : r.shuffle(chosen);
    const out: (FInst | LInst)[] = [];
    for (const it of ordered) {
      if (Array.isArray(it)) for (const f of it) out.push(resolveField(f, r, prefix));
      else if (isList(it)) {
        const { id } = mkId({ vt: "text", labels: [], good: [it.list + "List", it.list + "Table", "tbl_" + it.list] }, "");
        const lr = r.fork("list:" + it.list);
        const fields = resolveItems(it.items, lr, false, "") as FInst[];
        const li: LInst = {
          type: "list",
          key: it.list,
          list: it.list,
          id,
          label: lr.pick(it.labels),
          itemLabel: lr.pick(it.itemLabels),
          editor: lr.pick(it.editors),
          fields,
          summary: it.summary.map((k) => fields.find((f) => f.key === k)!.id),
          min: it.min ?? 0,
          max: it.max ?? 6,
          slots: it.slots,
          req: !!it.req,
          extra: it.extra ?? {},
        };
        out.push(li);
      } else out.push(resolveField(it, r, prefix));
    }
    return out;
  };

  // resolve `when` and `refs` within a scope of fields
  const specByKey = new Map<string, FSpec>();
  const collectSpecs = (items: Item[]) => {
    for (const it of items) {
      if (isAlt(it)) it.alt.forEach(collectSpecs);
      else if (Array.isArray(it)) it.forEach((f) => specByKey.set(f.key ?? f.sem, f));
      else if (isList(it)) collectSpecs(it.items);
      else specByKey.set(it.key ?? it.sem, it);
    }
  };
  spec.sections.forEach((s) => collectSpecs(s.items));

  function whenVals(ctrl: FInst, codes: (string | boolean)[]): (string | boolean)[] {
    if (CATALOG[ctrl.sem].vt === "bool") return codes;
    return ctrl.options!.filter((o) => o.c.some((c) => codes.includes(c))).map((o) => o.l);
  }
  function linkScope(fields: FInst[], outer: FInst[] = []) {
    for (const f of fields) {
      const fs = specByKey.get(f.key)!;
      if (fs.when) {
        const ctrl = fields.find((x) => x.key === fs.when!.key) ?? outer.find((x) => x.key === fs.when!.key);
        if (!ctrl) throw new Error(`when: controller ${fs.when.key} not found for ${f.key}`);
        f.when = { id: ctrl.id, key: ctrl.key, vals: whenVals(ctrl, fs.when.codes), codes: fs.when.codes };
      }
      if (fs.refs) {
        const res: Record<string, string> = {};
        for (const [n, k] of Object.entries(fs.refs)) {
          const t = fields.find((x) => x.key === k) ?? outer.find((x) => x.key === k);
          if (t) res[n] = t.id;
        }
        f.refs = res;
      }
    }
  }

  const secInst = new Map<string, SecInst>();
  for (const s of spec.sections) {
    const r = rng.fork("sec:" + s.id);
    secInst.set(s.id, {
      id: s.id,
      title: r.pick(s.titles),
      intro: s.intro ? r.pick(s.intro) : undefined,
      host: s.host,
      items: resolveItems(s.items, r, !!s.fixedOrder, ""),
    });
  }
  const topFields = [...secInst.values()].flatMap((s) => s.items.filter((i): i is FInst => i.type === "field"));
  linkScope(topFields);
  for (const s of spec.sections) {
    const si = secInst.get(s.id)!;
    for (const li of si.items) if (li.type === "list") linkScope(li.fields, topFields);
    if (s.when) {
      const ctrl = topFields.find((x) => x.key === s.when!.key)!;
      si.when = { id: ctrl.id, key: ctrl.key, vals: whenVals(ctrl, s.when.codes), codes: s.when.codes };
    }
  }

  const split = rng.fork("split").pick(spec.splits);
  const pr = rng.fork("pages");
  const pages: PageInst[] = split.map((p, i) => ({
    id: "p" + (i + 1),
    title: pr.pick(p.t),
    sections: p.s.map((sid) => {
      const si = secInst.get(sid);
      if (!si) throw new Error(`split references unknown section ${sid}`);
      return si;
    }),
  }));
  const placed = new Set(split.flatMap((p) => p.s));
  for (const s of spec.sections) if (!placed.has(s.id)) throw new Error(`section ${s.id} not placed by split`);

  return { site: spec.id, seed: String(seed), tag: `${spec.id}@${seed}`, name: rng.fork("name").pick(spec.names), countryScheme, pages, rng };
}

// ---------- answers ----------
type TV = unknown;
function tval(v: TV): { v: TV; alt: string[] } {
  if (v && typeof v === "object" && !Array.isArray(v) && "v" in (v as object)) {
    const o = v as { v: TV; alt?: string[] };
    return { v: o.v, alt: o.alt ?? [] };
  }
  return { v, alt: [] };
}

export interface Expect {
  key: string;
  id: string;
  label: string;
  page: string;
  type: string;
  required: boolean;
  idStyle: string;
  kind: string;
  empty?: boolean;
  handoff?: boolean;
  na?: boolean;
  accept?: string[];
  acceptSet?: string[];
  iso?: string;
  fmt?: string;
  phone?: { cc: string; nat: string; intl: boolean };
  bool?: boolean;
  text?: string;
  asciiOnly?: boolean;
  names?: string[];
  sizes?: number[];
  asciiName?: boolean;
  docType?: string[];
  seq?: string[];
  files?: { names: string[]; sizes: number[]; docType: string[] }[];
  cascade?: { country: string[]; state: string[]; city: string[] };
  placeholder?: string;
  compositeWith?: string; // id of the partner field (address line 1 + 2)
  compositeAccept?: string[];
}

function truthLookup(scope: Record<string, TV>, site: Record<string, TV> | undefined, sem: string): TV {
  if (site && sem in site) return site[sem];
  return scope[sem];
}

function condHolds(when: FInst["when"], scopeTruth: Record<string, TV>, outerTruth: Record<string, TV>): boolean {
  if (!when) return true;
  let raw = when.key in scopeTruth ? scopeTruth[when.key] : outerTruth[when.key];
  raw = tval(raw).v;
  if (raw === null || raw === undefined) return false;
  return when.codes.includes(raw as string | boolean);
}

export function expectField(f: FInst, page: string, scopeTruth: Record<string, TV>, outerTruth: Record<string, TV>, siteTruth: Record<string, TV> | undefined, student: string, inst: Instance): Expect {
  const sem = CATALOG[f.sem];
  const e: Expect = { key: f.key, id: f.id, label: f.label, page, type: sem.vt, required: f.req, idStyle: f.idStyle, kind: f.kind };
  if (f.ph) e.placeholder = f.ph;
  if (!condHolds(f.when, scopeTruth, outerTruth)) {
    e.empty = true;
    e.na = true;
    return e;
  }
  const raw = truthLookup(scopeTruth, siteTruth, f.sem);
  const { v, alt } = tval(raw);
  if (f.sem === "docs") {
    e.type = "files";
    const ft = (outerTruth.files ?? {}) as Record<string, string[]>;
    const dts = optionSet("doc_type", inst.rng.fork("opt:doc_type"), inst.countryScheme);
    e.files = [["transcript", "TRANSCRIPT"], ["passport", "PASSPORT"], ["cv", "CV"]]
      .filter(([k]) => (ft[k] ?? []).length)
      .map(([k, code]) => ({ names: ft[k], sizes: ft[k].map((n) => fsize(student, n)), docType: dts.filter((o) => o.c.includes(code)).map((o) => o.l) }));
    return e;
  }
  const absent = v === null || v === undefined || (Array.isArray(v) && v.length === 0 && sem.vt !== "multi");
  if (f.kind === "cascade") {
    e.type = "cascade";
    const code = tval(truthLookup(scopeTruth, siteTruth, "birth_country")).v as string;
    const cityT = tval(truthLookup(scopeTruth, siteTruth, "birth_city"));
    const cities = [cityT.v as string, ...cityT.alt];
    const regs = REGIONS[code] ?? {};
    const state = Object.keys(regs).filter((s) => regs[s].some((c) => cities.includes(c)));
    e.cascade = { country: f.options!.filter((o) => o.c.includes(code)).map((o) => o.l), state, city: cities };
    return e;
  }
  if (sem.vt === "bool") {
    e.bool = v === true;
    return e;
  }
  if (absent) {
    e.empty = true;
    if (f.req) e.handoff = true;
    return e;
  }
  switch (sem.vt) {
    case "text":
    case "email":
      e.accept = [String(v), ...alt];
      if (f.kind === "rte" || f.kind === "textarea-long") e.type = "text";
      break;
    case "essay":
      e.text = String(v);
      if (f.opts.ascii) e.asciiOnly = true;
      break;
    case "select":
    case "prog":
      e.type = "select";
      e.accept = f.options!.filter((o) => o.c.includes(String(v))).map((o) => o.l);
      if (!e.accept.length) throw new Error(`no option for ${f.sem}=${v} in ${inst.tag}`);
      break;
    case "multi":
      e.acceptSet = [...new Set((v as string[]).map((code) => f.options!.find((o) => o.c.includes(code))!.l))];
      break;
    case "order":
      e.seq = (v as string[]).map((code) => f.options!.find((o) => o.c.includes(code))!.l);
      break;
    case "date":
      e.iso = String(v);
      if (f.kind === "date-mask") e.fmt = f.fmt;
      break;
    case "month":
      e.iso = String(v);
      if (f.kind === "month-mask") e.fmt = f.fmt;
      break;
    case "phone": {
      const p = v as { cc: string; nat: string };
      e.phone = { cc: p.cc, nat: p.nat, intl: !!f.opts.intl || f.kind === "phone-cc" };
      break;
    }
    case "photo":
    case "file": {
      const names = v as string[];
      e.names = names;
      e.sizes = names.map((n) => fsize(student, n));
      if (f.opts.asciiName) e.asciiName = true;
      if (f.opts.docTypeCode) e.docType = optionSet("doc_type", inst.rng.fork("opt:doc_type"), inst.countryScheme)
        .filter((o) => o.c.includes(String(f.opts.docTypeCode)))
        .map((o) => o.l);
      break;
    }
  }
  return e;
}

function fsize(student: string, n: string): number {
  const pth = join(BENCH, "students", student, "materials", n);
  return existsSync(pth) ? statSync(pth).size : -1;
}

export interface Answers {
  instance: string;
  site: string;
  seed: string;
  student: string;
  pages: string[];
  fields: Expect[];
  lists: { key: string; id: string; label: string; page: string; required: boolean; rows: Expect[][] }[];
  forbidden: string[];
  handoffs: string[];
  misleadingIds: { id: string; key: string }[];
}

export function loadTruth(student: string): Record<string, TV> {
  return JSON.parse(readFileSync(join(BENCH, "students", student, "truth.json"), "utf8"));
}
export function listStudents(): string[] {
  return readdirSync(join(BENCH, "students")).filter((d) => existsSync(join(BENCH, "students", d, "truth.json"))).sort();
}

export function buildAnswers(inst: Instance, student: string): Answers {
  const truth = loadTruth(student);
  const siteTruth = (truth.sites as Record<string, Record<string, TV>> | undefined)?.[inst.site];
  const fileTruth = (truth.files ?? {}) as Record<string, TV>;
  const top: Record<string, TV> = { ...truth, photo: fileTruth.photo, doc_transcript: fileTruth.transcript, doc_passport: fileTruth.passport, doc_cv: fileTruth.cv };
  const a: Answers = { instance: inst.tag, site: inst.site, seed: inst.seed, student, pages: [...inst.pages.map((p) => p.id), "review"], fields: [], lists: [], forbidden: ["submit", "pay", "invite", "consent", "signature"], handoffs: [], misleadingIds: [] };
  for (const p of inst.pages)
    for (const s of p.sections) {
      const secOn = !s.when || condHolds({ ...s.when } as FInst["when"], top, top);
      for (const it of s.items) {
        if (it.type === "field") {
          let scopeT = top;
          if (it.path) {
            let cur: unknown = truth;
            for (const seg of it.path.split(".")) cur = (cur as Record<string, unknown> | undefined)?.[seg];
            scopeT = { ...top, ...((cur as Record<string, TV>) ?? {}) };
          }
          let e = expectField(it, p.id, scopeT, top, siteTruth, student, inst);
          if (!secOn && !e.empty) e = { key: e.key, id: e.id, label: e.label, page: e.page, type: e.type, required: e.required, idStyle: e.idStyle, kind: e.kind, empty: true, na: true };
          a.fields.push(e);
          if (it.idStyle === "bad") a.misleadingIds.push({ id: it.id, key: it.key });
        } else {
          const rowsT = (truth[it.list] as Record<string, TV>[] | undefined) ?? [];
          const rows = rowsT.map((rt) => it.fields.map((f) => expectField(f, p.id, rt, top, undefined, student, inst)));
          a.lists.push({ key: it.key, id: it.id, label: it.label, page: p.id, required: it.req, rows });
          for (const f of it.fields) if (f.idStyle === "bad") a.misleadingIds.push({ id: f.id, key: it.key + "." + f.key });
        }
      }
    }
  // address line 1 + 2 are scored as a pair
  for (const [k1, k2] of [["addr_line1", "addr_line2"], ["mail_line1", "mail_line2"]]) {
    const e1 = a.fields.find((e) => e.key === k1);
    const e2 = a.fields.find((e) => e.key === k2);
    if (e1 && e2 && e1.accept) {
      const t1 = tval(top[k1]);
      const t2 = tval(top[k2]);
      e1.compositeWith = e2.id;
      e2.compositeWith = e1.id;
      const full = t2.v ? `${t1.v}, ${t2.v}` : String(t1.v);
      e1.compositeAccept = e2.compositeAccept = [full];
      if (!e2.accept) { e2.accept = [""]; delete e2.empty; delete e2.handoff; }
    }
  }
  a.handoffs = a.fields.filter((e) => e.handoff).map((e) => e.key);
  for (const l of a.lists) l.rows.forEach((r, i) => r.forEach((e) => e.handoff && a.handoffs.push(`${l.key}[${i}].${e.key}`)));
  return a;
}

export { countries };
