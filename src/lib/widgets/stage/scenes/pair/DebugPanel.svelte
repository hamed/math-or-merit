<script lang="ts">
  /**
   * For the owner only, while tuning (owner, 2026-09-26: "a debugging mode …
   * verbose info for me only; we later remove that"). On with `?debug=1`, off
   * with `?debug=0`. Delete this file and tuning.svelte.ts when tuning is done.
   */
  import { resetTuning, saveTuning, tuning } from './tuning.svelte';

  interface Props {
    lines: readonly [string, string][];
    onreplay: () => void;
  }

  let { lines, onreplay }: Props = $props();
  let open = $state(true);
</script>

<aside class="debug" aria-label="Debug">
  <button type="button" class="toggle" onclick={() => (open = !open)}>debug {open ? '▾' : '▸'}</button>
  {#if open}
    <dl>
      {#each lines as [k, v] (k)}<dt>{k}</dt><dd>{v}</dd>{/each}
    </dl>
    <fieldset>
      <legend>run stops</legend>
      <label
        ><select bind:value={tuning.stop} onchange={saveTuning}>
          <option value="share">when the richest holds</option>
          <option value="trades">after trades</option>
          <option value="survivors">when only N hold ≥ floor</option>
        </select></label
      >
      {#if tuning.stop === 'share'}
        <label>share <input type="number" min="0.02" max="0.99" step="0.01" bind:value={tuning.share} onchange={saveTuning} /></label>
      {:else if tuning.stop === 'trades'}
        <label>trades <input type="number" min="100" step="100" bind:value={tuning.trades} onchange={saveTuning} /></label>
      {:else}
        <label>N <input type="number" min="1" max="100" bind:value={tuning.survivors} onchange={saveTuning} /></label>
        <label>floor ¢ <input type="number" min="1" step="1" bind:value={tuning.floorCents} onchange={saveTuning} /></label>
      {/if}
      <label>stake β <input type="number" min="0.01" max="1" step="0.05" bind:value={tuning.beta} onchange={saveTuning} /></label>
      <label>play ms <input type="number" min="500" step="500" bind:value={tuning.runMs} onchange={saveTuning} /></label>
      <div class="row">
        <button type="button" onclick={onreplay}>re-run</button>
        <button type="button" onclick={resetTuning}>defaults</button>
      </div>
    </fieldset>
  {/if}
</aside>

<style>
  .debug {
    position: absolute;
    z-index: 30;
    inset-block-end: 0.4rem;
    inset-inline-start: 0.4rem;
    max-inline-size: 17rem;
    max-block-size: 70%;
    overflow: auto;
    padding: 0.35rem 0.5rem;
    border: 1px solid #333;
    border-radius: 0.35rem;
    background: rgb(20 20 20 / 86%);
    color: #e8e8e8;
    font: 11px/1.35 ui-monospace, Menlo, monospace;
  }

  .toggle,
  .row button {
    padding: 0.1rem 0.4rem;
    border: 1px solid #666;
    border-radius: 3px;
    background: #2b2b2b;
    color: #e8e8e8;
    font: inherit;
    cursor: pointer;
  }

  dl {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.05rem 0.5rem;
    margin: 0.35rem 0;
  }

  dt {
    color: #9ab;
  }

  dd {
    margin: 0;
    overflow-wrap: anywhere;
  }

  fieldset {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    margin: 0;
    padding: 0.3rem;
    border: 1px solid #444;
  }

  label {
    display: flex;
    justify-content: space-between;
    gap: 0.4rem;
  }

  input,
  select {
    inline-size: 6.5rem;
    background: #111;
    color: #eee;
    border: 1px solid #555;
    font: inherit;
  }

  .row {
    display: flex;
    gap: 0.4rem;
    margin-block-start: 0.2rem;
  }
</style>
