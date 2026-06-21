export interface SimConfig {
  readonly n: number;      // agent count
  readonly beta: number;   // fraction of poorer agent's wealth at stake per trade
}

export interface SimState {
  readonly wealth: Float64Array;  // length n, struct-of-arrays layout
  readonly step: number;
}

export interface SimEngine {
  readonly config: SimConfig;
  readonly state: SimState;
  /** Advance the simulation by `steps` trades (default 1). */
  step(steps?: number): void;
  reset(): void;
}
