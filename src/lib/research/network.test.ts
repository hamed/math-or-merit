import { describe, expect, it } from 'vitest';
import {
  connectedRandomGraph,
  localRichAgentIndices,
  ringGraph,
  StaticNetworkYardSale,
  torusGraph,
} from './network';

describe('static network Yard-Sale research model', () => {
  it('constructs expected regular graph sizes', () => {
    expect(ringGraph(10)).toHaveLength(10);
    expect(torusGraph(4, 3)).toHaveLength(24);
  });

  it('makes a reproducible connected random graph', () => {
    const first = connectedRandomGraph(20, 0.1, 4);
    expect(connectedRandomGraph(20, 0.1, 4)).toEqual(first);
    expect(first).toEqual(expect.arrayContaining(ringGraph(20)));
  });

  it('conserves wealth and never goes negative', () => {
    const engine = new StaticNetworkYardSale({ n: 20, beta: 0.5, seed: 2, edges: ringGraph(20) });
    engine.step(100_000);
    expect(Array.from(engine.state.wealth).reduce((sum, value) => sum + value, 0)).toBeCloseTo(1);
    expect(Math.min(...engine.state.wealth)).toBeGreaterThanOrEqual(0);
  });

  it('samples edges uniformly rather than agents', () => {
    const engine = new StaticNetworkYardSale({ n: 4, beta: 0, seed: 9, edges: ringGraph(4) });
    engine.step(100_000);
    for (const count of engine.state.edgeEncounters) {
      expect(count).toBeGreaterThan(24_000);
      expect(count).toBeLessThan(26_000);
    }
  });

  it('identifies strict local rich agents', () => {
    expect(localRichAgentIndices([4, 1, 3, 1], ringGraph(4))).toEqual([0, 2]);
  });

  it('replays after reset', () => {
    const engine = new StaticNetworkYardSale({ n: 10, beta: 0.5, seed: 12, edges: ringGraph(10) });
    engine.step(1_000);
    const first = Array.from(engine.state.wealth);
    engine.reset();
    engine.step(1_000);
    expect(Array.from(engine.state.wealth)).toEqual(first);
  });
});
