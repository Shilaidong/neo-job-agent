#!/bin/sh
# Builds native/neo-ocr into one universal binary (Intel + Apple Silicon): resources/bin/neo-ocr.
# The result is committed — it is ~270KB and saves every machine from needing a Swift toolchain.
set -eu
cd "$(dirname "$0")/.."
SDK="$(xcrun --show-sdk-path)"
OUT="resources/bin"
TMP="$(mktemp -d)"
mkdir -p "$OUT"
for arch in arm64 x86_64; do
  swiftc -O -target "$arch-apple-macos12.0" -sdk "$SDK" native/neo-ocr/main.swift -o "$TMP/neo-ocr-$arch"
done
lipo -create "$TMP/neo-ocr-arm64" "$TMP/neo-ocr-x86_64" -output "$OUT/neo-ocr"
rm -rf "$TMP"
file "$OUT/neo-ocr"
