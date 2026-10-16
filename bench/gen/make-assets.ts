#!/usr/bin/env bun
// One-off asset builder for the fictional students: small valid JPEG photos (via macOS `sips`) and
// minimal one-page PDFs. Run again only if truth.json file names change:  bun bench/gen/make-assets.ts

import { writeFileSync, readFileSync, unlinkSync, existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { BENCH, listStudents } from "./build";

function bmp(w: number, h: number, hue: [number, number, number]): Buffer {
  const row = Math.ceil((w * 3) / 4) * 4;
  const buf = Buffer.alloc(54 + row * h);
  buf.write("BM", 0);
  buf.writeUInt32LE(buf.length, 2);
  buf.writeUInt32LE(54, 10);
  buf.writeUInt32LE(40, 14);
  buf.writeInt32LE(w, 18);
  buf.writeInt32LE(h, 22);
  buf.writeUInt16LE(1, 26);
  buf.writeUInt16LE(24, 28);
  buf.writeUInt32LE(row * h, 34);
  const cx = w / 2, cy = h * 0.58, r = w * 0.22;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const o = 54 + y * row + x * 3;
      let c: [number, number, number] = [245, 245, 245];
      const face = (x - cx) ** 2 + (y - cy) ** 2 < r * r;
      const body = y < h * 0.34 && Math.abs(x - cx) < w * 0.34 - (h * 0.34 - y) * 0.2;
      if (body) c = hue;
      if (face) c = [150, 185, 225];
      if (!face && !body) c = [hue[0] > 200 ? 250 : 236, 240, 246];
      buf[o] = c[0];
      buf[o + 1] = c[1];
      buf[o + 2] = c[2];
    }
  return buf;
}

function pdf(lines: string[]): Buffer {
  const text = lines.map((l, i) => `BT /F1 11 Tf 56 ${780 - i * 16} Td (${l.replace(/[\\()]/g, "\\$&").replace(/[^\x20-\x7e]/g, "?")}) Tj ET`).join("\n");
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${text.length} >>\nstream\n${text}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n";
  const offs: number[] = [];
  objs.forEach((o, i) => {
    offs.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map((o) => String(o).padStart(10, "0") + " 00000 n \n").join("")}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}

const HUES: [number, number, number][] = [[90, 60, 40], [120, 70, 30], [60, 60, 70]];
listStudents().forEach((sid, si) => {
  const dir = join(BENCH, "students", sid, "materials");
  const truth = JSON.parse(readFileSync(join(BENCH, "students", sid, "truth.json"), "utf8"));
  const files = truth.files as Record<string, string[]>;
  files.photo.forEach((name, i) => {
    const tmp = join(dir, `__tmp${i}.bmp`);
    writeFileSync(tmp, bmp(480 + i * 8, 640 + i * 8, HUES[si]));
    const res = spawnSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "80", tmp, "--out", join(dir, name)], { encoding: "utf8" });
    if (res.status !== 0) console.error("sips failed:", res.stderr);
    if (existsSync(tmp)) unlinkSync(tmp);
  });
  const who = `${String(truth.family_name?.v ?? truth.family_name).toUpperCase()}, ${truth.given_name?.v ?? truth.given_name}`;
  for (const [kind, title] of [["transcript", "Academic transcript (scanned copy)"], ["passport", "Passport information page (scanned copy)"], ["cv", "Curriculum vitae"]] as const)
    for (const name of files[kind] ?? []) writeFileSync(join(dir, name), pdf([title, who, "This PDF stands in for the scanned original.", "See the text files in this folder for the content."]));
  console.log(`assets for ${sid}: ${[...files.photo, ...(files.transcript ?? []), ...(files.passport ?? []), ...(files.cv ?? [])].join(", ")}`);
});
