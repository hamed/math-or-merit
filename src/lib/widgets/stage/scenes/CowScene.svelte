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
  import {
    BODY_COW,
    BODY_SPHERE,
    FACE,
    JAW,
    EAR_L_OUT,
    EAR_L_IN,
    EAR_R_OUT,
    EAR_R_IN,
    HORN_COW,
    HORN_SPHERE,
    MARK,
    MOUTH,
    EYE,
    NOSTRIL,
    LIMB_COW,
    LIMB_SPHERE,
    HOOF,
    COW_HAND_TF,
    SPHERE_LEG_TF,
    MIRROR,
    TAIL_COW,
    TAIL_SPHERE,
    UDDER_COW,
    UDDER_SPHERE,
    SPOTS_COW,
    SPOTS_SPHERE,
    teatPath,
  } from './cow-geometry';

  const stage = getContext<StageContext | undefined>(STAGE_CONTEXT);

  let body: SVGEllipseElement;
  let shadow: SVGEllipseElement;
  let cowG: SVGGElement; // translation only — never scaled
  let cowBodyG: SVGGElement; // scale/mirror only — never translated
  let cowArt: SVGGElement; // static 300-space wrapper; also the query root
  let horn: SVGPathElement;
  let mouth: SVGPathElement;
  let jaw: SVGPathElement;
  let cowHands: SVGGElement;
  let cowTail: SVGGElement;
  let cowUdder: SVGGElement;
  let cowSpots: SVGGElement;
  let sphHands: SVGGElement;
  let sphLegs: SVGGElement;
  let sphUdder: SVGGElement;
  let sphSpots: SVGGElement;
  let sphTail: SVGGElement;
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

  // The cow is drawn in its own 0 0 300 300 space (cow-geometry.ts) and
  // mapped so the spherical body lands exactly at r=62 around (240,150) —
  // every hill/push constant tuned for the old sphere still holds.
  const ART_S = 62 / 120; // 0.5167
  const ART_X = 240 - 150 * ART_S; // 162.5
  const ART_Y = 150 - 150 * ART_S; // 72.5
  // Standing, the hooves rest on the invisible ground (scene y≈234); the
  // morph to a floating sphere then RISES to centre (240,150) — the shadow
  // compensates the other way so it never leaves the ground.
  const STAND_Y = 43.6;
  const SHADOW_Y = 192.4; // local: renders at 236 while standing
  const REAL_X = -122; // returning cow: left flank meets the pusher

  // Scaling and travel live on SEPARATE nested groups: gsap recomputes x/y
  // when svgOrigin scaling and translation share an element, and the cow
  // teleports (cost a bug). cowG translates; cowBodyG scales about a fixed
  // origin; the body ellipse only tweens its attributes.
  const COW_ORIGIN = '240 150';
  const SPHERE_SCALE = 0.62;
  const GROUND_Y = 47.6; // scaled sphere bottom lands on the horizon (y=236)
  // shadow y while on the slope: 150 + (192.4 + y − 150)·0.62 + 47.6 = 236
  const SLOPE_SHADOW_Y = 19.5;

  onMount(() => {
    stage?.attach(BEATS, (tl) => {
      const q = (sel: string) => cowArt.querySelectorAll(sel);
      const lidsSleepy = q('.lid-sleepy');
      const lidsAngry = q('.lid-angry');
      const irises = q('.iris');
      const pupils = q('.pupil');
      const nostrilsOpen = q('.nostril-open');
      const nostrilsClosed = q('.nostril-closed');
      const cowParts = [cowHands, cowTail, cowUdder, cowSpots];
      const sphParts = [sphHands, sphLegs, sphUdder, sphSpots, sphTail];

      // chemist — walks in from the right, shakes the flask, nothing happens;
      // still, a visitor: the cow cheers up a bit
      tl.fromTo(chemist, { x: 170, autoAlpha: 1 }, { x: 20, duration: 0.4, ease: 'power1.out' }, 'chemist');
      tl.to(
        flaskArm,
        { keyframes: [{ rotation: -9 }, { rotation: 8 }, { rotation: -7 }, { rotation: 0 }], svgOrigin: '359 184', duration: 0.5 },
        'chemist+=0.45',
      );
      tl.to(mouth, { morphSVG: MOUTH.smile, duration: 0.35 }, 'chemist+=0.55');

      // physicist — the chemist gives up; time passes; an old man wanders in
      // and the smile flattens out
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
      tl.to(mouth, { morphSVG: MOUTH.flat, duration: 0.3 }, 'physicist+=1.05');

      // solved — the finger goes up
      tl.to(armDown, { autoAlpha: 0, duration: 0.12 }, 'solved+=0.1');
      tl.fromTo(armUp, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15 }, 'solved+=0.12');
      tl.to(einstein, { y: -4, duration: 0.12, ease: 'power2.out' }, 'solved+=0.12');
      tl.to(einstein, { y: 0, duration: 0.18, ease: 'power2.in' }, 'solved+=0.26');

      // sphere — the joke lands: the standing parts fold away, the folded-on-
      // the-ball parts appear, the body rounds off and pops up to float; the
      // cow's eyes go wide
      tl.to(cowParts, { scale: 0.35, autoAlpha: 0, transformOrigin: '50% 50%', duration: 0.4, ease: 'power2.in', stagger: 0.05 }, 'sphere');
      tl.to(body, { attr: { cx: BODY_SPHERE.cx, cy: BODY_SPHERE.cy, rx: BODY_SPHERE.r, ry: BODY_SPHERE.r }, duration: 0.55, ease: 'power2.inOut' }, 'sphere');
      tl.to(horn, { morphSVG: HORN_SPHERE, duration: 0.55, ease: 'power2.inOut' }, 'sphere');
      tl.to(cowG, { y: 0, duration: 0.55, ease: 'power2.inOut' }, 'sphere');
      tl.to(shadow, { y: STAND_Y, opacity: 0.35, scaleX: 0.85, transformOrigin: '50% 50%', duration: 0.55 }, 'sphere');
      tl.fromTo(
        sphParts,
        { scale: 0.7, autoAlpha: 0, transformOrigin: '50% 50%' },
        { scale: 1, autoAlpha: 1, duration: 0.3, stagger: 0.04, ease: 'power1.out', immediateRender: false },
        'sphere+=0.3',
      );
      tl.to(lidsSleepy, { autoAlpha: 0, duration: 0.2 }, 'sphere+=0.3');
      tl.to(irises, { attr: { cx: EYE.cx, cy: EYE.cy }, duration: 0.3 }, 'sphere+=0.3');
      tl.to(pupils, { attr: { cx: EYE.cx, cy: EYE.cy }, duration: 0.3 }, 'sphere+=0.3');

      // vacuum — holding its breath: cheeks puff, nostrils pinch shut, the
      // mouth becomes a little gasp, the pupils blow out
      tl.to(shadow, { opacity: 0.12, duration: 0.3 }, 'vacuum');
      tl.to(body, { attr: { rx: 127.2, ry: 123.6 }, duration: 0.3 }, 'vacuum+=0.1');
      tl.to(jaw, { scale: 1.09, transformOrigin: '50% 42%', duration: 0.3 }, 'vacuum+=0.1');
      tl.to(mouth, { morphSVG: MOUTH.gasp, duration: 0.25 }, 'vacuum+=0.15');
      tl.to(nostrilsOpen, { autoAlpha: 0, duration: 0.2 }, 'vacuum+=0.15');
      tl.to(nostrilsClosed, { autoAlpha: 1, duration: 0.2 }, 'vacuum+=0.2');
      tl.to(pupils, { attr: { r: EYE.pupilDilatedR }, duration: 0.25 }, 'vacuum+=0.2');

      // slope — the physicist leaves; the world gets a floor and a hill; the
      // sphere exhales, shrinks and rolls left, keeping its distance
      tl.to(einstein, { x: 150, autoAlpha: 0, duration: 0.3, ease: 'power1.in' }, 'slope');
      tl.to(body, { attr: { rx: BODY_SPHERE.r, ry: BODY_SPHERE.r }, duration: 0.2 }, 'slope');
      tl.to(jaw, { scale: 1, duration: 0.2 }, 'slope');
      tl.to(mouth, { morphSVG: MOUTH.flat, duration: 0.2 }, 'slope');
      tl.to(nostrilsClosed, { autoAlpha: 0, duration: 0.15 }, 'slope');
      tl.to(nostrilsOpen, { autoAlpha: 1, duration: 0.15 }, 'slope+=0.05');
      tl.to(pupils, { attr: { r: EYE.pupilR }, duration: 0.2 }, 'slope');
      tl.fromTo(horizon, { strokeDashoffset: HORIZON_LENGTH }, { strokeDashoffset: 0, duration: 0.4, ease: 'none' }, 'slope+=0.05');
      tl.fromTo(hill, { strokeDashoffset: HILL_LENGTH }, { strokeDashoffset: 0, duration: 0.4, ease: 'none' }, 'slope+=0.4');
      tl.to(cowG, { x: -120, y: GROUND_Y, duration: 0.5, ease: 'power1.inOut' }, 'slope+=0.3');
      tl.to(
        cowBodyG,
        { scaleX: SPHERE_SCALE, scaleY: SPHERE_SCALE, svgOrigin: COW_ORIGIN, duration: 0.5, ease: 'power1.inOut' },
        'slope+=0.3',
      );
      // the shadow rides inside the scaled group; lift it back onto the line
      tl.to(shadow, { opacity: 0.4, scaleX: 0.7, y: SLOPE_SHADOW_Y, duration: 0.3 }, 'slope+=0.5');

      // push — the pusher arrives, rolls it to the hill, gains, slips, gains
      // more, and the rollback takes them both off-screen. Frictionless.
      // Being rolled: the cow gets angry about it.
      tl.fromTo(pusher, { x: -140, y: 8, autoAlpha: 1 }, { x: 4, duration: 0.35, ease: 'power1.out' }, 'push');
      tl.to(cowG, { x: 36, duration: 0.35, ease: 'power1.inOut' }, 'push+=0.35');
      tl.to(pusher, { x: 160, duration: 0.35, ease: 'power1.inOut' }, 'push+=0.35');
      tl.to(lidsAngry, { autoAlpha: 1, duration: 0.2 }, 'push+=0.4');
      tl.to(mouth, { morphSVG: MOUTH.angry, duration: 0.25 }, 'push+=0.4');
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

      // real — off-screen, the sphere quietly becomes a cow again (face
      // forward, so no mirroring needed); it walks back in resigned and sad;
      // the pusher tries again
      tl.set(body, { attr: { cx: BODY_COW.cx, cy: BODY_COW.cy, rx: BODY_COW.rx, ry: BODY_COW.ry } }, 'real');
      tl.to(horn, { morphSVG: HORN_COW, duration: 0.001 }, 'real');
      tl.to(mouth, { morphSVG: MOUTH.sad, duration: 0.001 }, 'real');
      tl.set(cowParts, { scale: 1, autoAlpha: 1 }, 'real+=0.01');
      tl.set(sphParts, { scale: 1, autoAlpha: 0 }, 'real+=0.01');
      tl.set(lidsSleepy, { autoAlpha: 1 }, 'real+=0.01');
      tl.set(lidsAngry, { autoAlpha: 0 }, 'real+=0.01');
      tl.set(irises, { attr: { cx: EYE.irisSleepy.x, cy: EYE.irisSleepy.y } }, 'real+=0.01');
      tl.set(pupils, { attr: { cx: EYE.irisSleepy.x, cy: EYE.irisSleepy.y, r: EYE.pupilR } }, 'real+=0.01');
      tl.set(shadow, { opacity: 0.5, scaleX: 1, y: 0 }, 'real+=0.01');
      tl.set(cowG, { x: -420, y: STAND_Y }, 'real+=0.01');
      tl.set(cowBodyG, { scaleX: 1, scaleY: 1, svgOrigin: COW_ORIGIN }, 'real+=0.01');
      tl.to(cowG, { x: REAL_X, duration: 0.6, ease: 'none' }, 'real+=0.1');
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
            { x: REAL_X + 0.8, duration: 0.14 },
            { x: REAL_X, duration: 0.14 },
          ],
        },
        'real+=1.17',
      );

      // moral — the pusher sags; the cow is not going anywhere
      tl.to(pusher, { rotation: 7, y: 10, svgOrigin: '67 228', duration: 0.3, ease: 'power1.inOut' }, 'moral+=0.1');
    });
  });
</script>

{#snippet eye()}
  <circle class="c-eyewhite" cx={EYE.cx} cy={EYE.cy} r={EYE.r} />
  <circle class="c-iris iris" cx={EYE.irisSleepy.x} cy={EYE.irisSleepy.y} r={EYE.irisR} />
  <circle class="c-pupil pupil" cx={EYE.irisSleepy.x} cy={EYE.irisSleepy.y} r={EYE.pupilR} />
  <path class="c-lid lid-sleepy" d={EYE.lidSleepy} />
  <path class="c-lid lid-angry" d={EYE.lidAngry} />
{/snippet}

{#snippet limb(limbD: string, tf: string)}
  <g transform={tf}>
    <path class="c-hide" d={limbD} />
    <path class="c-hoof" d={HOOF} />
  </g>
{/snippet}

<figure class="scene-art cow-stage" aria-label="The spherical-cow joke: a sad cow becomes a sphere in a vacuum, then gets pushed at a hill">
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

    <!-- the chemist: a bun, an A-line coat, one flask, no luck -->
    <g bind:this={chemist} class="scientist">
      <circle cx="366" cy="170" r="7" class="skin" />
      <circle cx="374" cy="163" r="3.2" class="ink" />
      <path d="M 357 179 L 375 179 L 382 218 L 350 218 Z" class="coat" />
      <line x1="362" y1="218" x2="362" y2="236" />
      <line x1="370" y1="218" x2="370" y2="236" />
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

    <!-- the cow: outer group translates, inner group scales — never the same
         element. The art itself lives in a static 300×300 space. -->
    <g bind:this={cowG} transform={`translate(0 ${STAND_Y})`}>
      <g bind:this={cowBodyG}>
        <ellipse bind:this={shadow} class="shadow" cx="240" cy={SHADOW_Y} rx="48" ry="7" />
        <g bind:this={cowArt} class="cow-art" transform={`translate(${ART_X} ${ART_Y}) scale(${ART_S})`}>
          <!-- standing tail: raised, behind the body -->
          <g bind:this={cowTail} class="cow-part">
            <path class="c-hide" d={TAIL_COW.d} />
            <circle class="c-ink" cx={TAIL_COW.tip.x} cy={TAIL_COW.tip.y} r={TAIL_COW.tipR} />
            {#each TAIL_COW.tuft as t}
              <circle class="c-ink" cx={t.x} cy={t.y} r={t.r} />
            {/each}
          </g>

          <ellipse bind:this={body} class="c-hide" cx={BODY_COW.cx} cy={BODY_COW.cy} rx={BODY_COW.rx} ry={BODY_COW.ry} />

          <g bind:this={cowSpots} class="cow-part">
            {#each SPOTS_COW as s}
              <ellipse class="c-ink" cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} transform={`rotate(${s.rot} ${s.cx} ${s.cy})`} />
            {/each}
          </g>
          <g bind:this={sphSpots} class="sph-part">
            {#each SPOTS_SPHERE as s}
              <ellipse class="c-ink" cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} transform={`rotate(${s.rot} ${s.cx} ${s.cy})`} />
            {/each}
          </g>

          <!-- udders: the limbs paint over them, clipping the sack corners -->
          <g bind:this={cowUdder} class="cow-part">
            <path class="c-udder" d={UDDER_COW.sack} />
            {#each UDDER_COW.teats as t}
              <path class="c-teat" d={teatPath(t.x, t.y, UDDER_COW.teatRx, UDDER_COW.teatRy)} />
              <circle class="c-tip" cx={t.x} cy={t.y + UDDER_COW.tipDy} r={UDDER_COW.tipR} />
            {/each}
          </g>
          <g bind:this={sphUdder} class="sph-part">
            <circle class="c-udder" cx={UDDER_SPHERE.cx} cy={UDDER_SPHERE.cy} r={UDDER_SPHERE.r} />
            {#each UDDER_SPHERE.teats as t}
              <circle class="c-teat" cx={t.x} cy={t.y} r={UDDER_SPHERE.teatR} />
              <circle class="c-tip" cx={t.x} cy={t.y} r={UDDER_SPHERE.tipR} />
            {/each}
          </g>

          <!-- limbs: right side mirrors the left about x=300 -->
          <g bind:this={cowHands} class="cow-part">
            <g>{@render limb(LIMB_COW, COW_HAND_TF)}</g>
            <g transform={MIRROR}>{@render limb(LIMB_COW, COW_HAND_TF)}</g>
          </g>
          <g bind:this={sphHands} class="sph-part">
            <g>{@render limb(LIMB_SPHERE, '')}</g>
            <g transform={MIRROR}>{@render limb(LIMB_SPHERE, '')}</g>
          </g>
          <g bind:this={sphLegs} class="sph-part">
            <g>{@render limb(LIMB_SPHERE, SPHERE_LEG_TF)}</g>
            <g transform={MIRROR}>{@render limb(LIMB_SPHERE, SPHERE_LEG_TF)}</g>
          </g>

          <!-- the head: identical coordinates in both poses -->
          <g class="head">
            <g><path class="c-hide" d={EAR_L_OUT} /><path class="c-earin" d={EAR_L_IN} /></g>
            <g><path class="c-hide" d={EAR_R_OUT} /><path class="c-earin" d={EAR_R_IN} /></g>
            <path bind:this={horn} class="c-bone" d={HORN_COW} />
            <path class="c-hide" d={FACE} />
            <path bind:this={jaw} class="c-skin" d={JAW} />
            <ellipse class="c-ink" cx={MARK.cx} cy={MARK.cy} rx={MARK.rx} ry={MARK.ry} />
            <g>{@render eye()}</g>
            <g transform={MIRROR}>{@render eye()}</g>
            <g class="nostril-open">
              <circle class="c-ink" cx={NOSTRIL.leftX} cy={NOSTRIL.y} r={NOSTRIL.r} />
              <circle class="c-ink" cx={NOSTRIL.rightX} cy={NOSTRIL.y} r={NOSTRIL.r} />
            </g>
            <g class="nostril-closed">
              <line class="c-seal" x1={NOSTRIL.leftX - NOSTRIL.sealHalf} y1={NOSTRIL.y} x2={NOSTRIL.leftX + NOSTRIL.sealHalf} y2={NOSTRIL.y} />
              <line class="c-seal" x1={NOSTRIL.rightX - NOSTRIL.sealHalf} y1={NOSTRIL.y} x2={NOSTRIL.rightX + NOSTRIL.sealHalf} y2={NOSTRIL.y} />
            </g>
            <path bind:this={mouth} class="c-mouth" d={MOUTH.sad} />
          </g>

          <!-- spherical tail: folded onto the ball, on top -->
          <g bind:this={sphTail} class="sph-part">
            <path class="c-hide" d={TAIL_SPHERE.d} />
            <circle class="c-ink" cx={TAIL_SPHERE.tip.x} cy={TAIL_SPHERE.tip.y} r={TAIL_SPHERE.tipR} />
            {#each TAIL_SPHERE.tuft as t}
              <circle class="c-ink" cx={t.x} cy={t.y} r={t.r} />
            {/each}
          </g>
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

  /* ---- cow art (300-space: strokes here are ~0.52× on the stage) ----
     Three stroke tiers: silhouette 4.5, features 3, fine detail 2. */
  .cow-art .c-hide {
    fill: #f6ead2;
    stroke: #3c352b;
    stroke-width: 4.5;
  }

  .cow-art .c-bone {
    fill: #e5d5ae;
    stroke: #3c352b;
    stroke-width: 3;
  }

  .cow-art .c-skin {
    fill: #efdcc0;
    stroke: #3c352b;
    stroke-width: 3;
  }

  .cow-art .c-earin {
    fill: #ecd3c5;
    stroke: #3c352b;
    stroke-width: 2;
  }

  .cow-art .c-udder {
    fill: #eed7c9;
    stroke: #3c352b;
    stroke-width: 3;
  }

  .cow-art .c-teat {
    fill: #e0c0a8;
    stroke: #3c352b;
    stroke-width: 2;
  }

  .cow-art .c-tip {
    fill: #8b5e34;
    stroke: #3c352b;
    stroke-width: 2;
  }

  .cow-art .c-eyewhite {
    fill: #fdf8ec;
    stroke: #3c352b;
    stroke-width: 2;
  }

  .cow-art .c-iris {
    fill: #5a4632;
    stroke: #3c352b;
    stroke-width: 2;
  }

  .cow-art .c-pupil {
    fill: #3c352b;
    stroke: none;
  }

  .cow-art .c-lid {
    fill: #fdf8ec;
    stroke: #3c352b;
    stroke-width: 2;
  }

  .cow-art .c-ink {
    fill: #3c352b;
    stroke: none;
  }

  .cow-art .c-hoof {
    fill: #3c352b;
    stroke: #3c352b;
    stroke-width: 2;
    stroke-linejoin: round;
  }

  .cow-art .c-mouth,
  .cow-art .c-seal {
    fill: none;
    stroke: #3c352b;
    stroke-width: 2.6;
    stroke-linecap: round;
  }

  /* state overlays: hidden until their beat (the static no-JS view is the
     standing sad cow) */
  .cow-art .sph-part,
  .cow-art .lid-angry,
  .cow-art .nostril-closed {
    opacity: 0;
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
