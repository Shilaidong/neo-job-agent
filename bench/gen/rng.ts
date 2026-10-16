// Deterministic PRNG helpers used by the reskin generator.
// Everything random in bench/ must flow through Rng so that a seed fully determines an instance.

export class Rng {
  private s: number;
  private readonly seed: string;
  constructor(seed: number | string) {
    this.seed = String(seed);
    let h = 2166136261 >>> 0;
    const str = String(seed);
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    this.s = h || 0x9e3779b9;
  }
  // mulberry32
  next(): number {
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(n: number): number {
    return Math.floor(this.next() * n);
  }
  bool(p = 0.5): boolean {
    return this.next() < p;
  }
  pick<T>(arr: readonly T[]): T {
    return arr[this.int(arr.length)];
  }
  shuffle<T>(arr: readonly T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  // Independent child stream, so adding draws in one place does not shift another.
  fork(label: string): Rng {
    return new Rng(`${this.seed}:${label}`);
  }
}
