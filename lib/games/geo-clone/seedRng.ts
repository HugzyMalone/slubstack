export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedToInt(seed: string): number {
  const hex = seed.replace(/-/g, "");
  let acc = 0;
  for (let i = 0; i < hex.length; i += 8) {
    const chunk = parseInt(hex.slice(i, i + 8), 16);
    if (Number.isFinite(chunk)) acc = (acc ^ chunk) >>> 0;
  }
  return acc || 1;
}

export function pickN<T>(items: readonly T[], rng: () => number, count: number): T[] {
  const pool = items.slice();
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(rng() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
