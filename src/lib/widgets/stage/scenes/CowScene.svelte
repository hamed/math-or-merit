<script lang="ts" module>
  import type { BeatSpec } from '../contract';

  export const BEATS: readonly BeatSpec[] = [
    { label: 'once', length: 0.9 },
    { label: 'chemist', length: 1.2 },
    { label: 'physicist', length: 1.5 },
    { label: 'solved', length: 0.9 },
    { label: 'sphere', length: 1.1 },
    { label: 'vacuum', length: 0.8 },
    { label: 'slope', length: 1 },
    { label: 'push', length: 1.8 },
    { label: 'real', length: 1.5 },
    { label: 'moral', length: 1 },
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
  let scared: SVGGElement;
  let cowG: SVGGElement; // translation only — never scaled
  let cowBodyG: SVGGElement; // scale/mirror only — never translated
  let legs: SVGGElement;
  let tail: SVGGElement;
  let head: SVGGElement;
  let spots: SVGGElement;
  let udder: SVGGElement;
  let chemist: SVGGElement;
  let flaskArm: SVGGElement;
  let einstein: SVGGElement;
  let armDown: SVGLineElement;
  let armUp: SVGGElement;
  let sun: SVGCircleElement;
  let horizon: SVGLineElement;
  let hill: SVGPathElement;
  let pusher: SVGGElement;

  const HORIZON_LENGTH = 460;
  const HILL_LENGTH = 404;

  // The sphere (r 62 at full scale) shrinks so the hill towers over it.
  // Scaling and travel live on SEPARATE nested groups: gsap recomputes x/y
  // when svgOrigin scaling and translation share an element, and the cow
  // teleports (cost a bug). cowG translates; cowBodyG scales about a fixed
  // origin; the body path only morphs and squashes.
  const COW_ORIGIN = '240 150';
  const SPHERE_SCALE = 0.62;
  const GROUND_Y = 47.6; // scaled sphere bottom lands on the horizon (y=236)

  onMount(() => {
    stage?.attach(BEATS, (tl) => {
      const parts = [legs, tail, head, spots, udder];

      // chemist — walks in from the right, shakes the flask, nothing happens
      tl.fromTo(chemist, { x: 170, autoAlpha: 1 }, { x: 20, duration: 0.4, ease: 'power1.out' }, 'chemist');
      tl.to(
        flaskArm,
        { keyframes: [{ rotation: -9 }, { rotation: 8 }, { rotation: -7 }, { rotation: 0 }], svgOrigin: '359 184', duration: 0.5 },
        'chemist+=0.45',
      );

      // physicist — the chemist gives up; time passes; an old man wanders in
      tl.to(chemist, { x: 170, autoAlpha: 0, duration: 0.3, ease: 'power1.in' }, 'physicist');
      tl.fromTo(sun, { x: 20, autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08 }, 'physicist+=0.1');
      tl.to(
        sun,
        {
          keyframes: [
            { x: 140, y: -18, duration: 0.25 },
            { x: 260, y: -26, duration: 0.25 },
            { x: 380, y: -16, duration: 0.25 },
            { x: 462, y: 4, duration: 0.15 },
          ],
          ease: 'none',
        },
        'physicist+=0.18',
      );
      tl.to(sun, { autoAlpha: 0, duration: 0.08 }, 'physicist+=1.05');
      tl.fromTo(einstein, { x: 150, autoAlpha: 1 }, { x: 0, duration: 0.55, ease: 'power1.out' }, 'physicist+=0.8');

      // solved — the finger goes up
      tl.to(armDown, { autoAlpha: 0, duration: 0.12 }, 'solved+=0.1');
      tl.fromTo(armUp, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15 }, 'solved+=0.12');
      tl.to(einstein, { y: -4, duration: 0.12, ease: 'power2.out' }, 'solved+=0.12');
      tl.to(einstein, { y: 0, duration: 0.18, ease: 'power2.in' }, 'solved+=0.26');

      // sphere — the joke lands: parts retract, the torso rounds off
      tl.to(parts, { scale: 0.35, autoAlpha: 0, transformOrigin: '50% 50%', duration: 0.4, ease: 'power2.in', stagger: 0.05 }, 'sphere');
      tl.to(body, { morphSVG: SPHERE, duration: 0.55, ease: 'power2.inOut' }, 'sphere');
      tl.to(shadow, { opacity: 0.35, scaleX: 0.55, transformOrigin: '50% 50%', duration: 0.5 }, 'sphere');
      tl.to(shine, { opacity: 0.55, duration: 0.2 }, 'sphere+=0.5');

      // vacuum — no backdrop change; the cow's face carries it
      tl.to(shadow, { opacity: 0.12, duration: 0.3 }, 'vacuum');
      tl.to(body, { scaleX: 1.06, scaleY: 1.03, svgOrigin: COW_ORIGIN, duration: 0.3 }, 'vacuum+=0.1');
      tl.to(scared, { autoAlpha: 1, duration: 0.25 }, 'vacuum+=0.2');

      // slope — the physicist leaves; the world gets a floor and a hill;
      // the sphere shrinks and rolls left, keeping its distance
      tl.to(einstein, { x: 150, autoAlpha: 0, duration: 0.3, ease: 'power1.in' }, 'slope');
      tl.to([shine], { autoAlpha: 0, duration: 0.2 }, 'slope');
      tl.to(body, { scaleX: 1, scaleY: 1, svgOrigin: COW_ORIGIN, duration: 0.2 }, 'slope');
      tl.fromTo(horizon, { strokeDashoffset: HORIZON_LENGTH }, { strokeDashoffset: 0, duration: 0.4, ease: 'none' }, 'slope+=0.05');
      tl.fromTo(hill, { strokeDashoffset: HILL_LENGTH }, { strokeDashoffset: 0, duration: 0.4, ease: 'none' }, 'slope+=0.4');
      tl.to(cowG, { x: -120, y: GROUND_Y, duration: 0.5, ease: 'power1.inOut' }, 'slope+=0.3');
      tl.to(
        cowBodyG,
        { scaleX: SPHERE_SCALE, scaleY: SPHERE_SCALE, svgOrigin: COW_ORIGIN, duration: 0.5, ease: 'power1.inOut' },
        'slope+=0.3',
      );
      // the shadow rides inside the scaled group; lift it back onto the line
      tl.to(shadow, { opacity: 0.4, scaleX: 0.6, y: -26, duration: 0.3 }, 'slope+=0.5');

      // push — the pusher arrives, rolls it to the hill, gains, slips, gains
      // more, and the rollback takes them both off-screen. Frictionless.
      tl.fromTo(pusher, { x: -140, y: 8, autoAlpha: 1 }, { x: 4, duration: 0.35, ease: 'power1.out' }, 'push');
      tl.to(cowG, { x: 36, duration: 0.35, ease: 'power1.inOut' }, 'push+=0.35');
      tl.to(pusher, { x: 160, duration: 0.35, ease: 'power1.inOut' }, 'push+=0.35');
      tl.to(
        cowG,
        {
          keyframes: [
            { x: 63, y: 18.1, duration: 0.2 },
            { x: 44, y: 38.7, duration: 0.12 },
            { x: 88.7, y: -9.9, duration: 0.26 },
          ],
          ease: 'none',
        },
        'push+=0.75',
      );
      tl.to(
        pusher,
        {
          keyframes: [
            { x: 187, y: -21.5, duration: 0.2 },
            { x: 168, y: -0.9, duration: 0.12 },
            { x: 212.7, y: -40.6, duration: 0.26 },
          ],
          ease: 'none',
        },
        'push+=0.75',
      );
      tl.to(
        cowG,
        {
          keyframes: [
            { x: 36, y: GROUND_Y, duration: 0.12, ease: 'power1.in' },
            { x: -420, y: GROUND_Y, duration: 0.33, ease: 'none' },
          ],
        },
        'push+=1.35',
      );
      tl.to(
        pusher,
        {
          keyframes: [
            { x: 203, y: -50, duration: 0.08 },
            { x: -455, y: 16, rotation: -540, duration: 0.37, ease: 'none' },
          ],
          svgOrigin: '67 210',
        },
        'push+=1.35',
      );

      // real — off-screen, the sphere quietly becomes a cow again; it walks
      // back in facing its direction of travel; the pusher tries again
      tl.to(body, { morphSVG: COW_BODY, duration: 0.001 }, 'real');
      tl.set(parts, { scale: 1, autoAlpha: 1 }, 'real+=0.01');
      tl.set(scared, { autoAlpha: 0 }, 'real+=0.01');
      tl.set(shadow, { opacity: 0.5, scaleX: 0.9, y: 0 }, 'real+=0.01');
      tl.set(cowG, { x: -420, y: 0 }, 'real+=0.01');
      // mirrored: the returning cow faces its direction of travel
      tl.set(cowBodyG, { scaleX: -1, scaleY: 1, svgOrigin: COW_ORIGIN }, 'real+=0.01');
      tl.to(cowG, { x: -85, duration: 0.6, ease: 'none' }, 'real+=0.1');
      tl.set(pusher, { x: -160, y: 8, rotation: 0 }, 'real+=0.3');
      tl.to(pusher, { x: -36, duration: 0.3, ease: 'power1.out' }, 'real+=0.8');
      tl.to(
        pusher,
        {
          keyframes: [
            { x: -30, duration: 0.07 },
            { x: -38, duration: 0.07 },
            { x: -30, duration: 0.07 },
            { x: -38, duration: 0.07 },
            { x: -34, duration: 0.06 },
          ],
        },
        'real+=1.15',
      );
      tl.to(
        cowG,
        {
          keyframes: [
            { x: -84.2, duration: 0.14 },
            { x: -85, duration: 0.14 },
          ],
        },
        'real+=1.17',
      );

      // moral — the pusher sags; the cow is not going anywhere
      tl.to(pusher, { rotation: 7, y: 10, svgOrigin: '67 228', duration: 0.3, ease: 'power1.inOut' }, 'moral+=0.1');
    });
  });
</script>

<figure class="scene-art cow-stage" aria-label="The spherical-cow joke, then a sphere and a real cow pushed at a hill">
  <svg viewBox="0 0 480 280" role="img">
    <!-- time passing while the physicist works -->
    <circle bind:this={sun} class="sun" cx="0" cy="58" r="7" />

    <!-- the world: one horizon, one complete triangular hill -->
    <line
      bind:this={horizon}
      class="ground"
      x1="10"
      y1="236"
      x2="470"
      y2="236"
      stroke-dasharray={HORIZON_LENGTH}
      style={`stroke-dashoffset: ${HORIZON_LENGTH}`}
    />
    <path
      bind:this={hill}
      class="ground"
      d="M 300 236 L 456 236 L 388 140 Z"
      fill="none"
      stroke-dasharray={HILL_LENGTH}
      style={`stroke-dashoffset: ${HILL_LENGTH}`}
    />

    <!-- the chemist: lab coat, one flask, no luck -->
    <g bind:this={chemist} class="scientist">
      <circle cx="366" cy="170" r="7" class="skin" />
      <path d="M 357 179 L 375 179 L 379 212 L 353 212 Z" class="coat" />
      <line x1="361" y1="212" x2="361" y2="236" />
      <line x1="371" y1="212" x2="371" y2="236" />
      <line x1="373" y1="184" x2="381" y2="196" />
      <g bind:this={flaskArm}>
        <line x1="359" y1="184" x2="346" y2="193" />
        <path d="M 342 186 L 350 186 L 354 200 Q 346 206 338 200 Z" class="flask" />
        <circle cx="343" cy="180" r="1.6" class="bubble" />
        <circle cx="347" cy="175" r="1.2" class="bubble" />
      </g>
    </g>

    <!-- the physicist: the hair does the talking -->
    <g bind:this={einstein} class="scientist">
      <circle cx="396" cy="168" r="7.5" class="skin" />
      <path d="M 388 163 Q 384 156 389 152" class="hair" />
      <path d="M 393 159 Q 392 150 397 149" class="hair" />
      <path d="M 400 159 Q 401 149 406 151" class="hair" />
      <path d="M 404 164 Q 410 158 408 153" class="hair" />
      <circle cx="393" cy="167" r="1.2" class="ink" />
      <circle cx="399" cy="167" r="1.2" class="ink" />
      <path d="M 392 173 Q 396 176 400 173" class="stache" />
      <line x1="396" y1="176" x2="396" y2="212" />
      <line x1="396" y1="212" x2="389" y2="236" />
      <line x1="396" y1="212" x2="403" y2="236" />
      <line bind:this={armDown} x1="396" y1="186" x2="385" y2="198" />
      <g bind:this={armUp} class="arm-up">
        <line x1="396" y1="186" x2="407" y2="177" />
        <line x1="407" y1="177" x2="405" y2="168" />
      </g>
    </g>

    <!-- the pusher: enters when there is finally a hill to fail at -->
    <g bind:this={pusher} class="pusher">
      <circle cx="58" cy="196" r="6" />
      <line x1="60" y1="202" x2="66" y2="214" />
      <line x1="62" y1="205" x2="80" y2="201" />
      <line x1="63" y1="208" x2="81" y2="209" />
      <line x1="66" y1="214" x2="54" y2="228" />
      <line x1="66" y1="214" x2="72" y2="228" />
    </g>

    <!-- the cow: everything that travels, travels together (outer group
         translates, inner group scales/mirrors — never the same element) -->
    <g bind:this={cowG}>
      <g bind:this={cowBodyG}>
      <ellipse bind:this={shadow} class="shadow" cx="245" cy="238" rx="110" ry="10" />
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
      </g>
    </g>
  </svg>
</figure>

<style>
  /* This scene sits higher than the default stage: art near the upper third,
     captions near the lower third. */
  figure.cow-stage {
    padding-block-end: 30svh;
  }

  .sun {
    fill: none;
    stroke: #3c352b;
    stroke-width: 2;
    opacity: 0;
  }

  .ground {
    stroke: #3c352b;
    stroke-width: 2.6;
    stroke-linecap: round;
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

  .scientist {
    opacity: 0;
  }

  .scientist line {
    stroke: #3c352b;
    stroke-width: 2.2;
    stroke-linecap: round;
  }

  .scientist .skin {
    fill: #fdf9ef;
    stroke: #3c352b;
    stroke-width: 2.2;
  }

  .scientist .coat {
    fill: #fdf9ef;
    stroke: #3c352b;
    stroke-width: 2.2;
    stroke-linejoin: round;
  }

  .scientist .flask {
    fill: #fdf9ef;
    stroke: #3c352b;
    stroke-width: 2;
    stroke-linejoin: round;
  }

  .scientist .bubble {
    fill: none;
    stroke: #3c352b;
    stroke-width: 1.4;
  }

  .scientist .hair,
  .scientist .stache {
    fill: none;
    stroke: #3c352b;
    stroke-width: 2;
    stroke-linecap: round;
  }

  .scientist .ink {
    fill: #3c352b;
    stroke: none;
  }

  .arm-up {
    opacity: 0;
  }

  .pusher {
    opacity: 0;
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
