<script lang="ts">
  import { giniCoefficient, lorenzCurve } from '$lib/research';
  import { lorenzLinePath } from './lorenzPath';

  /** Compact Lorenz curve + Gini readout — the sidebar companion chart. */
  interface Props {
    wealth: ArrayLike<number>;
    /** Bump to re-read a mutating wealth array (RoomCanvas convention). */
    revision?: number;
    label?: string;
  }

  let { wealth, revision = 0, label = 'Lorenz curve and Gini' }: Props = $props();

  const S = 132;
  const FRAME = { x: 8, y: S + 8, size: S };

  const points = $derived.by(() => {
    void revision;
    return lorenzCurve(wealth);
  });
  const gini = $derived.by(() => {
    void revision;
    return giniCoefficient(wealth);
  });
</script>

<svg viewBox={`0 0 ${S + 16} ${S + 34}`} role="img" aria-label={`${label}: Gini ${gini.toFixed(2)}`}>
  <line class="frame" x1={FRAME.x} y1={FRAME.y} x2={FRAME.x + S} y2={FRAME.y} />
  <line class="frame" x1={FRAME.x} y1={FRAME.y} x2={FRAME.x} y2={FRAME.y - S} />
  <line class="diag" x1={FRAME.x} y1={FRAME.y} x2={FRAME.x + S} y2={FRAME.y - S} />
  <path class="curve" d={lorenzLinePath(points, FRAME)} />
  <text class="readout" x={FRAME.x + 2} y={FRAME.y + 18}>Gini {gini.toFixed(2)}</text>
</svg>

<style>
  svg {
    display: block;
    inline-size: 100%;
    block-size: auto;
  }

  .frame {
    stroke: #a99980;
    stroke-width: 1.1;
  }

  .diag {
    stroke: #a99980;
    stroke-width: 1.2;
    stroke-dasharray: 5 4;
  }

  .curve {
    fill: none;
    stroke: #8b3f2b;
    stroke-width: 2;
    stroke-linejoin: round;
  }

  .readout {
    fill: #3c352b;
    font-size: 12px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
</style>
