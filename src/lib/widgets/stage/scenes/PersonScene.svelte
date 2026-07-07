<script lang="ts" module>
  import type { BeatSpec } from '../contract';

  export const BEATS: readonly BeatSpec[] = [
    { label: 'person', length: 1.1 },
    { label: 'strip', length: 1.3 },
    { label: 'circle', length: 0.9 },
    { label: 'coins', length: 1.2 },
    { label: 'one', length: 1 },
  ];

  /** 4×4 grid of equal coins whose total area equals the r=62 circle. */
  const COIN_R = 15.5;
  const COIN_GRID: { cx: number; cy: number }[] = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      COIN_GRID.push({ cx: 240 + (col - 1.5) * 44, cy: 150 + (row - 1.5) * 44 });
    }
  }
</script>

<script lang="ts">
  import { getContext, onMount } from 'svelte';
  import { STAGE_CONTEXT, type StageContext } from '../contract';
  import { SPHERE } from './paths';
  import { assignStyles } from '../../shared/agentStyle';

  const stage = getContext<StageContext | undefined>(STAGE_CONTEXT);

  // The person reduces to the room's first agent: same fill/stroke it will
  // wear in every later scene (display-only continuity, agentStyle.ts GUARD).
  const agentZero = assignStyles(1)[0];

  let root: SVGSVGElement;
  let body: SVGPathElement;
  let person: SVGGElement;
  let torso: SVGGElement;
  let armLeft: SVGGElement;
  let armRight: SVGGElement;
  let rocket: SVGGElement;
  let headG: SVGGElement;
  let shoes: SVGGElement;
  let coins: SVGGElement;

  onMount(() => {
    stage?.attach(BEATS, (tl) => {
      const coinEls = coins.querySelectorAll<SVGCircleElement>('circle');

      // person — the cartoon fortune arrives over the waiting circle
      tl.fromTo(person, { autoAlpha: 0, y: -10 }, { autoAlpha: 1, y: 0, duration: 0.4 }, 'person+=0.1');
      tl.fromTo(body, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, 'person');

      // strip — every biography detail flies off; the circle remains
      tl.to(rocket, { x: 96, y: -84, rotation: 40, autoAlpha: 0, transformOrigin: '50% 50%', duration: 0.3 }, 'strip');
      tl.to(armRight, { scale: 0.2, autoAlpha: 0, transformOrigin: '0% 0%', duration: 0.25 }, 'strip+=0.15');
      tl.to(armLeft, { scale: 0.2, autoAlpha: 0, transformOrigin: '100% 0%', duration: 0.25 }, 'strip+=0.28');
      tl.to(shoes, { y: 30, autoAlpha: 0, duration: 0.25 }, 'strip+=0.42');
      tl.to(headG, { y: 24, scale: 0.6, autoAlpha: 0, transformOrigin: '50% 50%', duration: 0.3 }, 'strip+=0.55');
      tl.to(torso, { scale: 0.75, autoAlpha: 0, transformOrigin: '50% 50%', duration: 0.3 }, 'strip+=0.75');

      // circle — the leftover takes the agent's colors
      tl.to(body, { fill: agentZero.fill, stroke: agentZero.stroke, duration: 0.4 }, 'circle');
      tl.to(body, { scale: 1.06, transformOrigin: '50% 50%', duration: 0.2, yoyo: true, repeat: 1 }, 'circle+=0.45');

      // coins — the circle IS money: same area, sixteen golden pieces
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
          x: (_, el) => Number((el as SVGCircleElement).dataset.dx),
          y: (_, el) => Number((el as SVGCircleElement).dataset.dy),
          scale: 0.35,
          autoAlpha: 0,
          duration: 0.35,
          stagger: { each: 0.02, from: 'edges' },
        },
        'one',
      );
      tl.to(body, { autoAlpha: 1, scale: 1, duration: 0.3 }, 'one+=0.3');
    });
  });
</script>

<figure class="scene-art" aria-label="A person simplified to a circle, then to money">
  <svg bind:this={root} viewBox="0 0 480 280" role="img">
    <path bind:this={body} class="body" d={SPHERE} />

    <g bind:this={person} class="person">
      <g bind:this={torso}>
        <path class="suit" d="M 208 126 L 272 126 L 288 246 L 192 246 Z" />
        <path class="shirt" d="M 230 126 L 240 158 L 250 126 Z" />
        <path class="tie" d="M 237 130 L 243 130 L 242 152 L 240 162 L 238 152 Z" />
      </g>
      <g bind:this={armLeft}>
        <path d="M 210 136 Q 184 158 178 186" fill="none" class="limb" />
        <circle cx="177" cy="192" r="7" class="skin" />
      </g>
      <g bind:this={armRight}>
        <path d="M 270 136 Q 298 148 308 142" fill="none" class="limb" />
        <circle cx="313" cy="140" r="7" class="skin" />
      </g>
      <g bind:this={rocket}>
        <g transform="rotate(-32 322 122)">
          <rect x="316" y="102" width="13" height="34" rx="6" class="hull" />
          <path d="M 316 108 Q 322.5 92 329 108 Z" class="nose" />
          <path d="M 316 132 L 309 144 L 316 138 Z" class="fin" />
          <path d="M 329 132 L 336 144 L 329 138 Z" class="fin" />
          <circle cx="322.5" cy="114" r="3" class="window" />
        </g>
      </g>
      <g bind:this={headG}>
        <circle cx="240" cy="94" r="28" class="skin" />
        <path class="hair" d="M 213 88 Q 218 60 246 62 Q 264 64 267 80 Q 254 70 243 72 Q 224 74 213 88 Z" />
        <circle cx="231" cy="92" r="2.6" class="ink" />
        <circle cx="251" cy="92" r="2.6" class="ink" />
        <path d="M 230 104 Q 240 112 252 103" fill="none" class="smile" />
      </g>
      <g bind:this={shoes}>
        <ellipse cx="212" cy="250" rx="16" ry="7" class="shoe" />
        <ellipse cx="268" cy="250" rx="16" ry="7" class="shoe" />
      </g>
    </g>

    <g bind:this={coins} class="coins">
      {#each COIN_GRID as c}
        <circle cx={c.cx} cy={c.cy} r={COIN_R} data-dx={240 - c.cx} data-dy={150 - c.cy} />
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

  .person .skin {
    fill: #f6ead2;
    stroke: #3c352b;
    stroke-width: 2.4;
  }

  .person .suit {
    fill: #3f4a63;
    stroke: #3c352b;
    stroke-width: 2.4;
  }

  .person .shirt {
    fill: #fffaf0;
    stroke: none;
  }

  .person .tie {
    fill: #8b3f2b;
    stroke: none;
  }

  .person .limb {
    stroke: #3f4a63;
    stroke-width: 13;
    stroke-linecap: round;
  }

  .person .hair {
    fill: #3c352b;
  }

  .person .ink {
    fill: #3c352b;
  }

  .person .smile {
    stroke: #3c352b;
    stroke-width: 2.2;
    stroke-linecap: round;
  }

  .person .hull {
    fill: #d7dbe2;
    stroke: #3c352b;
    stroke-width: 1.8;
  }

  .person .nose,
  .person .fin {
    fill: #8b3f2b;
  }

  .person .window {
    fill: #9fc4c9;
    stroke: #3c352b;
    stroke-width: 1.2;
  }

  .person .shoe {
    fill: #2e2a23;
  }

  .coins circle {
    fill: var(--coin);
    stroke: var(--coin-ink);
    stroke-width: 2;
  }
</style>
