<script lang="ts">
  import { getContext, onMount } from 'svelte';
  import { SCENE_CONTEXT, type SceneRegistry } from './StageChapter.svelte';

  let { scene }: { scene: string } = $props();

  const registry = getContext<SceneRegistry | undefined>(SCENE_CONTEXT);
  let el: HTMLElement;

  onMount(() => {
    registry?.register(el, scene);
    return () => registry?.unregister(el);
  });
</script>

<span bind:this={el} class="scene-mark" data-scene={scene} aria-hidden="true"></span>

<style>
  .scene-mark {
    display: block;
    block-size: 1px;
  }
</style>
