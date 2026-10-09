import { describe, expect, it } from 'vitest';
import { gravity } from './hops';
import { pairLayout } from './layout';
import { MORE_SPEED, OUT_SECONDS, ROUND_SECONDS, STAKE_SECONDS, planRounds, windowSeconds, windowTimes } from './roomRounds';

for (const [w, h] of [[1280, 800], [390, 844], [3840, 2160]]) {
  describe(`the room's demonstration rounds on a ${w}×${h} stage`, () => {
    const L = pairLayout(w, h);
    const setup = { positions: L.room.positions, radius: L.room.radius, box: L.room.box, blue: L.room.blue, red: L.room.red, unit: L.radius(1), g: gravity(L.whole) };
    const plan = planRounds(setup, 2);

    it('takes two different people each round, never Blue or Red, and no one twice', () => {
      const all = plan.flatMap((r) => [r.a, r.b]);
      expect(new Set(all).size).toBe(all.length);
      for (const i of all) expect([L.room.blue, L.room.red]).not.toContain(i);
      for (const r of plan) expect([r.a, r.b]).toContain(r.winner);
    });

    it('brings them out, tosses between them, and has them home within their round', () => {
      plan.forEach((r, k) => {
        expect(r.outA.at(-1)!.to.x).toBeCloseTo(r.spotA.x, 6);
        expect(r.outB.at(-1)!.to.x).toBeCloseTo(r.spotB.x, 6);
        expect(r.backA.at(-1)!.to.x).toBeCloseTo(L.room.positions[r.a].x, 6);
        expect(r.backB.at(-1)!.to.x).toBeCloseTo(L.room.positions[r.b].x, 6);
        expect(r.stake).toBeLessThan(r.flip);
        expect(r.landed).toBeLessThan(r.back);
        expect(r.end).toBeLessThanOrEqual((k + 1) * ROUND_SECONDS);
      });
    });

    it('plays the same rounds every time, and a longer plan begins with the same rounds', () => {
      expect(planRounds(setup, 2)).toEqual(plan);
      expect(planRounds(setup, 4).slice(0, 2)).toEqual(plan);
    });

    it('puts the stakes in and tosses at the same moments on every stage, so a step told over a part knows its length', () => {
      plan.forEach((r) => {
        expect(r.stake).toBeCloseTo(r.start + OUT_SECONDS, 9);
        expect(r.flip).toBeCloseTo(r.start + OUT_SECONDS + STAKE_SECONDS, 9);
      });
    });
  });
}

describe('the parts of the demonstration a step plays', () => {
  it('tells the first round in three parts that meet end to end', () => {
    const pick = windowTimes({ first: 0, count: 1, from: 'start', to: 'stake', speed: 1 });
    const stake = windowTimes({ first: 0, count: 1, from: 'stake', to: 'flip', speed: 1 });
    const flip = windowTimes({ first: 0, count: 1, from: 'flip', to: 'end', speed: 1 });
    expect(pick[0]).toBe(0);
    expect(stake[0]).toBe(pick[1]);
    expect(flip[0]).toBe(stake[1]);
    expect(flip[1]).toBe(ROUND_SECONDS);
  });

  it('plays the rounds after it whole, and quicker', () => {
    const more = { first: 1, count: 3, from: 'start', to: 'end', speed: MORE_SPEED } as const;
    expect(windowTimes(more)).toEqual([ROUND_SECONDS, 4 * ROUND_SECONDS]);
    expect(windowSeconds(more)).toBeCloseTo((3 * ROUND_SECONDS) / MORE_SPEED, 9);
  });
});
