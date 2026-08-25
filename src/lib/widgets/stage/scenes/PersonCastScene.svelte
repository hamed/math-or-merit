<script lang="ts" module>
  import type { BeatSpec } from '../contract';

  import figure from './person/00-figure.webp';
  import head01 from './person/01-head.webp';
  import head02 from './person/02-head.webp';
  import head03 from './person/03-head.webp';
  import head04 from './person/04-head.webp';
  import head05 from './person/05-head.webp';
  import head06 from './person/06-head.webp';
  import head07 from './person/07-head.webp';
  import head08 from './person/08-head.webp';
  import head09 from './person/09-head.webp';
  import head10 from './person/10-head.webp';

  export const BEATS: readonly BeatSpec[] = [
    { label: 'person', length: 1.1 },
    { label: 'face', length: 0.9 },
    { label: 'strip', length: 1.6 },
    { label: 'circle', length: 0.9 },
    { label: 'coins', length: 1.2 },
    { label: 'one', length: 1 },
    { label: 'slide', length: 0.9 },
  ];

  /**
   * The reduction, plate by plate.
   *
   * `beat` is where the plate cuts in. The 'strip' beat holds most of them: the
   * details come off one cut at a time as the reader scrolls, which is the beat
   * doing its own work rather than a caption claiming it happened. Their spacing
   * inside the beat is computed, not authored — see stripAt() below.
   */
  export const PLATES: readonly { src: string; beat: string }[] = [
    { src: figure, beat: 'person' },
    { src: head01, beat: 'face' },
    { src: head02, beat: 'strip' },
    { src: head03, beat: 'strip' },
    { src: head04, beat: 'strip' },
    { src: head05, beat: 'strip' },
    { src: head06, beat: 'strip' },
    { src: head07, beat: 'strip' },
    { src: head08, beat: 'strip' },
    { src: head09, beat: 'strip' },
    { src: head10, beat: 'circle' },
  ];

  /**
   * Honeycomb lattice of 14 identical coins whose total area equals the r=62
   * circle (r = 62/√14). Wealth is coin COUNT at a fixed coin size — the
   * canonical coin never changes size (owner review 2026-07-08).
   */
  const COIN_R = 62 / Math.sqrt(14);
  const COIN_GRID: { cx: number; cy: number }[] = [];
  {
    const dx = COIN_R * 2;
    const dy = COIN_R * Math.sqrt(3);
    const rows = [3, 4, 4, 3];
    rows.forEach((count, ri) => {
      const y = 150 + (ri - 1.5) * dy;
      for (let ci = 0; ci < count; ci++) {
        COIN_GRID.push({ cx: 240 + (ci - (count - 1) / 2) * dx, cy: y });
      }
    });
  }

</script>

<script lang="ts">
  import { getContext, onMount } from 'svelte';
  import { STAGE_CONTEXT, type StageContext } from '../contract';
  import { SPHERE } from './paths';
  import { SEAT_A, VIEWBOX_H as TRADE_VIEWBOX_H } from './TradeScene.svelte';
  import { assignStyles } from '../../shared/agentStyle';
  import Coin from './Coin.svelte';

  const stage = getContext<StageContext | undefined>(STAGE_CONTEXT);

  // The person reduces to the room's first agent: same fill/stroke it will
  // wear in every later scene (display-only continuity, agentStyle.ts GUARD).
  const agentZero = assignStyles(1)[0];

  /** Panel switch width. See CowCastScene for why this is a cut, not a fade. */
  const SWITCH = 0.05;

  /**
   * The last plate has to become SPHERE, because everything after it — the
   * coin lattice, the park-left slide, every later scene's agent — is built
   * around that exact circle.
   *
   * The plate is 1543x900, which is the 480:280 stage aspect, so it fills the
   * viewBox with no letterbox: one plate pixel is 480/1543 units. Measured
   * there, the drawn circle sits at (240.2, 134.2) with radius 105.2, against
   * SPHERE's (240, 150) radius 62. So the plate shrinks by 62/105.2 and the
   * origin is solved from where the circle must END, the same way the cow's
   * closing push is: P = (s·B - C)/(s - 1).
   *
   * That shrink is not just plumbing — 'circle' is the beat whose caption calls
   * the leftover offensively small, so the reduction is the picture.
   */
  const CIRCLE_FIT = (() => {
    const k = 480 / 1543;
    const b = { x: 772 * k, y: 431.5 * k };
    const r = 338.25 * k;
    const s = 62 / r;
    const p = (bv: number, cv: number) => (s * bv - cv) / (s - 1);
    return { scale: s, origin: `${p(b.x, 240).toFixed(1)} ${p(b.y, 150).toFixed(1)}` };
  })();

  /**
   * Where the circle goes at the close: trader A's seat in the next scene, so
   * the room is already made for the second circle when that scene opens and
   * the same circle simply carries on.
   *
   * The seat is published by TradeScene rather than copied, and the y is
   * corrected by half the viewBox difference: that stage is 300 units tall
   * against this one's 280, both centred in the same box, so the same screen
   * point sits 10 units lower over there.
   */
  const SEAT = {
    x: SEAT_A.x - 240,
    y: SEAT_A.y - (TRADE_VIEWBOX_H - 280) / 2 - 150,
    scale: SEAT_A.r / 62,
  };

  let plates: SVGImageElement[] = [];
  let body: SVGPathElement;
  let bodyG: SVGGElement;
  let coins: SVGGElement;

  onMount(() => {
    stage?.attach(BEATS, (tl) => {
      const coinEls = coins.querySelectorAll<SVGGElement>('.lattice-coin');

      // Absolute timeline positions, not label arithmetic. A switch sits half a
      // SWITCH BEFORE its beat, and 'label+=-0.025' is not something gsap parses
      // as a negative offset — it silently lands somewhere else, which stranded
      // a plate on screen for the whole scene. Beat starts are the same
      // cumulative sums PinScene uses for its labels, so these line up exactly.
      const startOf = new Map<string, number>();
      {
        let t = 0;
        for (const beat of BEATS) {
          startOf.set(beat.label, t);
          t += beat.length;
        }
      }

      // Plates sharing the 'strip' beat are spread evenly across it, so the
      // reduction paces itself off the beat length instead of hard-coded
      // offsets that would drift the moment a plate is added or removed.
      const stripCount = PLATES.filter((p) => p.beat === 'strip').length;
      const stripSpan = BEATS.find((b) => b.label === 'strip')!.length;
      let stripSeen = -1;
      const offsetFor = (beat: string) => {
        if (beat !== 'strip') return 0;
        stripSeen += 1;
        return (stripSeen * stripSpan) / stripCount;
      };

      PLATES.forEach((plate, i) => {
        const el = plates[i];
        if (!el) return;

        if (i === 0) {
          tl.fromTo(el, { autoAlpha: 1 }, { autoAlpha: 1, duration: 0.01 }, startOf.get('person'));
          return;
        }

        const at = startOf.get(plate.beat)! + offsetFor(plate.beat) - SWITCH * 0.5;
        tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: SWITCH, ease: 'steps(1)' }, at);
        tl.to(plates[i - 1], { autoAlpha: 0, duration: SWITCH, ease: 'steps(1)' }, at);
      });

      const circleAt = startOf.get('circle')!;

      // circle — the last plate shrinks onto SPHERE, then hands over to the real
      // path. The two coincide exactly at that moment, so the swap is invisible;
      // from here on the circle is a vector again and can take the agent colors.
      const last = plates[PLATES.length - 1];
      tl.fromTo(
        last,
        { scale: 1, svgOrigin: CIRCLE_FIT.origin },
        { scale: CIRCLE_FIT.scale, svgOrigin: CIRCLE_FIT.origin, duration: 0.55, ease: 'power2.inOut' },
        circleAt,
      );
      tl.to(last, { autoAlpha: 0, duration: 0.01, ease: 'steps(1)' }, circleAt + 0.55);
      tl.fromTo(body, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, ease: 'steps(1)' }, circleAt + 0.55);
      tl.to(body, { fill: agentZero.fill, stroke: agentZero.stroke, duration: 0.3 }, circleAt + 0.56);

      // coins — the circle IS money: same area, fourteen golden pieces
      tl.to(body, { autoAlpha: 0, scale: 0.92, duration: 0.25 }, 'coins');
      tl.fromTo(
        coinEls,
        { scale: 0, autoAlpha: 0, transformOrigin: '50% 50%' },
        { scale: 1, autoAlpha: 1, duration: 0.3, stagger: { each: 0.035, from: 'center' } },
        'coins+=0.1',
      );

      // one — the coins pour back into a single person-sized circle
      tl.to(
        coinEls,
        {
          x: (_, el) => Number((el as SVGGElement).dataset.dx),
          y: (_, el) => Number((el as SVGGElement).dataset.dy),
          scale: 0.35,
          autoAlpha: 0,
          duration: 0.35,
          stagger: { each: 0.02, from: 'edges' },
        },
        'one',
      );
      tl.to(body, { autoAlpha: 1, scale: 1, duration: 0.3 }, 'one+=0.3');

      // slide — the circle steps aside to open a seat for the trader who is
      // about to arrive, and settles at the size its wealth earns. The next
      // scene opens on it exactly here and gives it NO entrance, so there is
      // one circle across the section boundary rather than one leaving and
      // another taking its place.
      //
      // Translation and scale are split across two elements on purpose: gsap
      // recomputes x/y when a scale about a fixed origin shares an element with
      // a translation, and the circle teleports (the lesson CowScene records).
      tl.to(bodyG, { x: SEAT.x, y: SEAT.y, duration: 0.55, ease: 'power1.inOut' }, 'slide+=0.1');
      tl.to(
        body,
        { scale: SEAT.scale, transformOrigin: '50% 50%', duration: 0.55, ease: 'power1.inOut' },
        'slide+=0.1',
      );
    });
  });
</script>

<figure
  class="scene-art person-stage"
  aria-label="A person drawn in full, then simplified step by step until nothing is left but a circle, and then the circle becomes coins"
>
  <svg viewBox="0 0 480 280" role="img">
    {#each PLATES as plate, i}
      <image
        bind:this={plates[i]}
        href={plate.src}
        x="0"
        y="0"
        width="480"
        height="280"
        preserveAspectRatio="xMidYMid meet"
      />
    {/each}

    <g bind:this={bodyG}>
      <path bind:this={body} class="body" d={SPHERE} />
    </g>

    <g bind:this={coins} class="coins">
      {#each COIN_GRID as c}
        <g class="lattice-coin" data-dx={240 - c.cx} data-dy={150 - c.cy}>
          <Coin cx={c.cx} cy={c.cy} r={COIN_R} />
        </g>
      {/each}
    </g>
  </svg>
</figure>

<style>
  .body {
    fill: #f6ead2;
    stroke: #3c352b;
    stroke-width: 2.6;
  }

  /* Matches the cow cast's stage: these are illustrations, not the sparse line
     art the default 54rem was sized for. */
  .scene-art.person-stage svg {
    inline-size: min(94vw, 62rem);
  }
</style>
