/** Stability check for the phase map (M8 GATE memo): fit constant c across seeds and N. */
import { fitCriticalCurve, runPhaseCell } from '../src/lib/research/phase';

const BETAS = Array.from({ length: 10 }, (_, i) => 0.05 + i * 0.05);
const TAXES = Array.from({ length: 13 }, (_, i) => i * 0.01);

function fitFor(n: number, seedBase: number): number | null {
  const grid = TAXES.map((taxRate, iy) =>
    BETAS.map((beta, ix) =>
      runPhaseCell({
        n, beta, taxRate, levyEvery: n, trades: 200_000, burnIn: 120_000, tailSamples: 8,
        seed: seedBase + ix * 101 + iy * 13,
      }),
    ),
  );
  return fitCriticalCurve(grid, BETAS, TAXES, 0.5)?.c ?? null;
}

for (const n of [50, 100, 200]) {
  const cs = [11, 271, 977].map((s) => fitFor(n, s));
  console.log(`N=${n}: c =`, cs.map((c) => c?.toFixed(3)).join(', '));
}
