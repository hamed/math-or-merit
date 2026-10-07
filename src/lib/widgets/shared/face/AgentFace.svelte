<script lang="ts">
  /**
   * A face on an agent, drawn from a pose (face.ts `FacePose`) and marks. It
   * never sees a feeling, an event or a person. The caller draws the body and
   * places this at the body's centre; the face sits inside it (peekers perch on
   * its outline).
   *
   * `look` picks the drawing. Every look maps the same pose to its own
   * geometry through one shared neutral + basis (`faceGeometry`); a look
   * without brows simply cannot show what brows carry. Lines are in the body's
   * stroke colour. Manga draws the marks; the others only the blush.
   */
  import type { AgentShape } from '../agentStyle';
  import { boundPose, faceAnchor, faceGeometry, topEdge, wobble, type FaceLook, type FacePose, type Marks } from './face';

  interface Props {
    shape: AgentShape;
    /** The body's radius: where the outline is. */
    r: number;
    /** The face's own radius (`faceRadius`), when it is not the body's. */
    faceR?: number;
    fill: string;
    /** How opaque the body's fill is drawn, so a peeker's lid matches the skin. */
    fillOpacity?: number;
    stroke: string;
    pose: FacePose;
    /** Decorations, each 0 … 1. */
    marks?: Marks;
    look: FaceLook;
    /** Per person: the hand-drawn wobble of the ink look. */
    seed?: number;
    /** Unique per face on the page: the eye clips are named after it. */
    uid: string;
  }

  let { shape, r, faceR, fill, fillOpacity = 0.75, stroke, pose, marks = {}, look, seed = 3, uid }: Props = $props();

  /** The page's paper, under the body's see-through fill, so a lid matches the skin. */
  const GROUND = '#f4efe4';
  const WHITE = '#fffaf0';
  const INK = '#28251f';
  const BLUSH = 'rgb(222 92 104 / 70%)';
  const TEAR = '#5b93cc';
  const TEAR_FILL = '#cfe5f7';
  const VEIN = '#c8463c';
  const TONGUE = 'rgb(214 96 108 / 90%)';

  /** The face's size: the body's, unless the caller says otherwise. */
  const s = $derived(faceR ?? r);
  /**
   * The size the features are drawn at, in steps of an eighth of an octave; a scale makes up the
   * rest. A body that grows every frame (the run) then redraws its face only at a step.
   */
  const sb = $derived(2 ** (Math.round(Math.log2(Math.max(s, 0.01)) * 8) / 8));
  const zoom = $derived(s / sb);
  /** The pose, held inside what can be drawn; then the shared geometry. */
  const p = $derived(boundPose(pose));
  const ch = $derived(faceGeometry(p.expression, p.pupil));
  const lw = $derived(Math.min(4, Math.max(1.2, 0.06 * sb)));
  // the head: yaw slides the face across the body and foreshortens it, pitch lifts it, roll tilts it
  const head = $derived(p.head);
  const pitchY = $derived(-head.pitch * 0.08 * s);
  const pitchSquash = $derived(1 - 0.06 * Math.abs(head.pitch));
  const yawX = $derived(head.yaw * 0.16 * s);
  const yawSquash = $derived(1 - 0.1 * Math.abs(head.yaw));
  const rollDeg = $derived(head.roll * 14);

  /** The drawings' proportions: a face a little wider than its radius. */
  const k = $derived(sb * 1.15);
  /** A face too small to read is not drawn: dust has no face. */
  const faceOn = $derived(s * 1.15 >= 4);
  const lwk = $derived(Math.min(4, Math.max(1.1, 0.075 * k)));
  const shut = $derived(Math.max(ch.upperLid, p.blink));
  /** How open a simple eye is: the upper lid (a resting lid barely counts) and the cheek pushing up. */
  const dotOpen = $derived(Math.min(1, (1 - shut) / 0.75) * (1 - 0.8 * ch.lowerLid));
  /** Eyes that smile: the Duchenne arch. */
  const beam = $derived(ch.crinkle > 0.45);
  /**
   * In looks without pupils, gaze moves the whole face a little, like a small head turn (owner's
   * choice, 2026-10-07: eyes sliding against a fixed mouth looked odd). Looks with pupils move the pupils.
   */
  const gaze = $derived(`translate(${(p.gaze.yaw * 0.1 * k).toFixed(2)} ${(p.gaze.pitch * 0.07 * k).toFixed(2)})`);

  const mk = $derived({
    hatch: marks.blushLines ?? 0,
    blush: marks.blush ?? 0,
    gloom: marks.gloom ?? 0,
    sweat: marks.sweat ?? 0,
    vein: marks.vein ?? 0,
    tears: marks.tears ?? 0,
    exclaim: marks.exclaim ?? 0,
    sparkles: marks.sparkles ?? 0,
  });
  /** Eyes open wide enough to draw as ◎ (manga) or o (ink): a startle, or fear — read off the pose. */
  const wide = $derived(p.expression.eyeOpening > 0.55);

  function q(x: number): string {
    return (x * k).toFixed(2);
  }

  function eye(side: number) {
    const cx = side * 0.32 * sb;
    const cy = -0.12 * sb;
    const rx = 0.13 * sb * ch.eyeScale;
    const ry = 0.155 * sb * ch.eyeScale;
    const yu = cy - ry + 2 * ry * shut;
    const yl = cy + ry - ry * ch.lowerLid;
    const closed = yu >= yl - 0.01 * sb;
    // the inner corner is the one nearer the middle of the face
    const innerLeft = side > 0;
    const slant = ch.lidSlant * sb * (1 - shut * 0.6);
    const xl = cx - rx;
    const xr = cx + rx;
    const yLeft = Math.min(yl, yu + (innerLeft ? slant : -slant));
    const yRight = Math.min(yl, yu + (innerLeft ? -slant : slant));
    const sag = 0.25 * ry * (1 - shut);
    const upperEdge = `M ${xl} ${yLeft} Q ${cx} ${yu + sag} ${xr} ${yRight}`;
    const push = 0.6 * ry * ch.lowerLid;
    const lowerEdge = `M ${xl} ${yl} Q ${cx} ${yl - push} ${xr} ${yl}`;
    // the opening between the lids: the eye shows only here, so no skin has to be painted over it
    const opening = `M ${xl} ${yLeft} Q ${cx} ${yu + sag} ${xr} ${yRight} L ${xr} ${yl} Q ${cx} ${yl - push} ${xl} ${yl} Z`;
    const pr = 0.072 * sb * ch.pupil;
    const px = cx + p.gaze.yaw * (rx - pr) * 0.85;
    const py = cy + p.gaze.pitch * (ry - pr) * 0.85;
    const mid = (yu + yl) / 2;
    // a shut eye is one line: an arch when the cheeks are up (a smile), else a soft dip
    const shutLine = `M ${xl} ${mid} Q ${cx} ${mid + (ch.lowerLid > 0.3 ? -0.9 : 0.5) * ry * 0.5} ${xr} ${mid}`;
    return { cx, cy, rx, ry, closed, upperEdge, lowerEdge, opening, px, py, pr, band: Math.min(yLeft, yRight), yl, shutLine };
  }

  function brow(side: number): string {
    const ix = side * ch.browInnerX * sb;
    const ox = side * 0.46 * sb;
    const iy = ch.browInnerY * sb;
    const oy = ch.browOuterY * sb;
    return `M ${ix} ${iy} Q ${side * 0.3 * sb} ${Math.min(iy, oy) - 0.03 * sb} ${ox} ${oy}`;
  }

  /** The shared mouth at height y0, scaled by w, in face units of `unit`. */
  function mouthPath(y0: number, w: number, unit: number): { d: string; open: boolean } {
    const at = (x: number) => (x * unit).toFixed(2);
    const half = ch.mouthHalf * w;
    const c = ch.mouthCurve * w;
    const o = ch.mouthOpen * 0.3 * w;
    const corner = y0 - c;
    // a smirk lifts the right-hand corner and lets the other sag a little
    const cl = corner + 0.25 * w * ch.mouthSmirk;
    const cr = corner - w * ch.mouthSmirk;
    const upperMid = y0 + 0.5 * c - 0.3 * o;
    const uc = 2 * upperMid - corner;
    const lc = 2 * (upperMid + o) - corner;
    const open = o > 0.02;
    return {
      d: open
        ? `M ${at(-half)} ${at(cl)} Q 0 ${at(uc)} ${at(half)} ${at(cr)} Q 0 ${at(lc)} ${at(-half)} ${at(cl)} Z`
        : `M ${at(-half)} ${at(cl)} Q 0 ${at(uc)} ${at(half)} ${at(cr)}`,
      open,
    };
  }

  /** The shared brows, moved down to sit over eyes at `eyeY` instead of −0.12. */
  function browK(side: number, eyeY: number): string {
    const dy = eyeY + 0.12;
    const iy = ch.browInnerY + dy;
    const oy = ch.browOuterY + dy;
    return `M ${q(side * (ch.browInnerX - 0.01))} ${q(iy)} Q ${q(side * 0.26)} ${q(Math.min(iy, oy) - 0.03)} ${q(side * 0.38)} ${q(oy)}`;
  }

  /** A lid over the top of a round eye, shut to `frac` of its height. */
  function lidSegment(cx: number, cy: number, R: number, frac: number): string {
    const c = -R + 2 * R * Math.min(0.95, frac);
    const w = Math.sqrt(Math.max(0, R * R - c * c));
    return `M ${(cx - w).toFixed(2)} ${(cy + c).toFixed(2)} A ${R.toFixed(2)} ${R.toFixed(2)} 0 ${c > 0 ? 1 : 0} 1 ${(cx + w).toFixed(2)} ${(cy + c).toFixed(2)} Z`;
  }

  /** The hand-drawn mouth: the shared corners and opening, never quite agreeing. */
  function inkMouth(): { d: string; open: boolean } {
    const j = (n: number) => wobble(seed, n) * 0.02;
    if (ch.mouthOpen > 0.1) {
      const rx = ch.mouthHalf * 0.55;
      const ry = 0.025 + 0.09 * ch.mouthOpen;
      const y = 0.22 - ch.mouthCurve * 0.4;
      return {
        d: `M ${q(-rx)} ${q(y)} Q ${q(-rx)} ${q(y - ry)} 0 ${q(y - ry - j(1))} Q ${q(rx)} ${q(y - ry)} ${q(rx + j(2))} ${q(y)} Q ${q(rx)} ${q(y + ry)} 0 ${q(y + ry)} Q ${q(-rx)} ${q(y + ry + j(3))} ${q(-rx)} ${q(y)} Z`,
        open: true,
      };
    }
    const bow = ch.mouthCurve * 0.85;
    const y = 0.2 - ch.mouthCurve * 0.3;
    const sm = ch.mouthSmirk;
    return { d: `M ${q(-0.14)} ${q(y + j(4) + 0.25 * sm)} C ${q(-0.05)} ${q(y + bow + j(5))} ${q(0.05)} ${q(y + bow + j(6))} ${q(0.14 + j(7))} ${q(y + j(8) - sm)}`, open: false };
  }
</script>

{#snippet marksLayer()}
  {#if mk.hatch > 0.02}
    {#each [-1, 1] as side (side)}
      {#each [-1, 0, 1] as j (j)}
        {@const cx = side * 0.36 + j * 0.05}
        <path d={`M ${q(cx - 0.02)} ${q(0.14)} L ${q(cx + 0.02)} ${q(0.06)}`} fill="none" stroke={BLUSH} stroke-opacity={mk.hatch} stroke-width={Math.max(1, lwk * 0.8)} />
      {/each}
    {/each}
  {/if}
  {#if mk.gloom > 0.02}
    {#each [-0.16, -0.04, 0.08, 0.2] as x (x)}
      <path d={`M ${q(x)} ${q(-0.52)} L ${q(x)} ${q(-0.3 - Math.abs(x) * 0.3)}`} fill="none" stroke={stroke} stroke-opacity={0.4 * mk.gloom} stroke-width={Math.max(0.8, lwk * 0.6)} />
    {/each}
  {/if}
  {#if mk.sweat > 0.02}
    {@const dx = 0.46}
    {@const dy = -0.36}
    <path
      d={`M ${q(dx)} ${q(dy - 0.13)} C ${q(dx + 0.03)} ${q(dy - 0.06)} ${q(dx + 0.07)} ${q(dy - 0.02)} ${q(dx + 0.07)} ${q(dy + 0.02)} A ${q(0.07)} ${q(0.07)} 0 0 1 ${q(dx - 0.07)} ${q(dy + 0.02)} C ${q(dx - 0.07)} ${q(dy - 0.02)} ${q(dx - 0.03)} ${q(dy - 0.06)} ${q(dx)} ${q(dy - 0.13)} Z`}
      fill={TEAR_FILL}
      stroke={TEAR}
      opacity={mk.sweat}
      stroke-width={Math.max(0.9, lwk * 0.7)}
    />
  {/if}
  {#if mk.vein > 0.02}
    <!-- 💢 the anger vein, up on the other temple -->
    {@const vx = -0.44}
    {@const vy = -0.4}
    <path
      d={[-1, 1].flatMap((sx) => [-1, 1].map((sy) => `M ${q(vx + sx * 0.03)} ${q(vy + sy * 0.1)} Q ${q(vx + sx * 0.02)} ${q(vy + sy * 0.02)} ${q(vx + sx * 0.1)} ${q(vy + sy * 0.03)}`)).join(' ')}
      fill="none"
      stroke={VEIN}
      opacity={mk.vein}
      stroke-width={Math.max(1.1, lwk * 0.9)}
    />
  {/if}
{/snippet}

{#if faceOn}
  {#if look === 'peek'}
    <!-- peekers sit on the outline itself, so they skip the face's anchor -->
    {@const R = 0.2 * k * ch.eyeScale}
    {@const pr = 0.1 * k * ch.pupil}
    <g transform={`translate(${yawX.toFixed(2)} ${pitchY.toFixed(2)})`} stroke-linecap="round" stroke-linejoin="round">
      {#each [-1, 1] as side (side)}
        {@const ex = side * 0.3 * k}
        {@const ey = topEdge(shape, r, ex + yawX) + 0.05 * k}
        {#if beam || shut > 0.9}
          <path d={`M ${(ex - R * 0.8).toFixed(2)} ${(ey + R * 0.15).toFixed(2)} Q ${ex.toFixed(2)} ${(ey + (beam ? -R * 1.1 : R * 0.3)).toFixed(2)} ${(ex + R * 0.8).toFixed(2)} ${(ey + R * 0.15).toFixed(2)}`} fill="none" stroke={stroke} stroke-width={lwk * 1.1} />
        {:else}
          {@const reach = R - pr - 0.02 * k}
          {@const len = Math.max(1, Math.hypot(p.gaze.yaw, p.gaze.pitch))}
          <circle cx={ex} cy={ey} r={R} fill={WHITE} stroke={stroke} stroke-width={lwk * 0.85} />
          <circle cx={ex + (p.gaze.yaw / len) * reach} cy={ey + (p.gaze.pitch / len) * reach} r={pr} fill={stroke} />
          {#if shut > 0.05}
            <path d={lidSegment(ex, ey, R, shut)} fill={GROUND} />
            <path d={lidSegment(ex, ey, R, shut)} {fill} fill-opacity={fillOpacity} stroke={stroke} stroke-width={lwk * 0.85} />
          {/if}
        {/if}
      {/each}
    </g>
  {:else}
    <g transform={`translate(${yawX.toFixed(2)} ${(faceAnchor(shape) * r + pitchY).toFixed(2)}) rotate(${rollDeg.toFixed(2)}) scale(${(yawSquash * zoom).toFixed(4)} ${(pitchSquash * zoom).toFixed(4)})`} stroke-linecap="round" stroke-linejoin="round">
      {#if mk.blush > 0.02}
        <!-- the blush is autonomic: every look shows it -->
        {#each [-1, 1] as side (side)}
          <ellipse cx={side * 0.36 * sb} cy={0.11 * sb} rx={0.11 * sb} ry={0.05 * sb} fill={BLUSH} opacity={0.6 * mk.blush} />
        {/each}
      {/if}
      {#if look === 'lids'}
        {@const m = mouthPath(0.3, 1, sb)}
        {#each [-1, 1] as side (side)}
          {@const e = eye(side)}
          <defs>
            <clipPath id={`${uid}-eye${side}`}><ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} /></clipPath>
            <clipPath id={`${uid}-open${side}`}><path d={e.opening} /></clipPath>
            <clipPath id={`${uid}-band${side}`}><rect x={e.cx - e.rx - 4} y={e.band} width={e.rx * 2 + 8} height={Math.max(0, e.yl - e.band)} /></clipPath>
          </defs>
          {#if e.closed}
            <path d={e.shutLine} fill="none" stroke={stroke} stroke-width={lw} />
          {:else}
            <g clip-path={`url(#${uid}-eye${side})`}>
              <g clip-path={`url(#${uid}-open${side})`}>
                <ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill={WHITE} />
                <circle cx={e.px} cy={e.py} r={e.pr} fill={stroke} />
              </g>
              <path d={e.upperEdge} fill="none" stroke={stroke} stroke-width={lw} />
              {#if ch.lowerLid > 0.04}<path d={e.lowerEdge} fill="none" stroke={stroke} stroke-width={lw * 0.7} />{/if}
            </g>
            <g clip-path={`url(#${uid}-band${side})`}>
              <ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill="none" stroke={stroke} stroke-width={lw * 0.8} />
            </g>
          {/if}
          {#if ch.crinkle > 0.02}
            {#each [-0.45, 0, 0.45] as angle (angle)}
              {@const x0 = e.cx + side * (e.rx + 0.03 * sb)}
              {@const len = 0.07 * sb * ch.crinkle}
              <path d={`M ${x0} ${e.cy + 0.02 * sb} l ${side * len * Math.cos(angle)} ${len * Math.sin(angle)}`} stroke={stroke} stroke-opacity={ch.crinkle} stroke-width={lw * 0.7} />
            {/each}
          {/if}
          <path d={brow(side)} fill="none" stroke={stroke} stroke-width={lw * 1.35} />
        {/each}
        <path d={m.d} fill={m.open ? stroke : 'none'} stroke={stroke} stroke-width={lw} />
      {:else if look === 'dots' || look === 'brows'}
        {@const er = (look === 'dots' ? 0.085 : 0.07) * k * ch.eyeScale}
        {@const ex = look === 'dots' ? 0.33 : 0.27}
        {@const ey = look === 'dots' ? -0.1 : -0.04}
        {@const m = mouthPath(look === 'dots' ? 0.22 : 0.2, 0.75, k)}
        <g transform={gaze}>
          {#each [-1, 1] as side (side)}
            <ellipse cx={side * ex * k} cy={ey * k} rx={Math.max(0.9, er)} ry={Math.max(0.5, er * dotOpen)} fill={stroke} />
            {#if look === 'brows'}<path d={browK(side, ey)} fill="none" stroke={stroke} stroke-width={lwk} />{/if}
          {/each}
          <path d={m.d} fill={m.open ? stroke : 'none'} stroke={stroke} stroke-width={lwk} />
        </g>
      {:else if look === 'beans'}
        {@const talky = Math.abs(ch.mouthCurve) > 0.03 || ch.mouthOpen > 0.08 || Math.abs(p.expression.smirk) > 0.15}
        {@const m = mouthPath(0.23, 0.6, k)}
        <g transform={gaze}>
          {#each [-1, 1] as side (side)}
            {@const ex = side * 0.26 * k}
            {@const ey = -0.07 * k}
            <ellipse cx={ex} cy={ey} rx={Math.max(0.9, 0.068 * k * ch.eyeScale)} ry={Math.max(0.5, 0.14 * k * ch.eyeScale * dotOpen)} fill={stroke} />
            {#if k >= 12 && dotOpen > 0.5}<circle cx={ex - 0.024 * k} cy={ey - 0.06 * k * dotOpen} r={0.03 * k} fill={WHITE} />{/if}
          {/each}
          <!-- no mouth until there is something to say or feel -->
          {#if talky}<path d={m.d} fill={m.open ? stroke : 'none'} stroke={stroke} stroke-width={lwk} />{/if}
        </g>
      {:else if look === 'googly'}
        {@const R = 0.17 * k * ch.eyeScale}
        {@const pr = 0.085 * k * ch.pupil}
        {@const open = Math.min(1, (1 - shut) / 0.8) * (1 - 0.6 * ch.lowerLid)}
        {@const m = mouthPath(0.24, 0.65, k)}
        {#each [-1, 1] as side (side)}
          {@const ex = side * 0.3 * k}
          {@const ey = -0.1 * k}
          {@const reach = R - pr - 0.02 * k}
          {@const len = Math.max(1, Math.hypot(p.gaze.yaw, p.gaze.pitch))}
          <ellipse cx={ex} cy={ey} rx={R} ry={Math.max(0.6, R * open)} fill={WHITE} stroke={stroke} stroke-width={lwk * 0.8} />
          {#if open > 0.3}
            <ellipse cx={ex + (p.gaze.yaw / len) * reach} cy={ey + (p.gaze.pitch / len) * reach * open} rx={pr} ry={pr * Math.min(1, open * 1.4)} fill={stroke} />
          {/if}
        {/each}
        <path d={m.d} fill={m.open ? stroke : 'none'} stroke={stroke} stroke-width={lwk} />
      {:else if look === 'ink'}
        {@const iw = lwk * 1.15}
        {@const m = inkMouth()}
        <g transform={gaze}>
          {#each [-1, 1] as side, n (side)}
            {@const ex = side * 0.27 + wobble(seed, 20 + n) * 0.02}
            {#if shut > 0.8}
              <path d={`M ${q(ex - 0.07)} ${q(-0.08)} L ${q(ex + 0.07)} ${q(-0.075)}`} fill="none" stroke={INK} stroke-width={iw} />
            {:else if wide}
              <circle cx={ex * k} cy={-0.09 * k} r={0.065 * k} fill="none" stroke={INK} stroke-width={iw} />
            {:else if beam}
              <path d={`M ${q(ex - 0.08)} ${q(-0.05)} Q ${q(ex)} ${q(-0.2)} ${q(ex + 0.08)} ${q(-0.05)}`} fill="none" stroke={INK} stroke-width={iw} />
            {:else}
              {@const half = 0.095 * Math.max(0.15, dotOpen) * ch.eyeScale}
              <path d={`M ${q(ex + wobble(seed, 24 + n) * 0.015)} ${q(-0.095 - half)} L ${q(ex + wobble(seed, 26 + n) * 0.015)} ${q(-0.095 + half)}`} fill="none" stroke={INK} stroke-width={iw} />
            {/if}
          {/each}
          <path d={m.d} fill={m.open ? INK : 'none'} stroke={INK} stroke-width={iw} />
        </g>
      {:else if look === 'manga'}
        <!-- Manga: every glyph is picked from the pose, never from a feeling. The eye is an ink
             oval with a glint; the same few numbers turn it into ^ ^, > <, ◎, a heavy lid or T T,
             add brows only when they have something to say, and choose the mouth. -->
        {@const x = p.expression}
        {@const mc = x.mouthCurve}
        {@const mo = ch.mouthOpen}
        {@const shock = x.eyeOpening > 0.85}
        {@const big = x.eyeOpening > 0.45}
        {@const lidded = x.eyeOpening < -0.25}
        {@const squeeze = mo > 0.55 && x.eyeOpening < -0.3}
        {@const glare = x.browSlope > 0.4}
        <g transform={gaze}>
          {#each [-1, 1] as side (side)}
            {@const ex = side * 0.3}
            {@const ey = -0.08}
            {#if p.blink > 0.6 || x.eyeOpening < -0.8}
              <!-- shut: a calm arc when the cheeks are up, a line otherwise -->
              <path d={`M ${q(ex - 0.1)} ${q(ey)} Q ${q(ex)} ${q(ey + (x.cheekLift > 0.3 ? -0.07 : 0.035))} ${q(ex + 0.1)} ${q(ey)}`} fill="none" stroke={stroke} stroke-width={lwk} />
            {:else if squeeze}
              <!-- > < -->
              <path d={`M ${q(ex + side * 0.08)} ${q(ey - 0.08)} L ${q(ex - side * 0.06)} ${q(ey)} L ${q(ex + side * 0.08)} ${q(ey + 0.08)}`} fill="none" stroke={stroke} stroke-width={lwk * 1.1} />
            {:else if beam}
              <!-- ^ ^ -->
              <path d={`M ${q(ex - 0.11)} ${q(ey + 0.04)} Q ${q(ex)} ${q(ey - 0.13)} ${q(ex + 0.11)} ${q(ey + 0.04)}`} fill="none" stroke={stroke} stroke-width={lwk * 1.15} />
            {:else if mk.tears > 0.4}
              <!-- T T, and the stream -->
              <path d={`M ${q(ex)} ${q(ey + 0.02)} L ${q(ex)} ${q(0.34)}`} fill="none" stroke={TEAR} stroke-opacity={0.75 * mk.tears} stroke-width={Math.max(1.4, 0.075 * k)} />
              <path d={`M ${q(ex - 0.12)} ${q(ey - 0.03)} L ${q(ex + 0.12)} ${q(ey - 0.03)} M ${q(ex)} ${q(ey - 0.03)} L ${q(ex)} ${q(ey + 0.04)}`} fill="none" stroke={stroke} stroke-width={lwk} />
            {:else if shock}
              <!-- ◎ -->
              <circle cx={ex * k} cy={ey * k} r={0.13 * k} fill={WHITE} stroke={stroke} stroke-width={lwk * 0.85} />
              <circle cx={ex * k} cy={ey * k} r={0.04 * k} fill={stroke} />
            {:else}
              {@const cx = ex * k}
              {@const cy = ey * k}
              {@const rx = (big ? 0.095 : 0.075) * k}
              {@const ry = (big ? 0.125 : 0.1) * k * Math.max(0.15, 1 - p.blink) * (1 - 0.45 * ch.lowerLid)}
              {#if lidded}
                <!-- a heavy lid: the oval cut flat across the top — sleepy, bored, contempt -->
                {@const cut = cy - ry * 0.15}
                {@const sl = ch.lidSlant * k * 1.5}
                <path d={`M ${cx - rx} ${cut} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cut} Z`} fill={stroke} />
                <path d={`M ${cx - rx * 1.25} ${cut + side * sl} L ${cx + rx * 1.25} ${cut - side * sl}`} fill="none" stroke={stroke} stroke-width={lwk * 1.1} />
              {:else if glare}
                <!-- a glare: the lid comes down hard at the inner corner, cutting the eye along a slant -->
                {@const inX = cx - side * rx * 1.25}
                {@const outX = cx + side * rx * 1.25}
                {@const inY = cy - ry * 0.3}
                {@const outY = cy - ry * 1.15}
                <defs><clipPath id={`${uid}-glare${side}`}><path d={`M ${inX} ${inY} L ${outX} ${outY} L ${outX} ${cy + ry + 3} L ${inX} ${cy + ry + 3} Z`} /></clipPath></defs>
                <ellipse {cx} {cy} {rx} {ry} fill={stroke} clip-path={`url(#${uid}-glare${side})`} />
                <path d={`M ${inX} ${inY} L ${outX} ${outY}`} fill="none" stroke={stroke} stroke-width={lwk * 1.2} />
              {:else}
                <ellipse {cx} {cy} {rx} {ry} fill={stroke} />
                {#if k >= 14}<circle cx={cx - 0.3 * rx} cy={cy - 0.35 * ry} r={0.32 * rx} fill={WHITE} />{/if}
              {/if}
            {/if}
            {#if Math.abs(x.browSlope) > 0.25 || x.browLift > 0.45}
              <!-- brows only when they have something to say: down at the inner end for anger, up for worry, arched for surprise -->
              {@const lift = 0.09 * Math.max(0, x.browLift)}
              {@const tilt = 0.07 * x.browSlope}
              {@const ix = ex - side * 0.08}
              {@const ox = ex + side * 0.14}
              {@const by = ey - 0.2 - lift}
              <path d={`M ${q(ix)} ${q(by + tilt)} Q ${q(ex + side * 0.03)} ${q(by - 0.03 - (x.browLift > 0.45 ? 0.03 : 0))} ${q(ox)} ${q(by - 0.4 * tilt)}`} fill="none" stroke={stroke} stroke-width={lwk} />
            {/if}
          {/each}
          {#if mo > 0.25 && Math.abs(mc) < 0.25}
            <!-- O -->
            <ellipse cx="0" cy={0.21 * k} rx={(0.045 + 0.03 * mo) * k} ry={(0.05 + 0.06 * mo) * k} fill={stroke} />
          {:else if mo > 0.45 && mc >= 0.2}
            <!-- D: a laugh, with a tongue -->
            {@const w = 0.1 + 0.05 * mo}
            {@const h = 0.1 + 0.12 * mo}
            <path d={`M ${q(-w)} ${q(0.15)} L ${q(w)} ${q(0.15)} Q ${q(w)} ${q(0.15 + h)} 0 ${q(0.15 + h)} Q ${q(-w)} ${q(0.15 + h)} ${q(-w)} ${q(0.15)} Z`} fill={stroke} stroke={stroke} stroke-width={lwk * 0.8} />
            <ellipse cx="0" cy={(0.15 + h * 0.72) * k} rx={w * 0.5 * k} ry={h * 0.22 * k} fill={TONGUE} />
          {:else if mo > 0.12 && mc >= -0.2}
            <!-- ▽ -->
            {@const mw = 0.08 + 0.06 * mo}
            {@const mh = 0.03 + 0.14 * mo}
            <path d={`M ${q(-mw)} ${q(0.15)} L ${q(mw)} ${q(0.15)} L 0 ${q(0.15 + mh)} Z`} fill={stroke} stroke={stroke} stroke-width={lwk * 0.8} />
          {:else if mo > 0.12}
            <!-- □: a shout -->
            {@const h = 0.06 + 0.12 * mo}
            <path d={`M ${q(-0.06)} ${q(0.16)} L ${q(0.06)} ${q(0.16)} L ${q(0.1)} ${q(0.16 + h)} L ${q(-0.1)} ${q(0.16 + h)} Z`} fill={stroke} stroke={stroke} stroke-width={lwk} />
          {:else if Math.abs(x.smirk) > 0.35}
            <!-- a smirk: one corner hooks up; when the mouth also turns down, the other end sags — a sneer -->
            {@const sd = Math.sign(x.smirk)}
            {@const hook = 0.05 + 0.05 * Math.abs(x.smirk)}
            {@const sag = 0.1 * Math.max(0, -mc)}
            <path d={`M ${q(-sd * 0.12)} ${q(0.2 + sag)} L ${q(sd * 0.03)} ${q(0.2)} Q ${q(sd * 0.1)} ${q(0.2)} ${q(sd * 0.13)} ${q(0.2 - hook)}`} fill="none" stroke={stroke} stroke-width={lwk} />
          {:else if mc > 0.45}
            <!-- ‿ wide -->
            <path d={`M ${q(-0.15)} ${q(0.17)} Q 0 ${q(0.31)} ${q(0.15)} ${q(0.17)}`} fill="none" stroke={stroke} stroke-width={lwk} />
          {:else if mc > 0.15}
            <!-- ‿ -->
            <path d={`M ${q(-0.1)} ${q(0.19)} Q 0 ${q(0.26)} ${q(0.1)} ${q(0.19)}`} fill="none" stroke={stroke} stroke-width={lwk} />
          {:else if mc < -0.45}
            <!-- ～ -->
            {@const amp = 0.02 + 0.03 * Math.min(1, -mc)}
            <path d={`M ${q(-0.12)} ${q(0.23)} Q ${q(-0.09)} ${q(0.23 - 2 * amp)} ${q(-0.06)} ${q(0.23)} T 0 ${q(0.23)} T ${q(0.06)} ${q(0.23)} T ${q(0.12)} ${q(0.23)}`} fill="none" stroke={stroke} stroke-width={lwk} />
          {:else if mc < -0.15}
            <!-- ︵ -->
            <path d={`M ${q(-0.09)} ${q(0.24)} Q 0 ${q(0.17)} ${q(0.09)} ${q(0.24)}`} fill="none" stroke={stroke} stroke-width={lwk} />
          {:else}
            <!-- ω -->
            <path d={`M ${q(-0.11)} ${q(0.15)} A ${q(0.055)} ${q(0.055)} 0 0 0 0 ${q(0.15)} A ${q(0.055)} ${q(0.055)} 0 0 0 ${q(0.11)} ${q(0.15)}`} fill="none" stroke={stroke} stroke-width={lwk} />
          {/if}
          {@render marksLayer()}
        </g>
      {/if}
    </g>
  {/if}
  {#if look === 'manga'}
    {@const top = topEdge(shape, r, 0)}
    {#if mk.exclaim > 0.02}
      <!-- ! the unexpected, over the head -->
      {@const x = 0.5 * r}
      {@const y = top - 0.12 * s}
      <g opacity={mk.exclaim} stroke-linecap="round">
        <path d={`M ${x} ${y - 0.36 * s} L ${x - 0.01 * s} ${y - 0.12 * s}`} stroke={INK} stroke-width={Math.max(2, 0.07 * s)} />
        <circle cx={x - 0.012 * s} cy={y - 0.02 * s} r={Math.max(1.2, 0.04 * s)} fill={INK} />
      </g>
    {/if}
    {#if mk.sparkles > 0.02}
      <!-- sparkles: never gold, gold is the money's -->
      {#each [[-0.66, 0.18, 0.13], [0.72, 0.3, 0.1], [0.42, -0.12, 0.08]] as [sx, sy, sr] (sx)}
        {@const R = sr * s}
        {@const cx = sx * r}
        {@const cy = top + sy * r}
        <path
          d={`M ${cx} ${cy - R} Q ${cx} ${cy} ${cx + R} ${cy} Q ${cx} ${cy} ${cx} ${cy + R} Q ${cx} ${cy} ${cx - R} ${cy} Q ${cx} ${cy} ${cx} ${cy - R} Z`}
          fill={WHITE}
          stroke={stroke}
          stroke-width={Math.max(0.8, 0.012 * r)}
          opacity={mk.sparkles}
        />
      {/each}
    {/if}
  {/if}
{/if}
