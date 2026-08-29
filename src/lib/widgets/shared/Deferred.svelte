<script lang="ts">
  import { onMount, type Component, type Snippet } from 'svelte';

  type ComponentModule = { default: Component };

  interface Props {
    load: () => Promise<ComponentModule>;
    label: string;
    /** Space held while the component is fetched, to avoid an offscreen layout jump. */
    reserve?: string;
    /** Optional composition seam for components that must mount inside a parent context. */
    content?: Snippet<[Component]>;
  }

  let { load, label, reserve = '24rem', content }: Props = $props();

  let marker = $state<HTMLDivElement | null>(null);
  let Loaded = $state<Component | null>(null);
  let loading = $state(false);
  let failed = $state(false);

  function begin(): void {
    if (loading || Loaded) return;
    loading = true;
    failed = false;
    load().then(
      (module) => {
        Loaded = module.default;
        loading = false;
      },
      () => {
        failed = true;
        loading = false;
      },
    );
  }

  onMount(() => {
    if (!('IntersectionObserver' in window)) {
      begin();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        begin();
      },
      { rootMargin: '100% 0px' },
    );
    if (marker) observer.observe(marker);
    else begin();
    return () => observer.disconnect();
  });
</script>

{#if Loaded}
  {#if content}
    {@render content(Loaded)}
  {:else}
    <Loaded />
  {/if}
{:else}
  <div
    bind:this={marker}
    class="deferred"
    style={`--deferred-reserve: ${reserve}`}
    data-deferred={label}
    role="status"
    aria-live="polite"
    aria-busy={loading}
  >
    {#if failed}
      <button type="button" onclick={begin}>Try loading {label} again</button>
    {:else}
      <span>Loading {label}…</span>
    {/if}
  </div>
{/if}

<style>
  .deferred {
    display: grid;
    min-block-size: var(--deferred-reserve);
    place-items: center;
    color: var(--ink-soft);
    font-family: var(--font-sans);
    font-size: 0.78rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .deferred span {
    opacity: 0.7;
  }

  .deferred button {
    min-block-size: 2.75rem;
    padding-inline: 1rem;
    border: 1px solid var(--line);
    border-radius: 999px;
    color: var(--ink);
    background: var(--paper);
    cursor: pointer;
    font: inherit;
  }
</style>
