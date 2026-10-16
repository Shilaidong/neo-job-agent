/** Token usage as OpenCode reports it per assistant message. */
export type TokenUsage = { input: number; output: number; reasoning: number; cache: { read: number; write: number } }

export const emptyTokens = (): TokenUsage => ({ input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } })

export function normalizeTokens(value: unknown): TokenUsage {
  const item = (value && typeof value === "object" ? value : {}) as any
  const n = (x: unknown) => (Number.isFinite(Number(x)) ? Math.max(0, Number(x)) : 0)
  return { input: n(item.input), output: n(item.output), reasoning: n(item.reasoning), cache: { read: n(item.cache?.read), write: n(item.cache?.write) } }
}

export function addTokens(a: TokenUsage, b: TokenUsage): TokenUsage {
  return {
    input: a.input + b.input,
    output: a.output + b.output,
    reasoning: a.reasoning + b.reasoning,
    cache: { read: a.cache.read + b.cache.read, write: a.cache.write + b.cache.write },
  }
}

export function subtractTokens(next: TokenUsage, previous: TokenUsage): TokenUsage {
  return {
    input: Math.max(0, next.input - previous.input),
    output: Math.max(0, next.output - previous.output),
    reasoning: Math.max(0, next.reasoning - previous.reasoning),
    cache: { read: Math.max(0, next.cache.read - previous.cache.read), write: Math.max(0, next.cache.write - previous.cache.write) },
  }
}

/** Same weighting as 1.1.x so credits mean the same thing in both apps: output ×4, cache reads free. */
export function weightedTokens(tokens: TokenUsage) {
  return Math.max(0, tokens.input + tokens.output * 4 + tokens.reasoning + tokens.cache.write)
}

export const WEIGHTED_TOKENS_PER_CREDIT = 10_000

export function creditsFor(tokens: TokenUsage) {
  return Math.ceil(weightedTokens(tokens) / WEIGHTED_TOKENS_PER_CREDIT)
}
