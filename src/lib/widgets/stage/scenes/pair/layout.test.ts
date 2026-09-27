import { describe, expect, it } from 'vitest';
import { COIN_DENSITY, ROOM_ZOOM, deciderFace, pairLayout, pile, scatter } from './layout';
import { PACKINGS } from './packings';

describe('the pair stage layout', () => {
  for (const [w, h] of [[1280, 900], [390, 844], [1920, 1080], [844, 390]]) {
    it(`puts Blue under MERIT first and Red under MATH second, mirrored right-to-left — ${w}×${h}`, () => {
      const L = pairLayout(w, h);
      expect(L.markBlue.x).toBeLessThan(L.markRed.x);
      expect(L.seatBlue.x).toBeLessThan(L.seatRed.x);
      expect(L.room.positions[L.room.blue].x).toBeLessThan(L.room.positions[L.room.red].x);
      const R = pairLayout(w, h, 100, true);
      expect(R.markBlue.x).toBeGreaterThan(R.markRed.x);
      expect(R.seatBlue.x).toBeCloseTo(w - L.seatBlue.x, 9);
      expect(R.room.positions[R.room.blue].x).toBeGreaterThan(R.room.positions[R.room.red].x);
    });

    it(`fits the whole crowd on screen — ${w}×${h}`, () => {
      const L = pairLayout(w, h);
      const r = L.radius(1);
      for (const home of L.crowdHomes) {
        expect(home.x - r).toBeGreaterThanOrEqual(0);
        expect(home.x + r).toBeLessThanOrEqual(w);
        expect(home.y + r).toBeLessThanOrEqual(h);
      }
    });
  }

  it('draws area as wealth: sixteen coins make one whole fortune', () => {
    const L = pairLayout(1280, 900);
    expect(L.radius(16)).toBeCloseTo(L.whole, 9);
    expect(L.radius(4) / L.radius(16)).toBeCloseTo(0.5, 9);
  });

  it('never lets a protagonist vanish when poor', () => {
    expect(pairLayout(390, 844).minRadius).toBeGreaterThan(0);
  });
});

describe('a pile of coins inside its fortune', () => {
  const L = pairLayout(1280, 900);
  const r = L.coinRadius;

  it('holds exactly the coins it is given', () => {
    for (let n = 0; n <= 20; n++) expect(pile(n, r, L.radius(n))).toHaveLength(n);
  });

  it('gives every coin the same area, a little more than itself: circle area is coin count', () => {
    for (const n of [1, 4, 8, 15]) {
      expect((Math.PI * L.radius(n) ** 2 * COIN_DENSITY) / (Math.PI * r * r)).toBeCloseTo(n, 9);
    }
  });

  it('never spills over the edge of the circle', () => {
    for (let n = 1; n <= 16; n++) {
      const fit = L.radius(n);
      for (const c of pile(n, r, fit)) expect(Math.hypot(c.x, c.y) + r).toBeLessThanOrEqual(fit + r * 1e-4);
    }
  });

  it('packs the two made equal (8) and Blue at the start (15) edge to edge', () => {
    for (const n of [8, 15]) {
      const fit = L.radius(n);
      const reach = Math.max(...pile(n, r, fit).map((c) => Math.hypot(c.x, c.y) + r));
      expect(reach / fit).toBeGreaterThan(0.99);
    }
  });

  it('never lets two coins overlap where the circle has room for the packing', () => {
    for (const n of [7, 8, 12, 14, 16]) {
      const spots = pile(n, r, L.radius(n));
      for (let i = 0; i < n; i++)
        for (let j = i + 1; j < n; j++)
          expect(Math.hypot(spots[i].x - spots[j].x, spots[i].y - spots[j].y)).toBeGreaterThan(2 * r * (1 - 1e-4));
    }
  });

  it('comes out the same every time', () => {
    expect(pile(12, r, L.radius(12))).toEqual(pile(12, r, L.radius(12)));
  });
});

describe('the packing table', () => {
  // Packomania's best known radii for unit circles, n = 1…16
  const KNOWN = [1, 2, 2.1547, 2.41421, 2.7013, 3, 3, 3.30476, 3.61313, 3.81303, 3.9238, 4.0296, 4.23607, 4.32838, 4.52132, 4.61543];

  it('is within 0.2% of the best known packing for every count', () => {
    PACKINGS.forEach((p, i) => expect(p.radius / KNOWN[i]).toBeLessThan(1.002));
  });

  it('really is a packing: no overlaps, everything inside', () => {
    PACKINGS.forEach((p) => {
      for (const [x, y] of p.centres) expect(Math.hypot(x, y) + 1).toBeLessThanOrEqual(p.radius + 1e-4);
      p.centres.forEach(([x1, y1], i) =>
        p.centres.slice(i + 1).forEach(([x2, y2]) => expect(Math.hypot(x1 - x2, y1 - y2)).toBeGreaterThan(2 - 1e-4)),
      );
    });
  });
});

describe('the decider coin', () => {
  it('shows Marx (Red) at rest and the bank (Blue) half a turn later', () => {
    expect(deciderFace(0).side).toBe('red');
    expect(deciderFace(Math.PI).side).toBe('blue');
    expect(deciderFace(10 * Math.PI + Math.PI).side).toBe('blue');
  });

  it('changes face only when it is edge-on', () => {
    let previous = deciderFace(0).side;
    for (let a = 0; a < 12 * Math.PI; a += 0.001) {
      const face = deciderFace(a);
      if (face.side !== previous) expect(Math.abs(Math.cos(a))).toBeLessThan(0.002);
      previous = face.side;
    }
  });

  it('sits clear of the pair and on screen, wide or narrow', () => {
    for (const [w, h] of [[1366, 768], [390, 844]]) {
      const L = pairLayout(w, h);
      const r = L.radius(12);
      for (const seat of [L.seatBlue, L.seatRed]) expect(Math.hypot(L.flip.x - seat.x, L.flip.y - seat.y)).toBeGreaterThan(r + L.coinRadius * 1.6);
      expect(L.flip.y + L.coinRadius * 1.6).toBeLessThan(h);
    }
  });
});

describe('a crowd with no rows (brief 3.6)', () => {
  it('scatters every point in its box, no two too close, the same every time', () => {
    const box = { x: 10, y: 20, w: 400, h: 200 };
    const points = scatter(40, box, 30, 3);
    expect(points).toHaveLength(40);
    expect(scatter(40, box, 30, 3)).toEqual(points);
    for (const p of points) {
      expect(p.x).toBeGreaterThanOrEqual(10);
      expect(p.x).toBeLessThanOrEqual(410);
      expect(p.y).toBeGreaterThanOrEqual(20);
      expect(p.y).toBeLessThanOrEqual(220);
    }
    for (let i = 0; i < 40; i++)
      for (let j = i + 1; j < 40; j++) expect(Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y)).toBeGreaterThan(20);
  });

  it('never lines people up: almost no two share a row', () => {
    const L = pairLayout(1366, 768);
    const ys = L.room.positions.map((p) => p.y);
    let aligned = 0;
    for (let i = 0; i < ys.length; i++) for (let j = i + 1; j < ys.length; j++) if (Math.abs(ys[i] - ys[j]) < 0.5) aligned++;
    // chance alone puts ~18 of 4,950 pairs within half a pixel; ten rows of ten put ~450
    expect(aligned).toBeLessThan(60);
  });

  it('keeps the two in their places relative to each other as the room fills', () => {
    for (const [w, h] of [[1366, 768], [390, 844]]) {
      const L = pairLayout(w, h);
      const blue = L.room.positions[L.room.blue];
      const red = L.room.positions[L.room.red];
      expect(red.x - blue.x).toBeCloseTo((L.seatRed.x - L.seatBlue.x) * ROOM_ZOOM, 6);
      // in the middle of the room's own box, which leaves the charts their column
      expect((blue.x + red.x) / 2).toBeCloseTo(L.room.box.x + L.room.box.w / 2, 6);
      if (L.column) expect(L.room.box.x + L.room.box.w).toBeLessThan(L.column.x);
      expect(blue.y).toBeCloseTo(red.y, 9);
      for (const [i, p] of L.room.positions.entries()) {
        if (i === L.room.blue || i === L.room.red) continue;
        expect(Math.hypot(p.x - blue.x, p.y - blue.y)).toBeGreaterThan(L.room.radius * 1.5);
      }
    }
  });
});
