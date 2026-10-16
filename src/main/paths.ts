import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

/** Project root in dev, the asar root when packaged — independent of how Electron was launched. */
export const appRoot = join(dirname(fileURLToPath(import.meta.url)), "../..")
export const fixture = (name: string) => `file://${join(appRoot, "fixtures", name)}`
