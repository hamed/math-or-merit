/**
 * Comic bubbles, as geometry (iteration-2 brief 3.1; owner review 2026-09-26).
 * Pure; no DOM.
 *
 * The talk reads like a chat window: one shared column, and the vertical axis
 * is time — every line sits below the one before it, newest lowest and nearest
 * the two speakers. Each bubble leans to its speaker's side of the column and
 * its tail leaves from the corner on that side. When the column is full the
 * oldest lines slide up and out. What happened (a coin that landed) is logged
 * in the same column, centred, as a line of its own.
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

export interface ChatItem {
  readonly w: number;
  readonly h: number;
  /** Who is speaking; null for a logged event, which sits centred. */
  readonly anchor: Anchor | null;
}

export interface Column {
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
  /** Scrolled out of the top of a full column. */
  readonly gone: boolean;
  readonly tail: Tail | null;
}

/** A reader's choice, set as a link inside the speaker's bubble (3.1). */
export interface BubbleChoice {
  readonly label: string;
  readonly act: () => void;
  /** A tiny picture beside the label: the radii of a few people. */
  readonly glyph?: readonly number[];
  /** The one the reader already picked. */
  readonly chosen?: boolean;
}

/** Space between one line and the next. */
export const BUBBLE_GAP = 8;
/** How far a tail reaches past its bubble. */
export const TAIL_LENGTH = 14;
const TAIL_HALF = 9;
/** Where a tail leaves its corner: this far in from the side. */
const TAIL_INSET = 30;

/** The column the talk lives in: over and around the two speakers, never wider than a comfortable read. */
export function chatColumn(anchors: readonly Anchor[], width: number, top: number, bottom: number): Column {
  const margin = 16;
  const xs = anchors.map((a) => a.x);
  let left = Math.max(margin, Math.min(...xs) - 170);
  let right = Math.min(width - margin, Math.max(...xs) + 170);
  const want = Math.min(560, width - 2 * margin);
  if (right - left < want) {
    const mid = (left + right) / 2;
    left = Math.max(margin, mid - want / 2);
    right = Math.min(width - margin, left + want);
    left = Math.max(margin, right - want);
  }
  return { top, bottom, left, right };
}

/** Lay the column out. `items` in time order, oldest first. */
export function stackChat(items: readonly ChatItem[], column: Column): Placed[] {
  const mid = (column.left + column.right) / 2;
  const laid: { x: number; y: number; tail: Tail | null }[] = [];
  let y = 0;
  for (const item of items) {
    let x = mid - item.w / 2;
    let tail: Tail | null = null;
    if (item.anchor) {
      const onLeft = item.anchor.x <= mid;
      x = onLeft ? column.left : column.right - item.w;
      const inset = Math.min(TAIL_INSET, item.w / 2);
      const base = onLeft ? inset : item.w - inset;
      tail = { edge: 'bottom', base, tip: { x: base + (onLeft ? -11 : 11), y: item.h + TAIL_LENGTH } };
    }
    laid.push({ x, y, tail });
    y += item.h + BUBBLE_GAP + (item.anchor ? TAIL_LENGTH * 0.6 : 0);
  }
  const lastItem = items[items.length - 1];
  const end = laid.length ? laid[laid.length - 1].y + lastItem.h + (lastItem.anchor ? TAIL_LENGTH : 0) : 0;
  const shift = column.bottom - end;
  return laid.map((p, i) => {
    const top = p.y + shift;
    return { x: p.x, y: top, gone: i < laid.length - 1 && top < column.top - 1, tail: p.tail };
  });
}

/**
 * The drawn outline of a bubble, as an SVG path in the bubble's own px, tail
 * included. Seeded, so a bubble keeps the same wobble every time it is drawn.
 */
export function comicOutline(w: number, h: number, tail: Tail | null, seed: string, wobble = 1.4): string {
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
    if (!tail) return [];
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
    if (!tail || tail.edge !== which) return along(x0, y, x1, y, 0, ny);
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
