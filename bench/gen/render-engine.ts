// Turns an Instance into the static files of an engine-driven portal (single-page app).
// The emitted config carries ids, labels, widget kinds and options only - never semantic keys.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { FInst, Instance, LInst, SecInst } from "./build";
import { BENCH } from "./build";
import { ADDRESS_BOOK, INSTITUTIONS, PROGRAMMES, REGIONS, countries, optionSet } from "./data";
import { css, type Theme } from "./style";
import type { Rng } from "./rng";

export interface EngineProfile {
  theme: Theme;
  kit: string[]; // paths relative to bench/
  ui: Record<string, unknown>;
  zh?: boolean;
  langs?: string[];
  sub: string[];
  footer: string[];
  tx: (r: Rng) => Record<string, string>;
  review: (r: Rng) => Record<string, unknown>;
  extras?: (r: Rng) => Record<string, unknown>; // cookie / notice / idle
  fieldX?: (f: FInst, r: Rng) => Record<string, unknown> | undefined; // per-site widget texts
  labelMode?: (f: FInst, r: Rng) => string | undefined;
  listX?: (l: LInst, r: Rng) => Record<string, unknown>;
  hasFrame?: boolean;
}

const NEEDS_OPTIONS = new Set(["select", "radio", "dradio", "sselect", "vselect", "chips", "checks", "dchecks", "order", "cascade"]);
const STRIP_OPTS = new Set(["intl", "docTypeCode", "help"]);

export function renderEngine(inst: Instance, prof: EngineProfile): Record<string, string> {
  const r = inst.rng.fork("render");
  const ctry = countries(inst.countryScheme);
  const cname = (code: string) => ctry.find((c) => c.code === code)?.name ?? code;
  const db: Record<string, unknown> = {};
  const need = new Set<string>();

  const field = (f: FInst): Record<string, unknown> => {
    const o: Record<string, unknown> = { id: f.id, k: f.kind, l: f.label };
    if (prof.zh && f.zh) o.lz = f.zh;
    if (f.req) o.r = 1;
    if (f.ph) o.ph = f.ph;
    if (f.options && NEEDS_OPTIONS.has(f.kind)) o.o = f.options.map((x) => x.l);
    if (f.when) o.w = { id: f.when.id, v: f.when.vals };
    if (f.fmt) o.fmt = f.fmt;
    if (f.refs && Object.keys(f.refs).length) o.refs = f.refs;
    if (f.opts.help) o.hp = f.opts.help;
    const x: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(f.opts)) if (!STRIP_OPTS.has(k)) x[k] = v;
    if (f.kind === "tree") {
      const facs = [...new Set(PROGRAMMES.map((p) => p.faculty))];
      x.tree = facs.map((fac) => ({
        t: "Faculty of " + fac,
        ch: [...new Set(PROGRAMMES.filter((p) => p.faculty === fac).map((p) => p.dept))].map((d) => ({ t: "Department of " + d, ch: PROGRAMMES.filter((p) => p.faculty === fac && p.dept === d).map((p) => ({ t: p.name })) })),
      }));
    }
    if (f.kind === "files") x.docTypes = optionSet("doc_type", inst.rng.fork("opt:doc_type"), inst.countryScheme).map((d) => d.l);
    if (f.kind === "lookup" || f.kind === "lookup2") {
      need.add("inst");
      x.countries = ctry.map((c) => c.name);
    }
    if (f.kind === "phone-cc") need.add("cc");
    if (f.kind === "addr-auto") need.add("addr");
    if (f.kind === "cascade") need.add("regions");
    const extra = prof.fieldX?.(f, r.fork("x:" + f.id));
    if (extra) Object.assign(x, extra);
    if (Object.keys(x).length) o.x = x;
    const lm = prof.labelMode?.(f, r.fork("lm:" + f.id));
    if (lm) o.lm = lm;
    if (f.opts.wide) o.wide = 1;
    return o;
  };
  const list = (l: LInst): Record<string, unknown> => ({
    id: l.id,
    k: "rep",
    l: l.label,
    il: l.itemLabel,
    ed: l.editor,
    fs: l.fields.map(field),
    sum: l.summary,
    min: l.min,
    max: l.max,
    r: l.req ? 1 : undefined,
    add: "Add " + l.itemLabel,
    x: { ...(l.extra ?? {}), ...(prof.listX?.(l, r.fork("lx:" + l.id)) ?? {}) },
  });
  const sec = (s: SecInst) => ({ t: s.title, i: s.intro, h: s.host, w: s.when ? { id: s.when.id, v: s.when.vals } : undefined, fs: s.items.map((it) => (it.type === "list" ? list(it) : field(it))) });
  const pages = inst.pages.map((p) => ({ id: p.id, t: p.title, secs: p.sections.map(sec) }));

  if (need.has("inst")) db.inst = INSTITUTIONS.map((i) => [i.name, i.city, cname(i.country), i.code]);
  if (need.has("cc")) db.cc = ctry.map((c) => [c.name, c.dial, c.example]);
  if (need.has("addr")) db.addr = ADDRESS_BOOK.map((a) => [a.line1, a.city, a.state, a.postal, cname(a.country)]);
  if (need.has("regions")) db.regions = Object.fromEntries(Object.entries(REGIONS).map(([code, v]) => [cname(code), v]));

  const cfg = {
    inst: inst.tag,
    key: "app_" + inst.site.replace(/\W/g, "") + "_" + inst.seed,
    mount: "app",
    name: inst.name,
    sub: r.pick(prof.sub),
    footer: r.pick(prof.footer),
    ui: { ...prof.ui, px: prof.theme.px },
    tx: prof.tx(r.fork("tx")),
    langs: prof.langs,
    pages,
    rev: prof.review(r.fork("rev")),
    db,
    ...(prof.extras?.(r.fork("extras")) ?? {}),
  };
  const kit = prof.kit.map((k) => readFileSync(join(BENCH, k), "utf8")).join("\n");
  const app = `(function () {\nvar CFG = ${JSON.stringify(cfg)};\n${kit}\nif (/frame\\.html$/.test(location.pathname)) bootFrame(); else boot();\n})();\n`;
  const html = (body: string, title: string) =>
    `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${esc(title)}</title>\n<link rel="stylesheet" href="style.css">\n</head>\n<body>\n${body}\n<script src="app.js"></script>\n</body>\n</html>\n`;
  const files: Record<string, string> = {
    "index.html": html(`<div id="app"></div>`, inst.name + " - Online Application"),
    "app.js": app,
    "style.css": css(prof.theme),
  };
  if (prof.hasFrame) files["frame.html"] = html(`<div id="app" style="padding:4px"></div>`, "Form");
  return files;
}

export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
