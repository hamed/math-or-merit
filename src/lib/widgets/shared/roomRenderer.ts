/**
 * Pure canvas drawing for rooms of agents. No Svelte, no lifecycle — the
 * scenes, RoomCanvas, and the sandbox all draw through this so the agent
 * look (pastel fill, independent stroke, shape, winner ring) has one home.
 */
import type { AgentShape, AgentStyle } from './agentStyle';
import type { Point } from './layout';

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
  if (shape === 'triangle') {
    const side = Math.sqrt((4 * area) / Math.sqrt(3));
    const h = (side * Math.sqrt(3)) / 2;
    ctx.moveTo(x, y - (2 / 3) * h);
    ctx.lineTo(x + side / 2, y + h / 3);
    ctx.lineTo(x - side / 2, y + h / 3);
    ctx.closePath();
    return;
  }
  if (shape === 'pentagon') {
    // regular pentagon area = (5/2) R² sin(72°) ≈ 2.378 R²
    const rr = Math.sqrt(area / 2.378);
    for (let k = 0; k < 5; k++) {
      const a = ((Math.PI * 2) / 5) * k - Math.PI / 2;
      const px = x + rr * Math.cos(a);
      const py = y + rr * Math.sin(a);
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    return;
  }
  // hexagon
  const rr = Math.sqrt(area / 2.598);
  for (let k = 0; k < 6; k++) {
    const a = (Math.PI / 3) * k - Math.PI / 6;
    const px = x + rr * Math.cos(a);
    const py = y + rr * Math.sin(a);
    if (k === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/** Legacy single-family look, used when no per-agent styles are supplied. */
const DEFAULT_FILL = 'rgb(189 98 69 / 26%)';
const DEFAULT_STROKE = '#96543c';
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
      ctx.fillStyle = isWinner ? WINNER_FILL : DEFAULT_FILL;
      ctx.fill();
      ctx.strokeStyle = isWinner ? WINNER_STROKE : isHot ? HOT_STROKE : DEFAULT_STROKE;
      ctx.lineWidth = isWinner || isHot ? 2.2 : 1.2;
    }
    ctx.stroke();

    if (isWinner) {
      ctx.beginPath();
      ctx.arc(x, p.y, r + 5, 0, Math.PI * 2);
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
