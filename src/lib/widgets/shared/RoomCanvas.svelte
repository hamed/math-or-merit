<script lang="ts">
  import { onMount } from 'svelte';
  import { radiusScale, roomPositions, type Point } from './layout';
  import { drawAgents } from './roomRenderer';
  import type { AgentStyle } from './agentStyle';

  interface Props {
    /** Target wealth shares (sums to ~1). May be mutated in place by the owner. */
    wealth: ArrayLike<number>;
    /** Bump to tell the canvas the wealth values changed. */
    revision?: number;
    /** Per-agent pastel fill / stroke / shape (agentStyle.ts). */
    styles?: readonly AgentStyle[] | null;
    winner?: number | null;
    highlight?: readonly number[];
    height?: number;
    /** Optional room inset for compositions that need fixed breathing room. */
    margin?: number;
    label: string;
    onTap?: ((index: number) => void) | null;
  }

  let {
    wealth,
    revision = 0,
    styles = null,
    winner = null,
    highlight = [],
    height = 300,
    margin,
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
      positions = roomPositions(n, width, height, margin);
      scale = radiusScale(n, width, height, margin);
    }
    if (displayed.length !== n) {
      displayed = Float64Array.from({ length: n }, (_, i) => wealth[i]);
      order = Array.from({ length: n }, (_, i) => i);
    }
  }

  function radius(share: number): number {
    return scale * Math.sqrt(Math.max(0, share));
  }

  function draw(now: number): void {
    const ctx = canvas.getContext('2d');
    if (!ctx || width === 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ensureLayout();

    order.sort((a, b) => displayed[b] - displayed[a]);

    // pulse progress in [0, 1); expired entries drop out
    const pulseProgress = new Map<number, number>();
    for (const [i, start] of pulses) {
      const t = (now - start) / 550;
      if (t >= 1) pulses.delete(i);
      else pulseProgress.set(i, t);
    }

    drawAgents(ctx, {
      positions,
      displayed,
      order,
      scale,
      styles,
      winner,
      highlight: new Set(highlight),
      pulses: pulseProgress,
    });
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
    void styles;
    start();
  });

  $effect(() => {
    void height; // flexible rooms (sandbox) resize in both axes
    void margin;
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
  /* frameless: agents sit directly on the paper */
  .room {
    inline-size: 100%;
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
