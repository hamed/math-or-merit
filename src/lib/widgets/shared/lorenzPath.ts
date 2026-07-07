/** Lorenz points → SVG path strings, shared by the Gini stage and the sandbox. */
import type { LorenzPoint } from '$lib/research';

export interface LorenzFrame {
  /** Plot origin (bottom-left corner) in view units. */
  readonly x: number;
  readonly y: number;
  readonly size: number;
}

/** Open polyline along the Lorenz curve, bottom-left to top-right. */
export function lorenzLinePath(points: readonly LorenzPoint[], frame: LorenzFrame): string {
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${(frame.x + p.populationShare * frame.size).toFixed(2)} ${(frame.y - p.wealthShare * frame.size).toFixed(2)}`)
    .join(' ');
}

/** Closed region between the equality diagonal and the Lorenz curve. */
export function lorenzGapPath(points: readonly LorenzPoint[], frame: LorenzFrame): string {
  const curve = points
    .slice()
    .reverse()
    .map((p) => `L ${(frame.x + p.populationShare * frame.size).toFixed(2)} ${(frame.y - p.wealthShare * frame.size).toFixed(2)}`)
    .join(' ');
  return `M ${frame.x} ${frame.y} L ${frame.x + frame.size} ${frame.y - frame.size} ${curve} Z`;
}
