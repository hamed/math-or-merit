/**
 * What an act draws, as plain data in yard units (x, y the lower-left corner,
 * y up). The renderer only paints these; it knows no act.
 */
import type { Box, Line } from '../core/area.ts';

/** Several people's colours mixed by weight (a pile's): one object per mix, so a painter can cache it. */
export interface Blend {
  readonly of: readonly number[];
  readonly by: readonly number[];
}

/** A piece of money: one person's colour, or a blend (a pile's), turning toward its host's as it joins. */
export interface Piece {
  box: Box;
  alpha: number;
  colour: number;
  blend?: Blend;
  /** Colour it is turning toward (a docked piece takes its host's), and how far. */
  to?: number;
  turn?: number;
}

export interface Scene {
  /** Bodies drawn as another box for now (a slice cut away, a bar attached). */
  display: Map<number, Box>;
  pieces: Piece[];
  /** Cut lines and seams. */
  lines: (Line & { alpha: number })[];
  /** Outlines: dashed, or solid (a division), with a number in the corner if `label`. */
  frames: { box: Box; alpha: number; solid?: boolean; label?: string }[];
  /** Text: at (x, y), its top-left corner; `size` as a share of the default. */
  labels: { x: number; y: number; text: string; size?: number }[];
  /** A dial of diameter `size` about (x, y), its needle at `angle` (radians, y up). */
  spinners: { x: number; y: number; size: number; angle: number; alpha: number }[];
  /** Every body copied at an offset, inside `clip` (a print). */
  ghosts: { dx: number; dy: number; alpha: number }[];
  clip: Box | null;
  /** Who looks at whom for now: [i, j]. */
  looks: [number, number][];
}

export function emptyScene(): Scene {
  return { display: new Map(), pieces: [], lines: [], frames: [], labels: [], spinners: [], ghosts: [], clip: null, looks: [] };
}
