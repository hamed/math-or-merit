<script lang="ts">
  import { fade } from 'svelte/transition';

  // One canvas, morphing in place (draft-decisions D5/D8). Scenes, in story order:
  //   cow → sphere → vacuum → uphill → person → strip → circle → coin → room
  // and for the ending (reverse morph): lone → reform → headcard.
  let { scene }: { scene: string } = $props();

  const isPerson = $derived(scene === 'person' || scene === 'strip' || scene === 'reform' || scene === 'headcard');
  const bodyVisible = $derived(
    scene === 'cow' || scene === 'sphere' || scene === 'vacuum' || scene === 'uphill' ||
    scene === 'strip' || scene === 'circle' || scene === 'coin' || scene === 'room' || scene === 'lone',
  );
  const cowParts = $derived(scene === 'cow');
  const inVacuum = $derived(scene === 'vacuum');

  // The one body circle (r=60), reshaped per scene via transform.
  const bodyTransform = $derived.by(() => {
    switch (scene) {
      case 'cow':
        return 'translate(6px, 0) scale(1.45, 0.92)';
      case 'sphere':
      case 'vacuum':
        return 'scale(1.1)';
      case 'uphill':
        return 'translate(-118px, 52px) scale(0.62)';
      case 'coin':
        return 'scale(1.2)';
      case 'room':
        return 'translate(-21px, -28px) scale(0.217)';
      case 'strip':
      case 'circle':
      case 'lone':
      default:
        return 'scale(1.1)';
    }
  });

  const roomGrid = (() => {
    const cells: { x: number; y: number }[] = [];
    for (let i = 0; i < 60; i++) {
      if (i === 24) continue; // the main circle's cell
      cells.push({ x: 51 + (i % 10) * 42, y: 38 + Math.floor(i / 10) * 42 });
    }
    return cells;
  })();

  const stars = [
    { x: 60, y: 46 }, { x: 128, y: 88 }, { x: 96, y: 210 }, { x: 190, y: 40 },
    { x: 306, y: 52 }, { x: 388, y: 96 }, { x: 420, y: 200 }, { x: 350, y: 236 },
    { x: 44, y: 150 }, { x: 434, y: 40 },
  ];
</script>

<figure class="stage" class:vacuum={inVacuum} aria-label="An illustration that morphs with the story">
  <svg viewBox="0 0 480 280" role="img" aria-label={`Story illustration, current scene: ${scene}`}>
    <!-- vacuum backdrop -->
    <rect class="void" x="0" y="0" width="480" height="280" rx="14" />
    <g class="stars">
      {#each stars as s}
        <circle cx={s.x} cy={s.y} r="1.6" />
      {/each}
    </g>

    <!-- uphill slope -->
    {#if scene === 'uphill'}
      <g transition:fade={{ duration: 400 }}>
        <line class="slope" x1="20" y1="258" x2="460" y2="88" />
        <path class="push-arrow" d="M 168 178 L 218 158 M 218 158 l -12 -4 M 218 158 l -7 11" />
        <!-- the square cow and the real cow, waiting their turn, sliding back -->
        <g class="ghost ghost-square">
          <rect x="52" y="216" width="34" height="26" rx="3" />
          <line x1="58" y1="242" x2="58" y2="252" />
          <line x1="80" y1="242" x2="80" y2="252" />
        </g>
        <g class="ghost ghost-cow">
          <ellipse cx="34" cy="254" rx="16" ry="9" />
          <circle cx="19" cy="248" r="5" />
        </g>
      </g>
    {/if}

    <!-- ground shadow (cow scene) -->
    <ellipse class="shadow" class:shown={scene === 'cow'} cx="245" cy="238" rx="110" ry="10" />

    <!-- cow parts: fade & retract into the body -->
    <g class="part legs" class:hidden={!cowParts}>
      <rect x="188" y="186" width="13" height="48" rx="6" />
      <rect x="216" y="192" width="13" height="44" rx="6" />
      <rect x="262" y="192" width="13" height="44" rx="6" />
      <rect x="290" y="186" width="13" height="48" rx="6" />
    </g>
    <g class="part tail" class:hidden={!cowParts}>
      <path d="M 332 138 Q 366 150 358 196" fill="none" />
      <circle cx="358" cy="200" r="6" />
    </g>
    <g class="part head" class:hidden={!cowParts}>
      <circle cx="152" cy="112" r="27" />
      <ellipse cx="143" cy="124" rx="16" ry="11" class="muzzle" />
      <circle cx="139" cy="122" r="1.8" class="ink" />
      <circle cx="148" cy="126" r="1.8" class="ink" />
      <circle cx="146" cy="104" r="2.6" class="ink" />
      <path d="M 132 94 Q 122 84 126 74" fill="none" />
      <path d="M 168 92 Q 176 82 172 72" fill="none" />
      <path d="M 170 106 Q 184 110 182 120" fill="none" class="ear" />
    </g>
    <g class="part spots" class:hidden={!cowParts}>
      <ellipse cx="222" cy="136" rx="24" ry="16" />
      <ellipse cx="286" cy="164" rx="18" ry="13" />
    </g>
    <g class="part udder" class:hidden={!cowParts}>
      <ellipse cx="272" cy="198" rx="16" ry="10" />
    </g>

    <!-- THE body: cow → sphere → pushed ball → circle → person's leftover → one of a crowd -->
    <circle class="body" class:hidden={!bodyVisible} class:pushed={scene === 'uphill'} cx="240" cy="150" r="60" vector-effect="non-scaling-stroke" style={`transform: ${bodyTransform}`} />
    <path class="shine" class:shown={scene === 'sphere' || inVacuum} d="M 206 122 Q 218 104 240 100" fill="none" />

    <!-- dust around the lone winner (ending) -->
    {#if scene === 'lone'}
      <g class="dust" transition:fade={{ duration: 400 }}>
        {#each roomGrid.slice(0, 24) as cell}
          <rect x={cell.x} y={cell.y} width="2" height="2" />
        {/each}
      </g>
    {/if}

    <!-- the person: appears where the cow was; stripped down to the same circle -->
    {#if isPerson}
      <g class="person" class:stripping={scene === 'strip'} class:fading={scene === 'headcard'} transition:fade={{ duration: 400 }}>
        <g class="piece torso-g">
          <path class="suit" d="M 208 126 L 272 126 L 288 246 L 192 246 Z" />
          <path class="shirt" d="M 230 126 L 240 158 L 250 126 Z" />
          <path class="tie piece-tie" d="M 237 130 L 243 130 L 242 152 L 240 162 L 238 152 Z" />
        </g>
        <g class="piece arm-left">
          <path d="M 210 136 Q 184 158 178 186" fill="none" class="limb" />
          <circle cx="177" cy="192" r="7" class="skin" />
        </g>
        <g class="piece arm-right">
          <path d="M 270 136 Q 298 148 308 142" fill="none" class="limb" />
          <circle cx="313" cy="140" r="7" class="skin" />
        </g>
        <g class="piece rocket">
          <g transform="rotate(-32 322 122)">
            <rect x="316" y="102" width="13" height="34" rx="6" class="hull" />
            <path d="M 316 108 Q 322.5 92 329 108 Z" class="nose" />
            <path d="M 316 132 L 309 144 L 316 138 Z" class="fin" />
            <path d="M 329 132 L 336 144 L 329 138 Z" class="fin" />
            <circle cx="322.5" cy="114" r="3" class="window" />
          </g>
        </g>
        <g class="piece head-g">
          <circle cx="240" cy="94" r="28" class="skin" />
          <path class="hair" d="M 213 88 Q 218 60 246 62 Q 264 64 267 80 Q 254 70 243 72 Q 224 74 213 88 Z" />
          <circle cx="231" cy="92" r="2.6" class="ink" />
          <circle cx="251" cy="92" r="2.6" class="ink" />
          <path d="M 230 104 Q 240 112 252 103" fill="none" class="smile" />
        </g>
        <g class="piece shoes">
          <ellipse cx="212" cy="250" rx="16" ry="7" />
          <ellipse cx="268" cy="250" rx="16" ry="7" />
        </g>
      </g>
    {/if}

    <!-- coins drop in; the honest size lesson -->
    {#if scene === 'coin'}
      <g transition:fade={{ duration: 300 }}>
        <g class="coin">
          <circle cx="240" cy="24" r="12" />
          <text x="240" y="29" text-anchor="middle">¢</text>
        </g>
        <circle class="companion" cx="404" cy="188" r="36" />
        <text class="note" x="240" y="264" text-anchor="middle">twice as wide — four times the money</text>
        <text class="mini-label" x="240" y="243" text-anchor="middle">four coins</text>
        <text class="mini-label" x="404" y="243" text-anchor="middle">one coin</text>
      </g>
    {/if}

    <!-- the room: the circle multiplies -->
    {#if scene === 'room'}
      <g class="crowd">
        {#each roomGrid as cell, i}
          <circle cx={cell.x} cy={cell.y} r="13" transition:fade={{ duration: 260, delay: i * 14 }} />
        {/each}
      </g>
    {/if}

    <!-- the ending: the person folds back into the opening headline card -->
    {#if scene === 'headcard'}
      <g class="headcard" transition:fade={{ duration: 500, delay: 250 }}>
        <rect x="70" y="88" width="340" height="104" rx="10" />
        <text x="240" y="132" text-anchor="middle" class="headline">The world has its first trillionaire.</text>
        <text x="240" y="162" text-anchor="middle" class="sub">— on paper, anyway.</text>
      </g>
    {/if}
  </svg>
</figure>

<style>
  .stage {
    margin: 0;
    border: 1px solid #d3c7b0;
    border-radius: 1rem;
    background: #fffaf0;
    box-shadow: 0 0.7rem 1.8rem rgb(65 50 29 / 10%);
    overflow: hidden;
    transition: background 0.9s ease;
  }

  .stage.vacuum {
    background: #241f2e;
  }

  svg {
    display: block;
    inline-size: 100%;
    block-size: auto;
  }

  /* every persistent element morphs, not jumps */
  .body,
  .part,
  .shadow,
  .void,
  .stars,
  .shine {
    transition:
      transform 0.85s cubic-bezier(0.55, 0, 0.25, 1),
      opacity 0.7s ease;
  }

  .void {
    fill: #241f2e;
    opacity: 0;
  }

  .stage.vacuum .void {
    opacity: 1;
  }

  .stars circle {
    fill: #efe6c8;
  }

  .stars {
    opacity: 0;
  }

  .stage.vacuum .stars {
    opacity: 0.9;
  }

  .body {
    fill: #f6ead2;
    stroke: #3c352b;
    stroke-width: 2.6;
    transform-box: fill-box;
    transform-origin: center;
  }

  .stage.vacuum .body {
    stroke: #efe6c8;
  }

  .body.pushed {
    animation: push-slide 2.6s cubic-bezier(0.45, 0, 0.6, 1) infinite;
  }

  @keyframes push-slide {
    0%, 12% {
      transform: translate(-118px, 52px) scale(0.62);
    }
    55% {
      transform: translate(-74px, 35px) scale(0.62);
    }
    100% {
      transform: translate(-118px, 52px) scale(0.62);
    }
  }

  .shine {
    stroke: #3c352b;
    stroke-width: 2;
    stroke-linecap: round;
    opacity: 0;
  }

  .stage.vacuum .shine {
    stroke: #efe6c8;
  }

  .shine.shown {
    opacity: 0.55;
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

  .part,
  .body,
  .shadow {
    transform-box: fill-box;
    transform-origin: center;
  }

  .part.hidden {
    opacity: 0;
    transform: scale(0.45);
    pointer-events: none;
  }

  .body.hidden {
    opacity: 0;
  }

  .shadow {
    fill: rgb(60 53 43 / 12%);
    opacity: 0;
  }

  .shadow.shown {
    opacity: 1;
  }

  .slope {
    stroke: #3c352b;
    stroke-width: 2.6;
    stroke-linecap: round;
  }

  .push-arrow {
    stroke: #8b3f2b;
    stroke-width: 2.6;
    stroke-linecap: round;
    fill: none;
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

  .dust rect {
    fill: rgb(60 53 43 / 45%);
  }

  /* person */
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
    fill: none;
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

  .person .nose {
    fill: #8b3f2b;
  }

  .person .fin {
    fill: #8b3f2b;
  }

  .person .window {
    fill: #9fc4c9;
    stroke: #3c352b;
    stroke-width: 1.2;
  }

  .person .shoes ellipse {
    fill: #2e2a23;
  }

  .piece {
    transition:
      transform 0.8s cubic-bezier(0.55, 0, 0.3, 1),
      opacity 0.7s ease;
    transform-box: fill-box;
    transform-origin: center;
  }

  .person.stripping .rocket {
    transform: translate(96px, -84px) rotate(40deg);
    opacity: 0;
    transition-delay: 0s;
  }

  .person.stripping .arm-right {
    transform: scale(0.2);
    opacity: 0;
    transition-delay: 0.25s;
  }

  .person.stripping .arm-left {
    transform: scale(0.2);
    opacity: 0;
    transition-delay: 0.35s;
  }

  .person.stripping .shoes {
    transform: translateY(30px);
    opacity: 0;
    transition-delay: 0.45s;
  }

  .person.stripping .head-g {
    transform: translateY(24px) scale(0.6);
    opacity: 0;
    transition-delay: 0.6s;
  }

  .person.stripping .torso-g {
    transform: scale(0.75);
    opacity: 0;
    transition-delay: 0.8s;
  }

  .person.fading {
    opacity: 0;
    transition: opacity 0.5s ease;
  }

  /* the body circle waits under the person and is revealed by the strip */
  .coin circle {
    fill: #e9c96a;
    stroke: #8a6a2a;
    stroke-width: 2;
  }

  .coin text {
    fill: #5c4413;
    font-size: 13px;
    font-weight: 700;
  }

  .coin {
    animation: coin-drop 1.5s cubic-bezier(0.5, 0, 0.8, 0.4) infinite;
  }

  @keyframes coin-drop {
    0% {
      transform: translateY(0);
      opacity: 0;
    }
    25% {
      opacity: 1;
    }
    62% {
      transform: translateY(64px);
      opacity: 1;
    }
    78% {
      transform: translateY(76px);
      opacity: 0;
    }
    100% {
      transform: translateY(76px);
      opacity: 0;
    }
  }

  .companion {
    fill: #f6ead2;
    stroke: #3c352b;
    stroke-width: 2.2;
  }

  .note {
    fill: #8b3f2b;
    font-size: 13px;
    font-style: italic;
  }

  .mini-label {
    fill: #756c5d;
    font-size: 11px;
  }

  .crowd circle {
    fill: #f6ead2;
    stroke: #3c352b;
    stroke-width: 2;
  }

  .headcard rect {
    fill: #fffdf8;
    stroke: #c9bca5;
    stroke-width: 1.5;
  }

  .headcard .headline {
    fill: #211e19;
    font-family: 'Iowan Old Style', 'Palatino Linotype', Georgia, serif;
    font-size: 19px;
    font-weight: 650;
  }

  .headcard .sub {
    fill: #756c5d;
    font-size: 12px;
    font-style: italic;
  }
</style>
