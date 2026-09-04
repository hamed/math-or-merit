import { GUIDED_OUTCOME_PROTOCOL, fitSquareRelationship, runOutcome } from '../src/lib/research';

// Reproduces the protocol-v2 ensemble convergence gate documented in
// notes/research/interventions.md. The first four seeds are nested in the eight-run set.

const betas = Array.from({ length: 10 }, (_, i) => 0.05 + i * 0.05);
const levies = Array.from({ length: 15 }, (_, i) => i * 0.01);
const target = GUIDED_OUTCOME_PROTOCOL.n / 2;
const seeds = Array.from({ length: 8 }, (_, i) => 0x9e3779b9 * (i + 1) >>> 0);

function gridFor(seedCount: number): number[][] {
  return levies.map((taxRate) => betas.map((beta) => {
    let sum = 0;
    for (const seed of seeds.slice(0, seedCount)) {
      sum += runOutcome({ ...GUIDED_OUTCOME_PROTOCOL, beta, taxRate, seed }).effectiveParticipants;
    }
    return sum / seedCount;
  }));
}

const four = gridFor(4);
const eight = gridFor(8);
const deltas = four.flatMap((row, iy) => row.map((value, ix) => Math.abs(value - eight[iy][ix])))
  .sort((a, b) => a - b);
const fitFour = fitSquareRelationship(four, betas, levies, target, 'increases');
const fitEight = fitSquareRelationship(eight, betas, levies, target, 'increases');

console.log(JSON.stringify({
  protocol: GUIDED_OUTCOME_PROTOCOL,
  target,
  seeds,
  medianAbsoluteCellChange: deltas[Math.floor(deltas.length / 2)],
  coefficientAtFour: fitFour?.c,
  coefficientAtEight: fitEight?.c,
  coefficientRelativeChange: fitFour && fitEight ? Math.abs(fitEight.c - fitFour.c) / fitFour.c : null,
  crossingsAtFour: fitFour?.crossings.length,
  crossingsAtEight: fitEight?.crossings.length,
}, null, 2));
