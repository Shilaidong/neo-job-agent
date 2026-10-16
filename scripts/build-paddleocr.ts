import { existsSync } from "node:fs"
import { mkdir, rm } from "node:fs/promises"
import path from "node:path"

// paddlepaddle 3.x never shipped Intel macOS wheels, so the x64 customer build
// downgrades to the last Intel-capable stack (paddle 2.6.2 + paddleocr 2.7,
// PP-OCRv4 mobile models). The terra-paddleocr CLI contract stays identical.
const legacyIntel = process.arch === "x64"
const cache = path.resolve(legacyIntel ? ".cache/terra-paddleocr-x64" : ".cache/terra-paddleocr")
const python = path.join(cache, "venv/bin/python")
// paddleocr 2.7.x hard-codes BASE_DIR = ~/.paddleocr/ (no env override exists), so
// the Intel prefetch redirects HOME into the cache and reads the models back from
// that fake home. It also downloads det, rec AND cls at construction time even
// with use_angle_cls=False, so all three must be prefetched and bundled.
const models = path.join(cache, legacyIntel ? "home/.paddleocr" : "models")
const target = path.resolve("resources/vendor/terra-paddleocr")
const source = path.resolve("native/terra-paddleocr.py")
const uv = Bun.which("uv")

if (process.platform !== "darwin") throw new Error("The bundled PaddleOCR tool is built for macOS customer packages.")
if (!uv) throw new Error("Building bundled PaddleOCR requires uv. Install it from https://docs.astral.sh/uv/.")

async function run(command: string[], env = process.env) {
  const child = Bun.spawn(command, { cwd: path.resolve("."), env, stdout: "inherit", stderr: "inherit" })
  if ((await child.exited) !== 0) throw new Error(`Command failed: ${command.join(" ")}`)
}

await mkdir(cache, { recursive: true })
if (!existsSync(python)) await run([uv, "venv", "--python", "3.11", path.join(cache, "venv")])

const packages = legacyIntel
  ? // numpy<2 is required by imgaug 0.4.2 (imported by paddleocr 2.x internals).
    ["paddlepaddle==2.6.2", "paddleocr==2.7.3", "numpy<2", "PyMuPDF==1.26.7", "pyinstaller==6.21.0"]
  : ["paddlepaddle==3.2.1", "paddleocr==3.7.0", "paddlex[ocr-core]==3.7.2", "PyMuPDF==1.26.7", "pyinstaller==6.21.0"]

await run([uv, "pip", "install", "--python", python, ...packages])

function packageInstalled(distribution: string) {
  const check = Bun.spawnSync([uv, "pip", "show", "--python", python, distribution], { stdout: "ignore", stderr: "ignore" })
  return check.exitCode === 0
}

function legacyRuntimeDeps(): { modules: string[]; distributions: string[] } {
  // Run the full OCR chain in the venv and take its sys.modules top-level set
  // as ground truth. paddleocr 2.x loads its nested tools/ppocr/ppstructure
  // copies from disk via sys.path injection, so PyInstaller's static analysis
  // misses what those files (and their transitive deps, e.g. imageio behind
  // skimage's lazy loader) actually import; pyclipper, imageio metadata and
  // stdlib imghdr were the first Intel crashes. Stdlib names stay in the
  // list: PyInstaller only bundles stdlib modules it can see statically, and
  // these are reached exclusively through the disk-loaded copies. The three
  // nested names are excluded because they resolve to bundled on-disk copies
  // at runtime and modulegraph cannot see them either way. Distributions are
  // probed with the pre-paddleocr sys.path (paddleocr vendors extra dist-info
  // behind its path injection, e.g. backports.tarfile, which PyInstaller
  // cannot resolve at build time and then dies on copy_metadata), and back
  // the importlib.metadata.version() calls that imageio and friends make at
  // import time.
  const script = [
    "import importlib.metadata, json, sys",
    "pristine = list(sys.path)",
    "from paddleocr import PaddleOCR",
    "PaddleOCR(lang='ch', show_log=False, use_angle_cls=False)",
    "tops = sorted({(getattr(m, '__name__', '') or '').split('.')[0] for m in sys.modules.values() if getattr(m, '__name__', '')})",
    "sys.path[:] = pristine",
    "excluded = {'__main__', 'tools', 'ppocr', 'ppstructure', 'setuptools', 'distutils', '_distutils_hack', 'virtualenv', 'pip', 'wheel'}",
    "modules = [name for name in tops if name not in excluded]",
    "mapping = importlib.metadata.packages_distributions()",
    "distributions = []",
    "for module in modules:",
    "    for dist in mapping.get(module, []):",
    "        try:",
    "            importlib.metadata.distribution(dist)",
    "        except importlib.metadata.PackageNotFoundError:",
    "            continue",
    "        if dist not in distributions:",
    "            distributions.append(dist)",
    "print('TERRA_DEPS=' + json.dumps({'modules': modules, 'distributions': sorted(distributions)}))",
  ].join("\n")
  const proc = Bun.spawnSync([python, "-c", script], {
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, HOME: path.join(cache, "home") },
  })
  if (proc.exitCode !== 0) throw new Error(`Failed to enumerate paddleocr 2.x runtime imports: ${proc.stderr.toString()}`)
  const line = proc.stdout
    .toString()
    .split("\n")
    .find((item) => item.startsWith("TERRA_DEPS="))
  if (!line) throw new Error("paddleocr runtime dependency probe did not emit its marker line.")
  return JSON.parse(line.slice("TERRA_DEPS=".length)) as { modules: string[]; distributions: string[] }
}

if (legacyIntel) {
  // paddleocr 2.7 pulls opencv-python 4.6 and visualdl pulls opencv-python-headless
  // 4.11; all three opencv distributions share site-packages/cv2 and whichever
  // installs last overwrites the shared cv2.abi3.so, so the frozen binary can end
  // up linked against a non-contrib or headless build. Drop the extra
  // distributions and reinstall contrib last so the OCR chain always runs the
  // contrib build that imgaug and paddleocr 2.x expect.
  const extraOpenCv = ["opencv-python", "opencv-python-headless"].filter(packageInstalled)
  if (extraOpenCv.length > 0) await run([uv, "pip", "uninstall", "--python", python, ...extraOpenCv])
  await run([uv, "pip", "install", "--python", python, "--force-reinstall", "--no-deps", "opencv-contrib-python==4.6.0.66"])
}

if (legacyIntel) {
  await mkdir(path.join(cache, "home"), { recursive: true })
  await run(
    [python, "-c", ["from paddleocr import PaddleOCR", "PaddleOCR(lang='ch', show_log=False, use_angle_cls=False)"].join("; ")],
    { ...process.env, HOME: path.join(cache, "home") },
  )
} else {
  const paddleEnv = {
    ...process.env,
    PADDLE_PDX_CACHE_HOME: models,
    PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK: "True",
  }
  await run(
    [
      python,
      "-c",
      [
        "from paddleocr import PaddleOCR",
        "PaddleOCR(text_detection_model_name='PP-OCRv6_medium_det', text_recognition_model_name='PP-OCRv6_medium_rec', use_doc_orientation_classify=False, use_doc_unwarping=False, use_textline_orientation=False)",
      ].join("; "),
    ],
    paddleEnv,
  )
}

const detector = legacyIntel
  ? path.join(models, "whl/det/ch/ch_PP-OCRv4_det_infer")
  : path.join(models, "official_models/PP-OCRv6_medium_det")
const recognizer = legacyIntel
  ? path.join(models, "whl/rec/ch/ch_PP-OCRv4_rec_infer")
  : path.join(models, "official_models/PP-OCRv6_medium_rec")
const classifier = legacyIntel ? path.join(models, "whl/cls/ch_ppocr_mobile_v2.0_cls_infer") : ""
if (!existsSync(detector) || !existsSync(recognizer) || (legacyIntel && !existsSync(classifier))) {
  throw new Error("PaddleOCR model prefetch did not produce the required local models.")
}

await rm(target, { recursive: true, force: true })
await mkdir(path.dirname(target), { recursive: true })
const pyinstallerArgs = [
  path.join(cache, "venv/bin/pyinstaller"),
  "--noconfirm",
  "--clean",
  "--onedir",
  "--name",
  "terra-paddleocr",
  "--distpath",
  path.dirname(target),
  "--workpath",
  path.join(cache, "work"),
  "--specpath",
  path.join(cache, "spec"),
  "--collect-all",
  "paddleocr",
]
if (legacyIntel) {
  pyinstallerArgs.push("--collect-all", "paddle")
  for (const distribution of ["paddleocr", "imgaug", "pyclipper", "shapely", "scikit-image", "opencv-contrib-python"]) {
    pyinstallerArgs.push("--copy-metadata", distribution)
  }
  // paddleocr 2.x injects its package dir into sys.path and then loads the
  // nested tools/ppocr/ppstructure copies by top-level name at runtime, so
  // static analysis never walks the imports behind those files
  // (warn-terra-paddleocr.txt lists the tools/ppocr/ppstructure edges as
  // missing). Scan those dirs for their full import surface and feed every
  // resolvable top-level dependency back in as a hidden import; pyclipper,
  // skimage and stdlib imghdr were the first crashes hit on Intel. The extra
  // static entries cover C/stdlib bits the scan cannot see through bytecode.
  const runtimeDeps = legacyRuntimeDeps()
  const hiddenImports = new Set([
    "cython",
    "_sha512",
    "_sysconfigdata__darwin_darwin",
    ...runtimeDeps.modules,
  ])
  for (const module of [...hiddenImports].sort()) {
    pyinstallerArgs.push("--hidden-import", module)
  }
  for (const distribution of runtimeDeps.distributions) {
    pyinstallerArgs.push("--copy-metadata", distribution)
  }
} else {
  pyinstallerArgs.push("--collect-all", "paddlex")
  for (const distribution of ["imagesize", "opencv-contrib-python", "pyclipper", "pypdfium2", "python-bidi", "shapely"]) {
    pyinstallerArgs.push("--copy-metadata", distribution)
  }
}
await run([
  ...pyinstallerArgs,
  "--add-data",
  `${detector}:models/${path.basename(detector)}`,
  "--add-data",
  `${recognizer}:models/${path.basename(recognizer)}`,
  ...(legacyIntel ? ["--add-data", `${classifier}:models/${path.basename(classifier)}`] : []),
  source,
])

if (!existsSync(path.join(target, "terra-paddleocr"))) throw new Error("PaddleOCR package build did not produce an executable.")
