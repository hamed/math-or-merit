import { describe, expect, it } from 'vitest';
import { bubbleLines, bubbleWords, comicOutline, shoutSegments, stackBubbles, tailFor, type BubbleBox } from './bubbles';

const REGION = { top: 100, bottom: 500, left: 16, right: 1264 };
const BLUE = { x: 420, y: 620, r: 100 };
const RED = { x: 860, y: 620, r: 30 };
const box = (w: number, h: number, anchor = BLUE): BubbleBox => ({ w, h, anchor });

describe('a panel of bubbles', () => {
  it('reads top to bottom: every reply sits lower than the line before it', () => {
    const placed = stackBubbles([box(300, 50), box(280, 50, RED), box(200, 76), box(260, 50, RED)], REGION);
    for (let i = 1; i < placed.length; i++) expect(placed[i].y).toBeGreaterThan(placed[i - 1].y);
  });

  it('never lets two bubbles cover each other', () => {
    const boxes = [box(300, 50), box(280, 50, RED), box(200, 76), box(260, 50, RED), box(340, 76)];
    const placed = stackBubbles(boxes, REGION);
    for (let i = 0; i < placed.length; i++)
      for (let j = i + 1; j < placed.length; j++) {
        const a = { ...placed[i], ...boxes[i] };
        const b = { ...placed[j], ...boxes[j] };
        const apart = a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
        expect(apart, `${i} vs ${j}`).toBe(true);
      }
  });

  it('tucks a reply in beside the line it answers when the stage is wide enough', () => {
    const placed = stackBubbles([box(300, 76), box(280, 50, RED)], REGION);
    expect(placed[1].y).toBeLessThan(placed[0].y + 76);
  });

  it('stacks them when the stage is narrow', () => {
    const narrow = { top: 80, bottom: 600, left: 16, right: 374 };
    const placed = stackBubbles([box(300, 50, { x: 120, y: 700, r: 40 }), box(280, 50, { x: 270, y: 700, r: 20 })], narrow);
    expect(placed[1].y).toBeGreaterThanOrEqual(placed[0].y + 50);
  });

  it('keeps every bubble inside the stage sideways', () => {
    const placed = stackBubbles([box(300, 50, { x: 10, y: 600, r: 20 }), box(300, 50, { x: 1270, y: 600, r: 20 })], REGION);
    expect(placed[0].x).toBeGreaterThanOrEqual(REGION.left);
    expect(placed[1].x + 300).toBeLessThanOrEqual(REGION.right);
  });

  it('scrolls the oldest out of a full panel, never the newest', () => {
    const boxes = Array.from({ length: 9 }, (_, i) => box(900, 60, i % 2 ? RED : BLUE));
    const placed = stackBubbles(boxes, REGION);
    const newest = placed[placed.length - 1];
    expect(newest.gone).toBe(false);
    expect(newest.y + 60).toBeLessThanOrEqual(REGION.bottom);
    expect(placed[0].gone).toBe(true);
    for (const p of placed.filter((q) => !q.gone)) expect(p.y).toBeGreaterThanOrEqual(REGION.top - 1);
  });
});

describe('a tail', () => {
  it('leaves the edge nearest the speaker and leans toward him', () => {
    const above = tailFor({ x: 300, y: 200, w: 240, h: 60 }, BLUE);
    expect(above.edge).toBe('bottom');
    expect(above.tip.y).toBeGreaterThan(60);
    const under = tailFor({ x: 300, y: 700, w: 240, h: 60 }, BLUE);
    expect(under.edge).toBe('top');
    expect(under.tip.y).toBeLessThan(0);
  });
});

describe('the drawn outline', () => {
  const tail = tailFor({ x: 0, y: 0, w: 260, h: 64 }, { x: 120, y: 300, r: 40 });

  it('is a closed path that passes through the tail tip', () => {
    const d = comicOutline(260, 64, tail, 'merit.1b');
    expect(d.startsWith('M')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
    expect(d).toContain(`L${tail.tip.x.toFixed(1)} ${tail.tip.y.toFixed(1)}`);
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
