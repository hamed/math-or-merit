<script lang="ts">
  import { onMount } from 'svelte';
  import { radiusScale, roomPositions, type Point } from './layout';
  import type { TraitShape } from './traits';

  interface Props {
    /** Target wealth shares (sums to ~1). May be mutated in place by the owner. */
    wealth: ArrayLike<number>;
    /** Bump to tell the canvas the wealth values changed. */
    revision?: number;
    shapes?: readonly TraitShape[] | null;
    winner?: number | null;
    highlight?: readonly number[];
    height?: number;
    label: string;
    onTap?: ((index: number) => void) | null;
  }

  let {
    wealth,
    revision = 0,
    shapes = null,
    winner = null,
    highlight = [],
    height = 300,
    label,
    onTap = null,
  }: Props = $props();

  let container: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let width = $state(0);

  let positions: Point[] = [];
  let scale = 0;
  let displayed = new Float64Array(0);
  let order: number[] = [];
  const pulses = new Map<number, number>();

  let frame: number | undefined;
  let lastTime = 0;

  function ensureLayout(): void {
    const n = wealth.length;
    if (positions.length !== n || scale === 0) {
      positions = roomPositions(n, width, height);
      scale = radiusScale(n, width, height);
    }
    if (displayed.length !== n) {
      displayed = Float64Array.from({ length: n }, (_, i) => wealth[i]);
      order = Array.from({ length: n }, (_, i) => i);
    }
  }

  function radius(share: number): number {
    return scale * Math.sqrt(Math.max(0, share));
  }

  function tracePath(ctx: CanvasRenderingContext2D, shape: TraitShape | null, x: number, y: number, r: number): void {
    ctx.beginPath();
    if (shape === null) {
      ctx.arc(x, y, r, 0, Math.PI * 2);
      return;
    }
    const area = Math.PI * r * r;
    if (shape === 'square' || shape === 'diamond') {
      const half = Math.sqrt(area) / 2;
      if (shape === 'square') {
        ctx.rect(x - half, y - half, half * 2, half * 2);
      } else {
        const d = half * Math.SQRT2;
        ctx.moveTo(x, y - d);
        ctx.lineTo(x + d, y);
        ctx.lineTo(x, y + d);
        ctx.lineTo(x - d, y);
        ctx.closePath();
      }
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
    if (shape === 'hexagon') {
      const rr = Math.sqrt(area / 2.598);
      for (let k = 0; k < 6; k++) {
        const a = (Math.PI / 3) * k - Math.PI / 6;
        const px = x + rr * Math.cos(a);
        const py = y + rr * Math.sin(a);
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      return;
    }
    if (shape === 'star') {
      const outer = Math.sqrt(area / 1.12);
      const inner = outer * 0.475;
      for (let k = 0; k < 10; k++) {
        const rr = k % 2 === 0 ? outer : inner;
        const a = (Math.PI / 5) * k - Math.PI / 2;
        const px = x + rr * Math.cos(a);
        const py = y + rr * Math.sin(a);
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      return;
    }
    // heart
    const s = Math.sqrt(area / 2.05);
    ctx.moveTo(x, y + s);
    ctx.bezierCurveTo(x - 1.5 * s, y - 0.1 * s, x - 0.6 * s, y - 1.1 * s, x, y - 0.45 * s);
    ctx.bezierCurveTo(x + 0.6 * s, y - 1.1 * s, x + 1.5 * s, y - 0.1 * s, x, y + s);
    ctx.closePath();
  }

  function draw(now: number): void {
    const ctx = canvas.getContext('2d');
    if (!ctx || width === 0) return;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ensureLayout();

    order.sort((a, b) => displayed[b] - displayed[a]);
    const highlightSet = new Set(highlight);

    for (const i of order) {
      const p = positions[i];
      let x = p.x;
      const pulseStart = pulses.get(i);
      let pulseT = -1;
      if (pulseStart !== undefined) {
        pulseT = (now - pulseStart) / 550;
        if (pulseT >= 1) {
          pulses.delete(i);
          pulseT = -1;
        } else {
          x += Math.sin(pulseT * 26) * 2.4 * (1 - pulseT);
        }
      }
      const r = radius(displayed[i]);
      if (r < 0.7) {
        ctx.fillStyle = 'rgb(110 85 62 / 60%)';
        ctx.fillRect(x - 0.7, p.y - 0.7, 1.4, 1.4);
        continue;
      }
      const isWinner = winner === i;
      const isHot = highlightSet.has(i);
      tracePath(ctx, shapes ? shapes[i] : null, x, p.y, r);
      ctx.fillStyle = isWinner ? 'rgb(139 63 43 / 45%)' : 'rgb(189 98 69 / 26%)';
      ctx.fill();
      ctx.strokeStyle = isWinner ? '#4d271c' : isHot ? '#2e2a23' : '#96543c';
      ctx.lineWidth = isWinner || isHot ? 2.2 : 1.2;
      ctx.stroke();
      if (isWinner) {
        ctx.beginPath();
        ctx.arc(x, p.y, r + 5, 0, Math.PI * 2);
        ctx.setLineDash([4, 5]);
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = 'rgb(77 39 28 / 65%)';
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

  function tick(now: number): void {
    frame = requestAnimationFrame(tick);
    const dt = Math.min(100, now - lastTime);
    lastTime = now;
    ensureLayout();

    const ease = 1 - Math.exp(-dt / 110);
    let maxDelta = 0;
    for (let i = 0; i < displayed.length; i++) {
      const delta = wealth[i] - displayed[i];
      displayed[i] += delta * ease;
      maxDelta = Math.max(maxDelta, Math.abs(delta));
    }
    draw(now);
    if (maxDelta < 1e-7 && pulses.size === 0) stop();
  }

  function start(): void {
    if (frame !== undefined) return;
    lastTime = performance.now();
    frame = requestAnimationFrame(tick);
  }

  function stop(): void {
    if (frame === undefined) return;
    cancelAnimationFrame(frame);
    frame = undefined;
  }

  /** Visual flinch for taxed/affected agents; display-layer only. */
  export function pulse(index: number): void {
    pulses.set(index, performance.now());
    start();
  }

  function handleTap(event: PointerEvent): void {
    if (!onTap) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    let best = -1;
    let bestDist = Infinity;
    for (let i = 0; i < positions.length; i++) {
      const dx = positions[i].x - x;
      const dy = positions[i].y - y;
      const dist = Math.hypot(dx, dy) - radius(displayed[i]);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }
    if (best >= 0 && bestDist < 18) onTap(best);
  }

  $effect(() => {
    void revision;
    void winner;
    void highlight;
    void wealth;
    start();
  });

  $effect(() => {
    if (width > 0) {
      positions = [];
      scale = 0;
      start();
    }
  });

  onMount(() => {
    const observer = new ResizeObserver((entries) => {
      width = entries[0].contentRect.width;
    });
    observer.observe(container);
    return () => {
      observer.disconnect();
      stop();
    };
  });
</script>

<div
  bind:this={container}
  class="room"
  class:tappable={onTap !== null}
  style={`block-size: ${height}px`}
  role="img"
  aria-label={label}
>
  <canvas bind:this={canvas} onpointerdown={handleTap}></canvas>
</div>

<style>
  .room {
    inline-size: 100%;
    border: 1px solid #d8cdb9;
    border-radius: 0.9rem;
    background:
      radial-gradient(circle at 30% 20%, rgb(255 255 255 / 55%), transparent 60%),
      #fbf6ea;
    overflow: hidden;
  }

  .room.tappable {
    cursor: pointer;
    touch-action: manipulation;
  }

  canvas {
    display: block;
    inline-size: 100%;
    block-size: 100%;
  }
</style>
