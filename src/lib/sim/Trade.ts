/**
 * Apply one yard-sale transfer to caller-owned struct-of-arrays state.
 *
 * This is the public low-level seam for headless research variants that choose
 * pairs differently from `SimEngine`. Ordinary simulations should use
 * `createEngine`; custom samplers may compose this primitive without reaching
 * into implementation-private paths.
 */
export function applyYardSaleTrade(
  wealth: Float64Array,
  a: number,
  b: number,
  beta: number,
  firstWins: boolean,
): void {
  const stake = beta * Math.min(wealth[a], wealth[b]);
  const sign = firstWins ? 1 : -1;
  wealth[a] += sign * stake;
  wealth[b] -= sign * stake;
}
