<script lang="ts" module>
  import type { BeatSpec } from '../contract';

  export const BEATS: readonly BeatSpec[] = [
    { label: 'joke', length: 1 },
    { label: 'sphere', length: 1 },
    { label: 'vacuum', length: 1 },
    { label: 'uphill', length: 1.4 },
    { label: 'weight', length: 1 },
  ];
</script>

<script lang="ts">
  import { getContext, onMount } from 'svelte';
  import { STAGE_CONTEXT, type StageContext } from '../contract';
  import { COW_BODY, SPHERE } from './paths';

  const stage = getContext<StageContext | undefined>(STAGE_CONTEXT);

  let body: SVGPathElement;
  let shadow: SVGEllipseElement;
  let shine: SVGPathElement;
  let voidRect: SVGRectElement;
  let stars: SVGGElement;
  let scared: SVGGElement;
  let uphill: SVGGElement;
  let slope: SVGLineElement;
  let pusher: SVGGElement;
  let legs: SVGGElement;
  let tail: SVGGElement;
  let head: SVGGElement;
  let spots: SVGGElement;
  let udder: SVGGElement;

  const SLOPE_LENGTH = 450;

  onMount(() => {
    stage?.attach(BEATS, (tl) => {
      const parts = [legs, tail, head, spots, udder];

      // sphere — the joke: parts retract, the torso rounds off
      tl.to(parts, { scale: 0.35, autoAlpha: 0, transformOrigin: '50% 50%', duration: 0.4, ease: 'power2.in', stagger: 0.05 }, 'sphere');
      tl.to(body, { morphSVG: SPHERE, duration: 0.55, ease: 'power2.inOut' }, 'sphere');
      tl.to(shadow, { opacity: 0.35, scaleX: 0.55, transformOrigin: '50% 50%', duration: 0.5 }, 'sphere');
      tl.to(shine, { opacity: 0.55, duration: 0.2 }, 'sphere+=0.5');

      // vacuum — space closes in; the cow holds its breath
      tl.to(voidRect, { opacity: 1, duration: 0.35 }, 'vacuum');
      tl.to(stars, { opacity: 0.9, duration: 0.3 }, 'vacuum+=0.15');
      tl.to(shadow, { opacity: 0, duration: 0.3 }, 'vacuum');
      tl.to([body, shine], { stroke: '#efe6c8', duration: 0.35 }, 'vacuum');
      tl.to(body, { scaleX: 1.06, scaleY: 1.03, transformOrigin: '50% 50%', duration: 0.3 }, 'vacuum+=0.25');
      tl.to(scared, { autoAlpha: 1, duration: 0.25 }, 'vacuum+=0.3');

      // uphill — the frictionless push, with a slip halfway
      tl.to([voidRect, stars, scared, shine], { autoAlpha: 0, duration: 0.25 }, 'uphill');
      tl.to(body, { stroke: '#3c352b', duration: 0.25 }, 'uphill');
      tl.to(uphill, { autoAlpha: 1, duration: 0.3 }, 'uphill');
      tl.fromTo(slope, { strokeDashoffset: SLOPE_LENGTH }, { strokeDashoffset: 0, duration: 0.35, ease: 'none' }, 'uphill+=0.05');
      tl.to(body, { x: -137, y: 39, scale: 0.55, transformOrigin: '50% 50%', duration: 0.35, ease: 'power2.inOut' }, 'uphill+=0.1');
      // climb, slip back, climb again — the pusher moves with the sphere
      tl.to(
        body,
        {
          keyframes: [
            { x: -11, y: -8, duration: 0.35 },
            { x: -45, y: 4.5, duration: 0.15 },
            { x: 40, y: -27, duration: 0.35 },
          ],
          ease: 'none',
        },
        'uphill+=0.55',
      );
      tl.to(
        pusher,
        {
          keyframes: [
            { x: 126, y: -47, duration: 0.35 },
            { x: 92, y: -34.5, duration: 0.15 },
            { x: 177, y: -66, duration: 0.35 },
          ],
          ease: 'none',
        },
        'uphill+=0.55',
      );

      // weight — back to center; heavy
      tl.to(uphill, { autoAlpha: 0, duration: 0.25 }, 'weight');
      tl.to(body, { x: 0, y: 24, scaleX: 1, scaleY: 1, duration: 0.45, ease: 'power2.inOut' }, 'weight');
      tl.to(body, { scaleX: 1.07, scaleY: 0.93, duration: 0.2, ease: 'power2.in' }, 'weight+=0.5');
      tl.to(shadow, { opacity: 0.5, scaleX: 0.8, duration: 0.25 }, 'weight+=0.45');
    });
  });
</script>

<figure class="scene-art" aria-label="A cow simplified into a sphere, put in a vacuum, and pushed uphill">
  <svg viewBox="0 0 480 280" role="img">
    <defs>
      <radialGradient id="cow-void-grad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#241f2e" />
        <stop offset="72%" stop-color="#241f2e" />
        <stop offset="100%" stop-color="#241f2e" stop-opacity="0" />
      </radialGradient>
    </defs>
    <ellipse bind:this={voidRect} class="void" cx="240" cy="140" rx="290" ry="170" fill="url(#cow-void-grad)" />
    <g bind:this={stars} class="stars">
      <circle cx="60" cy="46" r="1.6" /><circle cx="128" cy="88" r="1.6" />
      <circle cx="96" cy="210" r="1.6" /><circle cx="190" cy="40" r="1.6" />
      <circle cx="306" cy="52" r="1.6" /><circle cx="388" cy="96" r="1.6" />
      <circle cx="420" cy="200" r="1.6" /><circle cx="350" cy="236" r="1.6" />
      <circle cx="44" cy="150" r="1.6" /><circle cx="434" cy="40" r="1.6" />
    </g>

    <ellipse bind:this={shadow} class="shadow" cx="245" cy="238" rx="110" ry="10" />

    <g bind:this={uphill} class="uphill">
      <line bind:this={slope} class="slope" x1="30" y1="252" x2="452" y2="96" stroke-dasharray={SLOPE_LENGTH} />
      <g class="ghost">
        <rect x="86" y="238" width="30" height="22" rx="3" />
        <line x1="92" y1="260" x2="92" y2="268" />
        <line x1="110" y1="260" x2="110" y2="268" />
      </g>
      <g class="ghost">
        <ellipse cx="52" cy="262" rx="15" ry="8" />
        <circle cx="38" cy="256" r="4.5" />
      </g>
      <g bind:this={pusher} class="pusher">
        <circle cx="58" cy="196" r="6" />
        <line x1="60" y1="202" x2="66" y2="214" />
        <line x1="62" y1="205" x2="80" y2="201" />
        <line x1="63" y1="208" x2="81" y2="209" />
        <line x1="66" y1="214" x2="54" y2="228" />
        <line x1="66" y1="214" x2="72" y2="228" />
      </g>
    </g>

    <g bind:this={legs} class="part">
      <rect x="188" y="186" width="13" height="48" rx="6" />
      <rect x="216" y="192" width="13" height="44" rx="6" />
      <rect x="262" y="192" width="13" height="44" rx="6" />
      <rect x="290" y="186" width="13" height="48" rx="6" />
    </g>
    <g bind:this={tail} class="part">
      <path d="M 320 132 Q 356 146 350 194" fill="none" />
      <circle cx="350" cy="198" r="6" />
    </g>
    <g bind:this={spots} class="part spots">
      <ellipse cx="226" cy="136" rx="24" ry="16" />
      <ellipse cx="284" cy="164" rx="17" ry="12" />
    </g>
    <g bind:this={udder} class="part udder">
      <ellipse cx="268" cy="198" rx="16" ry="10" />
    </g>
    <g bind:this={head} class="part">
      <circle cx="152" cy="112" r="27" />
      <ellipse cx="143" cy="124" rx="16" ry="11" class="muzzle" />
      <circle cx="139" cy="122" r="1.8" class="ink" />
      <circle cx="148" cy="126" r="1.8" class="ink" />
      <circle cx="146" cy="104" r="2.6" class="ink" />
      <path d="M 132 94 Q 122 84 126 74" fill="none" />
      <path d="M 168 92 Q 176 82 172 72" fill="none" />
      <path d="M 170 106 Q 184 110 182 120" fill="none" />
    </g>

    <path bind:this={body} class="body" d={COW_BODY} />
    <path bind:this={shine} class="shine" d="M 206 122 Q 218 104 240 100" fill="none" />

    <g bind:this={scared} class="scared">
      <circle cx="222" cy="138" r="7.5" class="eye" />
      <circle cx="258" cy="138" r="7.5" class="eye" />
      <circle cx="224" cy="139" r="2.6" class="ink" />
      <circle cx="256" cy="139" r="2.6" class="ink" />
      <ellipse cx="240" cy="170" rx="5" ry="6.5" class="mouth" />
      <path d="M 214 158 Q 220 163 227 160" class="cheek" fill="none" />
      <path d="M 253 160 Q 260 163 266 158" class="cheek" fill="none" />
    </g>
  </svg>
</figure>

<style>
  .void {
    opacity: 0;
  }

  .stars {
    opacity: 0;
  }

  .stars circle {
    fill: #efe6c8;
  }

  .shadow {
    fill: rgb(60 53 43 / 14%);
  }

  .body {
    fill: #f6ead2;
    stroke: #3c352b;
    stroke-width: 2.6;
  }

  .shine {
    stroke: #3c352b;
    stroke-width: 2;
    stroke-linecap: round;
    opacity: 0;
  }

  .part rect,
  .part ellipse,
  .part circle {
    fill: #f6ead2;
    stroke: #3c352b;
    stroke-width: 2.6;
  }

  .part path {
    stroke: #3c352b;
    stroke-width: 2.6;
    stroke-linecap: round;
  }

  .part .ink,
  .part.spots ellipse {
    fill: #3c352b;
    stroke: none;
  }

  .part .muzzle {
    fill: #efdcc0;
  }

  .part.udder ellipse {
    fill: #efdcc0;
  }

  .scared {
    opacity: 0;
  }

  .scared .eye {
    fill: #fffaf0;
    stroke: #3c352b;
    stroke-width: 1.8;
  }

  .scared .ink {
    fill: #3c352b;
  }

  .scared .mouth {
    fill: #3c352b;
  }

  .scared .cheek {
    stroke: #3c352b;
    stroke-width: 1.6;
    stroke-linecap: round;
  }

  .uphill {
    opacity: 0;
  }

  .slope {
    stroke: #3c352b;
    stroke-width: 2.6;
    stroke-linecap: round;
  }

  .ghost rect,
  .ghost ellipse,
  .ghost circle {
    fill: none;
    stroke: #3c352b;
    stroke-width: 2;
  }

  .ghost line {
    stroke: #3c352b;
    stroke-width: 2;
  }

  .ghost {
    opacity: 0.45;
  }

  .pusher circle {
    fill: none;
    stroke: #8b3f2b;
    stroke-width: 2.4;
  }

  .pusher line {
    stroke: #8b3f2b;
    stroke-width: 2.4;
    stroke-linecap: round;
  }
</style>
