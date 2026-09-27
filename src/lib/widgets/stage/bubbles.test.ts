import { describe, expect, it } from 'vitest';
import {
  bubbleLines,
  bubbleWords,
  chatColumn,
  comicOutline,
  shoutSegments,
  stackChat,
  TALK_MIN,
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

  it('runs the talk over the middle two thirds of centre to centre, each line flush with its own side', () => {
    // owner review 2026-09-27: the talk is two thirds of centre to centre
    const third = (RED.x - BLUE.x) / 6;
    const left = BLUE.x + third;
    const right = RED.x - third;
    const width = Math.max(right - left, TALK_MIN);
    const mid = (BLUE.x + RED.x) / 2;
    expect(placed[0].x).toBeCloseTo(Math.min(left, mid - width / 2), 6);
    expect(placed[1].x + 300).toBeCloseTo(Math.max(right, mid + width / 2), 6);
  });

  it('keeps the talk readable when the two stand close: never narrower than a line', () => {
    const near = [{ x: 600, y: 620, r: 40 }, { x: 700, y: 620, r: 40 }];
    const laid = stackChat([said(280, 50, near[0]), said(280, 50, near[1])], chatColumn(near, 1366, 100, 480));
    expect(laid[1].x + 280 - laid[0].x).toBeGreaterThanOrEqual(TALK_MIN - 1e-6);
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

  it('puts what is said to the reader up and outward, about 45°, pointing at his centre', () => {
    const blueAside = stackChat([said(240, 50), { w: 200, h: 40, anchor: BLUE, aside: true }], COLUMN)[1];
    // above and to the left of Blue: its bottom-right corner on his upper-left diagonal
    const bx = BLUE.x - (blueAside.x + 200);
    const by = BLUE.y - (blueAside.y + 40);
    expect(bx).toBeGreaterThan(0);
    expect(by).toBeCloseTo(bx, 6);
    const redAside = stackChat([said(240, 50, RED), { w: 200, h: 40, anchor: RED, aside: true }], COLUMN)[1];
    expect(redAside.x - RED.x).toBeCloseTo(RED.y - (redAside.y + 40), 6);
    const base = { x: redAside.x + redAside.tail!.base, y: redAside.y + 40 };
    const tip = { x: redAside.x + redAside.tail!.tip.x, y: redAside.y + redAside.tail!.tip.y };
    const aim = { x: RED.x - base.x, y: RED.y - base.y };
    const dir = { x: tip.x - base.x, y: tip.y - base.y };
    expect((aim.x * dir.x + aim.y * dir.y) / (Math.hypot(aim.x, aim.y) * Math.hypot(dir.x, dir.y))).toBeGreaterThan(0.99);
  });

  it('moves an aside off the talk when there is room outside it, and never hides the newest', () => {
    const apart = (a: { x: number; y: number; w: number; h: number }, b: typeof a) =>
      a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
    // Red stands under the talk, but there is room to his outer side
    const blue = { x: 300, y: 560, r: 60 };
    const red = { x: 820, y: 470, r: 30 };
    const roomy = chatColumn([blue, red], 1366, 60, 440);
    const lines = [
      { w: 300, h: 60, anchor: blue },
      { w: 330, h: 80, anchor: red },
      { w: 220, h: 50, anchor: red, aside: true },
    ];
    const laid = stackChat(lines, roomy).map((p, i) => ({ ...p, ...lines[i] }));
    expect(laid.every((p) => !p.gone)).toBe(true);
    for (const talk of laid.slice(0, 2)) expect(apart(laid[2], talk)).toBe(true);
    // no room anywhere: the newest aside stays, even over the talk
    const tight = chatColumn([blue, red], 700, 300, 440);
    const crammed = stackChat([...lines.slice(0, 2), { w: 420, h: 90, anchor: red, aside: true }], tight);
    expect(crammed[2].gone).toBe(false);
  });

  it('keeps an aside through passing calls, until an aside or the talk says something', () => {
    const laid = stackChat([{ w: 150, h: 36, anchor: RED, aside: true }, { w: 90, h: 30, anchor: BLUE, aside: true, brief: true }], COLUMN);
    expect(laid[0].gone).toBe(false);
  });

  it('lets an aside go as soon as anyone says the next thing', () => {
    const asides = Array.from({ length: 4 }, () => ({ w: 150, h: 36, anchor: BLUE, aside: true }));
    expect(stackChat(asides, { ...COLUMN, top: -10_000 }).map((p) => p.gone)).toEqual([true, true, true, false]);
    const then = stackChat([{ w: 150, h: 36, anchor: BLUE, aside: true }, said(200, 40, RED)], COLUMN);
    expect(then.map((p) => p.gone)).toEqual([true, false]);
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
