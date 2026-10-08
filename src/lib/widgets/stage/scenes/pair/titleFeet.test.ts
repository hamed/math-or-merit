import { describe, expect, it } from 'vitest';
import { feetIn } from './titleFeet';

/** A glyph drawn at four times a 60 px em, as the scan sees it. */
const W = 240;
const H = 240;
const EM = 240;
/** The line every glyph here stands on: ink down to row 159, so its bottom edge is at 160. */
const BASE = 160;
const MIN = 0.06 * EM;

function glyph(ink: (x: number, y: number) => boolean): Uint8ClampedArray {
  const px = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (ink(x, y)) px[(y * W + x) * 4 + 3] = 255;
  return px;
}

describe('the feet of a glyph', () => {
  it('finds a stem standing on the line, with its serif', () => {
    // an "L": a stem and a flat foot
    const L = glyph((x, y) => (x >= 40 && x < 60 && y >= 20 && y < BASE) || (x >= 24 && x < 120 && y >= 140 && y < BASE));
    expect(feetIn(L, W, H, BASE, MIN)).toEqual([72]);
  });

  it('finds two feet on an "n", and none under a bowl that only crosses the line', () => {
    const n = glyph((x, y) => y >= 40 && y < BASE && ((x >= 32 && x < 56) || (x >= 120 && x < 144)));
    expect(feetIn(n, W, H, BASE, MIN)).toEqual([44, 132]);
    // a round letter dips a little below the line, as type does: its bottom crosses the line, never lies on it
    const o = glyph((x, y) => {
      const d = Math.hypot(x - 120, y - 104);
      return d <= 60 && d >= 40;
    });
    expect(feetIn(o, W, H, BASE, MIN)).toEqual([]);
  });

  it('does not count a stem that goes below the line', () => {
    // a "p": the stem descends past the baseline, so its lowest ink is not on it
    const p = glyph((x, y) => x >= 40 && x < 60 && y >= 40 && y < 220);
    expect(feetIn(p, W, H, BASE, MIN)).toEqual([]);
  });
});
