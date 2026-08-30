import { createEngine } from '$lib/sim';
import { measureWealth } from '$lib/research';
import { ROOM_BETA, ROOM_N } from './presets';

export interface LoggedRun {
  readonly seed: number;
  readonly beta: number;
  readonly trades: number;
  readonly wealth: Float64Array;
  readonly winner: number;
  readonly topShare: number;
}

/** Run one seeded room to completion, synchronously (100k trades ≈ 1 ms). */
export function completedRoomRun(seed: number, trades: number, n = ROOM_N, beta = ROOM_BETA): LoggedRun {
  const engine = createEngine({ n, beta, seed });
  engine.step(trades);
  const wealth = Float64Array.from(engine.state.wealth);
  let winner = 0;
  for (let i = 1; i < wealth.length; i++) if (wealth[i] > wealth[winner]) winner = i;
  return { seed, beta, trades, wealth, winner, topShare: measureWealth(wealth).topShare };
}
