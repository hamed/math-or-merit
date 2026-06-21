/** Internal shared primitive; external simulation consumers use SimEngine. */
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
