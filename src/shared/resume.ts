/** Shapes for the LaTeX resume studio (src/main/resume), crossing the IPC to the renderer. */

export type ResumeEngine = {
  kind: "tectonic" | "pdflatex" | "xelatex" | "none"
  binary?: string
  version?: string
  /** Human line for the settings screen: engine found (with version) or a hint how to install one. */
  note: string
}

/** One generated resume inside a student's `resume/` folder. */
export type ResumeItem = {
  studentDir: string
  track: string
  /** `resume/<track>-<name>/main.tex` */
  tex: string
  /** `resume/<track>-<name>/main.pdf` (compiled) */
  pdf: string
  /** `resume/Resume_<Track>_<Name>.pdf` — the named copy for sending off */
  exported: string
  updatedAt: string
}

export type ResumeResult = { item: ResumeItem; log: string }
