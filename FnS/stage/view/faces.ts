/**
 * Faces on the bodies, from the essay's own face engine
 * (src/lib/widgets/shared/face): its temperaments, its feelings and its
 * drawings. Nothing here draws a character; it only decides what each person
 * feels and where they look, and puts the engine's paths on a canvas.
 *
 *   wealth changes   → FaceField.react (felt on a log scale)
 *   bumps            → a small startle
 *   walking          → looks where it goes; standing → glances about
 *   in the air       → looks down at where it will land
 *
 * The engine draws SVG paths (FaceElement); this paints the same layers in
 * the same order with Path2D, so faces sit in the canvas's z-order.
 */
import { GROUND, WHITE, FacePainter, type FaceDrawing, type FaceMark } from '../essay/face/draw.ts';
import { faceRadius, type FaceLook } from '../essay/face/face.ts';
import { FaceField } from '../essay/face/field.ts';
import { temperament } from '../essay/face/moments.ts';
import type { AgentShape } from '../essay/agentStyle.ts';
import type { Stage } from '../core/stage.ts';

interface Paths {
  readonly transform: readonly [string, number[]][];
  readonly parts: Map<string, Path2D>;
}

export class Faces {
  readonly field: FaceField;
  private readonly painters: FacePainter[];
  private readonly seen: Float64Array;
  /** Face size relative to normal: a flinch shrinks it for a moment. Eased toward `scaleTo`. */
  readonly scale: Float64Array;
  readonly scaleTo: Float64Array;

  constructor(wealth: ArrayLike<number>, seed = 1) {
    const n = wealth.length;
    this.field = new FaceField(n, seed);
    for (let i = 0; i < n; i++) this.field.temper(i, temperament(i * 13 + 5 + seed * 7919));
    this.painters = Array.from({ length: n }, () => new FacePainter());
    this.seen = Float64Array.from(wealth);
    this.scale = new Float64Array(n).fill(1);
    this.scaleTo = new Float64Array(n).fill(1);
  }

  get n(): number {
    return this.field.n;
  }

  /** Feelings and looks for this frame. */
  update(dt: number, stage: Stage, wealth: ArrayLike<number>, looks: readonly (readonly [number, number])[] = []): void {
    const f = this.field;
    for (let i = 0; i < f.n; i++) {
      // a fortune felt once it has moved by a tenth of a percent, not every coin
      const before = this.seen[i];
      if (Math.abs(wealth[i] - before) > 1e-3 * before) {
        // what is seen happening is felt: a piece leaving, a piece arriving, the levy's beat
        f.react(i, before, wealth[i], FEEL);
        this.seen[i] = wealth[i];
      }
      const speed = Math.hypot(stage.vx[i], stage.vy[i]);
      if (stage.air[i] > 0) f.look(i, 0, 0.6);
      else if (speed > 0.05) f.look(i, (0.9 * stage.vx[i]) / speed, (-0.5 * stage.vy[i]) / speed);
      else f.glance(i);
    }
    // partners in a trade look at each other (+ yaw right, + pitch down on screen)
    for (const [i, j] of looks) {
      const dx = stage.x[j] + stage.w[j] / 2 - (stage.x[i] + stage.w[i] / 2);
      const dy = stage.y[j] + stage.h[j] / 2 - (stage.y[i] + stage.h[i] / 2);
      const d = Math.hypot(dx, dy) || 1;
      f.look(i, (0.9 * dx) / d, (-0.5 * dy) / d);
    }
    const ease = 1 - Math.exp(-dt / 0.12);
    for (let i = 0; i < f.n; i++) this.scale[i] += (this.scaleTo[i] - this.scale[i]) * ease;
    const b = stage.bumps;
    for (let k = 0; k + 1 < b.length; k += 2) {
      f.startle(b[k], 0.35);
      f.startle(b[k + 1], 0.35);
    }
    f.step(dt);
  }

  /**
   * Face `i` at (cx, cy) px on a body of `r` px (equal-area radius), `short`
   * px across its narrow side; `r0` is an equal share's radius in px.
   */
  /**
   * Something is about to be taken from face `i` (a levy): it flinches, and
   * feels the loss now, from `before` to `after` (worry, or anger in the
   * dominant: FaceField.react). The drawn wealth catching up later is not felt twice.
   */
  brace(i: number, before: number, after: number): void {
    this.field.react(i, before, after, FEEL);
    this.field.startle(i, 0.25);
    this.seen[i] = after;
    this.scaleTo[i] = 0.8;
  }

  /** Back to normal size. */
  relax(i: number): void {
    this.scaleTo[i] = 1;
  }

  draw(ctx: CanvasRenderingContext2D, i: number, look: FaceLook, shape: AgentShape, cx: number, cy: number, r: number, short: number, r0: number, pen: string, fill: string, now: number): void {
    const f = this.field;
    const s = Math.round(Math.min(faceRadius(r, r0), 0.45 * short) * this.scale[i] * 4) / 4;
    f.size(i, r, r0);
    f.still[i] = s < 7 ? 1 : 0;
    if (s < 4) return;
    const read = f.poseOf(i);
    const d = this.painters[i].paint(look, shape, Math.max(0.6, Math.min(r, short / Math.sqrt(Math.PI))), s, read.pose, read.marks, f.seed[i], now);
    if (d) paint(ctx, d, cx, cy, pen, fill);
  }
}

/** Reactions are amplified a little so small trades still show on a face. */
const FEEL = 2.5;

const cache = new WeakMap<FaceDrawing, Paths>();

function pathsOf(d: FaceDrawing): Paths {
  let p = cache.get(d);
  if (p) return p;
  const transform: [string, number[]][] = [];
  for (const m of d.transform.matchAll(/(translate|rotate|scale)\(([^)]*)\)/g)) {
    transform.push([m[1], m[2].trim().split(/[\s,]+/).map(Number)]);
  }
  const parts = new Map<string, Path2D>();
  for (const key of ['white', 'clip', 'clipped', 'ink', 'lid', 'rings', 'glint', 'lines', 'thin', 'heavy'] as const) {
    if (d[key]) parts.set(key, new Path2D(d[key]));
  }
  p = { transform, parts };
  cache.set(d, p);
  return p;
}

/** FaceElement's layers, in its order, on a canvas. */
function paint(ctx: CanvasRenderingContext2D, d: FaceDrawing, cx: number, cy: number, stroke: string, fill: string): void {
  const { transform, parts } = pathsOf(d);
  const pen = d.inked ? '#28251f' : stroke;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.save();
  for (const [op, v] of transform) {
    if (op === 'translate') ctx.translate(v[0] ?? 0, v[1] ?? 0);
    else if (op === 'rotate') ctx.rotate(((v[0] ?? 0) * Math.PI) / 180);
    else ctx.scale(v[0] ?? 1, v[1] ?? v[0] ?? 1);
  }
  marks(ctx, d.under, pen);
  const fillPart = (key: string, colour: string, alpha = 1) => {
    const p = parts.get(key);
    if (!p) return;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = colour;
    ctx.fill(p);
    ctx.globalAlpha = 1;
  };
  const strokePart = (key: string, width: number) => {
    const p = parts.get(key);
    if (!p) return;
    ctx.strokeStyle = pen;
    ctx.lineWidth = width;
    ctx.stroke(p);
  };
  fillPart('white', WHITE);
  const clip = parts.get('clip');
  if (clip && parts.has('clipped')) {
    ctx.save();
    ctx.clip(clip);
    fillPart('clipped', pen);
    ctx.restore();
  }
  fillPart('ink', pen);
  fillPart('lid', GROUND);
  fillPart('lid', fill, 0.9);
  strokePart('rings', d.lineWidth * 0.85);
  fillPart('glint', WHITE);
  strokePart('lines', d.lineWidth);
  strokePart('thin', d.lineWidth * 0.7);
  strokePart('heavy', d.lineWidth * 1.3);
  marks(ctx, d.over, pen);
  ctx.restore();
  marks(ctx, d.outer, pen);
  ctx.restore();
}

function marks(ctx: CanvasRenderingContext2D, list: readonly FaceMark[], pen: string): void {
  for (const m of list) {
    const p = new Path2D(m.d);
    ctx.globalAlpha = m.opacity;
    if (m.fill && m.fill !== 'none') {
      ctx.fillStyle = m.fill;
      ctx.fill(p);
    }
    if (m.stroke !== 'none' && m.width > 0) {
      ctx.strokeStyle = m.stroke || pen;
      ctx.lineWidth = m.width;
      ctx.stroke(p);
    }
    ctx.globalAlpha = 1;
  }
}
