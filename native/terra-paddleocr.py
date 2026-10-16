import json
import os
import sys
import tempfile
from pathlib import Path

if getattr(sys, "frozen", False):
    # The frozen interpreter has no real site-packages prefix, and PyInstaller's
    # site.getsitepackages() yields entries containing None. paddlepaddle 2.6.2
    # joins those entries in set_paddle_lib_path() at import time and crashes
    # with a TypeError, so point the lookup at the bundle directory that
    # actually contains the collected paddle package instead.
    import site as _site

    def _frozen_site_dirs(*_args, **_kwargs):
        roots = [item for item in sys.path if isinstance(item, str)]
        return [item for item in roots if os.path.isdir(os.path.join(item, "paddle"))]

    _site.getsitepackages = _frozen_site_dirs

import fitz
import paddleocr
from paddleocr import PaddleOCR

# Intel (x64) customer builds ship paddleocr 2.7 + paddlepaddle 2.6.2 because
# paddle 3.x never published Intel macOS wheels. Both stacks expose the same
# terra-paddleocr CLI contract; only the model wiring and result shapes differ.
LEGACY_PADDLE_V2 = paddleocr.__version__.split(".", 1)[0] == "2"


def bundled_path() -> Path:
    return Path(getattr(sys, "_MEIPASS", Path(__file__).parent))


def create_ocr() -> PaddleOCR:
    os.environ["PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK"] = "True"
    models = bundled_path() / "models"
    if LEGACY_PADDLE_V2:
        # paddleocr 2.x downloads det, rec and cls at construction time even with
        # use_angle_cls=False, so every model dir must point at the bundled copy.
        return PaddleOCR(
            lang="ch",
            use_angle_cls=False,
            show_log=False,
            det_model_dir=str(models / "ch_PP-OCRv4_det_infer"),
            rec_model_dir=str(models / "ch_PP-OCRv4_rec_infer"),
            cls_model_dir=str(models / "ch_ppocr_mobile_v2.0_cls_infer"),
        )
    return PaddleOCR(
        text_detection_model_name="PP-OCRv6_medium_det",
        text_detection_model_dir=str(models / "PP-OCRv6_medium_det"),
        text_recognition_model_name="PP-OCRv6_medium_rec",
        text_recognition_model_dir=str(models / "PP-OCRv6_medium_rec"),
        use_doc_orientation_classify=False,
        use_doc_unwarping=False,
        use_textline_orientation=False,
    )


def recognize(ocr: PaddleOCR, image: str) -> str:
    if LEGACY_PADDLE_V2:
        lines = []
        for page in ocr.ocr(image, cls=False) or []:
            for detection in page or []:
                text = detection[1][0]
                if text and text.strip():
                    lines.append(text.strip())
        return "\n".join(lines)
    return "\n".join(
        text.strip()
        for result in ocr.predict(image)
        for text in result.get("rec_texts", [])
        if text and text.strip()
    )


def extract(ocr: PaddleOCR, source: Path) -> str:
    if source.suffix.lower() != ".pdf":
        return recognize(ocr, str(source))

    document = fitz.open(source)
    try:
        with tempfile.TemporaryDirectory(prefix="terra-paddleocr-") as directory:
            pages = []
            for index, page in enumerate(document):
                image = Path(directory, f"page-{index + 1}.png")
                page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False).save(image)
                text = recognize(ocr, str(image))
                if text:
                    pages.append(f"--- Page {index + 1} ---\n{text}")
            return "\n\n".join(pages)
    finally:
        document.close()


def emit_jsonl(payload: dict) -> None:
    sys.stdout.write(json.dumps(payload, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def process_files(paths: list[Path], *, jsonl: bool) -> int:
    missing = [path for path in paths if not path.is_file()]
    if missing:
        print(f"terra-paddleocr: file not found: {missing[0]}", file=sys.stderr)
        return 66

    ocr = create_ocr()
    if not jsonl:
        if len(paths) != 1:
            print("Usage: terra-paddleocr <file>", file=sys.stderr)
            return 64
        print(extract(ocr, paths[0]))
        return 0

    for index, source in enumerate(paths, start=1):
        try:
            text = extract(ocr, source)
            emit_jsonl(
                {
                    "ok": True,
                    "index": index,
                    "total": len(paths),
                    "file": str(source),
                    "text": text,
                    "textLength": len(text),
                    "error": "",
                }
            )
        except Exception as error:  # noqa: BLE001 - surface per-file OCR failures without aborting the batch
            emit_jsonl(
                {
                    "ok": False,
                    "index": index,
                    "total": len(paths),
                    "file": str(source),
                    "text": "",
                    "textLength": 0,
                    "error": str(error),
                }
            )
    return 0


def main() -> int:
    args = sys.argv[1:]
    if not args:
        print("Usage: terra-paddleocr [--jsonl] <file> [file...]", file=sys.stderr)
        return 64

    jsonl = False
    if args[0] == "--jsonl":
        jsonl = True
        args = args[1:]
    if not args:
        print("Usage: terra-paddleocr [--jsonl] <file> [file...]", file=sys.stderr)
        return 64

    return process_files([Path(item) for item in args], jsonl=jsonl)


if __name__ == "__main__":
    raise SystemExit(main())
