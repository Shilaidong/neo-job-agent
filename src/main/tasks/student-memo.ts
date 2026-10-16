/**
 * The student-level account memo (2026-10-14 编辑 feature): one block of text, all the sites'
 * usernames and passwords the consultant pastes in at once; saving replaces the whole thing.
 *
 * It lives OUTSIDE the workspace, encrypted, on purpose. Two reasons, both measured:
 * `material-creds.ts` scans `student.json` as plain text — a "密码：…" line parked in there would
 * leak into the login scan's view and could turn an unambiguous site into a thrown "两处都有记录".
 * And the keychain-shaped stores (platform-passwords) already have the `secret: true` precedent:
 * the file tool the model runs with cannot reach userData.
 * The memo reaches the model only as the opening message's own text — same contract as the per-task
 * 「平台登录」 blob since 2026-10-12: the software never parses it, the model reads it.
 */
import { openStore } from "../store"

type MemoValue = { text: string; updatedAt: string }
type MemoStore = { get: (key: string) => MemoValue | undefined; set: (key: string, value: MemoValue) => void; delete: (key: string) => void }

let store: MemoStore = openStore<Record<string, MemoValue>>("student-memos", { secret: true })

/**
 * Seam for smoke: the tasks-smoke mode sits inside Electron's windowless boot, where the first
 * safeStorage call can park forever on a keychain consent the nobody can click — so the tasks smoke
 * runs these checks against a Map. The real encrypted store is exercised by the app itself and by
 * the same secret-store mechanism `platform-passwords` uses, proven in browser smoke.
 */
export function setMemoStoreForTests(next?: MemoStore) {
  store = next ?? openStore<Record<string, MemoValue>>("student-memos", { secret: true })
}

/** The pasted block, or "" when nothing was ever saved (or the last save came in empty). */
export function getStudentMemo(studentDir: string): string {
  return store.get(studentDir)?.text ?? ""
}

/** Whole-block replacement: anything that was there before is gone. Empty text clears it. */
export function setStudentMemo(studentDir: string, text: string): void {
  const value = text.trim()
  if (!value) store.delete(studentDir)
  else store.set(studentDir, { text: value, updatedAt: new Date().toISOString() })
}
