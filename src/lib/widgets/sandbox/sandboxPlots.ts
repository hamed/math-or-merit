export type SandboxPlotId = 'hist' | 'lorenz' | 'ccdf' | 'time' | 'phase' | 'gtax' | 'gstake';

export interface SandboxPlotPanels {
  histogram: boolean;
  lorenz: boolean;
  ccdf: boolean;
  time: boolean;
  phase: boolean;
  gtax: boolean;
  gstake: boolean;
}

const PLOT_PANELS: readonly [SandboxPlotId, keyof SandboxPlotPanels][] = [
  ['phase', 'phase'],
  ['gtax', 'gtax'],
  ['gstake', 'gstake'],
  ['hist', 'histogram'],
  ['lorenz', 'lorenz'],
  ['ccdf', 'ccdf'],
  ['time', 'time'],
];

export function sandboxPlotsFor(panels: SandboxPlotPanels): SandboxPlotId[] {
  return PLOT_PANELS.filter(([, panel]) => panels[panel]).map(([id]) => id);
}
