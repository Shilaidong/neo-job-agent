#!/usr/bin/env bun
// Tiny static server for a generated portal.
//   bun bench/serve.ts <dir> [--port N]
// <dir> is a site directory (e.g. bench/sites/portal-a, or <out>/site from reskin.ts).
// Picks a free port when --port is not given and prints the URL. Listens on all loopback names so that
// both http://127.0.0.1:PORT and http://localhost:PORT work (one portal embeds a cross-origin iframe that way).
// No directory listing, no access outside <dir>, no external requests.

import { resolve, join, normalize, extname } from "node:path";
import { existsSync, statSync } from "node:fs";

const args = process.argv.slice(2);
const dirArg = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--port");
if (!dirArg) {
  console.error("usage: bun bench/serve.ts <site-dir> [--port N]");
  process.exit(2);
}
const root = resolve(dirArg);
if (!existsSync(join(root, "index.html"))) {
  console.error(`no index.html in ${root}`);
  process.exit(2);
}
const portArg = args.includes("--port") ? Number(args[args.indexOf("--port") + 1]) : 0;
const TYPES: Record<string, string> = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml" };

const server = Bun.serve({
  port: portArg,
  hostname: "::",
  fetch(req) {
    const url = new URL(req.url);
    let p = decodeURIComponent(url.pathname);
    if (p.endsWith("/")) p += "index.html";
    const full = normalize(join(root, p));
    if (!full.startsWith(root) || !existsSync(full) || !statSync(full).isFile()) return new Response("Not found", { status: 404 });
    return new Response(Bun.file(full), { headers: { "content-type": TYPES[extname(full)] ?? "application/octet-stream", "cache-control": "no-store" } });
  },
});
console.log(`serving ${root}`);
console.log(`URL: http://127.0.0.1:${server.port}/`);
