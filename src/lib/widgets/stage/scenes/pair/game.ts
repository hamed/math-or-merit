/**
 * The two-person game, in coins — shared by the pair stage (Blue and Red) and
 * the old merged scene (now branch B2). Moved here unchanged from
 * PersonTradeScene: the brief (Scenes 10–12) keeps ROUNDS and HOLDINGS exactly
 * as they were, and so do their tests.
 *
 * Everything is counted in COINS, because that is what the reader sees. Sixteen
 * coins make one person's fortune; the two start at 8 and 8.
 *
 *   start        A 8   B 8
 *   round 1  stake 4 each (half of what they have) → B wins → A 4,  B 12
 *   round 2  stake 2 each (half of the poorer)     → A wins → A 6,  B 10
 *   round 3  stake 3 each (half of the poorer)     → A wins → A 9,  B 7
 *
 * A is Blue and B is Red in the pair stage. Nothing is rigged in the RULE;
 * these outcomes are authored (presets.ts honesty note), and any sequence of
 * tosses is possible.
 */
export const UNITS = 16;

export const ROUNDS: readonly { stake: number; winner: 'A' | 'B' }[] = [
  { stake: 4, winner: 'B' },
  { stake: 2, winner: 'A' },
  { stake: 3, winner: 'A' },
];

/** Coins held after each stage of the game, A and B. Index 0 is the start. */
export const HOLDINGS: readonly { a: number; b: number }[] = (() => {
  const out: { a: number; b: number }[] = [{ a: UNITS / 2, b: UNITS / 2 }];
  for (const r of ROUNDS) {
    const last = out[out.length - 1];
    const pot = r.stake * 2;
    out.push({
      a: last.a - r.stake + (r.winner === 'A' ? pot : 0),
      b: last.b - r.stake + (r.winner === 'B' ? pot : 0),
    });
  }
  return out;
})();
