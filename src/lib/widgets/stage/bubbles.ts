/**
 * Comic bubbles, as geometry (iteration-2 brief 3.1). Pure; no DOM.
 *
 * Within a panel the bubbles pile up like one comic panel: reading order runs
 * top to bottom, each reply lower than the line before it, and a bubble only
 * has to clear the bubbles it would actually cover — on a wide stage Red's
 * answer tucks in beside Blue's line instead of under it. The pile hangs from
 * the speakers, newest lowest and nearest them; each new line lifts the older
 * ones, and when the panel is full the oldest slide up and out.
 *
 * The outline is drawn, not boxed: a rounded rectangle whose edge wobbles a
 * little, deterministically, with a real tail pointing at whoever speaks.
 */

export interface Anchor {
  /** The speaker's centre and radius, stage px. */
  readonly x: number;
  readonly y: number;
  readonly r: number;
}

export interface BubbleBox {
  readonly w: number;
  readonly h: number;
  readonly anchor: Anchor;
}

export interface Region {
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
}

export interface Tail {
  /** Which edge the tail leaves from. */
  readonly edge: 'top' | 'bottom';
  /** Where it leaves that edge, px from the bubble's left. */
  readonly base: number;
  /** Where it points, px from the bubble's top-left. */
  readonly tip: { readonly x: number; readonly y: number };
}

export interface Placed {
  readonly x: number;
  readonly y: number;
  /** Scrolled out of the top of a full panel. */
  readonly gone: boolean;
  readonly tail: Tail;
}

/** A reader's choice, set as a link inside the speaker's bubble (3.1). */
export interface BubbleChoice {
  readonly label: string;
  readonly act: () => void;
}

/** Space between bubbles that would otherwise touch. */
export const BUBBLE_GAP = 10;
/** A reply always sits at least this much lower than the line before it. */
export const READING_STEP = 14;
/** How far a tail reaches past its bubble. */
export const TAIL_LENGTH = 16;
const TAIL_HALF = 9;
const SIDE_MARGIN = 8;

/** Lay a panel out. `boxes` in reading order, oldest first. */
export function stackBubbles(boxes: readonly BubbleBox[], region: Region): Placed[] {
  const placed: { x: number; y: number; w: number; h: number }[] = [];
  for (const [i, box] of boxes.entries()) {
    const x = clamp(box.anchor.x - box.w / 2, region.left, Math.max(region.left, region.right - box.w));
    let y = region.top;
    if (i > 0) y = Math.max(y, placed[i - 1].y + READING_STEP);
    for (const other of placed) {
      const overlaps = x < other.x + other.w + SIDE_MARGIN && other.x < x + box.w + SIDE_MARGIN;
      if (overlaps) y = Math.max(y, other.y + other.h + BUBBLE_GAP);
    }
    placed.push({ x, y, w: box.w, h: box.h });
  }
  const lowest = Math.max(...placed.map((p) => p.y + p.h), region.top);
  const shift = lowest + TAIL_LENGTH - region.bottom;
  return placed.map((p, i) => {
    const y = p.y - shift;
    return {
      x: p.x,
      y,
      gone: i < placed.length - 1 && y < region.top - 1,
      tail: tailFor({ x: p.x, y, w: p.w, h: p.h }, boxes[i].anchor),
    };
  });
}

/** A short tail from the edge nearest the speaker, leaning toward him. */
export function tailFor(box: { x: number; y: number; w: number; h: number }, anchor: Anchor): Tail {
  const below = box.y > anchor.y;
  const edge = below ? 'top' : 'bottom';
  const base = clamp(anchor.x - box.x, 30, Math.max(30, box.w - 30));
  const edgeY = below ? 0 : box.h;
  const lean = clamp((anchor.x - box.x - base) * 0.35, -14, 14);
  return { edge, base, tip: { x: base + lean, y: edgeY + (below ? -TAIL_LENGTH : TAIL_LENGTH) } };
}

/**
 * The drawn outline of a bubble, as an SVG path in the bubble's own px, tail
 * included. Seeded, so a bubble keeps the same wobble every time it is drawn.
 */
export function comicOutline(w: number, h: number, tail: Tail, seed: string, wobble = 1.4): string {
  const rand = seeded(seed);
  const radius = Math.min(18, h / 2, w / 2);
  const points: { x: number; y: number; nx: number; ny: number; sharp?: boolean }[] = [];
  const along = (x0: number, y0: number, x1: number, y1: number, nx: number, ny: number) => {
    const length = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(1, Math.round(length / 26));
    for (let k = 0; k < n; k++) points.push({ x: x0 + ((x1 - x0) * k) / n, y: y0 + ((y1 - y0) * k) / n, nx, ny });
  };
  const corner = (cx: number, cy: number, from: number) => {
    for (let k = 0; k < 3; k++) {
      const a = from + (k * Math.PI) / 6;
      points.push({ x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius, nx: Math.cos(a), ny: Math.sin(a) });
    }
  };
  // clockwise from the top-left, tail spliced into its edge
  const tailPoints = (forward: boolean) => {
    const a = tail.base + (forward ? -TAIL_HALF : TAIL_HALF);
    const b = tail.base + (forward ? TAIL_HALF : -TAIL_HALF);
    const y = tail.edge === 'top' ? 0 : h;
    const ny = tail.edge === 'top' ? -1 : 1;
    return [
      { x: a, y, nx: 0, ny, sharp: true },
      { x: tail.tip.x, y: tail.tip.y, nx: 0, ny: 0, sharp: true },
      { x: b, y, nx: 0, ny, sharp: true },
    ];
  };
  const edge = (x0: number, x1: number, y: number, ny: number, which: 'top' | 'bottom') => {
    if (tail.edge !== which) return along(x0, y, x1, y, 0, ny);
    const forward = x1 > x0;
    const before = tail.base + (forward ? -TAIL_HALF : TAIL_HALF);
    const after = tail.base + (forward ? TAIL_HALF : -TAIL_HALF);
    along(x0, y, before, y, 0, ny);
    points.push(...tailPoints(forward));
    along(after, y, x1, y, 0, ny);
  };
  corner(radius, radius, Math.PI);
  edge(radius, w - radius, 0, -1, 'top');
  corner(w - radius, radius, -Math.PI / 2);
  along(w, radius, w, h - radius, 1, 0);
  corner(w - radius, h - radius, 0);
  edge(w - radius, radius, h, 1, 'bottom');
  corner(radius, h - radius, Math.PI / 2);
  along(0, h - radius, 0, radius, -1, 0);

  const wobbled = points.map((p) => {
    if (p.sharp) return p;
    const d = (rand() * 2 - 1) * wobble;
    return { ...p, x: p.x + p.nx * d, y: p.y + p.ny * d };
  });
  const f = (n: number) => n.toFixed(1);
  const mid = (a: { x: number; y: number }, b: { x: number; y: number }) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const start = mid(wobbled[wobbled.length - 1], wobbled[0]);
  let d = `M${f(start.x)} ${f(start.y)}`;
  for (let i = 0; i < wobbled.length; i++) {
    const p = wobbled[i];
    const next = wobbled[(i + 1) % wobbled.length];
    if (p.sharp) {
      d += ` L${f(p.x)} ${f(p.y)}`;
      continue;
    }
    const m = next.sharp ? next : mid(p, next);
    d += ` Q${f(p.x)} ${f(p.y)} ${f(m.x)} ${f(m.y)}`;
  }
  return d + ' Z';
}

/** `**shout**` segments of one line: said louder — bigger and heavier (3.1). */
export function shoutSegments(line: string): { text: string; shout: boolean }[] {
  return line
    .split('**')
    .map((text, i) => ({ text, shout: i % 2 === 1 }))
    .filter((segment) => segment.text.length > 0);
}

/** A bubble's lines: one sentence per line, ` / ` between them in prose.md. */
export function bubbleLines(text: string): string[] {
  return text.split(' / ').map((line) => line.trim()).filter(Boolean);
}

/** Words in a bubble, for reading time — markup excluded. */
export function bubbleWords(text: string): number {
  return text.replace(/\*\*/g, '').split(/[\s/]+/).filter(Boolean).length;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi);
}

function seeded(seed: string): () => number {
  let a = 2166136261;
  for (let i = 0; i < seed.length; i++) a = Math.imul(a ^ seed.charCodeAt(i), 16777619);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
