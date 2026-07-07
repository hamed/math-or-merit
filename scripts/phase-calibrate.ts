/** Throwaway calibration for the phase-diagram ranges (M8). */
import { runPhaseCell } from '../src/lib/research/phase';

const N = 100;
const LEVY_EVERY = 100; // one "round" of the room
const TRADES = 200_000;

console.log('beta \\ tax : equilibrium gini');
const betas = [0.05, 0.1, 0.2, 0.3, 0.5];
const taxes = [0, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2];
for (const beta of betas) {
  const row = taxes.map((taxRate) =>
    runPhaseCell({ n: N, beta, taxRate, levyEvery: LEVY_EVERY, trades: TRADES, burnIn: 120_000, tailSamples: 8, seed: 11 })
      .toFixed(2),
  );
  console.log(beta.toFixed(2), row.join(' '));
}
