/** Stability check for the phase map (M8 GATE memo): fit constant c across seeds and N. */
import { fitSquareRelationship, OUTCOME_PROTOCOL_VERSION, runOutcome } from '../src/lib/research/phase';

const BETAS = Array.from({ length: 10 }, (_, i) => 0.05 + i * 0.05);
const TAXES = Array.from({ length: 13 }, (_, i) => i * 0.01);

function fitFor(n: number, seedBase: number): number | null {
  const grid = TAXES.map((taxRate, iy) =>
    BETAS.map((beta, ix) =>
      runOutcome({
        version: OUTCOME_PROTOCOL_VERSION,
        n, beta, taxRate, tradesPerRound: n, levyEveryRounds: 1, trades: 200_000, burnIn: 120_000, tailSamples: 8,
        seed: seedBase + ix * 101 + iy * 13,
      }).gini,
    ),
  );
  return fitSquareRelationship(grid, BETAS, TAXES, 0.5, 'decreases')?.c ?? null;
}

for (const n of [50, 100, 200]) {
  const cs = [11, 271, 977].map((s) => fitFor(n, s));
  console.log(`N=${n}: c =`, cs.map((c) => c?.toFixed(3)).join(', '));
}
