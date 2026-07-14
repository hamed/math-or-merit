import { describe, expect, it } from 'vitest';
import { collectStats, gazettePage, ledgerPage, type RoomStats } from './newsroom';
import { SandboxWorld } from './SandboxWorld';

const base: RoomStats = {
  gini: 0.8,
  topShare: 0.6,
  taxRate: 0,
  n: 128,
  povertyCount: 10,
  ratioTopBottom: 12,
  volumeVsPeak: 0.9,
};

const winner = { text: 'Six sides of genius', source: 'The hexagon did it again' };

describe('ledgerPage', () => {
  it('worships the winner while inequality reigns', () => {
    const page = ledgerPage(base, winner, 0);
    expect(page.text).toBe('Six sides of genius');
    expect(page.paper).toBe('The Morning Ledger');
  });

  it('pivots to anti-tax editorial when the levy actually levels the room', () => {
    const page = ledgerPage({ ...base, gini: 0.15, taxRate: 0.3 }, winner, 0);
    expect(page.text).not.toBe(winner.text);
    expect(page.text + page.source).toMatch(/tax|dial|Ambition|win/i);
    expect(page.source).toContain('30%');
  });

  it('cycles its editorials and leaves no placeholders', () => {
    for (const run of [0, 1, 2, 3]) {
      const page = ledgerPage({ ...base, gini: 0.1, taxRate: 0.5 }, winner, run);
      expect(page.text + page.source).not.toContain('$TAX');
    }
  });
});

describe('gazettePage', () => {
  it('leads with the ratio when the gap is obscene', () => {
    const page = gazettePage({ ...base, ratioTopBottom: 5000 }, 0);
    expect(page.stat).toBe('ratio');
    expect(page.text + page.source).toContain('5000');
  });

  it('leads with poverty when a third of the room is under the line', () => {
    const page = gazettePage({ ...base, ratioTopBottom: 50, povertyCount: 60 }, 0);
    expect(page.stat).toBe('poverty');
    expect(page.text).toContain('60');
  });

  it('leads with dying trade volume when the board is hoarded', () => {
    const page = gazettePage({ ...base, ratioTopBottom: 50, povertyCount: 5, volumeVsPeak: 0.2 }, 0);
    expect(page.stat).toBe('volume');
    expect(page.text + page.source).toContain('80%');
  });

  it('admits a fair morning when nothing is alarming', () => {
    const page = gazettePage({ ...base, gini: 0.18, ratioTopBottom: 6, povertyCount: 2, volumeVsPeak: 0.95 }, 0);
    expect(page.stat).toBe('fairness');
    expect(page.text + page.source).toContain('0.18');
  });

  it('spells huge ratios in millions and leaves no placeholders', () => {
    for (const run of [0, 1]) {
      const page = gazettePage({ ...base, ratioTopBottom: 3.2e8 }, run);
      expect(page.text + page.source).toMatch(/million/);
      expect(page.text + page.source).not.toMatch(/\$(RATIO|POOR|N|PCT|DROP|GINI)/);
    }
  });
});

describe('collectStats', () => {
  it('measures poverty, the top-bottom ratio, and the volume trend from a live world', () => {
    const world = new SandboxWorld({ n: 10, seed: 5, startDollars: 100 });
    world.beta = 0.3;
    world.taxEvery = 10;
    world.step(5000);
    const stats = collectStats(world, 0.7, 0.5);
    expect(stats.n).toBe(10);
    expect(stats.povertyCount).toBeGreaterThan(0);
    expect(stats.ratioTopBottom).toBeGreaterThan(1);
    expect(stats.volumeVsPeak).toBeGreaterThan(0);
    expect(stats.volumeVsPeak).toBeLessThanOrEqual(1);
  });
});
