<script lang="ts">
  import { onMount } from 'svelte';
  import { registerChapter } from './chapters.svelte';
  import { DEFERRED_MOUNTED_EVENT } from '$lib/deferredEvents';

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

  onMount(() => {
    const unregister = registerChapter({ id, label, el });
    let followingInitialHash = location.hash === `#${id}`;
    let frame: number | undefined;
    const align = () => {
      if (!followingInitialHash) return;
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (flush) {
          const documentTop = window.scrollY + el.getBoundingClientRect().top;
          window.scrollTo(0, Math.round(documentTop));
        } else {
          el.scrollIntoView({ block: 'start' });
        }
      });
    };
    const release = () => (followingInitialHash = false);
    if (followingInitialHash) {
      align();
      document.addEventListener(DEFERRED_MOUNTED_EVENT, align);
      window.addEventListener('wheel', release, { once: true, passive: true });
      window.addEventListener('touchstart', release, { once: true, passive: true });
      window.addEventListener('keydown', release, { once: true });
    }
    const timeout = window.setTimeout(release, 5000);
    return () => {
      unregister();
      window.clearTimeout(timeout);
      if (frame !== undefined) cancelAnimationFrame(frame);
      document.removeEventListener(DEFERRED_MOUNTED_EVENT, align);
      window.removeEventListener('wheel', release);
      window.removeEventListener('touchstart', release);
      window.removeEventListener('keydown', release);
    };
  });
</script>

<span bind:this={el} {id} class="chapter-anchor" class:flush aria-hidden="true"></span>

<style>
  /* A one-pixel target with a cancelling margin: no net layout space or ink,
     but browsers can observe it reliably at fractional document coordinates. */
  .chapter-anchor {
    display: block;
    block-size: 1px;
    margin-block-end: -1px;
  }

  .chapter-anchor.flush {
    scroll-margin-block-start: calc(-1 * var(--snap-pad));
  }
</style>
