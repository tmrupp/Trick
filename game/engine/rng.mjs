// Seeded random numbers. The generator's whole state is one 32-bit integer kept in the game state,
// so a game replays exactly from its seed and its actions.

export function seedFrom(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value >>> 0;
  let h = 2166136261;
  for (const ch of String(value)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

// mulberry32: returns [float in [0, 1), next state].
export function step(stateInt) {
  const s = (stateInt + 0x6d2b79f5) >>> 0;
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, s];
}

// A random source bound to a game state: reads and advances state.rng.
export function rngFor(state) {
  return {
    next() {
      const [x, s] = step(state.rng);
      state.rng = s;
      return x;
    },
    int(n) {
      return Math.floor(this.next() * n);
    },
    shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = this.int(i + 1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },
  };
}
