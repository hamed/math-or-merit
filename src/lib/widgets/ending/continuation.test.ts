import { describe, expect, it } from 'vitest';
import { completedRoomRun } from '../shared/roomRun';
import { continuationWorld } from './continuation';

describe('time-lapse continuation', () => {
  it('reconstructs the logged room exactly before continuing its random stream', () => {
    const run = completedRoomRun(8421, 100_000, 100, 0.35);
    const world = continuationWorld(run, 1000);
    expect(Array.from(world.wealth)).toEqual(Array.from(run.wealth));
    expect(world.beta).toBe(run.beta);
    expect(world.trades).toBe(run.trades);

    const replay = continuationWorld(run, 1000);
    world.step(25_000);
    replay.step(25_000);
    expect(Array.from(world.wealth)).toEqual(Array.from(replay.wealth));
  });
});
