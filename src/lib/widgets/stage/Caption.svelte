<script lang="ts">
  import { getContext, onMount, type Snippet } from 'svelte';
  import { STAGE_CONTEXT, type StageContext } from './contract';

  interface Props {
    /** Index into the scene's BEATS table this caption belongs to. */
    beat: number;
    /** Title-sized center-stage treatment instead of the bottom caption slot. */
    display?: boolean;
    /** Bigger type, but still in the caption slot under the picture. */
    big?: boolean;
    children: Snippet;
  }

  let { beat, display = false, big = false, children }: Props = $props();

  const stage = getContext<StageContext | undefined>(STAGE_CONTEXT);
  let el: HTMLElement;
  /**
   * A caption written as one logical unit per line has to KEEP those lines.
   * At display size a 35-character line overruns the measure and wraps, which
   * turns two authored lines into three read ones — so a broken caption steps
   * its type down. Detected rather than declared: the break is already in the
   * markup, and a second prop saying so could disagree with it.
   */
  let broken = $state(false);
  /**
   * More than one line on screen, however it got there — an authored break or
   * plain wrapping. Those are ranged left (owner, 2026-08-27: "do them left
   * align, it is prettier"); a single line keeps the centring it had, and
   * since the box shrink-wraps and auto-margins, it looks identical.
   * Measured, not guessed: whether a caption wraps depends on the viewport.
   */
  let ranged = $state(false);

  function measure(): void {
    broken = el.querySelector('br') !== null;
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
    if (!Number.isFinite(lineHeight) || lineHeight <= 0) return;
    ranged = el.getBoundingClientRect().height / lineHeight > 1.5;
  }

  onMount(() => {
    measure();
    // wrapping changes with the viewport, so this cannot be decided once
    const observer = new ResizeObserver(() => measure());
    observer.observe(el);
    const unregister = stage?.registerCaption(el, beat);
    return () => {
      observer.disconnect();
      unregister?.();
    };
  });
</script>

<p
  bind:this={el}
  class="stage-caption"
  class:stage-caption--display={display}
  class:stage-caption--big={big}
  class:stage-caption--broken={broken}
  class:stage-caption--ranged={ranged}
  data-beat={beat}
>
  {@render children()}
</p>
