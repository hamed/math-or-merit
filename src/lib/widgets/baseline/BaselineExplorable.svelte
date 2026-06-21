<script lang="ts">
  import { onMount } from 'svelte';
  import {
    createBaselineWorlds,
    resetBaselineWorlds,
    stepBaselineWorlds,
    viewBaselineWorlds,
  } from './BaselineWorlds';

  const population = 100;
  const beta = 0.5;
  const maxSteps = 200_000;
  const tradesPerFrame = 100;
  const worlds = createBaselineWorlds({ n: population, beta, seeds: [11, 42, 97] });

  let running = $state(false);
  let revision = $state(0);
  let views = $derived.by(() => {
    revision;
    return viewBaselineWorlds(worlds);
  });
  let step = $derived(views[0].step);

  function advance(steps: number): void {
    const remaining = maxSteps - step;
    if (remaining <= 0) {
      running = false;
      return;
    }
    stepBaselineWorlds(worlds, Math.min(steps, remaining));
    revision++;
    if (worlds[0].engine.state.step >= maxSteps) running = false;
  }

  function toggleRunning(): void {
    if (step >= maxSteps) return;
    running = !running;
  }

  function reset(): void {
    running = false;
    resetBaselineWorlds(worlds);
    revision++;
  }

  onMount(() => {
    let frame = 0;
    const tick = () => {
      if (running) advance(tradesPerFrame);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  });

  const percent = (value: number) => `${(value * 100).toFixed(value >= 0.1 ? 1 : 2)}%`;
</script>

<section class="explorable" aria-labelledby="baseline-title">
  <header class="intro">
    <div>
      <p class="kicker">Run the same rule three times</p>
      <h3 id="baseline-title">Three fair worlds</h3>
    </div>
    <p class="parameters">100 agents · 50% of the poorer wealth at stake · three fixed seeds</p>
  </header>

  <div class="toolbar" aria-label="Simulation controls">
    <button class="primary" type="button" onclick={toggleRunning} aria-pressed={running} disabled={step >= maxSteps}>
      {running ? 'Pause' : step === 0 ? 'Run all three' : 'Continue'}
    </button>
    <button type="button" onclick={() => advance(100)} disabled={running || step >= maxSteps}>Step 100 trades</button>
    <button type="button" onclick={reset} disabled={step === 0}>Reset seeds</button>
    <output aria-label="Trade count">{step.toLocaleString()} trades</output>
  </div>

  <div class="world-grid">
    {#each views as world (world.seed)}
      <section class="world-card" aria-labelledby={`world-${world.seed}`}>
        <header class="world-heading">
          <h4 id={`world-${world.seed}`}>World {world.seed}</h4>
          <span>seed {world.seed}</span>
        </header>
        <div
          class="skyline"
          role="img"
          aria-label={`World ${world.seed}: top share ${percent(world.topShare)}, Gini ${world.gini.toFixed(3)}`}
        >
          {#each world.rankedWealth as wealth}
            <span
              class="wealth-bar"
              style={`block-size: ${(wealth / world.maxWealth) * 100}%`}
              aria-hidden="true"
            ></span>
          {/each}
        </div>
        <dl>
          <div>
            <dt>Top share</dt>
            <dd>{percent(world.topShare)}</dd>
          </div>
          <div>
            <dt>Gini</dt>
            <dd>{world.gini.toFixed(3)}</dd>
          </div>
          <div>
            <dt>Effective agents</dt>
            <dd>{world.effectiveParticipants.toFixed(1)}</dd>
          </div>
        </dl>
      </section>
    {/each}
  </div>

  <footer>
    <p>Each skyline ranks all 100 agents. Bar height is relative to that world's richest agent.</p>
    <p>The display stops at 200,000 trades. The mathematical result concerns unlimited time.</p>
  </footer>
</section>

<style>
  .explorable {
    margin-block: 3rem;
    padding-block: clamp(1.2rem, 3vw, 2rem);
    padding-inline: clamp(1rem, 3vw, 2rem);
    border: 1px solid #b9aa91;
    border-radius: 1.2rem;
    background: #fffaf0;
    box-shadow: 0 1.2rem 3rem rgb(65 50 29 / 9%);
    font-family: Vazirmatn, system-ui, sans-serif;
  }

  .intro,
  .toolbar,
  .world-heading,
  footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .intro {
    align-items: end;
    margin-block-end: 1.25rem;
  }

  .kicker,
  .parameters,
  .world-heading span,
  footer p {
    margin-block: 0;
    color: #6e6659;
  }

  .kicker {
    color: #8b3f2b;
    font-size: 0.72rem;
    font-weight: 750;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  h3,
  h4 {
    margin-block: 0;
    color: #211e19;
  }

  h3 {
    margin-block-start: 0.2rem;
    font-family: "Iowan Old Style", "Palatino Linotype", Vazirmatn, Georgia, serif;
    font-size: clamp(1.8rem, 4vw, 2.8rem);
    line-height: 1;
  }

  .parameters {
    max-inline-size: 25rem;
    font-size: 0.78rem;
    text-align: end;
  }

  .toolbar {
    justify-content: flex-start;
    flex-wrap: wrap;
    padding-block: 0.85rem;
    border-block: 1px solid #ded4c2;
  }

  button {
    min-block-size: 2.65rem;
    padding-block: 0.45rem;
    padding-inline: 0.9rem;
    border: 1px solid #a99980;
    border-radius: 999px;
    color: #3c352b;
    background: #fffdf8;
    cursor: pointer;
    font-size: 0.82rem;
    font-weight: 650;
  }

  button:hover:not(:disabled) {
    border-color: #7a3f2b;
    color: #7a3f2b;
  }

  button:focus-visible {
    outline: 3px solid rgb(139 63 43 / 35%);
    outline-offset: 2px;
  }

  button.primary {
    border-color: #7a3f2b;
    color: #fffaf0;
    background: #8b3f2b;
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  output {
    margin-inline-start: auto;
    color: #3c352b;
    font-variant-numeric: tabular-nums;
    font-size: 0.82rem;
    font-weight: 700;
  }

  .world-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.8rem;
    margin-block: 1.2rem;
  }

  .world-card {
    min-inline-size: 0;
    padding-block: 0.8rem;
    padding-inline: 0.8rem;
    border: 1px solid #ded4c2;
    border-radius: 0.75rem;
    background: rgb(255 255 255 / 55%);
  }

  .world-heading {
    margin-block-end: 0.65rem;
  }

  .world-heading h4 {
    font-size: 0.92rem;
  }

  .world-heading span {
    font-size: 0.65rem;
  }

  .skyline {
    display: flex;
    align-items: end;
    gap: 1px;
    block-size: 9rem;
    padding-block-start: 0.5rem;
    border-block-end: 1px solid #a99980;
    overflow: hidden;
  }

  .wealth-bar {
    flex: 1 1 0;
    min-inline-size: 0;
    background: #bd6245;
  }

  dl {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.35rem;
    margin-block: 0.8rem 0;
  }

  dl div {
    min-inline-size: 0;
  }

  dt {
    min-block-size: 2.2em;
    color: #756c5d;
    font-size: 0.58rem;
    line-height: 1.1;
    text-transform: uppercase;
  }

  dd {
    margin-inline-start: 0;
    color: #29241d;
    font-size: 0.88rem;
    font-variant-numeric: tabular-nums;
    font-weight: 750;
  }

  footer {
    align-items: start;
  }

  footer p {
    max-inline-size: 28rem;
    font-size: 0.68rem;
    line-height: 1.45;
  }

  footer p:last-child {
    text-align: end;
  }

  @media (max-width: 48rem) {
    .world-grid {
      grid-template-columns: 1fr;
    }

    .skyline {
      block-size: 7rem;
    }
  }

  @media (max-width: 36rem) {
    .intro,
    footer {
      align-items: start;
      flex-direction: column;
    }

    .parameters,
    footer p:last-child {
      text-align: start;
    }

    output {
      inline-size: 100%;
      margin-inline-start: 0;
    }
  }
</style>
