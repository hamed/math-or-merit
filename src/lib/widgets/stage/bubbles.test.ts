import { describe, expect, it } from 'vitest';
import {
  bubbleLines,
  bubbleWords,
  chatColumn,
  comicOutline,
  shoutSegments,
  stackChat,
  type ChatItem,
  type Tail,
} from './bubbles';

const BLUE = { x: 450, y: 620, r: 100 };
const RED = { x: 916, y: 620, r: 30 };
const COLUMN = chatColumn([BLUE, RED], 1366, 100, 480);
const said = (w: number, h: number, anchor: typeof BLUE | null = BLUE): ChatItem => ({ w, h, anchor });

describe('the talk, as a chat window', () => {
  const items = [said(300, 50), said(300, 50, RED), said(200, 76), said(80, 30, null), said(260, 50, RED)];
  const placed = stackChat(items, COLUMN);

  it('reads in time order, top to bottom: every line starts below the end of the one before', () => {
    for (let i = 1; i < placed.length; i++) expect(placed[i].y).toBeGreaterThanOrEqual(placed[i - 1].y + items[i - 1].h);
  });

  it('leans each bubble to its speaker, reaching past the middle: two alike overlap by a third', () => {
    const blue = placed[0];
    const red = placed[1];
    expect(blue.x + 300 / 2).toBeLessThan(COLUMN.mid);
    expect(red.x + 300 / 2).toBeGreaterThan(COLUMN.mid);
    const overlap = blue.x + 300 - red.x;
    expect(overlap).toBeCloseTo(300 / 3, 6);
  });

  it('sets a logged event in the middle, with no tail', () => {
    expect(placed[3].x + 40).toBeCloseTo(COLUMN.mid, 9);
    expect(placed[3].tail).toBeNull();
  });

  it('points every tail at its speaker', () => {
    for (const [i, item] of items.entries()) {
      const p = placed[i];
      if (!item.anchor || !p.tail) continue;
      const base = { x: p.x + p.tail.base, y: p.y + (p.tail.edge === 'bottom' ? item.h : 0) };
      const tip = { x: p.x + p.tail.tip.x, y: p.y + p.tail.tip.y };
      const aim = { x: item.anchor.x - base.x, y: item.anchor.y - item.anchor.r - base.y };
      const dir = { x: tip.x - base.x, y: tip.y - base.y };
      const cos = (aim.x * dir.x + aim.y * dir.y) / (Math.hypot(aim.x, aim.y) * Math.hypot(dir.x, dir.y));
      expect(cos, `bubble ${i}`).toBeGreaterThan(0.9);
    }
  });

  it('hangs the newest line just above the speakers', () => {
    const last = placed[placed.length - 1];
    expect(last.y + 50 + 18).toBeCloseTo(COLUMN.bottom, 6);
  });

  it('scrolls the oldest out of a full column, never the newest', () => {
    const many = Array.from({ length: 12 }, (_, i) => said(260, 60, i % 2 ? RED : BLUE));
    const laid = stackChat(many, COLUMN);
    expect(laid[laid.length - 1].gone).toBe(false);
    expect(laid[0].gone).toBe(true);
    for (const p of laid.filter((q) => !q.gone)) expect(p.y).toBeGreaterThanOrEqual(COLUMN.top - 1);
  });

  it('keeps only the newest few when asked to', () => {
    const many = Array.from({ length: 6 }, (_, i) => said(200, 40, i % 2 ? RED : BLUE));
    const laid = stackChat(many, { ...COLUMN, top: -10_000 }, 4);
    expect(laid.map((p) => p.gone)).toEqual([true, true, false, false, false, false]);
  });

  it('keeps every bubble on the stage, on a phone too', () => {
    const phone = chatColumn([{ x: 117, y: 600, r: 70 }, { x: 273, y: 600, r: 20 }], 390, 80, 500);
    const laid = stackChat([{ w: 300, h: 50, anchor: { x: 117, y: 600, r: 70 } }, { w: 300, h: 50, anchor: { x: 273, y: 600, r: 20 } }], phone);
    for (const p of laid) {
      expect(p.x).toBeGreaterThanOrEqual(16);
      expect(p.x + 300).toBeLessThanOrEqual(374);
    }
  });
});

describe('the drawn outline', () => {
  const tail: Tail = { edge: 'bottom', base: 30, tip: { x: 19, y: 78 } };

  it('is a closed path that passes through the tail tip', () => {
    const d = comicOutline(260, 64, tail, 'merit.1b');
    expect(d.startsWith('M')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
    expect(d).toContain(`L${tail.tip.x.toFixed(1)} ${tail.tip.y.toFixed(1)}`);
  });

  it('draws a tailless line (a logged event) as a plain closed shape', () => {
    expect(comicOutline(120, 30, null, 'log')).not.toContain('L');
  });

  it('wobbles the same way every time for the same bubble, and differently for another', () => {
    expect(comicOutline(260, 64, tail, 'a')).toBe(comicOutline(260, 64, tail, 'a'));
    expect(comicOutline(260, 64, tail, 'a')).not.toBe(comicOutline(260, 64, tail, 'b'));
  });
});

describe('the words in a bubble', () => {
  it('splits a bubble into its lines', () => {
    expect(bubbleLines("I'm smart too. / I have a PhD in physics.")).toEqual(["I'm smart too.", 'I have a PhD in physics.']);
  });

  it('says **this** louder', () => {
    expect(shoutSegments('What if one does? **Very riiich.**')).toEqual([
      { text: 'What if one does? ', shout: false },
      { text: 'Very riiich.', shout: true },
    ]);
  });

  it('counts words, not markup', () => {
    expect(bubbleWords('What if one does? / **Very riiich.**')).toBe(6);
  });
});
