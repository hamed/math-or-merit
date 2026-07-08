<script lang="ts">
  import { onMount } from 'svelte';
  import { giniCoefficient } from '$lib/research';
  import { noise } from '../shared/layout';

  /**
   * The Gini build-up, as storyboarded by the owner (review 2026-07-08):
   * equal circles merge one by one into a running total — the straight
   * diagonal. Keep the graph, deal an unequal room (Gini ≈ 0.5), sort it,
   * merge again — the line sags. The gap IS the inequality; hatching shows
   * the area ratio; a slider then bends the curve for intuition.
   *
   * TOY discipline: the slider's rooms are parametric Lorenz curves
   * (L(x) = x^k), not simulation output; the number shown is the discrete
   * Gini of the twelve circles actually on screen.
   */
  const N = 12;

  // plot: an exactly square frame — both axes are shares from 0 to 1
  const PX = 118;
  const BY = 260;
  const S = 236;
  const ROW_Y = 312;
  const R_TOT = 34; // the all-of-it circle; every radius is R_TOT·√share

  const px = (x: number) => PX + x * S;
  const py = (y: number) => BY - y * S;
  const slotX = (i: number) => PX + ((i + 0.5) / N) * S;

  /** Discrete weights whose Lorenz curve is L(x) = x^k, ascending by design. */
  function lorenzWeights(k: number): number[] {
    return Array.from({ length: N }, (_, i) => Math.pow((i + 1) / N, k) - Math.pow(i / N, k));
  }

  const EQUAL_W = Array.from({ length: N }, () => 1 / N);
  const PRESET_W = lorenzWeights(3); // Gini exactly 0.5 in the continuous limit

  // a fixed shuffle so the unequal room first appears unsorted
  const SHUFFLE = Array.from({ length: N }, (_, i) => i).sort((a, b) => noise(a, 41) - noise(b, 41));

  type Phase = 'equal' | 'equalMerge' | 'unequal' | 'unequalMerge' | 'gap' | 'play';
  let phase = $state<Phase>('equal');
  let merged = $state(0); // circles absorbed into the running total so far
  let sorted = $state(false);
  let gini = $state(0.5); // slider value in the play phase
  let timer: ReturnType<typeof setInterval> | null = null;

  const weights = $derived(
    phase === 'equal' || phase === 'equalMerge'
      ? EQUAL_W
      : phase === 'play'
        ? lorenzWeights((1 + gini) / (1 - gini))
        : PRESET_W,
  );

  const cum = $derived.by(() => {
    const out = [0];
    let t = 0;
    for (const w of weights) out.push((t += w));
    return out;
  });

  const shownGini = $derived(giniCoefficient(Float64Array.from(weights)));

  const merging = $derived(phase === 'equalMerge' || phase === 'unequalMerge');

  // curve points revealed so far (all of them outside the merge phases)
  const curvePoints = $derived.by(() => {
    const upTo = merging ? merged : phase === 'equal' || phase === 'unequal' ? 0 : N;
    return Array.from({ length: upTo + 1 }, (_, j) => `${px(j / N).toFixed(1)},${py(cum[j]).toFixed(1)}`);
  });

  // the smooth slider curve (play phase draws the continuous family)
  const playPath = $derived.by(() => {
    if (phase !== 'play') return '';
    const k = (1 + gini) / (1 - gini);
    let d = `M ${px(0)} ${py(0)}`;
    for (let t = 1; t <= 48; t++) {
      const x = t / 48;
      d += ` L ${px(x).toFixed(1)} ${py(Math.pow(x, k)).toFixed(1)}`;
    }
    return d;
  });

  const gapPath = $derived.by(() => {
    if (phase !== 'gap' && phase !== 'play') return '';
    let d = `M ${px(0)} ${py(0)} L ${px(1)} ${py(1)}`;
    if (phase === 'gap') {
      // hug the discrete polyline the reader just watched being drawn
      for (let j = N; j >= 0; j--) d += ` L ${px(j / N).toFixed(1)} ${py(cum[j]).toFixed(1)}`;
    } else {
      const k = (1 + gini) / (1 - gini);
      for (let t = 48; t >= 0; t--) {
        const x = t / 48;
        d += ` L ${px(x).toFixed(1)} ${py(Math.pow(x, k)).toFixed(1)}`;
      }
    }
    return d + ' Z';
  });

  const diagonalDone = $derived(phase !== 'equal' && phase !== 'equalMerge');

  function startMerge(next: 'equalMerge' | 'unequalMerge'): void {
    phase = next;
    merged = 0;
    timer = setInterval(() => {
      merged += 1;
      if (merged >= N) {
        stopTimer();
        if (phase === 'unequalMerge') phase = 'gap';
      }
    }, 340);
  }

  function stopTimer(): void {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function reset(): void {
    stopTimer();
    phase = 'equal';
    merged = 0;
    sorted = false;
    gini = 0.5;
  }

  onMount(() => () => stopTimer());

  // where each of the twelve circles sits right now
  function circleX(i: number): number {
    if ((phase === 'unequal' || phase === 'unequalMerge') && !sorted) return slotX(SHUFFLE[i]);
    return slotX(i);
  }

  const accumVisible = $derived(merging && merged > 0);
  const accumX = $derived(slotX(Math.max(0, merged - 1)));
  const accumR = $derived(R_TOT * Math.sqrt(cum[Math.max(0, merged)]));

  const captions: Record<Phase, string> = {
    equal: 'Twelve people, all equal. Add them up, left to right, and plot the running total.',
    equalMerge: 'Each step adds the same slice — the running total climbs in a perfectly straight line.',
    unequal: 'Keep the graph. New room, same total — but unequal. First, sort them.',
    unequalMerge: 'The poor add almost nothing — the line crawls. The rich arrive last — it leaps.',
    gap: 'The sag is the inequality. Gini = the hatched gap ÷ everything under the straight line: 0 means all equal, 1 means one owner.',
    play: 'Bend it yourself. The circles are the room the curve describes.',
  };

  const buttonLabel = $derived.by(() => {
    if (phase === 'equal') return 'Add them up';
    if (phase === 'equalMerge' && merged >= N) return 'Now, an unequal room';
    if (phase === 'unequal') return sorted ? 'Add them up' : 'Sort them';
    if (phase === 'gap') return 'Bend it yourself';
    return null;
  });

  function advance(): void {
    if (phase === 'equal') startMerge('equalMerge');
    else if (phase === 'equalMerge' && merged >= N) {
      phase = 'unequal';
      sorted = false;
      merged = 0;
    } else if (phase === 'unequal' && !sorted) sorted = true;
    else if (phase === 'unequal' && sorted) startMerge('unequalMerge');
    else if (phase === 'gap') phase = 'play';
  }
</script>

<div class="widget" aria-label="Building the Gini coefficient from twelve circles">
  <p class="kicker">One number for the whole room</p>

  <svg viewBox="0 0 480 352" role="img" aria-label="Circles merging into a running total; the Lorenz curve and the Gini gap">
    <defs>
      <pattern id="gini-hatch" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="7" stroke="#8b3f2b" stroke-width="1.3" />
      </pattern>
    </defs>

    <!-- square frame: both axes are shares, 0 to 1, same scale -->
    <line class="axis" x1={px(0)} y1={py(0)} x2={px(1) + 6} y2={py(0)} />
    <line class="axis" x1={px(0)} y1={py(0)} x2={px(0)} y2={py(1) - 6} />
    {#each [0, 0.5, 1] as t}
      <text class="tick" x={px(t)} y={py(0) + 15} text-anchor="middle">{t * 100}%</text>
      <text class="tick" x={px(0) - 7} y={py(t) + 3.5} text-anchor="end">{t * 100}%</text>
    {/each}
    <text class="axis-label" x={px(0.5)} y={py(0) + 30} text-anchor="middle">share of people, poorest first</text>
    <text class="axis-label" x={px(0) - 84} y={py(0.5)} text-anchor="middle" transform={`rotate(-90 ${px(0) - 84} ${py(0.5)})`}>share of wealth</text>

    {#if gapPath}
      <path class="gap" d={gapPath} />
    {/if}

    {#if diagonalDone}
      <line class="diagonal settled" x1={px(0)} y1={py(0)} x2={px(1)} y2={py(1)} />
    {/if}

    {#if phase === 'play'}
      <path class="curve" d={playPath} />
    {:else if curvePoints.length > 1}
      <polyline
        class="curve"
        class:is-diagonal={phase === 'equal' || phase === 'equalMerge'}
        points={curvePoints.join(' ')}
        fill="none"
      />
    {/if}

    {#if phase === 'gap' || phase === 'play'}
      <text class="gini-readout" x={px(0.06)} y={py(0.9)}>Gini ≈ {shownGini.toFixed(2)}</text>
    {/if}

    <!-- the twelve circles under the axis; radius = R·√share, area-true -->
    {#each weights as w, i}
      <circle
        class="person"
        class:consumed={merging && i < merged}
        style={`transform: translate(${circleX(i)}px, ${ROW_Y}px)`}
        r={Math.max(1.1, R_TOT * Math.sqrt(w))}
      />
    {/each}

    <!-- the running total rolls left to right, swallowing as it goes -->
    {#if accumVisible}
      <circle class="accum" style={`transform: translate(${accumX}px, ${ROW_Y}px)`} r={accumR} />
    {/if}
  </svg>

  <p class="caption" aria-live="polite">{captions[phase]}</p>

  <div class="toolbar">
    {#if buttonLabel}
      <button class="primary" type="button" onclick={advance}>{buttonLabel}</button>
    {/if}
    {#if phase === 'play'}
      <label class="gini-label">
        Gini {gini.toFixed(2)}
        <input type="range" min="0" max="0.92" step="0.01" bind:value={gini} aria-label="Target Gini" />
      </label>
    {/if}
    <button type="button" onclick={reset} disabled={phase === 'equal'}>Start over</button>
  </div>
</div>

<style>
  svg {
    display: block;
    inline-size: 100%;
    block-size: auto;
  }

  .axis {
    stroke: #a99980;
    stroke-width: 1.2;
  }

  .tick {
    fill: #756c5d;
    font-size: 10.5px;
    font-variant-numeric: tabular-nums;
  }

  .axis-label {
    fill: #756c5d;
    font-size: 10.5px;
    font-style: italic;
  }

  .diagonal.settled {
    stroke: #a99980;
    stroke-width: 1.6;
    stroke-dasharray: 6 5;
  }

  .curve {
    stroke: #8b3f2b;
    stroke-width: 2.4;
    stroke-linecap: round;
    stroke-linejoin: round;
    fill: none;
  }

  .curve.is-diagonal {
    stroke: #5c5344;
  }

  .gap {
    fill: url(#gini-hatch);
    opacity: 0.55;
    stroke: none;
  }

  .gini-readout {
    fill: #8b3f2b;
    font-size: 16px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .person {
    fill: var(--agent-fill-blue, #b7cff9);
    stroke: var(--agent-stroke-blue, #284e99);
    stroke-width: 1.2;
    fill-opacity: 0.8;
    transition:
      transform 0.7s cubic-bezier(0.45, 0, 0.2, 1),
      r 0.7s cubic-bezier(0.45, 0, 0.2, 1),
      opacity 0.3s ease;
  }

  .person.consumed {
    opacity: 0;
  }

  .accum {
    fill: var(--agent-fill-teal, #9bdcdb);
    stroke: var(--agent-stroke-teal, #1d9999);
    stroke-width: 1.6;
    fill-opacity: 0.85;
    transition:
      transform 0.32s ease-out,
      r 0.32s ease-out;
  }

  .gini-label {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.78rem;
    font-weight: 650;
    font-variant-numeric: tabular-nums;
    color: #5c5344;
  }

  input[type='range'] {
    accent-color: #8b3f2b;
  }
</style>
