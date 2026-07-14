/**
 * The measured phase grid, shared by the map and both Gini cross-section
 * plots. Simulated, not theory — the display may interpolate it smoothly,
 * but every value comes from runPhaseCell (essay honesty rule).
 * NOT precomputed (owner review 2026-07-14): the map starts empty and the
 * measuring begins the first time the reader presses Run — the picture is a
 * consequence of running the machine. Filled once per session inside
 * requestAnimationFrame budgets.
 */
import { runPhaseCell } from '$lib/research';

/** Stake and tax both 0 … 100%, 11 steps each. */
export const PHASE_STEPS: readonly number[] = Array.from({ length: 11 }, (_, i) => i * 0.1);

const N = 100;
const LEVY_EVERY = 100;
const TRADES = 60_000;
const BURN_IN = 40_000;
const TAIL_SAMPLES = 6;

export const phaseStore = $state<{ grid: number[][] | null }>({ grid: null });

let started = false;

/** Begin the measuring — called on the reader's FIRST Run press. */
export function startPhaseGrid(): void {
  if (started || phaseStore.grid) return;
  started = true;
  compute();
}

function compute(): void {
  const steps = PHASE_STEPS.length;
  const out: number[][] = PHASE_STEPS.map(() => PHASE_STEPS.map(() => NaN));
  const cells: { cx: number; cy: number }[] = [];
  for (let cy = 0; cy < steps; cy++) {
    for (let cx = 0; cx < steps; cx++) cells.push({ cx, cy });
  }
  let next = 0;
  const work = () => {
    const budget = performance.now() + 18; // never own a whole frame
    while (next < cells.length && performance.now() < budget) {
      const { cx, cy } = cells[next++];
      out[cy][cx] = runPhaseCell({
        n: N,
        beta: PHASE_STEPS[cx],
        taxRate: PHASE_STEPS[cy],
        levyEvery: LEVY_EVERY,
        trades: TRADES,
        burnIn: BURN_IN,
        tailSamples: TAIL_SAMPLES,
        seed: 17 + cx * 101 + cy * 13,
      });
    }
    phaseStore.grid = out.map((r) => r.slice()); // paint as it fills
    if (next < cells.length) requestAnimationFrame(work);
  };
  requestAnimationFrame(work);
}

/** Grid value with NaN-tolerant bilinear sampling at (stakeFrac, taxFrac). */
export function sampleGrid(grid: number[][], sx: number, ty: number): number {
  const steps = PHASE_STEPS.length - 1;
  const fx = Math.min(steps - 1e-9, Math.max(0, sx * steps));
  const fy = Math.min(steps - 1e-9, Math.max(0, ty * steps));
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const dx = fx - x0;
  const dy = fy - y0;
  const corners = [
    { v: grid[y0][x0], w: (1 - dx) * (1 - dy) },
    { v: grid[y0][x0 + 1], w: dx * (1 - dy) },
    { v: grid[y0 + 1][x0], w: (1 - dx) * dy },
    { v: grid[y0 + 1][x0 + 1], w: dx * dy },
  ].filter((c) => !Number.isNaN(c.v));
  if (corners.length === 0) return NaN;
  const wSum = corners.reduce((a, c) => a + c.w, 0);
  if (wSum <= 0) return corners[0].v;
  return corners.reduce((a, c) => a + c.v * c.w, 0) / wSum;
}
