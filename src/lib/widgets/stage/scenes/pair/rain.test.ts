import { describe, expect, it } from 'vitest';
import { DROPS, RAINED } from './crowd';
import { pairLayout } from './layout';
import { planRain, type Box } from './rain';
import { RAIN_WAIT_MS } from './script';

for (const [w, h] of [[1366, 768], [390, 844], [1920, 1080]]) {
  describe(`the rain on a ${w}×${h} stage`, () => {
    const L = pairLayout(w, h);
    const band: Box = { x: w * 0.06, y: h * 0.6, w: w * 0.88, h: h * 0.3 };
    const plan = planRain(L.crowdHomes, band, L.radius(1));

    it('gives every drop to its owner, so everyone ends with what crowd.ts says', () => {
      expect(plan.catches.map((c) => [c.who, c.count])).toEqual(DROPS.map((d) => [d.who, d.count]));
      const caught = new Array(RAINED.length).fill(0);
      for (const c of plan.catches) caught[c.who] += c.count;
      expect(caught).toEqual([...RAINED]);
    });

    it('never has anyone in two places at once: each move starts where the last one ended', () => {
      const moves = [
        ...plan.catches.map((c) => ({ who: c.who, from: c.from, to: c.spot, start: c.depart, end: c.land })),
        ...plan.chases.map((c) => ({ who: c.who, from: c.from, to: c.to, start: c.depart, end: c.arrive })),
      ].sort((a, b) => a.start - b.start);
      const at = L.crowdHomes.map((p) => ({ ...p }));
      const free = L.crowdHomes.map(() => 0);
      for (const m of moves) {
        expect(m.start).toBeGreaterThanOrEqual(free[m.who] - 1e-9);
        expect(m.from.x).toBeCloseTo(at[m.who].x, 6);
        expect(m.from.y).toBeCloseTo(at[m.who].y, 6);
        at[m.who] = m.to;
        free[m.who] = m.end;
      }
      expect(plan.finals.map((p) => [p.x, p.y])).toEqual(at.map((p) => [p.x, p.y]));
    });

    it('keeps everyone in the crowd\'s band', () => {
      for (const p of plan.finals) {
        expect(p.x).toBeGreaterThanOrEqual(band.x - 1e-9);
        expect(p.x).toBeLessThanOrEqual(band.x + band.w + 1e-9);
        expect(p.y).toBeGreaterThanOrEqual(band.y - 1e-9);
        expect(p.y).toBeLessThanOrEqual(band.y + band.h + 1e-9);
      }
    });

    it('is over within the step that plays it', () => {
      expect(plan.seconds * 1000).toBeLessThanOrEqual(RAIN_WAIT_MS);
    });
  });
}
