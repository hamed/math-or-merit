<script lang="ts">
  import {
    EQUAL_COIN_OWNERS,
    PARTICIPATION_COINS,
    PARTICIPATION_HOLDERS,
    pairingMetrics,
    transferCoin,
  } from './participation';

  const HOLDER_NAMES = ['A', 'B', 'C', 'D'] as const;
  const MAX_CIRCLE = 112;

  let owners = $state([...EQUAL_COIN_OWNERS]);
  let history = $state<number[][]>([]);
  let selectedCoin = $state<number | null>(null);
  let draggingCoin = $state<number | null>(null);
  let dragMoved = $state(false);
  let dragX = $state(0);
  let dragY = $state(0);
  let dragStartX = 0;
  let dragStartY = 0;
  let suppressedClick = -1;

  const metrics = $derived(pairingMetrics(owners));
  const coinsByHolder = $derived.by(() =>
    Array.from({ length: PARTICIPATION_HOLDERS }, (_, holder) =>
      owners.flatMap((owner, coin) => owner === holder ? [coin] : []),
    ),
  );
  const pairedOwners = $derived([...owners].sort((a, b) => a - b));

  const lesson = $derived.by(() => {
    const effective = metrics.effectiveParticipants;
    if (Math.abs(effective - 4) < 1e-9) {
      return history.length === 0
        ? 'Four equal people. Move a coin from one circle to another. Can you make this number exactly 3?'
        : 'Back to four: every person holds the same number of coins again.';
    }
    if (Math.abs(effective - 3) < 1e-9) {
      return 'Exactly three. Four people remain, but this money has the same repeat-owner chance as three equal holders.';
    }
    if (Math.abs(effective - 1) < 1e-9) {
      return 'One owner catches every possible pair. Four people remain on screen; only one effective participant remains.';
    }
    return `Four people remain. This concentration behaves like ${effective.toFixed(2)} equal holders.`;
  });

  const circleDiameter = (coins: number) => coins === 0 ? 0 : MAX_CIRCLE * Math.sqrt(coins / PARTICIPATION_COINS);

  function moveCoin(coin: number, destination: number): void {
    if (owners[coin] === destination) {
      selectedCoin = null;
      return;
    }
    history = [...history, [...owners]];
    owners = transferCoin(owners, coin, destination);
    selectedCoin = null;
  }

  function chooseCoin(event: MouseEvent, coin: number): void {
    event.stopPropagation();
    if (suppressedClick === coin) {
      suppressedClick = -1;
      return;
    }
    selectedCoin = selectedCoin === coin ? null : coin;
  }

  function beginDrag(event: PointerEvent, coin: number): void {
    if (event.button !== 0) return;
    draggingCoin = coin;
    dragMoved = false;
    dragStartX = dragX = event.clientX;
    dragStartY = dragY = event.clientY;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function continueDrag(event: PointerEvent): void {
    if (draggingCoin === null) return;
    dragX = event.clientX;
    dragY = event.clientY;
    if (Math.hypot(dragX - dragStartX, dragY - dragStartY) > 6) dragMoved = true;
  }

  function endDrag(event: PointerEvent): void {
    const coin = draggingCoin;
    if (coin === null) return;
    if (dragMoved) {
      const target = Array.from(document.querySelectorAll<HTMLElement>('[data-holder]')).find((element) => {
        const box = element.getBoundingClientRect();
        return event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
      });
      const destination = Number(target?.dataset.holder);
      if (Number.isSafeInteger(destination)) moveCoin(coin, destination);
      else selectedCoin = coin;
      suppressedClick = coin;
    }
    draggingCoin = null;
    dragMoved = false;
  }

  function cancelDrag(): void {
    draggingCoin = null;
    dragMoved = false;
  }

  function undo(): void {
    const previous = history[history.length - 1];
    if (!previous) return;
    owners = [...previous];
    history = history.slice(0, -1);
    selectedCoin = null;
  }

  function reset(): void {
    owners = [...EQUAL_COIN_OWNERS];
    history = [];
    selectedCoin = null;
  }
</script>

<div class="widget" aria-label="Build effective participants by moving twelve coins among four people">
  <p class="kicker">Four people. How many effective participants?</p>

  <div class="room" aria-label="Four people holding twelve equal coins">
    {#each coinsByHolder as coins, holder}
      <div
        class="holder owner-{holder}"
        class:destination={selectedCoin !== null && owners[selectedCoin] !== holder}
        data-holder={holder}
        role="group"
        aria-label={`Person ${HOLDER_NAMES[holder]} holds ${coins.length} coins`}
      >
        <div
          class="fortune"
          class:empty={coins.length === 0}
          style={`inline-size:${circleDiameter(coins.length)}px;block-size:${circleDiameter(coins.length)}px`}
        >
          {#each coins as coin}
            <button
              type="button"
              class="coin owner-{holder}"
              class:selected={selectedCoin === coin}
              class:drag-source={draggingCoin === coin && dragMoved}
              aria-label={`Coin ${coin + 1}, held by person ${HOLDER_NAMES[holder]}`}
              aria-pressed={selectedCoin === coin}
              onclick={(event) => chooseCoin(event, coin)}
              onpointerdown={(event) => beginDrag(event, coin)}
              onpointermove={continueDrag}
              onpointerup={endDrag}
              onpointercancel={cancelDrag}
            ></button>
          {/each}
        </div>
        <p><strong>{HOLDER_NAMES[holder]}</strong><span>{coins.length} coins</span></p>
      </div>
    {/each}
  </div>

  {#if selectedCoin !== null}
    <div class="destinations" aria-label="Move the selected coin">
      <span>Move coin {selectedCoin + 1} to</span>
      {#each HOLDER_NAMES as name, holder}
        <button type="button" onclick={() => moveCoin(selectedCoin!, holder)} disabled={owners[selectedCoin] === holder}>{name}</button>
      {/each}
    </div>
  {/if}

  <div class="pairing">
    <div class="pair-visual">
      <div class="top-axis" aria-hidden="true">
        {#each pairedOwners as owner}<i class="owner-{owner}"></i>{/each}
      </div>
      <div class="pair-body">
        <div class="side-axis" aria-hidden="true">
          {#each pairedOwners as owner}<i class="owner-{owner}"></i>{/each}
        </div>
        <div
          class="pair-grid"
          role="img"
          aria-label={`${metrics.matchingPairs} of ${metrics.totalPairs} possible ordered coin pairs have the same owner`}
        >
          {#each pairedOwners as rowOwner}
            {#each pairedOwners as columnOwner}
              <i class:match={rowOwner === columnOwner} class="owner-{rowOwner}" aria-hidden="true"></i>
            {/each}
          {/each}
        </div>
      </div>
      <p>Every tile is one possible first-and-second draw; the first coin goes back. Color means the same owner appeared twice.</p>
    </div>

    <div class="calculation" aria-live="polite">
      <p><span>same-owner pairs</span><strong>{metrics.matchingPairs} / {metrics.totalPairs}</strong></p>
      <p><span>same-owner chance</span><strong>{(metrics.sameOwnerChance * 100).toFixed(1)}%</strong></p>
      <div aria-hidden="true">↓ turn it upside down</div>
      <output><span>effective participants</span><strong>{metrics.effectiveParticipants.toFixed(2)}</strong></output>
    </div>
  </div>

  <p class="caption" aria-live="polite">{lesson}</p>

  <div class="toolbar">
    <button type="button" onclick={undo} disabled={history.length === 0}>Undo one move</button>
    <button type="button" onclick={reset} disabled={history.length === 0}>Restore equality</button>
    <span class="hint">Drag a coin, or select it and use the destination buttons.</span>
  </div>

  {#if draggingCoin !== null && dragMoved}
    <span
      class="drag-ghost coin owner-{owners[draggingCoin]}"
      style={`inset-inline-start:${dragX}px;inset-block-start:${dragY}px`}
      aria-hidden="true"
    ></span>
  {/if}
</div>

<style>
  .room {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.75rem;
    margin-block: 0.6rem 1rem;
  }

  .holder {
    display: flex;
    min-inline-size: 0;
    min-block-size: 9rem;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    padding-block: 0.35rem;
    border-radius: 0.7rem;
    outline: none;
    cursor: default;
  }

  .holder.destination {
    background: rgb(255 252 245 / 75%);
    box-shadow: inset 0 0 0 1px #c9bca5;
  }

  .fortune {
    display: flex;
    box-sizing: border-box;
    flex-wrap: wrap;
    align-content: center;
    justify-content: center;
    gap: 2px;
    border: 1.5px solid var(--holder-stroke);
    border-radius: 50%;
    background: var(--holder-fill);
    transition: inline-size 0.35s ease, block-size 0.35s ease;
  }

  .fortune.empty {
    inline-size: 1.8rem !important;
    block-size: 1.8rem !important;
    border-style: dashed;
    background: transparent;
    opacity: 0.55;
  }

  .holder > p {
    display: flex;
    gap: 0.35rem;
    margin-block: 0.35rem 0;
    color: #756c5d;
    font-size: 0.72rem;
  }

  .holder > p strong {
    color: var(--holder-stroke);
  }

  .coin {
    box-sizing: border-box;
    inline-size: 0.95rem;
    block-size: 0.95rem;
    flex: 0 0 0.95rem;
    border: 1px solid var(--holder-stroke);
    border-radius: 50%;
    padding: 0;
    background: var(--coin-fill);
    box-shadow: inset 0 0 0 1px rgb(255 255 255 / 45%);
    cursor: grab;
    touch-action: none;
  }

  .coin.selected {
    outline: 3px solid #f2c94c;
    outline-offset: 2px;
  }

  .coin.drag-source {
    opacity: 0.25;
  }

  .destinations {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    margin-block: -0.3rem 0.8rem;
    color: #5c5344;
    font-size: 0.75rem;
  }

  .destinations button {
    min-inline-size: 2.3rem;
    min-block-size: 2.3rem;
    padding: 0;
    border-radius: 50%;
  }

  .pairing {
    display: grid;
    grid-template-columns: minmax(13rem, 1fr) minmax(12rem, 0.8fr);
    gap: clamp(1rem, 4vw, 2.5rem);
    align-items: center;
  }

  .pair-visual {
    max-inline-size: 20rem;
    margin-inline: auto;
  }

  .top-axis {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 1px;
    margin-inline-start: 1.15rem;
    margin-block-end: 0.18rem;
  }

  .pair-body {
    display: grid;
    grid-template-columns: 1rem 1fr;
    gap: 0.15rem;
  }

  .side-axis {
    display: grid;
    grid-template-rows: repeat(12, 1fr);
    gap: 1px;
  }

  .top-axis i,
  .side-axis i {
    display: block;
    inline-size: min(0.75rem, 80%);
    aspect-ratio: 1;
    align-self: center;
    justify-self: center;
    border-radius: 50%;
    background: var(--coin-fill);
  }

  .pair-grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    aspect-ratio: 1;
    border: 1px solid #b9aa91;
    background: rgb(255 252 245 / 55%);
  }

  .pair-grid i {
    min-inline-size: 0;
    border: 0.5px solid rgb(169 153 128 / 28%);
    background: transparent;
  }

  .pair-grid i.match {
    background: var(--coin-fill);
    border-color: var(--holder-stroke);
  }

  .pair-visual > p {
    margin-block: 0.45rem 0;
    color: #756c5d;
    font-size: 0.7rem;
    line-height: 1.35;
    text-align: center;
  }

  .calculation {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .calculation p,
  .calculation output {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin: 0;
    padding-block: 0.55rem;
    border-block-end: 1px solid #d8cdb9;
    color: #756c5d;
    font-size: 0.76rem;
  }

  .calculation strong {
    color: #5c5344;
    font-variant-numeric: tabular-nums;
  }

  .calculation > div {
    color: #8b3f2b;
    font-size: 0.7rem;
    font-style: italic;
    text-align: center;
  }

  .calculation output {
    align-items: baseline;
    border-block: 1px solid #c9bca5;
    color: #5c5344;
    font-weight: 650;
  }

  .calculation output strong {
    color: #8b3f2b;
    font-size: 1.45rem;
  }

  .hint {
    align-self: center;
    color: #756c5d;
    font-size: 0.7rem;
  }

  .drag-ghost {
    position: fixed;
    z-index: 100;
    transform: translate(-50%, -50%) scale(1.25);
    pointer-events: none;
  }

  .owner-0 { --holder-fill: #f1d0c3; --holder-stroke: #9e4e35; --coin-fill: #df8e73; }
  .owner-1 { --holder-fill: #c9dcf5; --holder-stroke: #365f9e; --coin-fill: #82a9df; }
  .owner-2 { --holder-fill: #c7e4d6; --holder-stroke: #36765a; --coin-fill: #78b99a; }
  .owner-3 { --holder-fill: #e1d1ed; --holder-stroke: #765190; --coin-fill: #b18acb; }

  @media (max-width: 40rem) {
    .room {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.25rem 0.75rem;
    }

    .holder {
      min-block-size: 8rem;
    }

    .pairing {
      grid-template-columns: 1fr;
    }

    .calculation {
      gap: 0.2rem;
    }
  }
</style>
