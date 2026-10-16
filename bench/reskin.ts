#!/usr/bin/env bun
// Reskin generator.
//   bun bench/reskin.ts <site> --seed N --out <dir>     -> <dir>/site/* , <dir>/answers/<student>.json , <dir>/instance.json
//   bun bench/reskin.ts --canonical                      -> rebuilds bench/sites/*, bench/sealed/portal-*, and their answers
//   bun bench/reskin.ts --list
// Deterministic per (site, seed). Serve ONLY <dir>/site to the agent; answers must stay outside its reach.

import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { BENCH, buildAnswers, buildInstance, listStudents, type Instance, type SiteSpec } from "./gen/build";

interface SiteModule {
  spec: SiteSpec;
  render: (inst: Instance) => Record<string, string>;
}
export const SITES: Record<string, { sealed: boolean; load: () => Promise<SiteModule> }> = {
  "portal-a": { sealed: false, load: () => import("./gen/sites/portal-a") },
  "portal-d": { sealed: false, load: () => import("./gen/sites/portal-d") },
  "portal-b": { sealed: true, load: () => import("./sealed/_src/portal-b") },
  "portal-c": { sealed: true, load: () => import("./sealed/_src/portal-c") },
  "portal-e": { sealed: true, load: () => import("./sealed/_src/portal-e") },
};
export const CANONICAL_SEED = "canon";

export async function generate(site: string, seed: string, siteDir: string, answersDir: string): Promise<{ inst: Instance; files: Record<string, string> }> {
  const entry = SITES[site];
  if (!entry) throw new Error(`unknown site "${site}". Known: ${Object.keys(SITES).join(", ")}`);
  const mod = await entry.load();
  const inst = buildInstance(mod.spec, seed);
  const files = mod.render(inst);
  if (existsSync(siteDir)) rmSync(siteDir, { recursive: true, force: true });
  mkdirSync(siteDir, { recursive: true });
  for (const [name, content] of Object.entries(files)) writeFileSync(join(siteDir, name), content);
  mkdirSync(answersDir, { recursive: true });
  for (const student of listStudents()) writeFileSync(join(answersDir, `${student}.json`), JSON.stringify(buildAnswers(inst, student), null, 2));
  return { inst, files };
}

export async function renderOnly(site: string, seed: string): Promise<{ inst: Instance; files: Record<string, string> }> {
  const mod = await SITES[site].load();
  const inst = buildInstance(mod.spec, seed);
  return { inst, files: mod.render(inst) };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--list")) {
    for (const [id, s] of Object.entries(SITES)) console.log(`${id}\t${s.sealed ? "sealed" : "dev"}`);
    return;
  }
  if (args.includes("--canonical")) {
    for (const [id, s] of Object.entries(SITES)) {
      const siteDir = s.sealed ? join(BENCH, "sealed", id) : join(BENCH, "sites", id);
      const ansDir = s.sealed ? join(BENCH, "sealed", "answers", id) : join(BENCH, "answers", id);
      await generate(id, CANONICAL_SEED, siteDir, ansDir);
      console.log(`built ${id}@${CANONICAL_SEED} -> ${siteDir}`);
    }
    return;
  }
  const site = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--seed" && args[args.indexOf(a) - 1] !== "--out");
  const seed = args[args.indexOf("--seed") + 1];
  const out = args[args.indexOf("--out") + 1];
  if (!site || !args.includes("--seed") || !args.includes("--out") || !seed || !out) {
    console.error("usage: bun bench/reskin.ts <site> --seed N --out <dir>   |   --canonical   |   --list");
    process.exit(2);
  }
  const outDir = resolve(out);
  const { inst } = await generate(site, seed, join(outDir, "site"), join(outDir, "answers"));
  writeFileSync(join(outDir, "instance.json"), JSON.stringify({ site, seed, instance: inst.tag, pages: inst.pages.map((p) => ({ id: p.id, title: p.title })) }, null, 2));
  console.log(`generated ${inst.tag}`);
  console.log(`  site    : ${join(outDir, "site")}   (serve this directory only)`);
  console.log(`  answers : ${join(outDir, "answers")}   (never expose to the agent)`);
}

if (import.meta.main) await main();
