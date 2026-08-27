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

  onMount(() => {
    broken = el.querySelector('br') !== null;
    return stage?.registerCaption(el, beat);
  });
</script>

<p
  bind:this={el}
  class="stage-caption"
  class:stage-caption--display={display}
  class:stage-caption--big={big}
  class:stage-caption--broken={broken}
  data-beat={beat}
>
  {@render children()}
</p>
