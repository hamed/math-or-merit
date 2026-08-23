<script>
  import Essay from './content/essay.en.svx';

  // Review-copy chrome only. VITE_REVIEW_ISSUES_URL is set by the Pages
  // workflow; a public build leaves it unset and renders no footer at all,
  // so the essay itself never carries reviewer scaffolding.
  const issuesUrl = import.meta.env.VITE_REVIEW_ISSUES_URL;
</script>

<svelte:head>
  <title>Merit or Math?</title>
  <meta
    name="description"
    content="An interactive explanation of how fair local trades can produce extreme wealth concentration."
  />
</svelte:head>

<main class="essay-shell">
  <Essay />
</main>

{#if issuesUrl}
  <footer class="review-footer">
    <p>
      This is an unlisted draft, shared for reading notes. Found a snag, a dull
      paragraph, or a claim that overreaches?
      <a href={issuesUrl} target="_blank" rel="noopener noreferrer">Tell me about it</a>.
    </p>
  </footer>
{/if}
