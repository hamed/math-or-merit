<script lang="ts">
  /**
   * A chapter the reader takes by choice (A4) — collapsed and deferred until
   * then. It opens when the dialogue asks for it by name, or when the reader
   * presses its one line. Nothing inside loads before that: `Deferred` only
   * mounts once rendered, so a reader who skips a branch never downloads its
   * plates (brief checklist). A `Chapter` inside joins the index only while the
   * branch is open.
   *
   * `display: block`, not flex: GSAP inserts a pinned scene's spacer as a child
   * here, and as a flex item its height stopped counting — a whole fable once
   * played inside one screen of scroll.
   */
  import { onMount, tick, type Snippet } from 'svelte';
  import { ScrollTrigger } from './gsap';
  import { BRANCH_EVENT, type BranchId } from './branch';
  import { motionOk } from './motion';
  import { DEFERRED_MOUNTED_EVENT } from '$lib/deferredEvents';

  interface Props {
    id: BranchId;
    /** The line on the collapsed branch. */
    offer: string;
    /** A link to this fragment opens the branch on arrival (`#sandbox` still lands on the machine). */
    opensOn?: string;
    children: Snippet;
  }

  let { id, offer, opensOn, children }: Props = $props();

  let open = $state(false);
  let host: HTMLDivElement;

  function land(): void {
    // everything below just moved; stale scroll positions would misplace pins
    ScrollTrigger.refresh();
    host.scrollIntoView({ behavior: motionOk() ? 'smooth' : 'auto', block: 'start' });
  }

  async function take(): Promise<void> {
    if (open) {
      land();
      return;
    }
    open = true;
    await tick();
    // The scene inside loads lazily. Scrolling before it has mounted aims at a
    // placeholder, and the pin it creates then moves the page under the reader —
    // so land once it is in, or after a second if it never says so.
    let landed = false;
    const once = () => {
      if (landed) return;
      landed = true;
      window.removeEventListener(DEFERRED_MOUNTED_EVENT, once);
      void tick().then(land);
    };
    window.addEventListener(DEFERRED_MOUNTED_EVENT, once);
    window.setTimeout(once, 1200);
  }

  onMount(() => {
    const onBranch = (event: Event) => {
      if ((event as CustomEvent<BranchId>).detail === id) void take();
    };
    window.addEventListener(BRANCH_EVENT, onBranch);
    if (opensOn && location.hash === `#${opensOn}`) void take();
    return () => window.removeEventListener(BRANCH_EVENT, onBranch);
  });
</script>

<div class="branch" bind:this={host} data-branch={id}>
  {#if open}
    {@render children()}
  {:else}
    <button type="button" class="offer" onclick={take}>
      <span class="mark" aria-hidden="true">+</span>{offer}
    </button>
  {/if}
</div>

<style>
  .branch {
    display: block;
    margin-block: 1.4rem;
  }

  .offer {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    min-block-size: 2.75rem;
    padding-block: 0.4rem;
    padding-inline: 0.95rem;
    border: 1px solid var(--line);
    border-radius: 999px;
    color: var(--ink-mid);
    background: var(--paper-bright);
    cursor: pointer;
    font-family: var(--font-sans);
    font-size: 0.88rem;
    font-weight: 600;
    text-align: start;
  }

  .offer:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  .offer:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .mark {
    color: var(--accent);
    font-size: 1.1rem;
    font-weight: 700;
    line-height: 1;
  }
</style>
