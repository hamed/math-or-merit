import { createRandomSource, type RandomSource } from '../sim';
import { applyYardSaleTrade } from '../sim/YardSaleTrade';

export type Edge = readonly [number, number];

export interface StaticNetworkConfig {
  readonly n: number;
  readonly beta: number;
  readonly seed: number;
  readonly edges: readonly Edge[];
}

export interface StaticNetworkState {
  readonly wealth: Readonly<Float64Array>;
  readonly encounters: Readonly<Uint32Array>;
  readonly edgeEncounters: Readonly<Uint32Array>;
  readonly step: number;
}

function canonicalEdge(a: number, b: number): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function validateGraph(n: number, edges: readonly Edge[]): void {
  if (!Number.isSafeInteger(n) || n < 2) throw new RangeError('n must be at least 2');
  if (edges.length === 0) throw new RangeError('edges must not be empty');
  const seen = new Set<string>();
  for (const [a, b] of edges) {
    if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b) || a < 0 || b < 0 || a >= n || b >= n || a === b) {
      throw new RangeError('edges must contain distinct valid agent indices');
    }
    const key = canonicalEdge(a, b);
    if (seen.has(key)) throw new RangeError('edges must be unique');
    seen.add(key);
  }
}

export function ringGraph(n: number): Edge[] {
  if (!Number.isSafeInteger(n) || n < 3) throw new RangeError('a ring requires at least 3 agents');
  return Array.from({ length: n }, (_, i) => [i, (i + 1) % n] as const);
}

export function torusGraph(width: number, height: number): Edge[] {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 3 || height < 3) {
    throw new RangeError('a torus requires integer width and height of at least 3');
  }
  const keys = new Set<string>();
  const edges: Edge[] = [];
  const add = (a: number, b: number) => {
    const key = canonicalEdge(a, b);
    if (!keys.has(key)) {
      keys.add(key);
      edges.push([a, b]);
    }
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      add(i, y * width + ((x + 1) % width));
      add(i, ((y + 1) % height) * width + x);
    }
  }
  return edges;
}

export function connectedRandomGraph(n: number, extraEdgeProbability: number, seed: number): Edge[] {
  if (!Number.isFinite(extraEdgeProbability) || extraEdgeProbability < 0 || extraEdgeProbability > 1) {
    throw new RangeError('extraEdgeProbability must be between 0 and 1');
  }
  const edges = ringGraph(n);
  const keys = new Set(edges.map(([a, b]) => canonicalEdge(a, b)));
  const random = createRandomSource(seed);
  for (let a = 0; a < n; a++) {
    for (let b = a + 1; b < n; b++) {
      const key = canonicalEdge(a, b);
      if (!keys.has(key) && random.next() < extraEdgeProbability) {
        keys.add(key);
        edges.push([a, b]);
      }
    }
  }
  return edges;
}

export class StaticNetworkYardSale {
  private readonly wealth: Float64Array;
  private readonly encounters: Uint32Array;
  private readonly edgeEncounters: Uint32Array;
  private readonly random: RandomSource;
  private currentStep = 0;

  constructor(readonly config: StaticNetworkConfig) {
    validateGraph(config.n, config.edges);
    if (!Number.isFinite(config.beta) || config.beta < 0 || config.beta > 1) {
      throw new RangeError('beta must be between 0 and 1');
    }
    this.wealth = new Float64Array(config.n).fill(1 / config.n);
    this.encounters = new Uint32Array(config.n);
    this.edgeEncounters = new Uint32Array(config.edges.length);
    this.random = createRandomSource(config.seed);
  }

  get state(): StaticNetworkState {
    return {
      wealth: this.wealth,
      encounters: this.encounters,
      edgeEncounters: this.edgeEncounters,
      step: this.currentStep,
    };
  }

  step(steps = 1): void {
    if (!Number.isSafeInteger(steps) || steps < 0) throw new RangeError('steps must be non-negative');
    for (let s = 0; s < steps; s++) {
      const edgeIndex = Math.floor(this.random.next() * this.config.edges.length);
      const [a, b] = this.config.edges[edgeIndex];
      applyYardSaleTrade(this.wealth, a, b, this.config.beta, this.random.next() < 0.5);
      this.encounters[a]++;
      this.encounters[b]++;
      this.edgeEncounters[edgeIndex]++;
    }
    this.currentStep += steps;
  }

  reset(): void {
    this.wealth.fill(1 / this.config.n);
    this.encounters.fill(0);
    this.edgeEncounters.fill(0);
    this.currentStep = 0;
    this.random.reset();
  }
}

export function localRichAgentIndices(wealth: ArrayLike<number>, edges: readonly Edge[]): number[] {
  const neighbors = Array.from({ length: wealth.length }, () => [] as number[]);
  for (const [a, b] of edges) {
    neighbors[a].push(b);
    neighbors[b].push(a);
  }
  const result: number[] = [];
  for (let i = 0; i < wealth.length; i++) {
    if (neighbors[i].length > 0 && neighbors[i].every((neighbor) => wealth[i] > wealth[neighbor])) {
      result.push(i);
    }
  }
  return result;
}
