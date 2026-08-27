<script lang="ts">
  import { onMount } from 'svelte';
  import { registerChapter } from './chapters.svelte';

  interface Props {
    /** Stable, shareable anchor: the URL fragment readers can send. */
    id: string;
    /** What the index calls it — the section's own words. */
    label: string;
    /**
     * Land flush with the top instead of under the page's scroll padding.
     * For a section that is exactly one screen tall and would otherwise lose
     * its bottom edge.
     */
    flush?: boolean;
  }

  let { id, label, flush = false }: Props = $props();

  let el: HTMLElement;

  onMount(() => registerChapter({ id, label, el }));
</script>

<span bind:this={el} {id} class="chapter-anchor" class:flush aria-hidden="true"></span>

<style>
  /* A marker, not a thing on the page: no box, no space, no ink. */
  .chapter-anchor {
    display: block;
    block-size: 0;
  }

  .chapter-anchor.flush {
    scroll-margin-block-start: calc(-1 * var(--snap-pad));
  }
</style>
