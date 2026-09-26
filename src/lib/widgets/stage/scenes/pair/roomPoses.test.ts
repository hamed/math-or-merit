import { describe, expect, it } from 'vitest';
import { giniCoefficient } from '$lib/research';
import { line, piles, roundRuler, roundStep, ruler } from './roomPoses';

/** A room after a run: one giant, a few middling, the rest near nothing. */
function room(): number[] {
  const out = Array.from({ length: 100 }, (_, i) => (i < 60 ? 0.001 * (i + 1) : i < 95 ? 0.5 * (i - 59) : 40 * (i - 94)));
  out[42] = 9000;
  return out;
}
const BOX = { x: 50, y: 230, w: 1250, h: 500 };
const PHONE = { x: 16, y: 250, w: 358, h: 560 };

describe('an ordinary ruler with round ticks (brief 5.1)', () => {
  it('steps in amounts you can say: 1, 2, 2.5 or 5 times a power of ten', () => {
    for (const span of [7, 93, 480, 5200, 9600, 10_000, 31_000]) {
      const step = roundStep(span, 4);
      const m = step / 10 ** Math.floor(Math.log10(step));
      expect([1, 2, 2.5, 5, 10]).toContain(Math.round(m * 1000) / 1000);
    }
    expect(roundRuler(9600)).toEqual({ top: 10_000, step: 2500 });
  });

  it('labels $0, $2.5k, $5k, $7.5k, $10k for a room whose richest holds $9k', () => {
    const pose = piles(room(), BOX);
    const round = pose.ticks.filter((t) => t.key.startsWith('round-'));
    expect(round.map((t) => t.label)).toEqual(['$0', '$2.5k', '$5k', '$7.5k', '$10k']);
    expect(round.every((t) => t.shown)).toBe(true);
  });
});

for (const [name, box] of [['wide', BOX], ['phone', PHONE]] as const) {
  describe(`the piles on a ${name} stage`, () => {
    const amounts = room();
    const pose = piles(amounts, box);

    it('puts everyone in exactly one pile, and counts them', () => {
      expect(pose.piles.reduce((s, p) => s + p.count, 0)).toBe(100);
      expect(pose.spots).toHaveLength(100);
    });

    it('keeps everyone inside the room and above the ruler', () => {
      for (const p of pose.spots) {
        expect(p.x - pose.marker).toBeGreaterThanOrEqual(box.x - 1e-6);
        expect(p.x + pose.marker).toBeLessThanOrEqual(box.x + box.w + 1e-6);
        expect(p.y + pose.marker).toBeLessThanOrEqual(pose.axisY);
        expect(p.y - pose.marker).toBeGreaterThanOrEqual(box.y - 1e-6);
      }
    });

    it('never stacks two people on top of each other', () => {
      for (let i = 0; i < 100; i++)
        for (let j = i + 1; j < 100; j++)
          expect(Math.hypot(pose.spots[i].x - pose.spots[j].x, pose.spots[i].y - pose.spots[j].y)).toBeGreaterThan(pose.marker * 2 - 1e-6);
    });

    it('stands each pile inside its own stretch of the ruler', () => {
      for (let i = 0; i < 100; i++) {
        const pile = pose.piles[pose.pileOf[i]];
        expect(pose.spots[i].x).toBeGreaterThanOrEqual(pile.x0);
        expect(pose.spots[i].x).toBeLessThanOrEqual(pile.x1);
      }
    });
  });

  describe(`the multiplying ruler on a ${name} stage`, () => {
    const amounts = room();
    const pose = ruler(amounts, box);

    it('puts everything under a cent in the dust box', () => {
      expect(pose.dust.count).toBe(amounts.filter((a) => a < 0.01).length);
    });

    it('spreads the decades evenly: equal distance means ten times the money', () => {
      const marks = pose.ticks.filter((t) => t.key.startsWith('decade-') && Number.isFinite(t.x));
      const gaps = marks.slice(1).map((m, k) => m.x - marks[k].x);
      for (const g of gaps) expect(g).toBeCloseTo(gaps[0], 6);
    });

    it('keeps the same decade keys as the ordinary ruler, so the marks can slide', () => {
      const flat = piles(amounts, box).ticks.filter((t) => t.key.startsWith('decade-')).map((t) => t.key);
      expect(pose.ticks.filter((t) => t.key.startsWith('decade-')).map((t) => t.key)).toEqual(flat);
    });
  });

  describe(`everyone in a line on a ${name} stage`, () => {
    const amounts = room();
    const pose = line(amounts, box);

    it('stands the poorest first and the richest last', () => {
      const byX = Array.from({ length: 100 }, (_, i) => i).sort((a, b) => pose.spots[a].x - pose.spots[b].x);
      for (let k = 1; k < 100; k++) expect(amounts[byX[k]]).toBeGreaterThanOrEqual(amounts[byX[k - 1]]);
    });

    it('draws the running total from the bottom-left to the top-right, never above the diagonal', () => {
      const f = pose.frame;
      expect(pose.curve[0]).toEqual({ x: f.x, y: f.y + f.h });
      expect(pose.curve[100].x).toBeCloseTo(f.x + f.w, 6);
      expect(pose.curve[100].y).toBeCloseTo(f.y, 6);
      for (const p of pose.curve) {
        const diagonalY = f.y + f.h - ((p.x - f.x) / f.w) * f.h;
        expect(p.y).toBeGreaterThanOrEqual(diagonalY - 1e-6);
      }
    });

    it('has the gap between the diagonal and the curve say the Gini', () => {
      const f = pose.frame;
      let under = 0;
      for (let k = 1; k < pose.curve.length; k++) {
        const a = pose.curve[k - 1];
        const b = pose.curve[k];
        under += ((b.x - a.x) * (f.y + f.h - a.y + f.y + f.h - b.y)) / 2;
      }
      const triangle = (f.w * f.h) / 2;
      expect((triangle - under) / triangle).toBeCloseTo(giniCoefficient(amounts), 2);
    });
  });
}

describe("Scene 17's imagined rooms", async () => {
  const { effectiveCount, imaginedShares } = await import('./roomPoses');
  const who = { emptied: 3, given: 7, owner: 9, half: (i: number) => i < 50 };
  const count = (mode: 'equal' | 'zero' | 'double' | 'half' | 'one') => effectiveCount(imaginedShares(mode, 100, who));

  it('counts all hundred when everyone is equal', () => expect(count('equal')).toBeCloseTo(100, 9));
  it("drops to 99 when one has nothing — no money, you don't count", () => expect(count('zero')).toBeCloseTo(99, 9));
  it('drops a bit more when that money goes to one other', () => expect(count('double')).toBeCloseTo(98.039, 2));
  it('is 50 when half own it all equally', () => expect(count('half')).toBeCloseTo(50, 9));
  it('is 1 when one owns everything', () => expect(count('one')).toBeCloseTo(1, 9));
  it('matches the four-coin case exactly: four equal is 4, all to one is 1', () => {
    expect(effectiveCount([4, 4, 4, 4])).toBe(4);
    expect(effectiveCount([16, 0, 0, 0])).toBe(1);
    expect(effectiveCount([8, 8, 0, 0])).toBe(2);
  });
});

describe('the line keeps everyone\'s size, under a square plot', () => {
  const amounts = room();
  const radii = amounts.map((a) => 12 * Math.sqrt(a / 100));
  for (const [name, box, beside] of [
    ['wide', { x: 40, y: 100, w: 840, h: 640 }, true],
    ['phone', PHONE, false],
  ] as const) {
    const pose = line(amounts, box, radii, beside);

    it(`draws the Lorenz plot square, inside the room, on a ${name} stage`, () => {
      const f = pose.frame;
      expect(f.w).toBeCloseTo(f.h, 6);
      expect(f.w).toBeGreaterThan(Math.min(box.w, box.h) * 0.4);
      expect(f.x).toBeGreaterThanOrEqual(box.x);
      expect(f.x + f.w).toBeLessThanOrEqual(box.x + box.w);
      expect(f.y).toBeGreaterThanOrEqual(box.y);
      if (beside) expect(box.x + box.w - (f.x + f.w)).toBeGreaterThan(box.w * 0.3);
    });

    it(`stands everyone on the floor under the plot, at their own sizes scaled together, on a ${name} stage`, () => {
      const floor = box.y + box.h - 4;
      const k = pose.radii[0] / Math.max(0.6, radii[0]);
      for (let i = 0; i < 100; i++) {
        expect(pose.spots[i].y + pose.radii[i]).toBeCloseTo(floor, 6);
        expect(pose.radii[i] / Math.max(0.6, radii[i])).toBeCloseTo(k, 6);
        expect(pose.spots[i].y - pose.radii[i]).toBeGreaterThan(pose.labelY);
      }
      // side by side, no one on anyone, the poorest first
      for (let rank = 1; rank < 100; rank++) {
        const a = pose.order[rank - 1];
        const b = pose.order[rank];
        expect(pose.spots[b].x - pose.radii[b]).toBeGreaterThanOrEqual(pose.spots[a].x + pose.radii[a] - 1e-6);
      }
      expect(pose.order[99]).toBe(42);
      const last = pose.order[99];
      expect(pose.spots[last].x + pose.radii[last]).toBeLessThanOrEqual(pose.frame.x + pose.frame.w + 1);
    });
  }
});
