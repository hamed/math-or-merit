/**
 * Pure canvas drawing for rooms of agents. No Svelte, no lifecycle — the
 * scenes, RoomCanvas, and the sandbox all draw through this so the agent
 * look (pastel fill, independent stroke, shape, winner ring) has one home.
 */
import { CLASSIC_AGENT_FILL, CLASSIC_AGENT_STROKE, type AgentShape, type AgentStyle } from './agentStyle';
import type { Point } from './layout';

/** Regular k-gon: circumradius factor (area = factor·R²) and rotation. */
export const POLYGONS: Partial<Record<AgentShape, { sides: number; factor: number; offset: number }>> = {
  pentagon: { sides: 5, factor: 2.378, offset: -Math.PI / 2 }, // (5/2)·sin 72°
  hexagon: { sides: 6, factor: 2.598, offset: -Math.PI / 6 },
  heptagon: { sides: 7, factor: 2.736, offset: -Math.PI / 2 },
  octagon: { sides: 8, factor: 2.828, offset: -Math.PI / 8 }, // flat top, like the sign
};

/** Trace an equal-area shape centered on (x, y); area = π·r². */
export function traceShape(
  ctx: CanvasRenderingContext2D,
  shape: AgentShape | null,
  x: number,
  y: number,
  r: number,
): void {
  ctx.beginPath();
  if (shape === null || shape === 'circle') {
    ctx.arc(x, y, r, 0, Math.PI * 2);
    return;
  }
  const area = Math.PI * r * r;
  if (shape === 'square') {
    const half = Math.sqrt(area) / 2;
    ctx.rect(x - half, y - half, half * 2, half * 2);
    return;
  }
  if (shape === 'triangle' || shape === 'triangleDown') {
    const side = Math.sqrt((4 * area) / Math.sqrt(3));
    const h = (side * Math.sqrt(3)) / 2;
    const flip = shape === 'triangleDown' ? -1 : 1;
    ctx.moveTo(x, y - flip * (2 / 3) * h);
    ctx.lineTo(x + side / 2, y + (flip * h) / 3);
    ctx.lineTo(x - side / 2, y + (flip * h) / 3);
    ctx.closePath();
    return;
  }
  const { sides, factor, offset } = POLYGONS[shape]!;
  const rr = Math.sqrt(area / factor);
  for (let k = 0; k < sides; k++) {
    const a = ((Math.PI * 2) / sides) * k + offset;
    const px = x + rr * Math.cos(a);
    const py = y + rr * Math.sin(a);
    if (k === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/** Legacy single-family look, used when no per-agent styles are supplied. */
const WINNER_FILL = 'rgb(139 63 43 / 45%)';
const WINNER_STROKE = '#4d271c';
const HOT_STROKE = '#2e2a23';
const DUST_FILL = 'rgb(110 85 62 / 60%)';

export interface DrawAgentsOptions {
  readonly positions: readonly Point[];
  /** Displayed wealth shares (post-easing), one per agent. */
  readonly displayed: ArrayLike<number>;
  /** Draw order, typically wealth-descending so small agents sit on top. */
  readonly order: readonly number[];
  /** radius = scale · √share. */
  readonly scale: number;
  readonly styles?: readonly AgentStyle[] | null;
  readonly winner?: number | null;
  readonly highlight?: ReadonlySet<number>;
  /** Pulse progress per agent in [0, 1) for the levy flinch. */
  readonly pulses?: ReadonlyMap<number, number>;
  /** Fill opacity for styled agents (pastels want ~0.75). */
  readonly fillAlpha?: number;
}

export function drawAgents(ctx: CanvasRenderingContext2D, opts: DrawAgentsOptions): void {
  const {
    positions,
    displayed,
    order,
    scale,
    styles = null,
    winner = null,
    highlight,
    pulses,
    fillAlpha = 0.75,
  } = opts;

  for (const i of order) {
    const p = positions[i];
    let x = p.x;
    const pulseT = pulses?.get(i) ?? -1;
    if (pulseT >= 0) {
      x += Math.sin(pulseT * 26) * 2.4 * (1 - pulseT);
    }
    const r = scale * Math.sqrt(Math.max(0, displayed[i]));
    if (r < 0.7) {
      ctx.fillStyle = DUST_FILL;
      ctx.fillRect(x - 0.7, p.y - 0.7, 1.4, 1.4);
      continue;
    }
    const isWinner = winner === i;
    const isHot = highlight?.has(i) ?? false;
    const style = styles ? styles[i] : null;

    traceShape(ctx, style ? style.shape : null, x, p.y, r);
    if (style) {
      ctx.globalAlpha = fillAlpha;
      ctx.fillStyle = style.fill;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = isHot ? HOT_STROKE : style.stroke;
      ctx.lineWidth = isWinner ? 2.6 : isHot ? 2.2 : 1.4;
    } else {
      ctx.fillStyle = isWinner ? WINNER_FILL : CLASSIC_AGENT_FILL;
      ctx.fill();
      ctx.strokeStyle = isWinner ? WINNER_STROKE : isHot ? HOT_STROKE : CLASSIC_AGENT_STROKE;
      ctx.lineWidth = isWinner || isHot ? 2.2 : 1.2;
    }
    ctx.stroke();

    if (isWinner) {
      // the halo wears the winner's own silhouette — a dashed pentagon for a
      // pentagon, never a generic circle
      traceShape(ctx, style ? style.shape : null, x, p.y, r + 5);
      ctx.setLineDash([4, 5]);
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = style ? style.stroke : 'rgb(77 39 28 / 65%)';
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (pulseT >= 0) {
      ctx.beginPath();
      ctx.arc(x, p.y, r + 4 + pulseT * 20, 0, Math.PI * 2);
      ctx.strokeStyle = `rgb(139 63 43 / ${(1 - pulseT) * 0.6})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}
