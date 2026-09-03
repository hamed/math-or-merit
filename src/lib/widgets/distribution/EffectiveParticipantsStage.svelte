<script lang="ts">
  import { onMount } from 'svelte';
  import RoomCanvas from '../shared/RoomCanvas.svelte';
  import { roomPositions } from '../shared/layout';
  import Coin from '../stage/scenes/Coin.svelte';
  import {
    EQUAL_COIN_OWNERS,
    PARTICIPATION_COINS,
    PARTICIPATION_HOLDERS,
    pairingMetrics,
    transferCoin,
  } from './participation';

  let room: HTMLDivElement;
  let width = $state(0);
  let owners = $state([...EQUAL_COIN_OWNERS]);
  let history = $state<number[][]>([]);
  let revision = $state(0);
  let selectedCoin = $state<number | null>(null);
  let draggingCoin = $state<number | null>(null);
  let dragMoved = $state(false);
  let dragX = $state(0);
  let dragY = $state(0);
  let dragStartX = 0;
  let dragStartY = 0;
  let suppressedClick = -1;

  const metrics = $derived(pairingMetrics(owners));
  const participationPosition = $derived(
    ((metrics.effectiveParticipants - 1) / (PARTICIPATION_HOLDERS - 1)) * 100,
  );
  const wealth = $derived(Float64Array.from(metrics.holdings, (holding) => holding / PARTICIPATION_COINS));
  const roomMargin = $derived(width * 0.12);
  const positions = $derived(roomPositions(PARTICIPATION_HOLDERS, width, width, roomMargin));
  const coinRadius = $derived(Math.max(8.5, Math.min(13, width / 42)));
  const coinStep = $derived(coinRadius * 2.15);
  const dropRadius = $derived(Math.max(40, width * 0.14));
  const coinsByHolder = $derived.by(() =>
    Array.from({ length: PARTICIPATION_HOLDERS }, (_, holder) =>
      owners.flatMap((owner, coin) => owner === holder ? [coin] : []),
    ),
  );

  function coinOffset(index: number, count: number): { x: number; y: number } {
    const columns = count <= 3 ? count : Math.min(4, Math.ceil(Math.sqrt(count)));
    const rows = Math.ceil(count / columns);
    const row = Math.floor(index / columns);
    const rowStart = row * columns;
    const inRow = Math.min(columns, count - rowStart);
    const column = index - rowStart;
    return {
      x: (column - (inRow - 1) / 2) * coinStep,
      y: (row - (rows - 1) / 2) * coinStep,
    };
  }

  function moveCoin(coin: number, destination: number): void {
    if (owners[coin] === destination) {
      selectedCoin = null;
      return;
    }
    history = [...history, [...owners]];
    owners = transferCoin(owners, coin, destination);
    revision++;
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
    suppressedClick = -1;
    draggingCoin = coin;
    dragMoved = false;
    dragStartX = dragX = event.clientX;
    dragStartY = dragY = event.clientY;
    (event.currentTarget as SVGGElement).setPointerCapture(event.pointerId);
  }

  function continueDrag(event: PointerEvent): void {
    if (draggingCoin === null) return;
    dragX = event.clientX;
    dragY = event.clientY;
    if (!dragMoved && Math.hypot(dragX - dragStartX, dragY - dragStartY) > 6) {
      dragMoved = true;
      selectedCoin = null;
    }
  }

  function endDrag(event: PointerEvent): void {
    const coin = draggingCoin;
    if (coin === null) return;
    if (dragMoved) {
      const target = Array.from(room.querySelectorAll<SVGCircleElement>('[data-holder]')).find((element) => {
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

  function chooseDestination(holder: number): void {
    if (selectedCoin !== null) moveCoin(selectedCoin, holder);
  }

  function handleCoinKeydown(event: KeyboardEvent, coin: number): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      selectedCoin = null;
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectedCoin = selectedCoin === coin ? null : coin;
    }
  }

  function handleDestinationKeydown(event: KeyboardEvent, holder: number): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      selectedCoin = null;
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      chooseDestination(holder);
    }
  }

  function undo(): void {
    const previous = history[history.length - 1];
    if (!previous) return;
    owners = [...previous];
    history = history.slice(0, -1);
    revision++;
    selectedCoin = null;
  }

  function reset(): void {
    owners = [...EQUAL_COIN_OWNERS];
    history = [];
    revision++;
    selectedCoin = null;
  }

  onMount(() => {
    const observer = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width;
    });
    observer.observe(room);
    return () => observer.disconnect();
  });
</script>

<div class="widget" aria-label="Explore effective participants by moving coins in a four-person room">
  <p class="kicker">A room in. One number out.</p>

  <div bind:this={room} class="room-stage">
    {#if width > 0}
      <RoomCanvas
        {wealth}
        {revision}
        height={width}
        margin={roomMargin}
        label="Four people at the corners of a square room; circle area shows each share of sixteen coins"
      />

      <svg
        class="coin-layer"
        class:choosing={selectedCoin !== null}
        viewBox={`0 0 ${width} ${width}`}
        aria-label="Sixteen movable coins, four per person"
      >
        {#each positions as position, holder}
          <circle
            class="drop-surface"
            cx={position.x}
            cy={position.y}
            r={dropRadius}
            data-holder={holder}
            role="button"
            tabindex="-1"
            aria-hidden="true"
            onclick={() => chooseDestination(holder)}
            onkeydown={(event) => handleDestinationKeydown(event, holder)}
          />
        {/each}

        {#each coinsByHolder as coins, holder}
          {#each coins as coin, index}
            {@const offset = coinOffset(index, coins.length)}
            <g
              class="coin-slot"
              class:selected={selectedCoin === coin}
              class:drag-source={draggingCoin === coin && dragMoved}
              transform={`translate(${positions[holder].x + offset.x} ${positions[holder].y + offset.y})`}
              role="button"
              tabindex={selectedCoin === null || selectedCoin === coin ? 0 : -1}
              aria-label={`Coin ${coin + 1}, held by person ${holder + 1}`}
              aria-pressed={selectedCoin === coin}
              onclick={(event) => chooseCoin(event, coin)}
              onpointerdown={(event) => beginDrag(event, coin)}
              onpointermove={continueDrag}
              onpointerup={endDrag}
              onpointercancel={cancelDrag}
              onkeydown={(event) => handleCoinKeydown(event, coin)}
            >
              <Coin r={coinRadius} face={coin % 2 === 0 ? 'front' : 'back'} />
            </g>
          {/each}
        {/each}

        {#each positions as position, holder}
          <circle
            class:destination={selectedCoin !== null && owners[selectedCoin] !== holder}
            class="drop-target"
            cx={position.x}
            cy={position.y}
            r={dropRadius}
            data-holder={holder}
            role="button"
            tabindex={selectedCoin === null ? -1 : 0}
            aria-label={`Move selected coin to person ${holder + 1}`}
            onclick={() => chooseDestination(holder)}
            onkeydown={(event) => handleDestinationKeydown(event, holder)}
          />
        {/each}
      </svg>
    {/if}
  </div>

  <output aria-live="polite">
    <span class="measure">effective participants</span>
    <strong>{metrics.effectiveParticipants.toFixed(2)} <small>of 4</small></strong>
    <span class="meaning">
      Same concentration as {metrics.effectiveParticipants.toFixed(2)} equal fortunes.
    </span>
    <span class="scale" aria-hidden="true">
      <span class="track">
        <span class="fill" style={`inline-size: ${participationPosition}%`}></span>
        <span class="marker" style={`inset-inline-start: ${participationPosition}%`}></span>
      </span>
      <span class="ends"><span>one owner</span><span>four equal</span></span>
    </span>
  </output>

  <p class="caption">Move a coin. The headcount stays four. The effective count does not.</p>

  <div class="toolbar">
    <button type="button" onclick={undo} disabled={history.length === 0}>Undo one move</button>
    <button type="button" onclick={reset} disabled={history.length === 0}>Restore equality</button>
    <span class="hint">Drag a coin, or select it and then select another circle.</span>
  </div>

  {#if draggingCoin !== null && dragMoved}
    <svg class="drag-ghost" aria-hidden="true">
      <Coin cx={dragX} cy={dragY} r={coinRadius * 1.2} face={draggingCoin % 2 === 0 ? 'front' : 'back'} />
    </svg>
  {/if}
</div>

<style>
  .room-stage {
    position: relative;
    inline-size: min(100%, 36rem);
    aspect-ratio: 1;
    margin-inline: auto;
    margin-block: 0.4rem 0.8rem;
  }

  .coin-layer {
    position: absolute;
    inset: 0;
    display: block;
    inline-size: 100%;
    block-size: 100%;
    overflow: visible;
  }

  .drop-target {
    fill: transparent;
    stroke: transparent;
    stroke-width: 1.5;
    cursor: default;
    outline: none;
    pointer-events: none;
  }

  .drop-surface {
    fill: transparent;
    cursor: pointer;
    outline: none;
  }

  .coin-layer:not(.choosing) .drop-surface {
    pointer-events: none;
  }

  .drop-target.destination {
    fill: transparent;
    stroke: rgb(74 63 48 / 38%);
    stroke-dasharray: 4 4;
    cursor: pointer;
  }

  .drop-target:focus-visible {
    stroke: #3c352b;
    stroke-width: 2.4;
  }

  .coin-slot {
    cursor: grab;
    outline: none;
    touch-action: none;
    transition: opacity 120ms ease;
  }

  .coin-slot:focus-visible :global(.rim),
  .coin-slot.selected :global(.rim) {
    stroke: #3c352b;
    stroke-width: 2.4;
    opacity: 1;
  }

  .coin-slot.drag-source {
    opacity: 0.2;
  }

  output {
    display: grid;
    grid-template-columns: 1fr auto;
    max-inline-size: 28rem;
    align-items: baseline;
    gap: 0.35rem 1rem;
    margin-inline: auto;
    padding-block: 1rem;
    padding-inline: 1.1rem;
    border-radius: 0.35rem;
    color: #f5ecdd;
    background: #29251f;
    font-size: 0.78rem;
    font-weight: 650;
  }

  output strong {
    color: #f1b89d;
    font-size: 1.75rem;
    font-variant-numeric: tabular-nums;
  }

  output small {
    color: #cfc3af;
    font-size: 0.72rem;
    font-weight: 500;
  }

  .measure {
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .meaning,
  .scale {
    grid-column: 1 / -1;
  }

  .meaning {
    color: #fffaf1;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 0.98rem;
    font-weight: 400;
  }

  .scale {
    display: grid;
    gap: 0.3rem;
    margin-block-start: 0.45rem;
  }

  .track {
    position: relative;
    display: block;
    block-size: 0.3rem;
    border-radius: 999px;
    background: #625a4e;
  }

  .fill {
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    border-radius: inherit;
    background: #d88767;
  }

  .marker {
    position: absolute;
    inset-block-start: 50%;
    inline-size: 0.85rem;
    block-size: 0.85rem;
    border: 2px solid #29251f;
    border-radius: 50%;
    background: #f1b89d;
    transform: translate(-50%, -50%);
  }

  :global([dir='rtl']) .marker {
    transform: translate(50%, -50%);
  }

  .ends {
    display: flex;
    justify-content: space-between;
    color: #cfc3af;
    font-size: 0.66rem;
    font-weight: 500;
  }

  .hint {
    align-self: center;
    color: #756c5d;
    font-size: 0.7rem;
  }

  .drag-ghost {
    position: fixed;
    z-index: 100;
    inset: 0;
    inline-size: 100vw;
    block-size: 100vh;
    overflow: visible;
    pointer-events: none;
  }

  @media (max-width: 40rem) {
    .room-stage {
      margin-block-start: 0;
    }
  }
</style>
