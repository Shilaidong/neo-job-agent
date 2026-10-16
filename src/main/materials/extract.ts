import { execFile, spawn } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync } from "node:fs"
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises"
import { dirname, extname, join, relative } from "node:path"
import { createInterface } from "node:readline"
import { promisify } from "node:util"
import XLSX from "xlsx"
import { createLogger } from "../log"
import { appRoot } from "../paths"
import { docxXmlToText } from "./docx"
import { redactSecrets, SECRET_NOTE } from "./redact"

/**
 * Turn `materials/` into text the model can read: `materials_text/<same path>.md` plus an INDEX.md
 * saying, per file, how the text was obtained and how far to trust it.
 *
 *   text-layer PDF, docx, xlsx, txt  → exact text, instant
 *   scanned PDF pages, images        → PaddleOCR (accurate; see docs/ROADMAP.md M3 for the comparison)
 *   …when PaddleOCR is not installed → macOS Vision, flagged as low-trust: it misreads names
 *
 * Incremental by content hash, so adding one file later costs one file.
 */
const log = createLogger("materials")
const run = promisify(execFile)

export type Method = "text" | "docx" | "xlsx" | "pdf-text" | "paddleocr" | "vision" | "unsupported" | "failed"
export type Entry = { file: string; hash: string; method: Method; chars: number; pages?: number; note?: string; output?: string; at: string }
export type Progress = { done: number; total: number; current: string }
export type Summary = { entries: Entry[]; processed: number; reused: number; failed: number; engine: "paddleocr" | "vision" }

const TEXT_EXT = new Set([".txt", ".md", ".csv", ".tsv", ".json", ".rtf"])
const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".heic", ".tif", ".tiff", ".bmp", ".gif", ".webp"])
const SHEET_EXT = new Set([".xlsx", ".xls"])
const METHOD_LABEL: Record<Method, string> = {
  text: "原文",
  docx: "Word 原文",
  xlsx: "表格原文",
  "pdf-text": "PDF 原文（电子版）",
  paddleocr: "OCR 识别",
  vision: "OCR 识别（低可信）",
  unsupported: "未处理",
  failed: "失败",
}
const VISION_NOTE = "用的是系统自带识别，姓名、地名、数字可能认错；填表前对照原件核对，或用 read 直接看原图。"

const resource = (...parts: string[]) => {
  const packaged = join(process.resourcesPath || "", ...parts)
  return existsSync(packaged) ? packaged : join(appRoot, "resources", ...parts)
}
const neoOcr = () => resource("bin", "neo-ocr")
const paddleOcr = () => resource("vendor", "terra-paddleocr", "terra-paddleocr")

/**
 * A student's papers often arrive as one .zip. Nothing downstream can read one, and until now it was quietly listed as
 * "未处理" — a real run had a whole folder of materials the model never saw. Unpack it next to itself, once, read-only
 * (the consultant's own folder is never touched; materials/ is our copy), and let the normal pipeline take it from there.
 */
async function unpackArchives(source: string) {
  for (const file of await walk(source)) {
    if (extname(file).toLowerCase() !== ".zip") continue
    const out = join(source, `${file}（解包）`)
    if (existsSync(out)) continue
    try {
      await mkdir(out, { recursive: true })
      // -j would flatten; keep the layout. -o overwrites nothing that matters because the folder is new.
      await run("/usr/bin/unzip", ["-o", "-q", join(source, file), "-d", out], { maxBuffer: 64 * 1024 * 1024 })
      log.info("archive unpacked", { file, into: `${file}（解包）` })
    } catch (error) {
      log.warn("could not unpack archive", { file, error })
    }
  }
}

async function walk(root: string, dir = root): Promise<string[]> {
  const out: string[] = []
  for (const entry of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    if (entry.name.startsWith(".") || entry.name.startsWith("~$")) continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walk(root, path)))
    else if (entry.isFile()) out.push(relative(root, path))
  }
  return out.sort()
}

async function hashFile(path: string) {
  return createHash("sha256").update(await readFile(path)).digest("hex").slice(0, 32)
}

type VisionPage = { page: number; source: "ocr" | "text-layer"; text: string; confidence: number }
async function readWithNeoOcr(path: string): Promise<VisionPage[]> {
  const { stdout } = await run(neoOcr(), ["--json", path], { maxBuffer: 64 * 1024 * 1024, timeout: 10 * 60_000 }).catch((error: any) => {
    // exit 1 still prints a JSON object carrying the reason
    if (error.stdout) return { stdout: String(error.stdout) }
    throw error
  })
  const parsed = JSON.parse(stdout.trim().split("\n").pop() || "{}")
  if (parsed.error) throw new Error(parsed.error)
  return parsed.pages ?? []
}

const joinPages = (pages: Array<{ page: number; text: string }>) =>
  pages.length <= 1 ? (pages[0]?.text ?? "") : pages.map((p) => `--- 第 ${p.page} 页 ---\n${p.text}`).join("\n\n")

/** One PaddleOCR process for the whole batch: loading its models is the slow part, each page after that is seconds. */
function runPaddle(files: string[], onResult: (file: string, result: { ok: boolean; text: string; error: string }) => void) {
  return new Promise<void>((resolve, reject) => {
    const started = Date.now()
    const child = spawn(paddleOcr(), ["--jsonl", ...files], { stdio: ["ignore", "pipe", "pipe"] })
    let stderr = ""
    child.stderr.on("data", (chunk) => (stderr = (stderr + chunk).slice(-4000)))
    createInterface({ input: child.stdout }).on("line", (line) => {
      if (!line.startsWith("{")) return
      try {
        const item = JSON.parse(line)
        onResult(item.file, { ok: Boolean(item.ok), text: String(item.text || ""), error: String(item.error || "") })
      } catch {
        // progress chatter from the OCR libraries; not ours
      }
    })
    child.once("error", reject)
    child.once("exit", (code) => {
      log[code === 0 ? "info" : "error"]("paddleocr finished", { code, files: files.length, ms: Date.now() - started, stderr: code === 0 ? undefined : stderr })
      code === 0 ? resolve() : reject(new Error(`PaddleOCR 退出码 ${code}`))
    })
  })
}

export async function extractMaterials(studentDir: string, onProgress?: (progress: Progress) => void): Promise<Summary> {
  const started = Date.now()
  const source = join(studentDir, "materials")
  const target = join(studentDir, "materials_text")
  const indexFile = join(target, ".index.json")
  await mkdir(target, { recursive: true })

  const previous: Record<string, Entry> = JSON.parse(await readFile(indexFile, "utf8").catch(() => "{}"))
  const hasPaddle = existsSync(paddleOcr())
  await unpackArchives(source)
  const files = await walk(source)
  const entries: Record<string, Entry> = {}
  const ocrQueue: string[] = []
  let done = 0
  let reused = 0
  const tick = (current: string) => onProgress?.({ done: ++done, total: files.length, current })

  const save = async (file: string, hash: string, method: Method, text: string, extra: Partial<Entry> = {}) => {
    const output = `${file}.md`
    const redacted = redactSecrets(text.trim())
    const body = redacted.text
    if (redacted.found) {
      extra = { ...extra, note: [extra.note, SECRET_NOTE].filter(Boolean).join("；") }
      log.warn("a material contains a password; blanked in the text version", { file, found: redacted.found })
    }
    const header = `<!-- 来源：materials/${file} · 方式：${METHOD_LABEL[method]}${extra.pages ? ` · ${extra.pages} 页` : ""} -->${extra.note ? `\n<!-- 注意：${extra.note} -->` : ""}`
    await mkdir(dirname(join(target, output)), { recursive: true })
    await writeFile(join(target, output), `${header}\n\n${body}\n`)
    entries[file] = { file, hash, method, chars: body.length, output, at: new Date().toISOString(), ...extra }
  }
  const skip = (file: string, hash: string, method: "unsupported" | "failed", note: string) => {
    entries[file] = { file, hash, method, chars: 0, note, at: new Date().toISOString() }
    if (method === "failed") log.warn("extraction failed", { file, note })
  }

  for (const file of files) {
    const path = join(source, file)
    const ext = extname(file).toLowerCase()
    const hash = await hashFile(path)
    const before = previous[file]
    // Redo a Vision result once PaddleOCR is available; otherwise an unchanged file keeps its text.
    const upgradable = before?.method === "vision" && hasPaddle
    if (before && before.hash === hash && !upgradable && before.method !== "failed" && (!before.output || existsSync(join(target, before.output)))) {
      entries[file] = before
      reused++
      tick(file)
      continue
    }
    try {
      if ((await stat(path)).size > 80 * 1024 * 1024) skip(file, hash, "unsupported", "文件超过 80MB，没有处理")
      else if (TEXT_EXT.has(ext)) await save(file, hash, "text", await readFile(path, "utf8"))
      else if (ext === ".docx") await save(file, hash, "docx", docxXmlToText((await run("/usr/bin/unzip", ["-p", path, "word/document.xml"], { maxBuffer: 64 * 1024 * 1024 })).stdout))
      else if (SHEET_EXT.has(ext)) {
        const book = XLSX.readFile(path, { cellDates: true })
        await save(file, hash, "xlsx", book.SheetNames.map((name) => `## ${name}\n\n${XLSX.utils.sheet_to_csv(book.Sheets[name], { blankrows: false })}`).join("\n\n"))
      } else if (ext === ".pdf") {
        const pages = await readWithNeoOcr(path)
        const scanned = pages.filter((p) => p.source === "ocr").length
        if (scanned === 0) await save(file, hash, "pdf-text", joinPages(pages), { pages: pages.length })
        else if (hasPaddle) {
          ocrQueue.push(file)
          entries[file] = { file, hash, method: "paddleocr", chars: 0, pages: pages.length, at: "" }
          continue // counted when PaddleOCR reports back
        } else await save(file, hash, "vision", joinPages(pages), { pages: pages.length, note: VISION_NOTE })
      } else if (IMAGE_EXT.has(ext)) {
        if (hasPaddle) {
          ocrQueue.push(file)
          entries[file] = { file, hash, method: "paddleocr", chars: 0, at: "" }
          continue
        }
        await save(file, hash, "vision", joinPages(await readWithNeoOcr(path)), { note: VISION_NOTE })
      } else skip(file, hash, "unsupported", `不认识的文件类型 ${ext || "（无扩展名）"}；需要的话直接用 read 打开`)
    } catch (error) {
      skip(file, hash, "failed", error instanceof Error ? error.message : String(error))
    }
    tick(file)
  }

  if (ocrQueue.length) {
    onProgress?.({ done, total: files.length, current: `正在加载文字识别引擎（${ocrQueue.length} 份扫描件）` })
    const byPath = new Map(ocrQueue.map((file) => [join(source, file), file]))
    const pending = new Set(ocrQueue)
    await runPaddle([...byPath.keys()], (path, result) => {
      const file = byPath.get(path)
      if (!file) return
      pending.delete(file)
      const { hash, pages } = entries[file]
      void (result.ok ? save(file, hash, "paddleocr", result.text, { pages }) : Promise.resolve(skip(file, hash, "failed", result.error))).then(() => tick(file))
    }).catch((error) => log.error("paddleocr batch failed", { error }))
    for (const file of pending) skip(file, entries[file].hash, "failed", "文字识别引擎没有返回结果")
  }

  // Text for files that no longer exist would mislead the model.
  for (const gone of Object.values(previous)) if (!entries[gone.file] && gone.output) await rm(join(target, gone.output), { force: true })

  const list = Object.values(entries).sort((a, b) => a.file.localeCompare(b.file))
  await writeFile(indexFile, JSON.stringify(entries, null, 2))
  await writeFile(join(target, "INDEX.md"), renderIndex(list, await gistOf(list, target)))
  const summary: Summary = { entries: list, processed: list.length - reused, reused, failed: list.filter((e) => e.method === "failed").length, engine: hasPaddle ? "paddleocr" : "vision" }
  log.info("materials extracted", { studentDir, files: list.length, processed: summary.processed, reused, failed: summary.failed, engine: summary.engine, ms: Date.now() - started, methods: countBy(list) })
  return summary
}

/**
 * One line per file saying what is actually in it, read off the top of its text version. The model has to pick which
 * paper answers the box in front of it; a bare list of 17 file names makes it open all of them (or guess from memory).
 */
async function gistOf(list: Entry[], target: string) {
  const out: Record<string, string> = {}
  for (const entry of list) {
    if (!entry.output) continue
    const text = await readFile(join(target, entry.output), "utf8").catch(() => "")
    const lines = text
      .split("\n")
      .map((line) => line.replace(/^#+\s*/, "").replace(/[|`]/g, " ").trim())
      .filter((line) => line && !line.startsWith("<!--"))
    out[entry.file] = lines.slice(0, 3).join(" · ").slice(0, 90)
  }
  return out
}

const countBy = (list: Entry[]) => list.reduce<Record<string, number>>((acc, e) => ((acc[e.method] = (acc[e.method] ?? 0) + 1), acc), {})

function renderIndex(list: Entry[], gist: Record<string, string>) {
  const rows = list.map(
    (e) => `| ${e.file} | ${METHOD_LABEL[e.method]} | ${e.chars || "—"} | ${e.output ? `materials_text/${e.output}` : "—"} | ${gist[e.file] ?? ""} | ${e.note ?? ""} |`,
  )
  return [
    "# 材料文字版索引",
    "",
    "`materials/` 里每个文件的文字版。**原文**类是精确的；**OCR 识别**来自扫描件或照片，关键信息（姓名、证件号、成绩、日期）拿不准时，用 read 打开原文件对照。",
    "这个目录由软件生成，补了新材料后调用 `materials_extract` 会更新它；不要手改。",
    "",
    "| 原文件 | 文字怎么来的 | 字数 | 文字版 | 里面大概有什么 | 备注 |",
    "|---|---|---|---|---|---|",
    ...rows,
    "",
  ].join("\n")
}
