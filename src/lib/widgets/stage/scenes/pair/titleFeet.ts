/**
 * Where the title stands on its line (owner, 2026-10-07): "one [coin] from
 * each letter touchpoint with the horizontal line, from the characters that
 * have a flat bottom — two from M and h, one from r and i, none from e, o or a".
 *
 * A foot is a flat run of a glyph's lowest ink lying on the baseline: serif
 * feet and stems count; round bowls that only kiss the line do not. Measured
 * from the font as rendered, so it holds for any face and any language.
 */
import type { Point } from '../../../shared/layout';

/**
 * The feet in one glyph's bitmap (RGBA, `width` × `height`): the centres, in
 * px from its left, of runs of columns whose lowest ink sits on row
 * `baseline` (within `tolerance`) for at least `minRun` columns.
 */
export function feetIn(rgba: ArrayLike<number>, width: number, height: number, baseline: number, minRun: number, tolerance = 1.2): number[] {
  const out: number[] = [];
  let run = 0;
  let start = 0;
  for (let x = 0; x <= width; x++) {
    let onLine = false;
    if (x < width) {
      let low = -1;
      for (let y = height - 1; y >= 0; y--)
        if (rgba[(y * width + x) * 4 + 3] > 128) {
          low = y;
          break;
        }
      onLine = low >= 0 && Math.abs(low + 1 - baseline) <= tolerance;
    }
    if (onLine) {
      if (!run) start = x;
      run++;
    } else if (run) {
      if (run >= minRun) out.push(start + run / 2);
      run = 0;
    }
  }
  return out;
}

/** How finely glyphs are drawn to find their feet. */
const SCALE = 4;
/** A foot is at least this much of an em wide: a stem with its serif, never a bowl. */
const MIN_FOOT = 0.06;

/**
 * The title's feet on the page, relative to `origin` (the stage's top-left),
 * in reading order: every flat foot of every letter in `words` (each an
 * element holding one line of text). Empty if nothing can be measured.
 */
export function titleFeet(words: readonly HTMLElement[], origin: { left: number; top: number }, rtl: boolean): Point[] {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx || words.length === 0) return [];
  const feet: Point[] = [];
  // the line the title stands on: every word shares it
  const first = words[0];
  const style = getComputedStyle(first);
  ctx.font = style.font;
  const descent = ctx.measureText('M').fontBoundingBoxDescent;
  const baselineY = first.getBoundingClientRect().bottom - descent - origin.top;
  for (const word of words) {
    const text = word.firstChild;
    if (!text || text.nodeType !== Node.TEXT_NODE) continue;
    const font = getComputedStyle(word).font;
    const em = parseFloat(getComputedStyle(word).fontSize) || 16;
    const range = document.createRange();
    const content = text.textContent ?? '';
    for (let k = 0; k < content.length; k++) {
      const ch = content[k];
      if (!ch.trim()) continue;
      range.setStart(text, k);
      range.setEnd(text, k + 1);
      const box = range.getBoundingClientRect();
      if (!(box.width > 0)) continue;
      const w = Math.ceil(em * 2 * SCALE);
      const h = Math.ceil(em * 2 * SCALE);
      canvas.width = w;
      canvas.height = h;
      ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.font = font;
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#000';
      const left = em * 0.25;
      const base = em * 1.4;
      ctx.fillText(ch, left, base);
      const advance = ctx.measureText(ch).width;
      const runs = feetIn(ctx.getImageData(0, 0, w, h).data, w, h, Math.round(base * SCALE), MIN_FOOT * em * SCALE);
      for (const at of runs) {
        const frac = (at / SCALE - left) / advance;
        feet.push({ x: box.left + frac * box.width - origin.left, y: baselineY });
      }
    }
  }
  feet.sort((a, b) => (rtl ? b.x - a.x : a.x - b.x));
  return feet;
}
