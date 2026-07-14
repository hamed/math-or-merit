/**
 * The sandbox's two morning papers (owner review 2026-07-14): same room,
 * same numbers, opposite front pages. The Ledger celebrates whoever is on
 * top — and when the levy actually works, it rediscovers its principles and
 * rails against the dial. The Gazette leads with statistics: poverty, the
 * top-to-bottom ratio, the trade volume dying as the board concentrates.
 * Neither paper is right. That is the point.
 */
import type { WinnerHeadline } from '../shared/agentStyle';
import type { SandboxWorld } from './SandboxWorld';

export interface RoomStats {
  gini: number;
  topShare: number;
  taxRate: number;
  n: number;
  /** Agents below a tenth of the starting money. */
  povertyCount: number;
  /** Richest over poorest (positive holdings only). */
  ratioTopBottom: number;
  /** Last round's trade volume over the run's peak (1 = healthy). */
  volumeVsPeak: number;
}

export function collectStats(world: SandboxWorld, gini: number, topShare: number): RoomStats {
  const { n, startDollars } = world.config;
  const povertyLine = 0.1 * startDollars;
  let povertyCount = 0;
  let minPos = Infinity;
  let max = -Infinity;
  for (let i = 0; i < n; i++) {
    const d = world.dollarsOf(i);
    if (d < povertyLine) povertyCount++;
    if (d > 0 && d < minPos) minPos = d;
    if (d > max) max = d;
  }
  const volume = world.volumeSeries.values;
  let peak = 0;
  for (const v of volume) if (Number.isFinite(v) && v > peak) peak = v;
  const last = volume.length > 0 ? volume[volume.length - 1] : 0;
  return {
    gini,
    topShare,
    taxRate: world.taxRate,
    n,
    povertyCount,
    ratioTopBottom: Number.isFinite(minPos) && minPos > 0 && max > 0 ? max / minPos : Infinity,
    volumeVsPeak: peak > 0 ? last / peak : 1,
  };
}

export interface FrontPage {
  paper: string;
  text: string;
  source: string;
}

const pct = (v: number) => `${Number((v * 100).toPrecision(3))}%`;

/** The Ledger's anti-levy edition — runs whenever the tax actually worked. */
const LEDGER_ANTITAX: readonly { text: string; source: string }[] = [
  {
    text: 'Nobody wants to win anymore',
    source: 'With a $TAX levy every single round, why would they? A cautionary tale',
  },
  {
    text: 'The commissar’s dial',
    source: 'Inside the $TAX tax that flattened every honest fortune in the room',
  },
  {
    text: 'Ambition, taxed to death',
    source: 'Equality achieved — and absolutely no one is rich. Congratulations?',
  },
];

/**
 * The Ledger: winner worship as long as there IS a winner; when the levy
 * holds inequality down, the editorial pivots to taxes, control, laziness.
 */
export function ledgerPage(stats: RoomStats, winnerLine: WinnerHeadline, run = 0): FrontPage {
  const leveled = stats.gini < 0.3 && stats.taxRate >= 0.05;
  if (leveled) {
    const pick = LEDGER_ANTITAX[Math.abs(run) % LEDGER_ANTITAX.length];
    return {
      paper: 'The Morning Ledger',
      text: pick.text.replaceAll('$TAX', pct(stats.taxRate)),
      source: pick.source.replaceAll('$TAX', pct(stats.taxRate)),
    };
  }
  return { paper: 'The Morning Ledger', text: winnerLine.text, source: winnerLine.source };
}

export type GazetteStat = 'ratio' | 'poverty' | 'volume' | 'fairness';

const GAZETTE: Record<GazetteStat, readonly { text: string; source: string }[]> = {
  ratio: [
    { text: 'The $RATIO-to-one room', source: 'The richest now holds $RATIO× the poorest. The coin did that, not character' },
    { text: 'Two economies, one door', source: 'Top to bottom, the gap hits $RATIO to one — and it compounds every round' },
  ],
  poverty: [
    { text: '$POOR of $N under the line', source: '$PCT of the room holds less than a tenth of its starting money' },
    { text: 'The line moved down again', source: '$POOR people — $PCT of the room — now live on pocket dust' },
  ],
  volume: [
    { text: 'Trade grinds to a halt', source: 'Volume down $DROP from its peak. When one player holds the board, the game stops' },
    { text: 'The quiet economy', source: 'Rounds keep passing; $DROP less money changes hands. Hoarding is not commerce' },
  ],
  fairness: [
    { text: 'A rare morning: the numbers look fair', source: 'Gini $GINI and holding. Enjoy it while the dial does the work' },
    { text: 'Boring, by design', source: 'No winner to crown today — Gini $GINI. The levy keeps eating the snowball' },
  ],
};

/** The Gazette: leads with whichever measured statistic is most alarming. */
export function gazettePage(stats: RoomStats, run = 0): FrontPage & { stat: GazetteStat } {
  let stat: GazetteStat = 'fairness';
  if (Number.isFinite(stats.ratioTopBottom) && stats.ratioTopBottom >= 100) stat = 'ratio';
  else if (stats.povertyCount / stats.n >= 0.3) stat = 'poverty';
  else if (stats.volumeVsPeak <= 0.5) stat = 'volume';

  const pick = GAZETTE[stat][Math.abs(run) % GAZETTE[stat].length];
  const ratio =
    stats.ratioTopBottom >= 1e6
      ? `${Number((stats.ratioTopBottom / 1e6).toPrecision(2))} million`
      : String(Math.round(stats.ratioTopBottom));
  const fill = (s: string) =>
    s
      .replaceAll('$RATIO', ratio)
      .replaceAll('$POOR', String(stats.povertyCount))
      .replaceAll('$N', String(stats.n))
      .replaceAll('$PCT', pct(stats.povertyCount / stats.n))
      .replaceAll('$DROP', pct(Math.max(0, 1 - stats.volumeVsPeak)))
      .replaceAll('$GINI', Number.isFinite(stats.gini) ? stats.gini.toFixed(2) : '—');
  return { paper: 'The People’s Gazette', text: fill(pick.text), source: fill(pick.source), stat };
}
