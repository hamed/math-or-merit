export interface SimConfig {
  readonly n: number;      // agent count
  readonly beta: number;   // fraction of poorer agent's wealth at stake per trade
}

type Float64ArrayEscapeHatch =
  | 'buffer'
  | 'copyWithin'
  | 'fill'
  | 'reverse'
  | 'set'
  | 'sort'
  | 'subarray'
  | 'valueOf';

/**
 * A borrowed, zero-copy Float64Array view. Common mutation paths are omitted from
 * the public type; consumers must not mutate the backing storage through casts.
 */
export type ReadonlyFloat64Array = Readonly<
  Omit<Float64Array, Float64ArrayEscapeHatch>
>;

export interface SimState {
  readonly wealth: ReadonlyFloat64Array;  // length n, struct-of-arrays layout
  readonly step: number;
}

export interface SimEngine {
  readonly config: SimConfig;
  readonly state: SimState;
  /** Advance the simulation by `steps` trades (default 1). */
  step(steps?: number): void;
  reset(): void;
}
