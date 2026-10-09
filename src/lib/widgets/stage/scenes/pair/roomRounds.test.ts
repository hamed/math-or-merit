import { describe, expect, it } from 'vitest';
import { gravity } from './hops';
import { pairLayout } from './layout';
import { ROUND_SECONDS, planRounds } from './roomRounds';

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

    it('plays the same rounds every time', () => {
      expect(planRounds(setup, 2)).toEqual(plan);
    });
  });
}
