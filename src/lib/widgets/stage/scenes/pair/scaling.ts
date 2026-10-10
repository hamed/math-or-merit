/**
 * The stake scales time (owner, 2026-10-10: "stake time can be done before
 * levy"): rooms that differ only in their stake go the same way, at speeds
 * that go as the stake squared — half the stake, four times the trades. Three
 * stakes, each room's "players who still count" over its trades, averaged over
 * a few seeds; counted in trades × (stake / 10%)², the three fall on one curve.
 * Pure and seeded, so the scene draws it and the test holds it.
 */
import { applyYardSaleTrade, createRandomSource } from '$lib/sim';

export const SCALING_STAKES: readonly number[] = [0.2, 0.1, 0.05];
/** The stake time is counted against: the room's own. */
export const SCALING_REFERENCE = 0.1;

export interface ScalingCurve {
  readonly stake: number;
  /** Trades done at each sample. */
  readonly trades: readonly number[];
  /** How many still count (1 / Σ s²) at each sample, the mean over the seeds. */
  readonly players: readonly number[];
}

/** How many still count: 1 / Σ s². */
function players(w: Float64Array): number {
  let sum = 0;
  let squares = 0;
  for (let i = 0; i < w.length; i++) {
    sum += w[i];
    squares += w[i] * w[i];
  }
  return squares > 0 ? (sum * sum) / squares : 0;
}

/**
 * Each stake's room, sampled so both ways of counting time reach `span`: in
 * plain trades, and in trades scaled to the reference stake. `step` trades
 * between samples.
 */
export function scalingCurves(span: number, step: number, seeds: readonly number[] = [11, 12, 13], n = 100): ScalingCurve[] {
  return SCALING_STAKES.map((stake) => {
    const total = Math.ceil(span * Math.max(1, (SCALING_REFERENCE / stake) ** 2));
    const samples = Math.floor(total / step) + 1;
    const sum = new Float64Array(samples);
    for (const seed of seeds) {
      const random = createRandomSource(seed);
      const w = new Float64Array(n).fill(1 / n);
      sum[0] += players(w);
      for (let k = 1; k < samples; k++) {
        for (let t = 0; t < step; t++) {
          const a = Math.floor(random.next() * n);
          let b = Math.floor(random.next() * (n - 1));
          if (b >= a) b++;
          applyYardSaleTrade(w, a, b, stake, random.next() < 0.5);
        }
        sum[k] += players(w);
      }
    }
    return {
      stake,
      trades: Array.from({ length: samples }, (_, k) => k * step),
      players: Array.from(sum, (x) => x / seeds.length),
    };
  });
}

/** Trades counted at the reference stake: half the stake, a quarter of the time. */
export const scaledTrades = (trades: number, stake: number): number => trades * (stake / SCALING_REFERENCE) ** 2;
