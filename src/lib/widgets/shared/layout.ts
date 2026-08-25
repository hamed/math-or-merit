export interface Point {
  readonly x: number;
  readonly y: number;
}

/** Deterministic hash noise in [-1, 1] so the room reads organic but stable. */
export function noise(index: number, salt: number): number {
  let h = (index * 374761393 + salt * 668265263) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) / 0xffff_ffff) * 2 - 1;
}

/**
 * How far the widest agent shape reaches, relative to a circle of the SAME
 * area. Shapes are equal-area (the essay's honest encoding), so a triangle is
 * much wider than its circle: area = (√3/4)s² = πr² gives s = 2r√(π/√3), and
 * its circumradius is s/√3 ≈ 1.56r. Square ≈ 1.25r, pentagon ≈ 1.15r.
 *
 * The room's inset has to clear this or the outer shapes cross the canvas edge
 * and get clipped — which is exactly what happened to the first room.
 */
const SHAPE_REACH = 1.6;

/** Radius as a fraction of the cell, at equal wealth. */
const RADIUS_PER_CELL = 0.34;

/**
 * The grid both exported functions work from. They MUST agree: the sandbox
 * positions its winner halo with roomPositions and sizes it with radiusScale,
 * so a mismatch puts the halo somewhere the agent is not.
 *
 * An explicit `margin` is honoured; otherwise one is derived that fits the
 * widest shape a cell can hold. It is sized from an un-inset cell, which
 * slightly over-estimates and so stays safe.
 */
function roomGrid(n: number, width: number, height: number, margin?: number) {
  const cols = Math.ceil(Math.sqrt((n * width) / height));
  const rows = Math.ceil(n / cols);
  const inset =
    margin ?? RADIUS_PER_CELL * SHAPE_REACH * Math.min(width / cols, height / rows);
  const cellX = (width - 2 * inset) / cols;
  const cellY = (height - 2 * inset) / rows;
  return { cols, rows, inset, cellX, cellY, cell: Math.min(cellX, cellY) };
}

/**
 * Slightly jittered grid positions for n agents inside width × height.
 * Rows are balanced (each holds ⌈n/rows⌉ or ⌊n/rows⌋) and centered, so a
 * remainder never leaves a half-empty last row (owner review 2026-07-13).
 */
export function roomPositions(n: number, width: number, height: number, margin?: number): Point[] {
  // unmeasured canvases ask with width 0 — cols would be 0 and rows ∞
  if (!(n > 0) || !(width > 0) || !(height > 0)) return [];
  const { cols, rows, inset, cellX, cellY } = roomGrid(n, width, height, margin);
  const jitter = 0.16;
  const points: Point[] = [];
  let i = 0;
  for (let row = 0; row < rows; row++) {
    const inRow = Math.round(((row + 1) * n) / rows) - Math.round((row * n) / rows);
    const xStart = inset + ((cols - inRow) / 2) * cellX;
    for (let col = 0; col < inRow; col++, i++) {
      points.push({
        x: xStart + (col + 0.5 + noise(i, 1) * jitter) * cellX,
        y: inset + (row + 0.5 + noise(i, 2) * jitter) * cellY,
      });
    }
  }
  return points;
}

/** Where in the room a point sits, as prose — "the top-left corner". */
export function zoneName(x: number, y: number, width: number, height: number): string {
  const col = x < width / 3 ? 0 : x < (2 * width) / 3 ? 1 : 2;
  const row = y < height / 3 ? 0 : y < (2 * height) / 3 ? 1 : 2;
  return [
    ['top-left corner', 'top edge', 'top-right corner'],
    ['left wing', 'middle of the room', 'right wing'],
    ['bottom-left corner', 'bottom row', 'bottom-right corner'],
  ][row][col];
}

/**
 * Scale factor k such that radius = k · √(wealthShare) keeps equal-start
 * circles comfortably inside their grid cells and a total winner inside the
 * room. Area stays proportional to wealth — the essay's honest encoding.
 */
export function radiusScale(n: number, width: number, height: number, margin?: number): number {
  if (!(n > 0) || !(width > 0) || !(height > 0)) return 0;
  return RADIUS_PER_CELL * roomGrid(n, width, height, margin).cell * Math.sqrt(n);
}
