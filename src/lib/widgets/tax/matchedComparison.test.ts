import { describe, expect, it } from 'vitest';
import { IncrementalOutcomeRun } from '$lib/research';
import { MATCHED_LEVY_RATE, matchedRunConfigs } from './matchedComparison';

describe('matchedRunConfigs', () => {
  it('changes only the levy while preserving the complete random protocol', () => {
    const [control, treatment] = matchedRunConfigs(47);
    expect(treatment).toEqual({ ...control, taxRate: MATCHED_LEVY_RATE });
  });

  it('reports participation and ordinary turnover from the same calibrated script', () => {
    const [controlConfig, treatmentConfig] = matchedRunConfigs(47);
    const controlRun = new IncrementalOutcomeRun(controlConfig);
    const treatmentRun = new IncrementalOutcomeRun(treatmentConfig);
    controlRun.step(controlConfig.trades);
    treatmentRun.step(treatmentConfig.trades);
    const control = controlRun.result();
    const treatment = treatmentRun.result();
    expect(treatment.effectiveParticipants).toBeGreaterThan(control.effectiveParticipants);
    expect(treatment.wealthTurnover).toBeGreaterThan(control.wealthTurnover);
  });
});
