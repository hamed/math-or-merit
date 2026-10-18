/**
 * N_eff, counted: the folded photo (area Σw²) printed across the 1 × 1 box,
 * one copy at a time, row by row, each in its frame (the photo and a thin
 * empty band above it; `tile` chose the frames so they fill the box in whole
 * copies). Each frame is numbered as it lands; the count beside the box
 * steps 1, 2, 3, …, and a beat after the last it takes on the bands too:
 * N_eff, 6.5. Pure: the figure and the time since the photo was ready.
 */
import type { Figure } from '../core/figure.ts';
import type { Scene } from './scene.ts';

/** Seconds between two copies landing. */
export const PRINT_EVERY = 0.35;

export function prints(fig: Figure, elapsed: number, scene: Scene): void {
  const photo = fig.photo;
  if (!photo || !fig.clip || elapsed <= 0) return;
  // the photo itself is the first; its copies follow row by row, as a page is read from the bottom
  const copies = [{ dx: 0, dy: 0 }, ...[...fig.prints].sort((a, b) => a.dy - b.dy || a.dx - b.dx)];
  const clip = fig.clip;
  scene.clip = { x: clip.x0, y: clip.y0, w: clip.x1 - clip.x0, h: clip.y1 - clip.y0 };
  let landed = 0;
  copies.forEach(({ dx, dy }, c) => {
    const fade = Math.min(1, Math.max(0, (elapsed - c * PRINT_EVERY) / PRINT_EVERY));
    if (fade <= 0) return;
    if (fade >= 1) landed++;
    if (c > 0) scene.ghosts.push({ dx, dy, alpha: fade });
    scene.frames.push({ box: { x: clip.x0 + dx, y: clip.y0 + dy, w: photo.frameW, h: photo.frameH }, alpha: 0.75 * fade, solid: true, label: String(c + 1) });
  });
  if (landed === 0) return;
  // whole copies, one by one; a beat after the last, the empty bands too: N_eff
  const done = elapsed >= (copies.length + 1) * PRINT_EVERY;
  scene.labels.push({ x: clip.x1, y: clip.y1, text: done ? (1 / (photo.w * photo.h)).toFixed(1) : String(landed), size: 1.6 });
}
