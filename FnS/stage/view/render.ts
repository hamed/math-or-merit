/**
 * The stage on a canvas: the yard, the 1 × 1 reference box, the bodies with
 * their faces, and (dev only) ticks. Nothing is labelled: charts are the
 * bodies' poses. Opacity shows density (resting area over drawn area): a
 * squeezed or shrunk body is darker, a stretched one paler.
 *
 * Bodies are drawn from shapes.outline, the same polygon picking and the area
 * readout use. Gait (bob and waddle) and hop height are drawn here; picking
 * adds the hop height too (Stage.lift).
 */
import { COLOR_NAMES, FILLS, STROKES, type AgentShape } from '../essay/agentStyle.ts';
import { emptyScene, type Blend, type Piece, type Scene } from '../acts/scene.ts';
import { prints } from '../acts/prints.ts';
import type { FaceLook } from '../essay/face/face.ts';
import type { Session } from '../console/session.ts';
import { HEX, RECT, TRI, areaOf, outline } from '../core/shapes.ts';
import { BOX, YARD } from '../core/figure.ts';
import { mix as mixColours } from '../core/area.ts';
import { Faces } from './faces.ts';

/** Canvas backing store cap, pixels: big screens at 2× stay cheap. */
const MAX_PIXELS = 4_000_000;
const PAD = 18;
/** Prints: a pause after the photo is ready (then one copy every PRINT_EVERY, acts/prints.ts). */
const PRINT_DELAY = 0.6;

export class StageView {
  readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private faces: Faces | null = null;
  private facesFor: unknown = null;
  /** Camera: world rectangle shown, eased. */
  private view = { x0: -0.05, y0: -0.05, x1: YARD + 0.05, y1: YARD + 0.05 };
  private scale = 1;
  private ox = 0;
  private oy = 0;
  private cssW = 1;
  private cssH = 1;
  private readonly poly: number[] = [];
  /** When the folded photo was last finished, for printing its copies one by one. */
  private readyAt = -1;
  private readyFigure: unknown = null;
  /** A short swell (arrival, absorption) or squash (a piece leaving) per body, decaying. */
  private pop = new Float64Array(0);
  private scene: Scene | null = null;
  /** A blend's colour, worked out once per blend. */
  private readonly blends = new WeakMap<Blend, string>();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is unavailable');
    this.ctx = ctx;
  }

  /** Screen (client) point to world. */
  toWorld(clientX: number, clientY: number): [number, number] {
    const rect = this.canvas.getBoundingClientRect();
    return [(clientX - rect.left - this.ox) / this.scale, -(clientY - rect.top - this.oy) / this.scale];
  }

  render(s: Session, dt: number, now: number): void {
    this.resize();
    const { ctx } = this;
    const stage = s.stage;
    const game = s.game;
    if (this.facesFor !== stage) {
      this.faces = new Faces(game.wealth, game.seed);
      this.facesFor = stage;
    }
    const faces = this.faces!;
    const scene = emptyScene();
    this.scene = scene;
    s.transit.draw(s.live, scene);
    this.prints(s, now, scene);
    // partners who have met face each other
    const pairs = s.pairs;
    if (pairs && pairs.length === stage.n) for (let p = 0; p + 1 < pairs.length; p += 2) this.scene.looks.push([pairs[p], pairs[p + 1]], [pairs[p + 1], pairs[p]]);
    faces.update(dt, stage, s.shown, this.scene.looks);
    if (this.pop.length !== stage.n) this.pop = new Float64Array(stage.n);
    const decay = Math.exp(-dt / 0.18);
    for (let i = 0; i < stage.n; i++) this.pop[i] *= decay;
    for (const e of s.transit.events) {
      // a trade's money landing swells its taker, leaving squashes its giver (a levy's go through the pot)
      if (e.kind === 'on' && e.holder >= 0 && e.other >= 0) this.pop[e.holder] = 1;
      else if (e.kind === 'off' && e.holder >= 0 && e.other >= 0) this.pop[e.holder] = -0.6;
      else if (e.kind === 'brace') {
        // everyone flinches before the levy is cut: worry, or anger in the dominant
        for (let j = 0; j < stage.n; j++) faces.brace(j, s.shown[j], s.shown[j] - e.pays[j]);
      } else if (e.kind === 'relax') {
        for (let j = 0; j < stage.n; j++) faces.relax(j);
        this.pop.fill(0.7);
      }
    }
    this.camera(s, dt);

    const css = getComputedStyle(this.canvas);
    const paper = css.getPropertyValue('--paper').trim() || '#f4efe4';
    const floor = css.getPropertyValue('--floor').trim() || '#fbf8f1';
    const wall = css.getPropertyValue('--wall').trim() || '#5b5547';
    const faint = css.getPropertyValue('--faint').trim() || '#b9b09c';
    const dpr = this.canvas.width / this.cssW;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, this.cssW, this.cssH);

    // the yard and its walls
    const { right, top } = stage.walls;
    const [ax, ay] = this.px(0, 0);
    const [bx, by] = this.px(right, top);
    ctx.fillStyle = floor;
    ctx.fillRect(ax, by, bx - ax, ay - by);
    ctx.strokeStyle = wall;
    ctx.lineWidth = 3;
    ctx.strokeRect(ax - 1.5, by - 1.5, bx - ax + 3, ay - by + 3);
    // the reference box: area 1, all the wealth there is, in the middle of the yard
    const [qx, qy] = this.px(BOX, BOX);
    const [rx, ry] = this.px(BOX + 1, BOX + 1);
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = faint;
    ctx.lineWidth = 1;
    ctx.strokeRect(qx, ry, rx - qx, qy - ry);
    ctx.setLineDash([]);
    if (s.axes) this.ticks(right, top, faint);

    // printed copies under everyone; frames and counts over everyone (the photo's own too)
    this.ghosts(s, scene);

    const look: FaceLook | null = s.look === 'off' ? null : s.look;
    const n = stage.n;
    const r0 = Math.sqrt(1 / n / Math.PI) * this.scale;
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < n; i++) {
        const flying = stage.air[i] > 0;
        if (flying !== (pass === 1)) continue;
        this.body(s, i, faces, look, r0, now);
      }
      if (pass === 0) this.drawScene(scene);
    }
    this.overlay(scene);
  }

  /**
   * What the acts draw (acts/scene.ts): pieces of money, then divisions, cut
   * lines and seams, and spinners on top.
   */
  private drawScene(scene: Scene): void {
    const { ctx } = this;
    ctx.save();
    for (const p of scene.pieces) this.piece(p);
    ctx.lineCap = 'round';
    for (const o of scene.frames) {
      if (o.label !== undefined) continue;
      const [x, y] = this.px(o.box.x, o.box.y + o.box.h);
      const w = o.box.w * this.scale;
      const h = o.box.h * this.scale;
      if (!sane(x, y, w, h)) continue;
      ctx.globalAlpha = 0.85 * o.alpha;
      ctx.strokeStyle = '#28251f';
      ctx.lineWidth = 1;
      ctx.setLineDash(o.solid ? [] : [3, 2]);
      ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(w) - 1, Math.round(h) - 1);
    }
    ctx.setLineDash([]);
    for (const l of scene.lines) {
      if (l.alpha <= 0.01) continue;
      const [x0, y0] = this.px(l.x0, l.y0);
      const [x1, y1] = this.px(l.x1, l.y1);
      if (!sane(x0, y0, x1, y1)) continue;
      ctx.globalAlpha = 0.9 * l.alpha;
      ctx.strokeStyle = '#28251f';
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
    // a toss's spinner: a faint dial, a needle with a head, a pin
    for (const sp of scene.spinners) {
      if (sp.alpha <= 0.01) continue;
      const [x, y] = this.px(sp.x, sp.y);
      const r = (sp.size / 2) * this.scale;
      if (!sane(x, y, r)) continue;
      ctx.globalAlpha = sp.alpha;
      ctx.fillStyle = 'rgba(40, 37, 31, 0.07)';
      ctx.strokeStyle = 'rgba(40, 37, 31, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      // canvas y runs down
      const dx = Math.cos(sp.angle);
      const dy = -Math.sin(sp.angle);
      const head = 0.32 * r;
      const tip: [number, number] = [x + dx * 0.88 * r, y + dy * 0.88 * r];
      const neck: [number, number] = [tip[0] - dx * head, tip[1] - dy * head];
      ctx.strokeStyle = '#28251f';
      ctx.fillStyle = '#28251f';
      ctx.lineWidth = Math.max(1.5, 0.09 * r);
      ctx.beginPath();
      ctx.moveTo(x - dx * 0.5 * r, y - dy * 0.5 * r);
      ctx.lineTo(neck[0], neck[1]);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(tip[0], tip[1]);
      ctx.lineTo(neck[0] - dy * head * 0.55, neck[1] + dx * head * 0.55);
      ctx.lineTo(neck[0] + dy * head * 0.55, neck[1] - dx * head * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1.5, 0.08 * r), 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.restore();
  }

  /** A blend's colour as '#rrggbb': its people's fills mixed by weight. */
  private blendOf(b: Blend): string {
    let c = this.blends.get(b);
    if (c) return c;
    const rgb = (f: string) => [1, 3, 5].map((k) => parseInt(f.slice(k, k + 2), 16)) as [number, number, number];
    const h = (v: number) => Math.round(v).toString(16).padStart(2, '0');
    c = `#${mixColours(b.of.map((i) => rgb(FILLS[colourOf(i)])), b.by).map(h).join('')}`;
    this.blends.set(b, c);
    return c;
  }

  /** A piece of money: one colour, or a blend, turning toward its host's as it joins. */
  private piece(p: Piece): void {
    const { ctx } = this;
    const [x, y] = this.px(p.box.x, p.box.y + p.box.h);
    const w = Math.max(1, p.box.w * this.scale);
    const h = Math.max(1, p.box.h * this.scale);
    if (!sane(x, y, w, h)) return;
    ctx.globalAlpha = p.alpha;
    if (p.blend) {
      const own = this.blendOf(p.blend);
      ctx.fillStyle = p.to !== undefined && p.turn ? mix(own, FILLS[colourOf(p.to)], p.turn) : own;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#5b5547';
    } else {
      const from = FILLS[colourOf(p.colour)];
      ctx.fillStyle = p.to !== undefined && p.turn ? mix(from, FILLS[colourOf(p.to)], p.turn) : from;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = STROKES[colourOf(p.to !== undefined && (p.turn ?? 0) > 0.5 ? p.to : p.colour)];
    }
    ctx.globalAlpha = Math.min(1, p.alpha + 0.05);
    ctx.lineWidth = 0.75;
    ctx.strokeRect(x, y, w, h);
    ctx.globalAlpha = 1;
  }

  private body(s: Session, i: number, faces: Faces, look: FaceLook | null, r0: number, now: number): void {
    const { ctx } = this;
    const st = s.stage;
    // a body in a beat (a slice cut away, a bar attached) is drawn as the beat has it
    const shown = this.scene?.display.get(i);
    const x = shown ? shown.x : st.x[i];
    const w = shown ? shown.w : st.w[i];
    const h = shown ? shown.h : st.h[i];
    const lift = st.lift(i);
    const y = shown ? shown.y : st.y[i] + lift;
    const k = shown ? RECT : st.kind[i];
    const colour = colourOf(i);
    const fill = FILLS[colour];
    const pen = STROKES[colour];
    const wpx = w * this.scale;
    const hpx = h * this.scale;
    if (wpx < 0.05 && hpx < 0.05) return;
    if (!sane(x * this.scale, y * this.scale, wpx, hpx)) return;

    // gait: a bob and a waddle while walking, nothing while standing
    const speed = Math.hypot(st.vx[i], st.vy[i]);
    // only a real walk shows a gait: drifting into place does not waddle
    const walking = Math.min(1, Math.max(0, (speed - 0.08) / 0.2)) * (lift > 0 ? 0 : 1);
    const phase = (st.stride[i] / Math.max(0.02, 0.9 * Math.max(w, h))) * Math.PI * 2;
    const bob = walking * Math.abs(Math.sin(phase)) * 0.05 * Math.min(w, h);
    const tilt = walking * Math.sin(phase) * 0.04;

    if (lift > 0) {
      // the shadow stays on the ground
      const [sx, sy] = this.px(x + w / 2, st.y[i]);
      ctx.fillStyle = 'rgba(40, 37, 31, 0.16)';
      ctx.beginPath();
      ctx.ellipse(sx, sy, Math.max(1, wpx * 0.45), Math.max(0.6, Math.min(wpx, hpx) * 0.12), 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const [cx, cy] = this.px(x + w / 2, y + h / 2 + bob);
    ctx.save();
    ctx.translate(cx, cy);
    if (tilt) ctx.rotate(tilt);
    const swell = 1 + 0.07 * (this.pop[i] ?? 0);
    if (swell !== 1) ctx.scale(swell, swell);
    const n = outline(k, -w / 2, -h / 2, w, h, this.poly);
    ctx.beginPath();
    for (let v = 0; v < n; v++) {
      const px = this.poly[2 * v] * this.scale;
      const py = -this.poly[2 * v + 1] * this.scale;
      if (v === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    // density shows as opacity: 1 at rest
    const rho = st.density(i);
    ctx.globalAlpha = Math.min(1, Math.max(0.12, 0.82 * rho ** 0.4));
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.globalAlpha = 1;
    if (Math.min(wpx, hpx) > 1.2) {
      ctx.strokeStyle = pen;
      ctx.lineWidth = i === s.selected ? 2.5 : Math.min(1.25, 0.25 * Math.min(wpx, hpx));
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
    ctx.restore();

    if (!look) return;
    const shape: AgentShape = k === TRI ? 'triangle' : k === HEX ? 'hexagon' : 'square';
    // a triangle's face sits at its centroid, a third of the way up
    const fy = k === TRI ? y + h / 3 + bob : y + h / 2 + bob;
    const [fx, fpy] = this.px(x + w / 2, fy);
    const r = Math.sqrt(areaOf(k, w, h) / Math.PI) * this.scale;
    ctx.save();
    if (tilt) {
      ctx.translate(cx, cy);
      ctx.rotate(tilt);
      ctx.translate(-cx, -cy);
    }
    faces.draw(ctx, i, look, shape, fx, fpy, r, Math.min(wpx, hpx), r0, pen, fill, now / 1000);
    ctx.restore();
  }

  /** The prints (acts/prints.ts), once the folded photo is ready: copies, frames and counts into the scene. */
  private prints(s: Session, now: number, scene: Scene): void {
    const fig = s.figure;
    if (!s.stage.posing || !fig.clip || !fig.photo || !s.stage.done) {
      this.readyAt = -1;
      return;
    }
    // a live chart's figure changes every few frames; only a new pose starts the printing over
    if (this.readyAt < 0 || this.readyFigure !== s.recipe) {
      this.readyAt = now;
      this.readyFigure = s.recipe;
    }
    // counted one by one when the pose stands still; while trading, the chart changes every few
    // frames: all of it at once, and the count as it is now
    prints(fig, s.playing ? Infinity : (now - this.readyAt) / 1000 - PRINT_DELAY, scene);
  }

  /** Every body copied at each ghost's offset, inside the scene's clip: under everyone. */
  private ghosts(s: Session, scene: Scene): void {
    if (!scene.ghosts.length || !scene.clip) return;
    const fig = s.figure;
    const { ctx } = this;
    const c = scene.clip;
    const [ax, ay] = this.px(c.x, c.y);
    const [bx, by] = this.px(c.x + c.w, c.y + c.h);
    ctx.save();
    ctx.beginPath();
    ctx.rect(ax, by, bx - ax, ay - by);
    ctx.clip();
    for (let i = 0; i < fig.kind.length; i++) {
      const colour = colourOf(i);
      ctx.fillStyle = FILLS[colour];
      ctx.strokeStyle = STROKES[colour];
      ctx.lineWidth = 0.6;
      for (const { dx, dy, alpha } of scene.ghosts) {
        const [x0, y1] = this.px(fig.x[i] + dx, fig.y[i] + dy);
        const [x1, y0] = this.px(fig.x[i] + dx + fig.w[i], fig.y[i] + dy + fig.h[i]);
        ctx.globalAlpha = 0.28 * alpha;
        ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
        ctx.globalAlpha = 0.45 * alpha;
        ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
      }
    }
    ctx.restore();
  }

  /** Numbered frames and labels: over everyone. */
  private overlay(scene: Scene): void {
    const framed = scene.frames.filter((f) => f.label !== undefined);
    if (!framed.length && !scene.labels.length) return;
    const { ctx } = this;
    const ink = getComputedStyle(this.canvas).getPropertyValue('--ink').trim() || '#28251f';
    const first = framed[0]?.box;
    const label = Math.max(9, Math.min(16, first ? Math.min(first.w, first.h) * this.scale * 0.22 : 12));
    ctx.save();
    ctx.font = `${label}px ui-monospace, monospace`;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'start';
    for (const f of framed) {
      const [qx, qy] = this.px(f.box.x, f.box.y + f.box.h);
      const [rx, ry] = this.px(f.box.x + f.box.w, f.box.y);
      ctx.globalAlpha = f.alpha;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.25;
      ctx.strokeRect(qx + 0.5, qy + 0.5, rx - qx - 1, ry - qy - 1);
      ctx.fillStyle = ink;
      if (rx - qx > label * 1.2 && ry - qy > label * 1.1) ctx.fillText(f.label!, qx + 3, qy + 3);
    }
    ctx.globalAlpha = 1;
    ctx.textBaseline = 'bottom';
    for (const l of scene.labels) {
      const size = Math.round(label * (l.size ?? 1));
      ctx.font = `${size}px ui-monospace, monospace`;
      const [tx, ty] = this.px(l.x, l.y);
      ctx.fillText(l.text, tx + 6, ty + size);
    }
    ctx.restore();
  }

  private ticks(right: number, top: number, colour: string): void {
    const { ctx } = this;
    const step = niceStep(Math.max(right, top) / 6);
    ctx.fillStyle = colour;
    ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'center';
    for (let k = 0; k * step <= right + 1e-9; k++) {
      const [x, y] = this.px(k * step, 0);
      ctx.fillRect(x - 0.5, y + 3, 1, 4);
      ctx.fillText(String(+(k * step).toFixed(6)), x, y + 17);
    }
    ctx.textAlign = 'end';
    for (let k = 1; k * step <= top + 1e-9; k++) {
      const [x, y] = this.px(0, k * step);
      ctx.fillRect(x - 7, y - 0.5, 4, 1);
      ctx.fillText(String(+(k * step).toFixed(6)), x - 10, y + 3);
    }
  }

  /** Ease the camera toward the walls (and anything outside them). */
  private camera(s: Session, dt: number): void {
    const st = s.stage;
    let x0 = 0;
    let y0 = 0;
    let x1 = Math.max(YARD, st.walls.right);
    let y1 = Math.max(YARD, st.walls.top);
    if (s.zoom === 'chart' && st.done && s.recipe.pose !== 'free') {
      // the formed chart fills the screen
      x0 = y0 = Infinity;
      x1 = y1 = -Infinity;
      for (let i = 0; i < st.n; i++) {
        x0 = Math.min(x0, st.ex[i]);
        y0 = Math.min(y0, st.ey[i]);
        x1 = Math.max(x1, st.ex[i] + st.tw[i]);
        y1 = Math.max(y1, st.ey[i] + st.th[i]);
      }
      const clip = s.figure.clip;
      if (clip && s.figure.photo) {
        x0 = Math.min(x0, clip.x0);
        y0 = Math.min(y0, clip.y0);
        x1 = Math.max(x1, clip.x1 + 0.25);
        y1 = Math.max(y1, clip.y1);
      }
    } else {
      for (let i = 0; i < st.n; i++) {
        x1 = Math.max(x1, st.x[i] + st.w[i]);
        y1 = Math.max(y1, st.y[i] + st.h[i] + st.lift(i));
      }
    }
    const m = 0.04 * Math.max(x1 - x0, y1 - y0);
    const target = { x0: x0 - m, y0: y0 - m, x1: x1 + m, y1: y1 + m };
    const k = dt > 0 ? 1 - Math.exp(-dt * 4) : 1;
    const v = this.view;
    v.x0 += (target.x0 - v.x0) * k;
    v.y0 += (target.y0 - v.y0) * k;
    v.x1 += (target.x1 - v.x1) * k;
    v.y1 += (target.y1 - v.y1) * k;
    const top = s.hud ? 28 : PAD;
    const bottom = s.axes ? 26 : PAD;
    const left = s.axes ? 34 : PAD;
    const availW = Math.max(1, this.cssW - left - PAD);
    const availH = Math.max(1, this.cssH - top - bottom);
    this.scale = Math.min(availW / (v.x1 - v.x0), availH / (v.y1 - v.y0));
    // centred in the space left by the hud and ticks
    this.ox = left + (availW - (v.x1 - v.x0) * this.scale) / 2 - v.x0 * this.scale;
    this.oy = top + availH - (availH - (v.y1 - v.y0) * this.scale) / 2 + v.y0 * this.scale;
  }

  private px(x: number, y: number): [number, number] {
    return [this.ox + x * this.scale, this.oy - y * this.scale];
  }

  private resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    let dpr = Math.min(2, window.devicePixelRatio || 1);
    if (w * h * dpr * dpr > MAX_PIXELS) dpr = Math.sqrt(MAX_PIXELS / (w * h));
    const bw = Math.max(1, Math.round(w * dpr));
    const bh = Math.max(1, Math.round(h * dpr));
    if (this.canvas.width !== bw || this.canvas.height !== bh) {
      this.canvas.width = bw;
      this.canvas.height = bh;
    }
    this.cssW = w;
    this.cssH = h;
  }
}

/** Two #rrggbb colours mixed, u of the way from a to b. */
function mix(a: string, b: string, u: number): string {
  const p = (c: string, k: number) => parseInt(c.slice(1 + 2 * k, 3 + 2 * k), 16);
  const ch = (k: number) => Math.round(p(a, k) + (p(b, k) - p(a, k)) * u);
  return `rgb(${ch(0)} ${ch(1)} ${ch(2)})`;
}

/**
 * Pixel values worth drawing: finite and within a million pixels. A bad value
 * draws nothing rather than asking the GPU for an absurd path.
 */
function sane(...v: number[]): boolean {
  for (const x of v) if (!(Math.abs(x) < 1e6)) return false;
  return true;
}

/** A person's colour: hashed, so neighbours on the starting grid differ. */
function colourOf(i: number): (typeof COLOR_NAMES)[number] {
  return COLOR_NAMES[(Math.imul(i + 1, 2654435761) >>> 0) % COLOR_NAMES.length];
}

function niceStep(raw: number): number {
  if (!(raw > 0) || !Number.isFinite(raw)) return 1;
  const p = 10 ** Math.floor(Math.log10(raw));
  const r = raw / p;
  return (r > 5 ? 10 : r > 2 ? 5 : r > 1 ? 2 : 1) * p;
}
