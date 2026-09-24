/**
 * Reveal calibration — the distribution of the top share the reveal's reader
 * will actually see, at the shipped stake.
 *
 *   npx vite-node scripts/reveal-calibrate.ts
 *
 * Same protocol as the original REVEAL_BETA scan (presets.ts): 120 unseeded
 * runs, 100k trades, N = 100. The reveal is unseeded on purpose, so its claim
 * can only ever be distributional — this is where that distribution comes from.
 */
import { createEngine } from '../src/lib/sim';
import { REVEAL_BETA, REVEAL_TRADES, ROOM_N } from '../src/lib/widgets/shared/presets';

const RUNS = 120;
const quantile = (sorted: number[], q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];

for (const beta of [0.35, REVEAL_BETA]) {
  const tops: number[] = [];
  for (let run = 0; run < RUNS; run++) {
    const engine = createEngine({ n: ROOM_N, beta });
    engine.step(REVEAL_TRADES);
    let top = 0;
    for (let i = 0; i < ROOM_N; i++) top = Math.max(top, engine.state.wealth[i]);
    tops.push(top);
  }
  tops.sort((a, b) => a - b);
  const pct = (v: number) => `${(v * 100).toFixed(0)}%`;
  const overHalf = tops.filter((t) => t > 0.5).length;
  console.log(
    `beta ${beta}: median ${pct(quantile(tops, 0.5))}, p5 ${pct(quantile(tops, 0.05))}, ` +
      `p95 ${pct(quantile(tops, 0.95))}, min ${pct(tops[0])}, over half in ${overHalf}/${RUNS}`,
  );
}
