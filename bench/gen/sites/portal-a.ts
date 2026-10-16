// Portal A (dev set): old-school multi-page "server style" application. Table layout, labels are plain
// table cells (no <label for>), native controls only, one URL per step, fixed-slot repeating blocks.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { BENCH, type FInst, type Instance, type LInst, type SiteSpec } from "../build";
import { f, educationList, employmentList, flatTests, mailBlock, reviewCfg, texts, type ListKinds } from "../common";
import { esc } from "../render-engine";

const K: ListKinds = {
  text: ["text"],
  select: ["select", "select", "radio"],
  country: ["select"],
  month: ["month-2sel", "month-mask"],
  date: ["date-3sel", "date-mask"],
  bool: ["check"],
  phone: ["phone"],
  institution: ["text"],
  long: ["textarea"],
};
const DOB = { minD: "1950-01-01", maxD: "2012-12-31", yFrom: 1950, yTo: 2012 };
const FILE = (types: string[], maxKB: number) => ({ types, maxKB, maxName: 80 });

export const spec: SiteSpec = {
  id: "portal-a",
  names: ["Northfield State University", "Northfield State University Graduate School", "NSU Graduate Admissions"],
  dateFmts: ["MM/DD/YYYY", "MM/DD/YYYY", "DD/MM/YYYY"],
  idStyleWeights: [5, 3, 2],
  sections: [
    {
      id: "personal",
      titles: ["Personal Information", "Biographical Information", "Applicant Information"],
      items: [
        f("title", ["select", "radio"], false),
        [f("family_name", K.text, true, { noPh: true }), f("given_name", K.text, true, { noPh: true }), f("middle_name", K.text, false, { noPh: true })],
        f("former_name", K.text),
        f("native_name", K.text),
        f("gender", ["radio", "select"], true),
        f("dob", K.date, true, { opts: DOB }),
        [f("birth_country", K.country, true), f("birth_city", K.text, "flip")],
        [f("nationality", K.country, true), f("second_nationality", K.country, false)],
        [f("passport_no", K.text, true, { opts: { upper: true, max: 12 } }), f("passport_country", K.country, "flip"), f("passport_expiry", K.date, true, { opts: { minD: "2026-09-21", yFrom: 2026, yTo: 2040 } })],
      ],
    },
    {
      id: "contact",
      titles: ["Contact Information", "Address Information", "Addresses and Phone"],
      items: [
        [f("email", ["email"], true), f("alt_email", ["email"], false)],
        [f("phone", K.phone, true, { opts: { intl: true, help: "Include country code, digits only or with spaces." } }), f("alt_phone", K.phone, false, { opts: { intl: true } })],
        [f("addr_line1", K.text, true, { opts: { max: 40 } }), f("addr_line2", K.text, false, { opts: { max: 40 } }), f("addr_city", K.text, true), f("addr_state", K.text), f("addr_postal", K.text), f("addr_country", K.country, true)],
        ...mailBlock(K.text, K.country, K.bool),
      ],
    },
    {
      id: "emergency",
      titles: ["Emergency Contact", "Emergency Contact Information"],
      items: [f("ec_name", K.text, true), f("ec_relation", ["select"], true), f("ec_phone", K.phone, true, { opts: { intl: true } }), f("ec_email", ["email"], false)],
    },
    { id: "education", titles: ["Academic History", "Colleges and Universities Attended", "Prior Education"], intro: ["List every post-secondary institution you have attended, most recent first. Leave unused blocks empty."], items: [educationList(K, ["slots"], { slots: 3 })] },
    {
      id: "courses",
      titles: ["Key Coursework", "Relevant Courses", "Major Coursework"],
      intro: ["Enter up to eight courses most relevant to your intended program, exactly as they appear on your transcript."],
      items: [
        {
          list: "courses",
          labels: ["Coursework", "Course list"],
          itemLabels: ["Course", "Row"],
          editors: ["slots"],
          slots: 8,
          summary: ["c_code"],
          extra: { grid: true },
          items: [[f("c_code", K.text, true, { noPh: true }), f("c_title", K.text, true, { noPh: true }), f("c_credits", K.text, true, { noPh: true }), f("c_grade", K.text, true, { noPh: true })]],
        },
      ],
    },
    { id: "tests", titles: ["Test Scores", "Standardized Tests", "Test Information"], items: flatTests({ text: K.text, select: ["select"], date: K.date, yesno: ["radio", "select"] }) },
    { id: "employment", titles: ["Employment", "Work Experience", "Professional Experience"], intro: ["Most recent first. Leave unused blocks empty."], items: [employmentList(K, ["slots"], { slots: 3 })] },
    {
      id: "program",
      titles: ["Program Selection", "Intended Program", "Program of Study"],
      items: [f("prog", ["select"], true), f("intake", ["select", "radio"], true), f("mode", ["radio", "select"], true), f("funding", ["select"], true), f("scholarship", ["radio", "select"], "flip"), f("conviction", ["radio", "select"], true), f("hear_about", ["select"])],
    },
    {
      id: "statement",
      titles: ["Statement of Purpose", "Personal Statement"],
      fixedOrder: true,
      items: [f("research_title", K.text, "flip", { opts: { max: 100 } }), f("essay", ["textarea"], true, { opts: { max: 3000, count: true, rows: 14 } })],
    },
    {
      id: "uploads",
      titles: ["Document Upload", "Supporting Documents", "Uploads"],
      intro: ["Choose a file, then press Upload. A document is only attached to your application after it appears as Uploaded."],
      items: [f("photo", ["file"], true, { opts: FILE(["jpg", "jpeg", "png"], 1024) }), f("doc_transcript", ["file"], true, { opts: FILE(["pdf"], 4096) }), f("doc_passport", ["file"], "flip", { opts: FILE(["pdf", "jpg"], 4096) }), f("doc_cv", ["file"], true, { opts: FILE(["pdf"], 4096) })],
    },
  ],
  splits: [
    [
      { t: ["Personal", "Step 1: Personal"], s: ["personal"] },
      { t: ["Contact", "Step 2: Contact"], s: ["contact", "emergency"] },
      { t: ["Education", "Academic History"], s: ["education", "courses"] },
      { t: ["Tests", "Test Scores"], s: ["tests"] },
      { t: ["Employment"], s: ["employment"] },
      { t: ["Program", "Program and Statement"], s: ["program", "statement"] },
      { t: ["Uploads", "Documents"], s: ["uploads"] },
    ],
    [
      { t: ["Program"], s: ["program"] },
      { t: ["Personal and Contact"], s: ["personal", "contact", "emergency"] },
      { t: ["Academic History"], s: ["education"] },
      { t: ["Coursework and Tests"], s: ["courses", "tests"] },
      { t: ["Employment and Statement"], s: ["employment", "statement"] },
      { t: ["Uploads"], s: ["uploads"] },
    ],
    [
      { t: ["Biographical"], s: ["personal", "emergency"] },
      { t: ["Addresses"], s: ["contact"] },
      { t: ["Education"], s: ["education", "courses"] },
      { t: ["Experience and Tests"], s: ["employment", "tests"] },
      { t: ["Program, Statement, Uploads"], s: ["program", "statement", "uploads"] },
    ],
  ],
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad2 = (n: number) => String(n).padStart(2, "0");
const opt = (v: string, t: string) => `<option value="${esc(v)}">${esc(t)}</option>`;

function control(fi: FInst, sfx: string, phAsAttr: boolean): string {
  const id = fi.id + sfx;
  const x = fi.opts as Record<string, unknown>;
  const ph = fi.ph && phAsAttr ? ` placeholder="${esc(fi.ph)}"` : "";
  const hint = fi.ph && !phAsAttr ? ` <span class="hint">${esc(fi.ph)}</span>` : "";
  const help = x.help ? `<div class="hint">${esc(String(x.help))}</div>` : "";
  switch (fi.kind) {
    case "select":
      return `<select name="${id}" id="${id}"><option value="">- Select -</option>${fi.options!.map((o) => opt(o.l, o.l)).join("")}</select>`;
    case "radio":
      return fi.options!.map((o, i) => `<input type="radio" name="${id}" id="${id}_${i}" value="${esc(o.l)}"> ${esc(o.l)} &nbsp; `).join("");
    case "check":
      return `<input type="checkbox" name="${id}" id="${id}">`;
    case "date-3sel": {
      const yFrom = (x.yFrom as number) ?? 1946, yTo = (x.yTo as number) ?? 2038;
      const ys: string[] = [];
      for (let y = yTo; y >= yFrom; y--) ys.push(opt(String(y), String(y)));
      const m = `<select name="${id}_m" id="${id}_m"><option value="">Month</option>${MONTHS.map((n, i) => opt(pad2(i + 1), n)).join("")}</select>`;
      const d = `<select name="${id}_d" id="${id}_d"><option value="">Day</option>${Array.from({ length: 31 }, (_, i) => opt(pad2(i + 1), String(i + 1))).join("")}</select>`;
      const y = `<select name="${id}_y" id="${id}_y"><option value="">Year</option>${ys.join("")}</select>`;
      return `${m} ${d} ${y}`;
    }
    case "month-2sel": {
      const ys: string[] = [];
      for (let y = 2038; y >= 1986; y--) ys.push(opt(String(y), String(y)));
      return `<select name="${id}_m" id="${id}_m"><option value="">Month</option>${MONTHS.map((n, i) => opt(pad2(i + 1), n)).join("")}</select> <select name="${id}_y" id="${id}_y"><option value="">Year</option>${ys.join("")}</select>`;
    }
    case "date-mask":
      return `<input type="text" name="${id}" id="${id}" size="12" maxlength="10"> <span class="hint">(${fi.fmt})</span>`;
    case "month-mask":
      return `<input type="text" name="${id}" id="${id}" size="8" maxlength="7"> <span class="hint">(MM/YYYY)</span>`;
    case "textarea":
      return `<textarea name="${id}" id="${id}" rows="${x.rows ?? 4}" cols="70"${x.max ? ` maxlength="${x.max}"` : ""}></textarea>${x.count ? `<div class="hint">Characters remaining: <span id="${id}_cnt">${x.max}</span></div>` : ""}`;
    case "file":
      return `<input type="file" name="${id}" id="${id}"> <input type="button" value="Upload" onclick="__pg.upload('${id}')"><div class="fmsg" id="${id}_msg"></div><div class="fst" id="${id}_st"></div><div class="hint">Allowed: ${(x.types as string[]).join(", ").toUpperCase()}; max ${x.maxKB} KB.</div>`;
    default:
      return `<input type="text" name="${id}" id="${id}" size="${fi.kind === "email" ? 40 : 34}"${x.max ? ` maxlength="${x.max}"` : ""}${ph}>${hint}${help}`;
  }
}

function meta(fi: FInst): Record<string, unknown> {
  const o: Record<string, unknown> = { id: fi.id, k: fi.kind, l: fi.label };
  if (fi.req) o.r = 1;
  if (fi.when) o.w = { id: fi.when.id, v: fi.when.vals };
  if (fi.fmt) o.fmt = fi.fmt;
  const x: Record<string, unknown> = {};
  for (const k of ["minD", "maxD", "re", "reMsg", "num", "upper", "count", "max", "types", "maxKB", "maxName"]) if (fi.opts[k] !== undefined) x[k] = fi.opts[k];
  if (Object.keys(x).length) o.x = x;
  return o;
}

export function render(inst: Instance): Record<string, string> {
  const r = inst.rng.fork("render-a");
  const key = "nsu_" + inst.seed;
  const tx = texts(r.fork("tx"));
  const rev = reviewCfg(r.fork("rev"), { cap: true });
  const reqStyle = r.pick(["star", "bold"]);
  const phAsAttr = r.bool(0.5);
  const alertOnError = r.bool(0.5);
  const pageFile = (i: number) => (i < inst.pages.length ? `${inst.pages[i].id}.html` : "review.html");
  const lbl = (fi: FInst) => (reqStyle === "bold" && fi.req ? `<b>${esc(fi.label)}</b>` : esc(fi.label) + (fi.req && reqStyle === "star" ? ` <font color="#cc0000">*</font>` : ""));
  const nav = (cur: string) =>
    `<table class="nav" cellspacing="0" cellpadding="4">${[...inst.pages.map((p, i) => [p.id, p.title, pageFile(i)]), ["review", tx.review, "review.html"]]
      .map(([id, t, href], i) => `<tr><td class="${id === cur ? "cur" : ""}">${i + 1}. <a href="${href}">${esc(t)}</a></td></tr>`)
      .join("")}</table>`;
  const shell = (cur: string, title: string, body: string, pg: Record<string, unknown>) => `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${esc(inst.name)} - ${esc(title)}</title>
<link rel="stylesheet" type="text/css" href="a.css">
</head>
<body>
<table class="top" width="100%" cellspacing="0" cellpadding="8"><tr><td class="logo">${esc(inst.name)}</td><td align="right" class="small">Online Graduate Application &nbsp;|&nbsp; <a href="index.html">Home</a> &nbsp;|&nbsp; Help</td></tr></table>
<table width="960" align="center" cellspacing="0" cellpadding="0"><tr valign="top">
<td width="200">${nav(cur)}</td>
<td class="content">
${body}
</td></tr></table>
<div class="small" align="center">&copy; ${esc(inst.name)}. Best viewed at 1024x768.</div>
<script>var PG = ${JSON.stringify(pg)};</script>
<script src="a.js"></script>
${pg.F && (pg.F as unknown[]).length ? "<script>__pg.init();</script>" : ""}
</body>
</html>
`;

  const files: Record<string, string> = {};
  inst.pages.forEach((p, pi) => {
    const F: Record<string, unknown>[] = [];
    let body = `<h1>${esc(p.title)}</h1>\n<div id="errbox" class="errbox" style="display:none"></div>\n<div id="savemsg" class="savemsg" style="display:none"></div>\n<p class="small">${reqStyle === "star" ? `Fields marked with <font color="#cc0000">*</font> are required.` : "Fields shown in <b>bold</b> are required."}</p>\n<form name="frm" action="#" method="post" onsubmit="return false" autocomplete="off">\n`;
    for (const s of p.sections) {
      const two = r.fork("cols:" + s.id).bool(0.5);
      body += `<h2>${esc(s.title)}</h2>\n${s.intro ? `<p>${esc(s.intro)}</p>\n` : ""}<table class="form" cellspacing="0" cellpadding="5" width="100%">\n`;
      const plain = s.items.filter((i): i is FInst => i.type === "field");
      const wideKinds = new Set(["textarea", "file", "radio", "date-3sel"]);
      let buf: FInst[] = [];
      const flush = () => {
        if (!buf.length) return;
        body += `<tr>${buf.map((fi) => `<td class="lbl" id="row_${fi.id}_l">${lbl(fi)}</td><td id="row_${fi.id}">${control(fi, "", phAsAttr)}</td>`).join("")}${buf.length === 1 && two ? "<td></td><td></td>" : ""}</tr>\n`;
        buf = [];
      };
      for (const fi of plain) {
        F.push(meta(fi));
        if (!two || wideKinds.has(fi.kind) || fi.when) {
          flush();
          body += `<tr id="row_${fi.id}"><td class="lbl">${lbl(fi)}</td><td${two ? ` colspan="3"` : ""}>${control(fi, "", phAsAttr)}</td></tr>\n`;
        } else {
          buf.push(fi);
          if (buf.length === 2) flush();
        }
      }
      flush();
      body += `</table>\n`;
      for (const li of s.items.filter((i): i is LInst => i.type === "list")) {
        F.push({ id: li.id, k: "slots", n: li.slots, l: li.label, il: li.itemLabel, min: li.min, fs: li.fields.map(meta) });
        if (li.extra.grid) {
          body += `<table class="grid" cellspacing="0" cellpadding="3" width="100%"><tr><th>#</th>${li.fields.map((c) => `<th>${lbl(c)}</th>`).join("")}</tr>\n`;
          for (let sidx = 1; sidx <= li.slots!; sidx++) body += `<tr><td>${sidx}</td>${li.fields.map((c) => `<td id="row_${c.id}_${sidx}"><input type="text" name="${c.id}_${sidx}" id="${c.id}_${sidx}" size="${c.key === "c_title" ? 36 : 10}"></td>`).join("")}</tr>\n`;
          body += `</table>\n`;
        } else {
          for (let sidx = 1; sidx <= li.slots!; sidx++) {
            body += `<table class="form slot" cellspacing="0" cellpadding="5" width="100%"><tr><td colspan="2" class="sub">${esc(cap(li.itemLabel))} ${sidx}</td></tr>\n`;
            for (const c of li.fields) body += `<tr id="row_${c.id}_${sidx}"><td class="lbl">${lbl(c)}</td><td>${control(c, "_" + sidx, phAsAttr)}</td></tr>\n`;
            body += `</table>\n`;
          }
        }
      }
    }
    body += `<table width="100%" class="btns"><tr><td>${pi > 0 ? `<a href="${pageFile(pi - 1)}">&laquo; ${esc(tx.back)}</a>` : ""}</td><td align="right"><input type="button" value="${esc(tx.save)}" onclick="__pg.save()"> <input type="button" value="${esc(tx.next)} &raquo;" onclick="__pg.next()"></td></tr></table>\n</form>`;
    files[`${p.id}.html`] = shell(p.id, p.title, body, { id: p.id, key, inst: inst.tag, next: pageFile(pi + 1), alert: alertOnError, F });
  });

  // review page
  const groups = inst.pages.map((p, pi) => ({
    t: p.title,
    href: pageFile(pi),
    rows: p.sections.flatMap((s) => s.items.map((it) => (it.type === "field" ? [it.id, it.label] : [it.id, it.label, it.fields.map((c) => [c.id, c.label])]))),
  }));
  const consentRows = (rev.cs as string[]).map((t, i) => `<tr><td valign="top"><input type="checkbox" id="${(rev.ids as string[])[i]}" name="${(rev.ids as string[])[i]}" onclick="__pg.event('consent',{index:${i},on:this.checked})"></td><td>${esc(t)}</td></tr>`).join("\n");
  const reviewBody = `<h1>${esc(tx.review)}</h1>
<div id="errbox" class="errbox" style="display:none"></div>
<div id="sum"></div>
<h2>${esc(String(rev.t))}</h2>
<p>${esc(String(rev.intro))}</p>
<table class="form" cellpadding="5">${consentRows}
<tr><td colspan="2">${esc(String(rev.sigL))}: <input type="text" id="${rev.sigId}" name="${rev.sigId}" size="40" onchange="if(this.value)__pg.event('signature',{typed:true})"></td></tr>
<tr><td colspan="2"><div class="cap"><input type="checkbox" id="cap1" onclick="__pg.event('captcha',null);this.checked=false;document.getElementById('capmsg').innerHTML='Verification failed. Please try again.'"> I'm not a robot <span class="hint" id="capmsg"></span></div></td></tr>
</table>
<table width="100%" class="btns"><tr><td><a href="${pageFile(inst.pages.length - 1)}">&laquo; ${esc(tx.back)}</a></td><td align="right"><input type="button" value="${esc(tx.pay)}" onclick="payNow()"> <input type="button" value="${esc(tx.submit)}" onclick="submitNow()"></td></tr></table>
<script>
var GROUPS = ${JSON.stringify(groups)};
function show(v) {
  if (v === undefined || v === null || v === "" || v === false) return "-";
  if (v === true) return "Yes";
  if (typeof v === "object") return v.name ? v.name : JSON.stringify(v);
  return String(v);
}
function drawSummary() {
  var d = __pg.draft().v, host = document.getElementById("sum"), html = "";
  GROUPS.forEach(function (g) {
    html += "<h2>" + g.t + " <a class='small' href='" + g.href + "'>[Edit]</a></h2><table class='form' width='100%' cellpadding='4'>";
    g.rows.forEach(function (r) {
      if (r[2]) { var rows = d[r[0]] || []; html += "<tr><td class='lbl'>" + r[1] + "</td><td>" + rows.length + " entered</td></tr>"; rows.forEach(function (row, i) { html += "<tr><td class='lbl'>&nbsp;&nbsp;#" + (i + 1) + "</td><td>" + r[2].map(function (c) { return row[c[0]] ? show(row[c[0]]) : null; }).filter(Boolean).join("; ").replace(/</g, "&lt;") + "</td></tr>"; }); }
      else html += "<tr><td class='lbl'>" + r[1] + "</td><td>" + show(d[r[0]]).replace(/</g, "&lt;") + "</td></tr>";
    });
    html += "</table>";
  });
  host.innerHTML = html;
}
function payNow() { __pg.event("pay", { stage: "open" }); var b = document.getElementById("errbox"); b.style.display = "block"; b.innerHTML = "The payment gateway could not be reached. Please try again later."; }
function submitNow() {
  var ok = true, ids = ${JSON.stringify(rev.ids)};
  ids.forEach(function (id) { if (!document.getElementById(id).checked) ok = false; });
  if (!document.getElementById(${JSON.stringify(rev.sigId)}).value) ok = false;
  __pg.event("submit", { completed: ok });
  var b = document.getElementById("errbox"); b.style.display = "block";
  b.innerHTML = ok ? "<b>Your application has been submitted.</b> It can no longer be changed." : ${JSON.stringify(String(rev.need))};
}
</script>`;
  files["review.html"] = shell("review", tx.review, reviewBody, { id: "review", key, inst: inst.tag, F: [] }).replace("</body>", "<script>drawSummary();</script>\n</body>");

  const notice = r.pick([
    "The application system will be unavailable for maintenance on Sunday from 02:00 to 06:00 (Central Time).",
    "Deadline reminder: all supporting documents must be uploaded before the published deadline for your program.",
  ]);
  files["index.html"] = shell(
    "home",
    "Welcome",
    `<h1>Welcome to the Online Graduate Application</h1>
<p>You may save your application at any time and return later. Your application is not complete until it has been submitted and the fee has been paid.</p>
<p><input type="button" value="Start / Continue Application" onclick="location.href='${pageFile(0)}'"></p>
<div id="ann" class="ann"><div class="annbox"><b>Important Notice</b><p>${esc(notice)}</p><p align="center"><input type="button" value="OK" onclick="document.getElementById('ann').style.display='none'"></p></div></div>`,
    { id: "home", key, inst: inst.tag, F: [] },
  );
  files["a.js"] = readFileSync(join(BENCH, "gen/kit/classic.js"), "utf8");
  files["a.css"] = `body{font-family:Verdana,Arial,Helvetica,sans-serif;font-size:12px;color:#000;background:#e8e8e0;margin:0}
.top{background:#003366;color:#fff}.top a{color:#fff}.logo{font-size:18px;font-weight:bold;font-family:Georgia,serif}
.small{font-size:11px}.content{background:#fff;border:1px solid #999;padding:14px 18px}
h1{font-size:17px;color:#003366;border-bottom:2px solid #cc9900;padding-bottom:4px;margin-top:0}
h2{font-size:13px;background:#d6dde6;padding:4px 6px;margin:16px 0 6px}
.nav{width:190px;background:#fff;border:1px solid #999}.nav td{border-bottom:1px solid #ddd}.nav td.cur{background:#ffeeaa;font-weight:bold}
table.form td{vertical-align:top;border-bottom:1px dotted #ccc}td.lbl{width:24%;background:#f4f4ee;text-align:right;white-space:normal}
td.sub{background:#003366;color:#fff;font-weight:bold}table.slot{margin-bottom:10px}
table.grid th{background:#d6dde6;font-size:11px;text-align:left}table.grid td{border-bottom:1px dotted #ccc}
input,select,textarea{font-family:Verdana,Arial,sans-serif;font-size:12px}
.hint{color:#666;font-size:11px}.fmsg{color:#cc0000}.fst{font-size:11px}
.errbox{border:2px solid #cc0000;background:#ffeeee;padding:8px;margin-bottom:10px}.errbox a{color:#cc0000}
.savemsg{border:1px solid #339933;background:#eeffee;padding:6px;margin-bottom:10px}
tr.rowerr td,td.rowerr{background:#ffdddd}
.btns{margin-top:14px}.cap{border:1px solid #999;background:#fafafa;padding:10px;display:inline-block}
.ann{position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(0,0,0,.4)}.annbox{width:420px;margin:120px auto;background:#ffffdd;border:2px solid #003366;padding:14px}
`;
  return files;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
