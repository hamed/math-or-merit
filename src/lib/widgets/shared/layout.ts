export interface Point {
  readonly x: number;
  readonly y: number;
}

/** Deterministic hash noise in [-1, 1] so the room reads organic but stable. */
function noise(index: number, salt: number): number {
  let h = (index * 374761393 + salt * 668265263) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) / 0xffff_ffff) * 2 - 1;
}

/** Slightly jittered grid positions for n agents inside width × height. */
export function roomPositions(n: number, width: number, height: number, margin = 16): Point[] {
  const cols = Math.ceil(Math.sqrt((n * width) / height));
  const rows = Math.ceil(n / cols);
  const cellX = (width - 2 * margin) / cols;
  const cellY = (height - 2 * margin) / rows;
  const jitter = 0.16;
  const points: Point[] = [];
  for (let i = 0; i < n; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    points.push({
      x: margin + (col + 0.5 + noise(i, 1) * jitter) * cellX,
      y: margin + (row + 0.5 + noise(i, 2) * jitter) * cellY,
    });
  }
  return points;
}

/**
 * Scale factor k such that radius = k · √(wealthShare) keeps equal-start
 * circles comfortably inside their grid cells and a total winner inside the
 * room. Area stays proportional to wealth — the essay's honest encoding.
 */
export function radiusScale(n: number, width: number, height: number, margin = 16): number {
  const cols = Math.ceil(Math.sqrt((n * width) / height));
  const rows = Math.ceil(n / cols);
  const cell = Math.min((width - 2 * margin) / cols, (height - 2 * margin) / rows);
  return 0.34 * cell * Math.sqrt(n);
}
