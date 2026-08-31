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

  const HEIGHT = 300;
  const COIN_RADIUS = 7.5;
  const COIN_STEP = 16.5;

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
  const wealth = $derived(Float64Array.from(metrics.holdings, (holding) => holding / PARTICIPATION_COINS));
  const positions = $derived(roomPositions(PARTICIPATION_HOLDERS, width, HEIGHT));
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
      x: (column - (inRow - 1) / 2) * COIN_STEP,
      y: (row - (rows - 1) / 2) * COIN_STEP,
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
    if (Math.hypot(dragX - dragStartX, dragY - dragStartY) > 6) dragMoved = true;
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
    <RoomCanvas
      {wealth}
      {revision}
      height={HEIGHT}
      label="Four people whose circle areas show their shares of twelve coins"
    />

    {#if width > 0}
      <svg
        class="coin-layer"
        class:choosing={selectedCoin !== null}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        aria-label="Twelve movable coins"
      >
        {#each positions as position, holder}
          <circle
            class:destination={selectedCoin !== null && owners[selectedCoin] !== holder}
            class="drop-target"
            cx={position.x}
            cy={position.y}
            r="42"
            data-holder={holder}
            role="button"
            tabindex={selectedCoin === null ? -1 : 0}
            aria-label={`Move selected coin to person ${holder + 1}`}
            onclick={() => chooseDestination(holder)}
            onkeydown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                chooseDestination(holder);
              }
            }}
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
              tabindex="0"
              aria-label={`Coin ${coin + 1}, held by person ${holder + 1}`}
              aria-pressed={selectedCoin === coin}
              onclick={(event) => chooseCoin(event, coin)}
              onpointerdown={(event) => beginDrag(event, coin)}
              onpointermove={continueDrag}
              onpointerup={endDrag}
              onpointercancel={cancelDrag}
              onkeydown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  selectedCoin = selectedCoin === coin ? null : coin;
                }
              }}
            >
              <Coin r={COIN_RADIUS} face={coin % 2 === 0 ? 'front' : 'back'} />
            </g>
          {/each}
        {/each}
      </svg>
    {/if}
  </div>

  <output aria-live="polite">
    <span>effective participants</span>
    <strong>{metrics.effectiveParticipants.toFixed(2)} <small>of 4</small></strong>
  </output>

  <p class="caption">Move a coin. Watch what the number does.</p>

  <div class="toolbar">
    <button type="button" onclick={undo} disabled={history.length === 0}>Undo one move</button>
    <button type="button" onclick={reset} disabled={history.length === 0}>Restore equality</button>
    <span class="hint">Drag a coin, or select it and then select another circle.</span>
  </div>

  {#if draggingCoin !== null && dragMoved}
    <svg class="drag-ghost" aria-hidden="true">
      <Coin cx={dragX} cy={dragY} r={COIN_RADIUS * 1.2} face={draggingCoin % 2 === 0 ? 'front' : 'back'} />
    </svg>
  {/if}
</div>

<style>
  .room-stage {
    position: relative;
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
  }

  .drop-target.destination {
    fill: rgb(255 252 245 / 32%);
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

  .coin-layer.choosing .coin-slot {
    pointer-events: none;
  }

  output {
    display: flex;
    max-inline-size: 24rem;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    margin-inline: auto;
    padding-block: 0.65rem;
    border-block: 1px solid #c9bca5;
    color: #5c5344;
    font-size: 0.78rem;
    font-weight: 650;
  }

  output strong {
    color: #8b3f2b;
    font-size: 1.55rem;
    font-variant-numeric: tabular-nums;
  }

  output small {
    color: #756c5d;
    font-size: 0.72rem;
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
