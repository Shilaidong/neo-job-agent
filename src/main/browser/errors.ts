/**
 * The browser layer's error classes live here, apart from controller.ts, so code that only
 * throws them (login-creds.ts, 2026-10-11) can import them without dragging Electron into
 * a bun-test module graph. controller.ts re-exports BrowserError, so callers keep their imports.
 */

/** Ordinary tool feedback for the model: stale ref, blocked click, a page that won't act. */
export class BrowserError extends Error {}
