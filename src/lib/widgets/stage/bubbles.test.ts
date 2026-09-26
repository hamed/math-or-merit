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
  const items = [said(300, 50), said(280, 50, RED), said(200, 76), said(80, 30, null), said(260, 50, RED)];
  const placed = stackChat(items, COLUMN);

  it('reads in time order, top to bottom: every line starts below the end of the one before', () => {
    for (let i = 1; i < placed.length; i++) expect(placed[i].y).toBeGreaterThanOrEqual(placed[i - 1].y + items[i - 1].h);
  });

  it("leans each bubble to its speaker's side of one shared column", () => {
    expect(placed[0].x).toBe(COLUMN.left);
    expect(placed[1].x + 280).toBe(COLUMN.right);
  });

  it('sets a logged event in the middle, with no tail', () => {
    expect(placed[3].x + 40).toBeCloseTo((COLUMN.left + COLUMN.right) / 2, 9);
    expect(placed[3].tail).toBeNull();
  });

  it("puts the tail at the corner on the speaker's side, pointing outward", () => {
    const blue = placed[0].tail!;
    const red = placed[1].tail!;
    expect(blue.base).toBeLessThan(300 / 2);
    expect(blue.tip.x).toBeLessThan(blue.base);
    expect(red.base).toBeGreaterThan(280 / 2);
    expect(red.tip.x).toBeGreaterThan(red.base);
  });

  it('hangs the newest line just above the speakers', () => {
    const last = placed[placed.length - 1];
    expect(last.y + last.tail!.tip.y).toBeCloseTo(COLUMN.bottom, 6);
  });

  it('scrolls the oldest out of a full column, never the newest', () => {
    const many = Array.from({ length: 12 }, (_, i) => said(260, 60, i % 2 ? RED : BLUE));
    const laid = stackChat(many, COLUMN);
    expect(laid[laid.length - 1].gone).toBe(false);
    expect(laid[0].gone).toBe(true);
    for (const p of laid.filter((q) => !q.gone)) expect(p.y).toBeGreaterThanOrEqual(COLUMN.top - 1);
  });

  it('keeps the column on the stage and wide enough to lean in, on a phone too', () => {
    const phone = chatColumn([{ x: 117, y: 600, r: 70 }, { x: 273, y: 600, r: 20 }], 390, 80, 500);
    expect(phone.left).toBeGreaterThanOrEqual(16);
    expect(phone.right).toBeLessThanOrEqual(374);
    expect(phone.right - phone.left).toBeGreaterThan(340);
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
