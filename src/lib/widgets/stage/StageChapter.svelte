<script lang="ts" module>
  export interface SceneRegistry {
    register(el: HTMLElement, scene: string): void;
    unregister(el: HTMLElement): void;
  }

  export const SCENE_CONTEXT = 'merit-or-math.scene-marks';
</script>

<script lang="ts">
  import { onMount, setContext, type Component, type Snippet } from 'svelte';

  interface Props {
    /** The stage art component; receives the active scene name. */
    stage: Component<{ scene: string }>;
    /** Scene shown before the first mark crosses the read line. */
    initial: string;
    children: Snippet;
  }

  let { stage: Stage, initial, children }: Props = $props();

  // `initial` is fixed per chapter; reading it once at init is intentional.
  // svelte-ignore state_referenced_locally
  let active = $state(initial);
  const marks = new Map<HTMLElement, string>();
  let frame: number | undefined;

  function update(): void {
    frame = undefined;
    // The read line sits just below the sticky stage, where reading happens;
    // a scene fires once its mark rises above it. The last such mark wins.
    const readLine = window.innerHeight * 0.55;
    let current = initial;
    let bestTop = -Infinity;
    for (const [el, scene] of marks) {
      const top = el.getBoundingClientRect().top;
      if (top < readLine && top > bestTop) {
        bestTop = top;
        current = scene;
      }
    }
    active = current;
  }

  function requestUpdate(): void {
    if (frame !== undefined) return;
    frame = requestAnimationFrame(update);
  }

  setContext<SceneRegistry>(SCENE_CONTEXT, {
    register(el, scene) {
      marks.set(el, scene);
      requestUpdate();
    },
    unregister(el) {
      marks.delete(el);
    },
  });

  onMount(() => {
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });
    requestUpdate();
    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  });
</script>

<div class="stage-chapter">
  <div class="stage-sticky">
    <Stage scene={active} />
  </div>
  {@render children()}
</div>

<style>
  .stage-sticky {
    position: sticky;
    inset-block-start: 0;
    z-index: 5;
    margin-inline: auto;
    max-inline-size: 34rem;
    padding-block: 0.6rem 0.4rem;
    background: linear-gradient(#f4efe4 82%, rgb(244 239 228 / 0%));
  }
</style>
