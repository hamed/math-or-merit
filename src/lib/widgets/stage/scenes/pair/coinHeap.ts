/**
 * A coin split into many (owner, 2026-10-10): `n` equal coins with the same
 * total area as the one, in place, packed in a round heap — a little wider
 * than the coin it was, for the gaps between them. A sunflower spiral packs
 * them evenly and never lets two overlap.
 */
import type { Point } from '../../../shared/layout';

const GOLDEN = Math.PI * (3 - Math.sqrt(5));
/** Spiral spacing, in small radii: the closest any two come is just over a diameter. */
const SPACING = 1.25;

export interface Heap {
  /** Each small coin's radius: their areas add up to the big one's. */
  readonly r: number;
  readonly spots: readonly Point[];
  /** How far the heap reaches from its centre. */
  readonly reach: number;
}

export function coinHeap(n: number, bigR: number, at: Point): Heap {
  const r = bigR / Math.sqrt(n);
  const d = r * SPACING;
  const spots = Array.from({ length: n }, (_, k) => {
    const rho = d * Math.sqrt(k + 1);
    return { x: at.x + rho * Math.cos(k * GOLDEN), y: at.y + rho * Math.sin(k * GOLDEN) };
  });
  return { r, spots, reach: d * Math.sqrt(n) + r };
}
