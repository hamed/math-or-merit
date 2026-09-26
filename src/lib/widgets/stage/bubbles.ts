/**
 * Comic bubbles, as geometry (iteration-2 brief 3.1; owner reviews 2026-09-26).
 * Pure; no DOM.
 *
 * The talk reads like a chat window: one shared column, and the vertical axis
 * is time — every line sits below the one before it, newest lowest and nearest
 * the two speakers. Each bubble leans to its speaker's side but reaches past
 * the middle: a Blue line and a Red line of the same width overlap by a third.
 * Its tail leaves the corner on the speaker's side and points AT him. When the
 * column is full the oldest lines slide up and out. What happened (a coin that
 * landed) is logged in the same column, centred, as a line of its own.
 *
 * The outline is drawn, not boxed: a rounded rectangle whose edge wobbles a
 * little, deterministically.
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
  /** How far any bubble may reach, sideways. */
  readonly left: number;
  readonly right: number;
  /** Where the two sides meet: halfway between the speakers. */
  readonly mid: number;
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
export const TAIL_LENGTH = 18;
/** How much of a bubble crosses the middle toward the other speaker's side. */
export const CROSS = 1 / 6;
const TAIL_HALF = 9;
/** Where a tail leaves its corner: this far in from the side. */
const TAIL_INSET = 30;

/** The column the talk lives in: the whole stage width, meeting halfway between the speakers. */
export function chatColumn(anchors: readonly Anchor[], width: number, top: number, bottom: number): Column {
  const margin = 16;
  const xs = anchors.map((a) => a.x);
  const between = (Math.min(...xs) + Math.max(...xs)) / 2;
  return { top, bottom, left: margin, right: width - margin, mid: Math.min(width - margin, Math.max(margin, between)) };
}

/** A tail from the bubble's corner on the speaker's side, pointing at the top of his circle. */
export function tailToward(box: { x: number; y: number; w: number; h: number }, anchor: Anchor, onLeft: boolean): Tail {
  const below = anchor.y - anchor.r < box.y;
  const inset = Math.min(TAIL_INSET, box.w / 2);
  const base = onLeft ? inset : box.w - inset;
  const edgeY = below ? 0 : box.h;
  const from = { x: box.x + base, y: box.y + edgeY };
  const to = { x: anchor.x, y: below ? anchor.y + anchor.r : anchor.y - anchor.r };
  const d = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  let ux = (to.x - from.x) / d;
  let uy = (to.y - from.y) / d;
  // never flatter than 25° from its edge, or the tail lies along the bubble
  const min = Math.sin((25 * Math.PI) / 180);
  if (Math.abs(uy) < min) {
    uy = below ? -min : min;
    ux = Math.sign(ux || (onLeft ? -1 : 1)) * Math.sqrt(1 - min * min);
  }
  return { edge: below ? 'top' : 'bottom', base, tip: { x: base + ux * TAIL_LENGTH, y: edgeY + uy * TAIL_LENGTH } };
}

/**
 * Lay the column out. `items` in time order, oldest first. Only the newest
 * `keep` stay: the talk is context, not a transcript (owner review 2026-09-26).
 */
export function stackChat(items: readonly ChatItem[], column: Column, keep = Infinity): Placed[] {
  const laid: { x: number; y: number; onLeft: boolean }[] = [];
  let y = 0;
  for (const item of items) {
    let x = column.mid - item.w / 2;
    let onLeft = true;
    if (item.anchor) {
      onLeft = item.anchor.x <= column.mid;
      x = onLeft ? column.mid - item.w * (1 - CROSS) : column.mid - item.w * CROSS;
    }
    x = Math.min(Math.max(x, column.left), Math.max(column.left, column.right - item.w));
    laid.push({ x, y, onLeft });
    y += item.h + BUBBLE_GAP + (item.anchor ? TAIL_LENGTH * 0.6 : 0);
  }
  const lastItem = items[items.length - 1];
  const end = laid.length ? laid[laid.length - 1].y + lastItem.h + (lastItem.anchor ? TAIL_LENGTH : 0) : 0;
  const shift = column.bottom - end;
  return laid.map((p, i) => {
    const top = p.y + shift;
    const item = items[i];
    const tail = item.anchor ? tailToward({ x: p.x, y: top, w: item.w, h: item.h }, item.anchor, p.onLeft) : null;
    const old = i < laid.length - keep;
    return { x: p.x, y: top, gone: i < laid.length - 1 && (old || top < column.top - 1), tail };
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
