<script lang="ts">
  /**
   * A [CHOICE] in the dialogue, outside a stage: a short row of plain buttons.
   * The words come in already translated; this only lays them out.
   */
  interface Props {
    options: readonly { label: string; act: () => void }[];
  }

  let { options }: Props = $props();
</script>

<div class="choice-row">
  {#each options as option, i (i)}
    <button type="button" class:first={i === 0} onclick={option.act}>{option.label}</button>
  {/each}
</div>

<style>
  .choice-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.7rem;
    margin-block: 1rem 2rem;
  }

  button {
    min-block-size: 2.75rem;
    padding-block: 0.45rem;
    padding-inline: 1.15rem;
    border: 1px solid var(--line);
    border-radius: 999px;
    color: var(--ink);
    background: var(--paper-bright);
    font-family: var(--font-sans);
    font-size: 0.92rem;
    font-weight: 650;
    white-space: nowrap;
    cursor: pointer;
  }

  button.first {
    border-color: var(--accent);
    color: var(--accent);
  }

  button:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
</style>
