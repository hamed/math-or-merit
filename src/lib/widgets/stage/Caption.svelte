<script lang="ts">
  import { getContext, onMount, type Snippet } from 'svelte';
  import { STAGE_CONTEXT, type StageContext } from './contract';

  interface Props {
    /** Index into the scene's BEATS table this caption belongs to. */
    beat: number;
    /** Title-sized center-stage treatment instead of the bottom caption slot. */
    display?: boolean;
    children: Snippet;
  }

  let { beat, display = false, children }: Props = $props();

  const stage = getContext<StageContext | undefined>(STAGE_CONTEXT);
  let el: HTMLElement;

  onMount(() => stage?.registerCaption(el, beat));
</script>

<p bind:this={el} class="stage-caption" class:stage-caption--display={display} data-beat={beat}>
  {@render children()}
</p>
