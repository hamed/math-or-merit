<script lang="ts">
  import { createEngine } from '$lib/sim';

  const engine = createEngine({ n: 100, beta: 0.5 });
</script>

<h1>Math or Merit?</h1>
<p>n={engine.config.n} &nbsp; step={engine.state.step}</p>
