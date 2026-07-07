<script lang="ts">
  import { getContext, onMount, type Snippet } from 'svelte';
  import { STAGE_CONTEXT, type StageContext } from './contract';

  interface Props {
    /** Index into the scene's BEATS table this caption belongs to. */
    beat: number;
    children: Snippet;
  }

  let { beat, children }: Props = $props();

  const stage = getContext<StageContext | undefined>(STAGE_CONTEXT);
  let el: HTMLElement;

  onMount(() => stage?.registerCaption(el, beat));
</script>

<p bind:this={el} class="stage-caption" data-beat={beat}>
  {@render children()}
</p>
