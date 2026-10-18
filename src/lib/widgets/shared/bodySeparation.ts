/** Display-only, overdamped soft contacts. Positions never enter the wealth model. */
import type { AgentShape } from './agentStyle';
import type { Point } from './layout';
import { POLYGONS } from './roomRenderer';

export interface SeparationBody extends Point {
  readonly r: number;
  readonly shape?: AgentShape;
  /** Choreographed entrances/exits may remain outside the room. */
  readonly confine?: boolean;
}

export interface RoomBounds {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** Gentle finite-range attraction, integrated without momentum or singularities. */
export function attractBodies(bodies: readonly SeparationBody[], dtMs: number): Point[] {
  const dt = Math.min(50, Math.max(0, dtMs)) / 1000;
  const dx = new Float64Array(bodies.length);
  const dy = new Float64Array(bodies.length);
  const reach = (i: number) => 3 * Math.max(0.7, bodies[i].r) * 1.6;
  const order = bodies.map((_, i) => i).sort((a, b) => bodies[a].x - reach(a) - bodies[b].x + reach(b));
  for (let a = 0; a < order.length; a++) {
    const i = order[a];
    const p = bodies[i];
    for (let b = a + 1; b < order.length && bodies[order[b]].x - reach(order[b]) < p.x + reach(i); b++) {
      const j = order[b];
      const q = bodies[j];
      const x = q.x - p.x;
      const y = q.y - p.y;
      const distance = Math.hypot(x, y);
      const cutoff = reach(i) + reach(j);
      if (distance >= cutoff) continue;
      const force = dt * 0.8 * (1 - distance / cutoff) ** 2;
      dx[i] += x * force;
      dy[i] += y * force;
      dx[j] -= x * force;
      dy[j] -= y * force;
    }
  }
  return bodies.map((p, i) => {
    const magnitude = Math.hypot(dx[i], dy[i]);
    const limit = Math.min(1, (30 * dt) / (magnitude || 1));
    return { x: p.x + dx[i] * limit, y: p.y + dy[i] * limit };
  });
}

/** Local vertices share the renderer's equal-area geometry; circles stay analytic. */
function vertices(shape: AgentShape): readonly Point[] | null {
  if (shape === 'circle') return null;
  if (shape === 'square') {
    const h = Math.sqrt(Math.PI) / 2;
    return [{ x: -h, y: -h }, { x: h, y: -h }, { x: h, y: h }, { x: -h, y: h }];
  }
  if (shape === 'triangle' || shape === 'triangleDown') {
    const s = Math.sqrt(4 * Math.PI / Math.sqrt(3));
    const h = s * Math.sqrt(3) / 2;
    const flip = shape === 'triangle' ? 1 : -1;
    return [{ x: 0, y: -flip * h * 2 / 3 }, { x: s / 2, y: flip * h / 3 }, { x: -s / 2, y: flip * h / 3 }];
  }
  const { sides, factor, offset } = POLYGONS[shape]!;
  const r = Math.sqrt(Math.PI / factor);
  return Array.from({ length: sides }, (_, k) => ({ x: r * Math.cos(k * 2 * Math.PI / sides + offset), y: r * Math.sin(k * 2 * Math.PI / sides + offset) }));
}

const geometry = new Map<AgentShape, ReturnType<typeof vertices>>();
function outline(shape: AgentShape): readonly Point[] | null {
  if (!geometry.has(shape)) geometry.set(shape, vertices(shape));
  return geometry.get(shape)!;
}

/**
 * Relax overlapping silhouettes with a bounded repulsive contact force.
 * The force tends continuously to zero at contact, without attraction or
 * inertia. A sorted sweep avoids checking every pair in large sandbox rooms.
 * `iterations` is the relaxation budget, not simulated time. Repeated calls
 * can start from the previous display positions for gentle motion.
 */
export function separateBodies(
  bodies: readonly SeparationBody[],
  bounds: RoomBounds,
  { gap = 2, iterations = 48, verticalOnly = false }: { gap?: number; iterations?: number; verticalOnly?: boolean } = {},
): Point[] {
  const n = bodies.length;
  const x = Float64Array.from(bodies, (p) => p.x);
  const y = Float64Array.from(bodies, (p) => p.y);
  const radii = Float64Array.from(bodies, (p) => Number.isFinite(p.r) ? Math.max(0.7, p.r) : 0.7);
  const shapes = bodies.map((p) => outline(p.shape ?? 'circle'));
  const left = new Float64Array(n);
  const right = new Float64Array(n);
  const top = new Float64Array(n);
  const bottom = new Float64Array(n);
  const axes = shapes.map((polygon) => polygon?.map((p, k) => {
    const q = polygon[(k + 1) % polygon.length];
    const len = Math.hypot(q.x - p.x, q.y - p.y);
    return { x: -(q.y - p.y) / len, y: (q.x - p.x) / len };
  }) ?? []);
  for (let i = 0; i < n; i++) {
    const polygon = shapes[i];
    left[i] = polygon ? Math.min(...polygon.map((p) => p.x)) * radii[i] : -radii[i];
    right[i] = polygon ? Math.max(...polygon.map((p) => p.x)) * radii[i] : radii[i];
    top[i] = polygon ? Math.min(...polygon.map((p) => p.y)) * radii[i] : -radii[i];
    bottom[i] = polygon ? Math.max(...polygon.map((p) => p.y)) * radii[i] : radii[i];
  }
  const clamp = (value: number, lo: number, hi: number) => lo <= hi ? Math.min(hi, Math.max(lo, value)) : (lo + hi) / 2;
  function walls(i: number): void {
    if (bodies[i].confine === false) return;
    if (!verticalOnly) x[i] = clamp(x[i], bounds.x - left[i] + gap / 2, bounds.x + bounds.w - right[i] - gap / 2);
    y[i] = clamp(y[i], bounds.y - top[i] + gap / 2, bounds.y + bounds.h - bottom[i] - gap / 2);
  }
  for (let i = 0; i < n; i++) walls(i);

  function projection(i: number, ax: number, ay: number): [number, number] {
    const polygon = shapes[i];
    if (!polygon) return [-radii[i], radii[i]];
    let lo = Infinity;
    let hi = -Infinity;
    for (const p of polygon) {
      const dot = (p.x * ax + p.y * ay) * radii[i];
      lo = Math.min(lo, dot);
      hi = Math.max(hi, dot);
    }
    return [lo, hi];
  }

  const order = Array.from({ length: n }, (_, i) => i);
  const sweepLeft = new Float64Array(n);
  const sweepRight = new Float64Array(n);
  for (let pass = 0; pass < iterations; pass++) {
    // Freeze broad-phase bounds for this pass. Corrections enter the next pass.
    for (let i = 0; i < n; i++) {
      sweepLeft[i] = x[i] + left[i];
      sweepRight[i] = x[i] + right[i];
    }
    order.sort((a, b) => sweepLeft[a] - sweepLeft[b] || a - b);
    let largest = 0;
    for (let a = 0; a < n; a++) {
      const i = order[a];
      for (let b = a + 1; b < n && sweepLeft[order[b]] < sweepRight[i] + gap; b++) {
        const j = order[b];
        if (y[j] + top[j] >= y[i] + bottom[i] + gap || y[i] + top[i] >= y[j] + bottom[j] + gap) continue;
        const dx = x[j] - x[i];
        const dy = y[j] - y[i];
        let nx = 0;
        let ny = 0;
        let depth = Infinity;
        const test = (ax: number, ay: number): boolean => {
          const [alo, ahi] = projection(i, ax, ay);
          const [blo, bhi] = projection(j, ax, ay);
          const distance = dx * ax + dy * ay;
          const forward = ahi - blo - distance + gap;
          const backward = bhi - alo + distance + gap;
          if (forward <= 0 || backward <= 0) return false;
          if (verticalOnly && Math.abs(ay) < 1e-8) return true;
          const d = Math.min(forward, backward) / (verticalOnly ? Math.abs(ay) : 1);
          if (d < depth) {
            depth = d;
            const sign = forward < backward ? 1 : -1;
            nx = verticalOnly ? 0 : ax * sign;
            ny = verticalOnly ? Math.sign(ay) * sign : ay * sign;
          }
          return true;
        };
        let contact = true;
        if (!shapes[i] && !shapes[j]) {
          const distance = Math.hypot(dx, dy);
          depth = radii[i] + radii[j] + gap - distance;
          // Coincident centers need a deterministic direction, never a divide by zero.
          const angle = (i * 2.399963 + j * 0.618034);
          nx = distance > 1e-8 ? dx / distance : Math.cos(angle);
          ny = distance > 1e-8 ? dy / distance : Math.sin(angle);
          contact = depth > 0;
          if (verticalOnly && contact) {
            const need = radii[i] + radii[j] + gap;
            nx = 0;
            ny = dy === 0 ? (i < j ? 1 : -1) : Math.sign(dy);
            depth = Math.sqrt(Math.max(0, need * need - dx * dx)) - Math.abs(dy);
          }
        } else {
          for (const axis of [...axes[i], ...axes[j]]) {
            if (!test(axis.x, axis.y)) { contact = false; break; }
          }
          // The closest polygon vertex supplies the additional circle–polygon axis.
          if (contact && (!shapes[i] || !shapes[j])) {
            const polygonIndex = shapes[i] ? i : j;
            const circleIndex = shapes[i] ? j : i;
            let nearest = Infinity;
            let vx = 0;
            let vy = 0;
            for (const p of shapes[polygonIndex]!) {
              const px = x[polygonIndex] + p.x * radii[polygonIndex] - x[circleIndex];
              const py = y[polygonIndex] + p.y * radii[polygonIndex] - y[circleIndex];
              const distance = Math.hypot(px, py);
              if (distance < nearest) { nearest = distance; vx = px; vy = py; }
            }
            if (nearest > 1e-8) contact = test(vx / nearest, vy / nearest);
          }
        }
        if (!contact) continue;
        largest = Math.max(largest, depth);
        // Quadratic contact potential: its restoring force is proportional to
        // penetration. Overdamping and partial relaxation prevent explosions.
        const push = depth * 0.8;
        const weight = radii[j] / (radii[i] + radii[j]);
        x[i] -= nx * push * weight;
        y[i] -= ny * push * weight;
        x[j] += nx * push * (1 - weight);
        y[j] += ny * push * (1 - weight);
        walls(i);
        walls(j);
      }
    }
    if (largest < 0.02) break;
  }
  return Array.from({ length: n }, (_, i) => ({ x: x[i], y: y[i] }));
}
