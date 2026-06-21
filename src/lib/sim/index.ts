import { YardSaleEngine } from './YardSaleEngine';
import type { SimConfig, SimEngine } from './SimEngine';

export function createEngine(config: SimConfig): SimEngine {
  return new YardSaleEngine(config);
}

export type {
  ReadonlyFloat64Array,
  SimConfig,
  SimState,
  SimEngine,
} from './SimEngine';

export { createRandomSource } from './Random';
export type { RandomSource } from './Random';
