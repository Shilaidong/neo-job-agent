// neo-ocr — text from scanned PDFs and images, using the OCR engine that ships with macOS (Vision).
// No models to bundle, no Python, one universal binary for Intel and Apple Silicon.
//
//   neo-ocr [--json] <file> [<file>...]
//
// Plain mode prints the text, page by page. --json prints one object per file:
//   {"file": "...", "pages": [{"page": 1, "source": "ocr" | "text-layer", "text": "...", "confidence": 0.97}]}
import AppKit
import Foundation
import PDFKit
import Vision

struct Page: Codable { let page: Int; let source: String; let text: String; let confidence: Double }
struct Output: Codable { let file: String; let pages: [Page]; let error: String? }

let LANGUAGES = ["zh-Hans", "zh-Hant", "en-US"]
let PDF_RENDER_SCALE: CGFloat = 2.5   // ~180 dpi: enough for small print on transcripts without huge bitmaps
let TEXT_LAYER_MIN_CHARS = 40         // fewer than this on a PDF page = treat it as a scan

func recognize(_ image: CGImage) throws -> (String, Double) {
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.recognitionLanguages = LANGUAGES
    request.usesLanguageCorrection = true
    try VNImageRequestHandler(cgImage: image, options: [:]).perform([request])
    let observations = request.results ?? []

    // Vision returns blocks in no useful order. Group into rows by vertical overlap, then read each row left to right,
    // so a transcript table comes out as "课程 高一 高二 高三" rather than four separate columns.
    struct Item { let text: String; let box: CGRect; let confidence: Float }
    let items = observations.compactMap { o -> Item? in
        guard let best = o.topCandidates(1).first else { return nil }
        return Item(text: best.string, box: o.boundingBox, confidence: best.confidence)
    }.sorted { $0.box.midY > $1.box.midY }

    var rows: [[Item]] = []
    for item in items {
        if let last = rows.last, let anchor = last.first, abs(anchor.box.midY - item.box.midY) < min(anchor.box.height, item.box.height) * 0.6 {
            rows[rows.count - 1].append(item)
        } else {
            rows.append([item])
        }
    }
    let text = rows.map { $0.sorted { $0.box.minX < $1.box.minX }.map(\.text).joined(separator: "    ") }.joined(separator: "\n")
    let confidence = items.isEmpty ? 0 : Double(items.map(\.confidence).reduce(0, +)) / Double(items.count)
    return (text, confidence)
}

func render(_ page: PDFPage) -> CGImage? {
    let bounds = page.bounds(for: .mediaBox)
    let size = CGSize(width: bounds.width * PDF_RENDER_SCALE, height: bounds.height * PDF_RENDER_SCALE)
    guard let context = CGContext(data: nil, width: Int(size.width), height: Int(size.height), bitsPerComponent: 8, bytesPerRow: 0,
                                  space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return nil }
    context.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
    context.fill(CGRect(origin: .zero, size: size))
    context.scaleBy(x: PDF_RENDER_SCALE, y: PDF_RENDER_SCALE)
    page.draw(with: .mediaBox, to: context)
    return context.makeImage()
}

func process(_ path: String) -> Output {
    let url = URL(fileURLWithPath: path)
    guard FileManager.default.fileExists(atPath: path) else { return Output(file: path, pages: [], error: "file not found") }
    do {
        if url.pathExtension.lowercased() == "pdf" {
            guard let document = PDFDocument(url: url) else { return Output(file: path, pages: [], error: "cannot open PDF (damaged or password-protected)") }
            var pages: [Page] = []
            for index in 0..<document.pageCount {
                guard let page = document.page(at: index) else { continue }
                // A PDF that already carries text needs no OCR — its own text is exact.
                let embedded = (page.string ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
                if embedded.count >= TEXT_LAYER_MIN_CHARS {
                    pages.append(Page(page: index + 1, source: "text-layer", text: embedded, confidence: 1))
                } else if let image = render(page) {
                    let (text, confidence) = try recognize(image)
                    pages.append(Page(page: index + 1, source: "ocr", text: text, confidence: confidence))
                }
            }
            return Output(file: path, pages: pages, error: nil)
        }
        guard let image = NSImage(contentsOf: url)?.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
            return Output(file: path, pages: [], error: "not an image macOS can read")
        }
        let (text, confidence) = try recognize(image)
        return Output(file: path, pages: [Page(page: 1, source: "ocr", text: text, confidence: confidence)], error: nil)
    } catch {
        return Output(file: path, pages: [], error: error.localizedDescription)
    }
}

var arguments = Array(CommandLine.arguments.dropFirst())
let json = arguments.first == "--json"
if json { arguments.removeFirst() }
guard !arguments.isEmpty else {
    FileHandle.standardError.write("Usage: neo-ocr [--json] <file> [<file>...]\n".data(using: .utf8)!)
    exit(64)
}

var failed = false
let encoder = JSONEncoder()
encoder.outputFormatting = [.withoutEscapingSlashes]
for path in arguments {
    let output = process(path)
    if output.error != nil { failed = true }
    if json {
        print(String(data: try! encoder.encode(output), encoding: .utf8)!)
    } else if let error = output.error {
        FileHandle.standardError.write("neo-ocr: \(path): \(error)\n".data(using: .utf8)!)
    } else {
        for page in output.pages {
            if output.pages.count > 1 { print("\n--- 第 \(page.page) 页 ---") }
            print(page.text)
        }
    }
}
exit(failed ? 1 : 0)
