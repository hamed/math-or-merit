import { SandboxWorld } from '../sandbox/SandboxWorld';
import type { LoggedRun } from '../shared/roomRun';
import { START_DOLLARS } from '../shared/presets';

/** Replays a logged run so both its wealth and seeded random stream continue exactly. */
export function continuationWorld(run: LoggedRun, roundTrades: number): SandboxWorld {
  const world = new SandboxWorld({
    n: run.wealth.length,
    startDollars: START_DOLLARS,
    seed: run.seed,
  });
  world.beta = run.beta;
  world.tradesPerRound = roundTrades;
  world.step(run.trades);
  return world;
}
