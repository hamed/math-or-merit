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
  /**
   * Said to the reader (or to nobody), not to the other one: it goes on the
   * speaker's OUTER side, close to him, and never into the middle where the two
   * talk to each other (owner review 2026-09-26).
   */
  readonly aside?: boolean;
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
  readonly edge: 'top' | 'bottom' | 'left' | 'right';
  /** Where it leaves that edge, px from the bubble's left (top, bottom) or top (left, right). */
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

/** A tail from the bubble's side edge nearest the speaker, pointing at the centre of his circle. */
export function tailBeside(box: { x: number; y: number; w: number; h: number }, anchor: Anchor, edge: 'left' | 'right'): Tail {
  const base = clamp(anchor.y - box.y, TAIL_HALF + 6, Math.max(TAIL_HALF + 6, box.h - TAIL_HALF - 6));
  const edgeX = edge === 'left' ? 0 : box.w;
  const d = Math.hypot(anchor.x - (box.x + edgeX), anchor.y - (box.y + base)) || 1;
  const ux = (anchor.x - (box.x + edgeX)) / d;
  const uy = (anchor.y - (box.y + base)) / d;
  return { edge, base, tip: { x: edgeX + ux * TAIL_LENGTH, y: base + uy * TAIL_LENGTH } };
}

/** A tail from the bottom corner nearest the speaker, pointing at the centre of his circle. */
export function tailAtCorner(box: { x: number; y: number; w: number; h: number }, anchor: Anchor, onLeftOfSpeaker: boolean): Tail {
  const inset = Math.min(TAIL_INSET, box.w / 2);
  const base = onLeftOfSpeaker ? box.w - inset : inset;
  const from = { x: box.x + base, y: box.y + box.h };
  const dist = Math.hypot(anchor.x - from.x, anchor.y - from.y) || 1;
  return { edge: 'bottom', base, tip: { x: base + ((anchor.x - from.x) / dist) * TAIL_LENGTH, y: box.h + ((anchor.y - from.y) / dist) * TAIL_LENGTH } };
}

/**
 * Lay the talk out. `items` in time order, oldest first.
 *
 * What the two say to each other runs down the middle column; only the newest
 * `keep` stay — the talk is context, not a transcript. What either says to the
 * reader stacks on his outer side, just above him, newest lowest; only the
 * newest `asides` per side stay.
 */
export function stackChat(items: readonly ChatItem[], column: Column, keep = Infinity, asides = 2, outer = true): Placed[] {
  const placed = new Array<Placed>(items.length);

  // the middle: the two, to each other, and what happened between them — and,
  // when the speakers are markers inside a picture, everything
  const talk = items.map((item, i) => ({ item, i })).filter(({ item }) => !outer || !item.aside || !item.anchor);
  const laid: { i: number; x: number; y: number; onLeft: boolean }[] = [];
  const span = talkSpan(items, column);
  let y = 0;
  for (const { item, i } of talk) {
    let x = column.mid - item.w / 2;
    let onLeft = true;
    if (item.anchor) {
      onLeft = item.anchor.x <= column.mid;
      // beside the two (owner review 2026-09-27): the talk runs between their
      // centres, each line flush with its own speaker's end
      if (outer && span) x = onLeft ? span.left : span.right - item.w;
      else x = onLeft ? column.mid - item.w * (1 - CROSS) : column.mid - item.w * CROSS;
    }
    x = Math.min(Math.max(x, column.left), Math.max(column.left, column.right - item.w));
    laid.push({ i, x, y, onLeft });
    y += item.h + BUBBLE_GAP + (item.anchor ? TAIL_LENGTH * 0.6 : 0);
  }
  if (laid.length) {
    const last = items[laid[laid.length - 1].i];
    const end = laid[laid.length - 1].y + last.h + (last.anchor ? TAIL_LENGTH : 0);
    const shift = column.bottom - end;
    laid.forEach((p, k) => {
      const item = items[p.i];
      const top = p.y + shift;
      const tail = item.anchor ? tailToward({ x: p.x, y: top, w: item.w, h: item.h }, item.anchor, p.onLeft) : null;
      const old = k < laid.length - keep;
      // an aside to the reader goes as soon as anyone says the next thing
      const passed = !!item.aside && p.i < items.length - 1;
      placed[p.i] = { x: p.x, y: top, gone: k < laid.length - 1 && (old || passed || top < column.top - 1), tail };
    });
  }

  // the outer sides: to the reader, beside whoever says it, at the height of
  // his circle and pointing at its centre (owner review 2026-09-27); above him
  // only when the stage has no room outside. An aside goes as soon as anyone
  // says the next thing.
  const taken: Box[] = laid.filter((p) => !placed[p.i].gone).map((p) => ({ x: p.x, y: placed[p.i].y, w: items[p.i].w, h: items[p.i].h }));
  for (const side of outer ? [true, false] : []) {
    const own = items
      .map((item, i) => ({ item, i }))
      .filter(({ item }) => item.aside && item.anchor && item.anchor.x <= column.mid === side);
    let bottom = Infinity;
    own
      .slice()
      .reverse()
      .forEach(({ item, i }, k) => {
        const a = item.anchor!;
        const reach = Math.max(a.r, 12);
        const passed = i < items.length - 1;
        let gone = k >= asides || passed;
        // up and outward at about 45° (owner review 2026-09-27): the corner
        // nearest the circle sits on that diagonal, the tail points at the centre
        const d = (reach + TAIL_LENGTH + 6) * Math.SQRT1_2;
        const cx = side ? a.x - d : a.x + d;
        const x45 = side ? cx - item.w : cx;
        const y45 = a.y - d - item.h;
        if (x45 >= column.left && x45 + item.w <= column.right && y45 >= column.top - 1) {
          const box: Box = { x: x45, y: y45, w: item.w, h: item.h };
          if (!gone) taken.push(box);
          placed[i] = { x: box.x, y: box.y, gone, tail: tailAtCorner(box, a, side) };
          return;
        }
        let x = side ? a.x + reach * 0.35 - item.w : a.x - reach * 0.35;
        x = Math.min(Math.max(x, column.left), Math.max(column.left, column.right - item.w));
        const floor = Math.min(bottom, a.y - reach - TAIL_LENGTH - 4);
        const box: Box = { x, y: floor - item.h, w: item.w, h: item.h };
        if (!gone) {
          const moved = { ...box };
          clear(moved, taken, side, column);
          // no room anywhere: the newest stays where it was said, older ones go
          if (moved.y >= column.top - 1) Object.assign(box, moved);
          else if (k > 0) gone = true;
        }
        bottom = box.y - BUBBLE_GAP;
        gone ||= box.y < column.top - 1 && k > 0;
        if (!gone) taken.push(box);
        placed[i] = { x: box.x, y: box.y, gone, tail: tailToward(box, a, !side) };
      });
  }
  return placed;
}

/**
 * Where the talk runs when it sits beside the two: from one centre to the
 * other, never narrower than a readable line, inside the column.
 */
export function talkSpan(items: readonly ChatItem[], column: Column): { left: number; right: number } | null {
  const xs = items.flatMap((item) => (item.anchor ? [item.anchor.x] : []));
  if (xs.length === 0) return null;
  // owner review 2026-09-27: the talk is two thirds of centre to centre, centred between them
  const lo = Math.min(...xs, column.mid);
  const hi = Math.max(...xs, column.mid);
  let left = lo + (hi - lo) / 6;
  let right = hi - (hi - lo) / 6;
  const least = Math.min(TALK_MIN, column.right - column.left);
  if (right - left < least) [left, right] = [column.mid - least / 2, column.mid + least / 2];
  left = Math.max(left, column.left);
  right = Math.min(right, column.right);
  return { left, right };
}

/** The talk is never narrower than this, even when the two stand close. */
export const TALK_MIN = 300;

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.w + BUBBLE_GAP / 2 && b.x < a.x + a.w + BUBBLE_GAP / 2 && a.y < b.y + b.h + BUBBLE_GAP / 2 && b.y < a.y + a.h + BUBBLE_GAP / 2;

/** Move `box` off everything in `taken`: outward (left when `left`), else up. */
function clear(box: Box, taken: readonly Box[], left: boolean, column: Column): void {
  for (let tries = 0; tries < 12; tries++) {
    const hit = taken.find((t) => overlaps(box, t));
    if (!hit) return;
    const outward = left ? hit.x - BUBBLE_GAP - box.w : hit.x + hit.w + BUBBLE_GAP;
    if (left ? outward >= column.left : outward + box.w <= column.right) box.x = outward;
    else box.y = hit.y - BUBBLE_GAP - box.h;
  }
}

/**
 * The drawn outline of a bubble, as an SVG path in the bubble's own px, tail
 * included. Seeded, so a bubble keeps the same wobble every time it is drawn.
 */
export function comicOutline(w: number, h: number, tail: Tail | null, seed: string, wobble = 1.4, roundness = 18): string {
  const rand = seeded(seed);
  const radius = Math.min(roundness, h / 2, w / 2);
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
  const side = (y0: number, y1: number, x: number, nx: number, which: 'left' | 'right') => {
    if (!tail || tail.edge !== which) return along(x, y0, x, y1, nx, 0);
    const down = y1 > y0;
    const before = tail.base + (down ? -TAIL_HALF : TAIL_HALF);
    const after = tail.base + (down ? TAIL_HALF : -TAIL_HALF);
    along(x, y0, x, before, nx, 0);
    points.push({ x, y: before, nx, ny: 0, sharp: true }, { x: tail.tip.x, y: tail.tip.y, nx: 0, ny: 0, sharp: true }, { x, y: after, nx, ny: 0, sharp: true });
    along(x, after, x, y1, nx, 0);
  };
  corner(radius, radius, Math.PI);
  edge(radius, w - radius, 0, -1, 'top');
  corner(w - radius, radius, -Math.PI / 2);
  side(radius, h - radius, w, 1, 'right');
  corner(w - radius, h - radius, 0);
  edge(w - radius, radius, h, 1, 'bottom');
  corner(radius, h - radius, Math.PI / 2);
  side(h - radius, radius, 0, -1, 'left');

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
