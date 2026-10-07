import { describe, expect, it } from 'vitest';
import { DROPS, RAINED, START } from './crowd';
import { fallTime, gravity } from './hops';
import { pairLayout } from './layout';
import { GAP, REACH, planRain } from './rain';
import { RAIN_WAIT_MS } from './script';

for (const [w, h] of [[1366, 768], [390, 844], [1920, 1080]]) {
  describe(`the rain on a ${w}×${h} stage`, () => {
    const L = pairLayout(w, h);
    const g = gravity(L.whole);
    // the title's nine feet, along a title above the crowd
    const feet = Array.from({ length: 9 }, (_, k) => ({ x: w * (0.15 + 0.7 * (k / 8)), y: h * 0.32 }));
    const plan = planRain({ homes: L.crowdHomes, band: L.crowdBand, feet, radius: L.radius, g });

    it('gives every coin to its owner, so everyone ends with what crowd.ts says', () => {
      expect(plan.catches.map((c) => [c.who, c.count])).toEqual(DROPS.map((d) => [d.who, d.count]));
      const held = [...START];
      for (const c of plan.catches) held[c.who] += c.count;
      expect(held).toEqual([...RAINED]);
    });

    it('drops each coin straight down from its foot, falling from rest under g onto its catcher', () => {
      const held = [...START];
      // one coin from each foot
      expect(plan.catches.map((c) => c.foot.x).sort((a, b) => a - b)).toEqual(feet.map((f) => f.x));
      for (const c of plan.catches) {
        const r = L.radius(held[c.who]);
        expect(c.meet.x).toBe(c.foot.x);
        // the coin's line falls inside the body, and the coin lands on its outline
        expect(Math.abs(c.foot.x - c.spot.x)).toBeLessThanOrEqual(REACH * r + 1e-6);
        expect(Math.hypot(c.meet.x - c.spot.x, c.meet.y - c.spot.y)).toBeCloseTo(r, 6);
        expect(c.land - c.release).toBeCloseTo(fallTime(c.meet.y - c.foot.y, g), 9);
        expect(c.release).toBeGreaterThanOrEqual(0);
        held[c.who] += c.count;
      }
    });

    it('lands one coin at a time, a beat apart', () => {
      const lands = plan.catches.map((c) => c.land);
      for (let k = 1; k < lands.length; k++) expect(lands[k] - lands[k - 1]).toBeGreaterThanOrEqual(GAP - 1e-9);
    });

    it('never has anyone in two places at once: each move starts where the last one ended', () => {
      const moves = [
        ...plan.catches.map((c) => ({ who: c.who, from: c.from, to: c.spot, start: c.hops[0]?.start ?? c.land, end: c.land })),
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

    it("keeps everyone in the crowd's band", () => {
      const band = L.crowdBand;
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
