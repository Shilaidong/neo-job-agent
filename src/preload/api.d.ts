import type { NeoApi } from "../shared/types"
declare global {
  interface Window {
    neo: NeoApi
  }
}
export {}
