import { YardSaleEngine } from './YardSaleEngine';
import type { SimConfig, SimEngine } from './SimEngine';

export function createEngine(config: SimConfig): SimEngine {
  return new YardSaleEngine(config);
}

export type { SimConfig, SimState, SimEngine } from './SimEngine';
