<script lang="ts">
  import { onMount } from 'svelte';
  import Coin from '../stage/scenes/Coin.svelte';
  import { CLASSIC_AGENT_FILL, CLASSIC_AGENT_STROKE } from '../shared/agentStyle';
  import { levyLessonAmounts, wealthAfterLevyRounds } from './levyLesson';

  const VIEW = 520;
  const CENTER = { x: VIEW / 2, y: VIEW / 2 };
  const PEOPLE = [
    { x: 105, y: 105 },
    { x: 415, y: 105 },
    { x: 105, y: 415 },
    { x: 415, y: 415 },
  ] as const;
  const CONTRIBUTION_OWNER = [0, 1, 2, 3, 3, 3, 3, 3] as const;
  const COIN_R = 14;
  const REPEAT_MS = 380;
  const VISUAL_EQUALITY_PX = 0.5;
  const amounts = levyLessonAmounts();

  const phases = ['start', 'collect', 'pool', 'divide', 'return', 'settle', 'repeat'] as const;
  type Phase = (typeof phases)[number];
  let phaseIndex = $state(0);
  let repeatRound = $state(1);
  let repeating = $state(false);
  let repeatTimer: ReturnType<typeof setInterval> | undefined;
  const phase = $derived<Phase>(phases[phaseIndex]);

  const shownWealth = $derived(
    phase === 'start'
      ? amounts.initial
      : phase === 'settle' || phase === 'repeat'
        ? wealthAfterLevyRounds(repeatRound)
        : amounts.afterLevy,
  );

  const visuallyEqual = $derived(
    radius(Math.max(...shownWealth)) - radius(Math.min(...shownWealth)) < VISUAL_EQUALITY_PX,
  );

  const captions: Record<Exclude<Phase, 'repeat'>, string> = {
    start: 'Four fortunes. One rule will touch all four.',
    collect: 'Take the same quarter from each. Three give one coin. The largest gives five.',
    pool: 'Eight coins enter one common pool.',
    divide: 'Divide the pool into four equal shares: two coins each.',
    return: 'Return one equal share to each person.',
    settle: 'Net result: each smaller fortune gains one coin. The largest contributes three.',
  };

  const caption = $derived(
    phase === 'repeat'
      ? visuallyEqual
        ? `After ${repeatRound} rounds, the room is equal to the eye. Any remaining difference is smaller than a pixel.`
        : `Round ${repeatRound}. The same rule pulls every fortune another quarter of the way toward the mean.`
      : captions[phase],
  );

  const nextLabels: Record<Exclude<Phase, 'settle' | 'repeat'>, string> = {
    start: 'Take the same 25%',
    collect: 'Make one pool',
    pool: 'Divide it equally',
    divide: 'Return it to the room',
    return: 'Count the result',
  };

  function radius(units: number): number {
    return 17 * Math.sqrt(units);
  }

  function collectPosition(coin: number): { x: number; y: number } {
    const owner = CONTRIBUTION_OWNER[coin];
    const person = PEOPLE[owner];
    const towardCenter = owner < 3 ? 0.43 : 0.7;
    const offsets = owner < 3
      ? [[0, 0]]
      : [[-30, -14], [0, -14], [30, -14], [-15, 16], [15, 16]];
    const [dx, dy] = offsets[owner < 3 ? 0 : coin - 3];
    return {
      x: person.x + (CENTER.x - person.x) * towardCenter + dx,
      y: person.y + (CENTER.y - person.y) * towardCenter + dy,
    };
  }

  function poolPosition(coin: number): { x: number; y: number } {
    return {
      x: CENTER.x + (coin % 4 - 1.5) * 31,
      y: CENTER.y + (Math.floor(coin / 4) - 0.5) * 31,
    };
  }

  function dividedPosition(coin: number): { x: number; y: number } {
    const owner = Math.floor(coin / 2);
    const quadrant = [
      { x: -44, y: -44 },
      { x: 44, y: -44 },
      { x: -44, y: 44 },
      { x: 44, y: 44 },
    ][owner];
    return {
      x: CENTER.x + quadrant.x + (coin % 2 === 0 ? -COIN_R : COIN_R),
      y: CENTER.y + quadrant.y,
    };
  }

  function returnPosition(coin: number): { x: number; y: number } {
    const owner = Math.floor(coin / 2);
    const person = PEOPLE[owner];
    return {
      x: person.x + (CENTER.x - person.x) * 0.65 + (coin % 2 === 0 ? -COIN_R : COIN_R),
      y: person.y + (CENTER.y - person.y) * 0.65,
    };
  }

  function coinPosition(coin: number): { x: number; y: number } {
    if (phase === 'collect') return collectPosition(coin);
    if (phase === 'pool') return poolPosition(coin);
    if (phase === 'divide') return dividedPosition(coin);
    return returnPosition(coin);
  }

  function stopRepeating(): void {
    repeating = false;
    if (repeatTimer !== undefined) clearInterval(repeatTimer);
    repeatTimer = undefined;
  }

  function startRepeating(): void {
    if (repeating || visuallyEqual) return;
    if (phase !== 'repeat') phaseIndex = phases.indexOf('repeat');
    repeating = true;
    repeatTimer = setInterval(() => {
      repeatRound++;
      if (visuallyEqual) stopRepeating();
    }, REPEAT_MS);
  }

  function next(): void {
    if (phase === 'settle') {
      startRepeating();
      return;
    }
    if (phaseIndex < phases.indexOf('settle')) phaseIndex++;
  }

  function previous(): void {
    stopRepeating();
    if (phase === 'repeat') {
      if (repeatRound > 2) repeatRound--;
      else {
        repeatRound = 1;
        phaseIndex = phases.indexOf('settle');
      }
      return;
    }
    if (phaseIndex > 0) phaseIndex--;
  }

  function reset(): void {
    stopRepeating();
    repeatRound = 1;
    phaseIndex = 0;
  }

  onMount(() => () => stopRepeating());
</script>

<div class="widget" aria-label="A reversible lesson showing a proportional wealth levy and equal return">
  <p class="kicker">Follow eight coins</p>

  <svg viewBox={`0 0 ${VIEW} ${VIEW}`} role="img" aria-label={caption}>
    {#if phase === 'pool' || phase === 'divide'}
      <circle class="pool" cx={CENTER.x} cy={CENTER.y} r="80" />
      <text class="pool-label" x={CENTER.x} y={CENTER.y - 92} text-anchor="middle">common pool</text>
    {/if}

    {#each PEOPLE as person, i}
      <circle
        class="fortune"
        cx={person.x}
        cy={person.y}
        r={radius(shownWealth[i])}
        style={`--agent-fill:${CLASSIC_AGENT_FILL};--agent-stroke:${CLASSIC_AGENT_STROKE}`}
      />
    {/each}

    {#each CONTRIBUTION_OWNER as _, coin}
      {@const position = coinPosition(coin)}
      <g
        class="levy-coin"
        class:hidden={phase === 'start' || phase === 'settle' || phase === 'repeat'}
        style={`transform:translate(${position.x}px, ${position.y}px)`}
      >
        <Coin r={COIN_R} face={coin % 2 === 0 ? 'front' : 'back'} />
      </g>
    {/each}
  </svg>

  <p class="caption" aria-live="polite">{caption}</p>

  <div class="toolbar">
    {#if phase === 'settle'}
      <button class="primary" type="button" onclick={startRepeating}>Repeat until equal</button>
    {:else if phase === 'repeat' && !visuallyEqual}
      <button class="primary" type="button" onclick={repeating ? stopRepeating : startRepeating}>
        {repeating ? 'Pause' : 'Keep going'}
      </button>
    {:else if phase !== 'repeat'}
      <button class="primary" type="button" onclick={next}>{nextLabels[phase]}</button>
    {/if}
    <button type="button" onclick={previous} disabled={phaseIndex === 0}>Step back</button>
    <button type="button" onclick={reset} disabled={phaseIndex === 0}>Start over</button>
    <output>{phase === 'repeat' ? `round ${repeatRound}` : `step ${phaseIndex + 1} of 6`}</output>
  </div>

  <p class="note">The 25% rate is deliberately large so every coin stays visible. It is a teaching prop, not a policy recommendation.</p>
</div>

<style>
  svg {
    display: block;
    inline-size: min(100%, 34rem);
    margin-inline: auto;
    overflow: visible;
  }

  .fortune {
    fill: var(--agent-fill);
    stroke: var(--agent-stroke);
    stroke-width: 1.6;
    transition: r 420ms ease;
  }

  .pool {
    fill: rgb(255 252 245 / 55%);
    stroke: #a99980;
    stroke-width: 1.4;
    stroke-dasharray: 5 5;
  }

  .pool-label {
    fill: #756c5d;
    font-family: var(--font-sans);
    font-size: 12px;
  }

  .levy-coin {
    opacity: 1;
    transform-box: view-box;
    transform-origin: 0 0;
    transition: transform 480ms ease, opacity 220ms ease;
  }

  .levy-coin.hidden {
    opacity: 0;
  }

  output {
    margin-inline-start: auto;
    color: #756c5d;
    font-size: 0.76rem;
    font-variant-numeric: tabular-nums;
  }

  .note {
    margin-block: 0.7rem 0;
    color: #756c5d;
    font-size: 0.72rem;
    text-align: center;
  }

  @media (prefers-reduced-motion: reduce) {
    .fortune,
    .levy-coin {
      transition: none;
    }
  }
</style>
