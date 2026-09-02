import { describe, expect, it } from 'vitest';
import { sandboxPlotsFor, type SandboxPlotPanels } from './sandboxPlots';

const everyPanel: SandboxPlotPanels = {
  histogram: true,
  lorenz: true,
  ccdf: true,
  time: true,
  phase: true,
  gtax: true,
  gstake: true,
};

describe('sandbox plot navigation', () => {
  it('offers only enabled plots and leaves the first enabled plot selectable', () => {
    expect(sandboxPlotsFor({ ...everyPanel, phase: false, gtax: false })).toEqual([
      'gstake',
      'hist',
      'lorenz',
      'ccdf',
      'time',
    ]);
  });

  it('allows a preset with no plots', () => {
    expect(sandboxPlotsFor({
      histogram: false,
      lorenz: false,
      ccdf: false,
      time: false,
      phase: false,
      gtax: false,
      gstake: false,
    })).toEqual([]);
  });
});
