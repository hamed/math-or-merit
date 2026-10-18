<script lang="ts">
  import { onMount } from 'svelte';
  import { ROOM_JITTER, radiusScale, roomPositions, type Point } from './layout';
  import { drawAgents, type AgentPulse, type PulseDirection } from './roomRenderer';
  import { CLASSIC_AGENT_FILL, CLASSIC_AGENT_STROKE, type AgentStyle } from './agentStyle';
  import { faceRadius, type FaceLook } from './face/face';
  import { FacePainter } from './face/draw';
  import { FaceElement } from './face/faceElement';
  import { FaceField } from './face/field';
  import { temperament } from './face/moments';
  import { attractBodies, separateBodies } from './bodySeparation';

  const PULSE_DURATION_MS = 700;
  const TAX_SHRINK_MS = 330;
  const GIFT_ARRIVAL = 0.85;

  interface Props {
    /** Target wealth shares (sums to ~1). May be mutated in place by the owner. */
    wealth: ArrayLike<number>;
    /** Bump to tell the canvas the wealth values changed. */
    revision?: number;
    /** Per-agent pastel fill / stroke / shape (agentStyle.ts). */
    styles?: readonly AgentStyle[] | null;
    /** Optional faces over the displayed bodies; visual only. */
    faceLook?: FaceLook | null;
    winner?: number | null;
    highlight?: readonly number[];
    height?: number;
    /** Optional room inset for compositions that need fixed breathing room. */
    margin?: number;
    /** Cell jitter; 0 for an exact grid. Defaults to the shared room jitter. */
    jitter?: number;
    /** Dashed ring for anyone smaller than this (see drawAgents). Off by default. */
    presenceRadius?: number;
    /** Display forces only; they never affect trading or wealth. */
    repulsion?: boolean;
    attraction?: boolean;
    label: string;
    onTap?: ((index: number, event: PointerEvent) => void) | null;
  }

  let {
    wealth,
    revision = 0,
    styles = null,
    faceLook = null,
    winner = null,
    highlight = [],
    height = 300,
    margin,
    jitter = ROOM_JITTER,
    presenceRadius = 0,
    repulsion = true,
    attraction = false,
    label,
    onTap = null,
  }: Props = $props();

  let container: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let faceLayer: SVGSVGElement;
  let width = $state(0);

  let positions: Point[] = [];
  let anchors: Point[] = [];
  let scale = 0;
  let displayed = new Float64Array(0);
  let order: number[] = [];
  const pulses: { index: number; start: number; direction: PulseDirection; gain: number }[] = [];
  const facePrefix = `sandbox-face-${Math.random().toString(36).slice(2)}`;
  const faceNodes = new Map<number, { group: SVGGElement; element: FaceElement; painter: FacePainter }>();
  let faceField: FaceField | null = null;
  let faceWealth: ArrayLike<number> | null = null;
  let faceSeen = new Float64Array(0);
  let faceRevision = -1;

  function updateFaceField(dt: number): void {
    if (!faceLook) {
      faceField = null;
      faceWealth = null;
      return;
    }
    if (!faceField || faceField.n !== wealth.length || faceWealth !== wealth) {
      faceField = new FaceField(wealth.length);
      for (let i = 0; i < wealth.length; i++) faceField.temper(i, temperament(i * 13 + 5));
      faceWealth = wealth;
      faceSeen = Float64Array.from(wealth);
      faceRevision = revision;
    } else if (faceRevision !== revision) {
      for (let i = 0; i < wealth.length; i++) {
        faceField.react(i, faceSeen[i], wealth[i]);
        faceSeen[i] = wealth[i];
      }
      faceRevision = revision;
    }
    faceField.step(dt / 1000);
  }

  function drawFaces(now: number): void {
    if (!faceLayer) return;
    if (!faceLook) {
      if (faceNodes.size) {
        faceLayer.replaceChildren();
        faceNodes.clear();
      }
      return;
    }
    faceLayer.setAttribute('viewBox', `0 0 ${width} ${height}`);
    const field = faceField;
    if (!field) return;
    const equalRadius = scale / Math.sqrt(displayed.length);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const visible = new Set<number>();
    for (const i of order) {
      const r = radius(displayed[i]);
      const s = Math.round(faceRadius(r, equalRadius) * 4) / 4;
      if (s * 1.15 < 4) continue;
      visible.add(i);
      let node = faceNodes.get(i);
      if (!node) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.dataset.agentFace = String(i);
        faceLayer.append(group);
        node = { group, element: new FaceElement(group, `${facePrefix}-${i}`), painter: new FacePainter() };
        faceNodes.set(i, node);
      }
      const p = positions[i];
      let pulseT = -1;
      for (const pulse of pulses) {
        if (pulse.index !== i) continue;
        const t = (now - pulse.start) / PULSE_DURATION_MS;
        if (t >= 0 && t < 1) pulseT = t;
      }
      const x = p.x + (pulseT >= 0 && pulseT < 1 ? Math.sin(pulseT * 26) * 2.4 * (1 - pulseT) : 0);
      const place = `translate(${x.toFixed(2)} ${p.y.toFixed(2)})`;
      if (node.group.getAttribute('transform') !== place) node.group.setAttribute('transform', place);
      const style = styles?.[i];
      field.size(i, r, equalRadius);
      field.still[i] = s < 7 ? 1 : 0;
      const face = field.poseOf(i, reduced);
      node.element.render(
        node.painter.paint(faceLook, style?.shape ?? 'circle', Math.max(0.6, r), s, face.pose, face.marks, field.seed[i], now / 1000),
        { fill: style?.fill ?? CLASSIC_AGENT_FILL, stroke: style?.stroke ?? CLASSIC_AGENT_STROKE, fillOpacity: style ? 0.75 : 1 },
      );
    }
    for (const [i, node] of faceNodes) {
      if (visible.has(i)) continue;
      node.group.remove();
      faceNodes.delete(i);
    }
  }

  let frame: number | undefined;
  let lastTime = 0;
  let redrawBodies = true;

  function ensureLayout(): void {
    const n = wealth.length;
    if (positions.length !== n || scale === 0) {
      positions = roomPositions(n, width, height, margin, jitter);
      anchors = positions;
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

  /** The same displayed location used for bodies, faces, taps, and photographs. */
  export function bodyAt(index: number): { x: number; y: number; r: number } | null {
    const p = positions[index];
    return p ? { ...p, r: radius(displayed[index]) } : null;
  }

  function separate(dt: number): number {
    const restore = attraction ? 0 : 1 - Math.exp(-dt / (repulsion ? 3000 : 180));
    let bodies = positions.map((p, i) => ({
      x: p.x + (anchors[i].x - p.x) * restore,
      y: p.y + (anchors[i].y - p.y) * restore,
      r: Math.max(presenceRadius, radius(displayed[i])),
      shape: styles?.[i]?.shape ?? 'circle' as const,
    }));
    if (attraction) {
      const attracted = attractBodies(bodies, dt);
      bodies = bodies.map((p, i) => ({ ...p, ...attracted[i] }));
    }
    const inset = margin ?? 0;
    const next = separateBodies(bodies, { x: inset, y: inset, w: Math.max(1, width - inset * 2), h: Math.max(1, height - inset * 2) }, {
      gap: Math.min(2, scale / Math.sqrt(Math.max(1, displayed.length)) * 0.3),
      iterations: repulsion ? 12 : 0,
    });
    let movement = 0;
    for (let i = 0; i < next.length; i++) movement = Math.max(movement, Math.hypot(next[i].x - positions[i].x, next[i].y - positions[i].y));
    positions = next;
    return movement;
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

    // Each tap keeps its own ring, even when several taps hit the same person.
    const pulseProgress = new Map<number, AgentPulse[]>();
    for (let j = pulses.length - 1; j >= 0; j--) {
      const pulse = pulses[j];
      const t = (now - pulse.start) / PULSE_DURATION_MS;
      if (t >= 1) {
        pulses.splice(j, 1);
      } else if (t >= 0) {
        const rings = pulseProgress.get(pulse.index) ?? [];
        rings.push({ progress: t, direction: pulse.direction });
        pulseProgress.set(pulse.index, rings);
      }
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
      presenceRadius,
    });
    drawFaces(now);
  }

  function tick(now: number): void {
    frame = requestAnimationFrame(tick);
    const dt = Math.min(100, now - lastTime);
    lastTime = now;
    ensureLayout();

    const ease = 1 - Math.exp(-dt / 110);
    let maxDelta = 0;
    for (let i = 0; i < displayed.length; i++) {
      let pendingGain = 0;
      for (const pulse of pulses) {
        if (pulse.index === i && pulse.direction === 'in'
          && (now - pulse.start) / PULSE_DURATION_MS < GIFT_ARRIVAL) {
          pendingGain += pulse.gain;
        }
      }
      const delta = wealth[i] - pendingGain - displayed[i];
      displayed[i] += delta * ease;
      maxDelta = Math.max(maxDelta, Math.abs(delta));
    }
    const movement = separate(dt);
    updateFaceField(dt);
    if (maxDelta >= 1e-7 || movement > 0.01 || pulses.length > 0 || redrawBodies) {
      draw(now);
      redrawBodies = false;
    } else drawFaces(now);
    if (maxDelta < 1e-7 && movement <= 0.01 && pulses.length === 0 && !faceLook) stop();
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
  export function pulse(index: number, direction: PulseDirection, gain: number): void {
    // A tax first makes the person smaller; its outward ring starts after the
    // ease has covered about 95% of that change. Gifts travel inward first.
    const delay = direction === 'out' ? TAX_SHRINK_MS : 0;
    pulses.push({ index, start: performance.now() + delay, direction, gain });
    faceField?.startle(index, 0.8);
    redrawBodies = true;
    start();
  }

  function handleTap(event: PointerEvent): void {
    if (!onTap || event.button !== 0) return;
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
    if (best >= 0 && bestDist < 18) onTap(best, event);
  }

  $effect(() => {
    void revision;
    void winner;
    void highlight;
    void wealth;
    void styles;
    void faceLook;
    void presenceRadius;
    void repulsion;
    void attraction;
    redrawBodies = true;
    start();
  });

  $effect(() => {
    void height; // flexible rooms (sandbox) resize in both axes
    void margin;
    void jitter;
    if (width > 0) {
      positions = [];
      scale = 0;
      redrawBodies = true;
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
      faceNodes.clear();
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
  <svg bind:this={faceLayer} class="faces" aria-hidden="true"></svg>
</div>

<style>
  /* frameless: agents sit directly on the paper */
  .room {
    inline-size: 100%;
    position: relative;
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

  .faces {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    pointer-events: none;
    overflow: visible;
  }
</style>
