/**
 * The sandbox's two morning papers (owner review 2026-07-14): same room,
 * same numbers, opposite front pages. The Ledger celebrates whoever is on
 * top — and when the levy actually works, it rediscovers its principles and
 * rails against the dial. The Gazette is its mirror: it covers what the
 * morning did to ORDINARY people — the neighbor who outweighs the street,
 * the fourth job that still sinks, the corner shop gone quiet — picking
 * whichever measured story is most alarming (or, grudgingly, the good news).
 * Neither paper is right. That is the point.
 */
import type { WinnerHeadline } from '../shared/agentStyle';
import type { SandboxWorld } from './SandboxWorld';

/**
 * What the newsroom needs to know about a room. Kept structural so the papers
 * are not tied to one world class: the reveal beat runs a plain `SimEngine`
 * and still gets a front page.
 */
export interface StatsSource {
  n: number;
  startDollars: number;
  /** The structural levy in force, 0 where there is none yet. */
  taxRate: number;
  dollarsOf: (index: number) => number;
  /** Dollars won per round; empty where nobody records it. */
  volume: readonly number[];
}

/** The sandbox's world, seen as the newsroom sees it. */
export function roomStatsSource(world: SandboxWorld): StatsSource {
  return {
    n: world.config.n,
    startDollars: world.config.startDollars,
    taxRate: world.taxRate,
    dollarsOf: (i) => world.dollarsOf(i),
    volume: world.tradeVolumeSeries.values,
  };
}

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

export function collectStats(room: StatsSource, gini: number, topShare: number): RoomStats {
  const { n, startDollars } = room;
  const povertyLine = 0.1 * startDollars;
  let povertyCount = 0;
  let minPos = Infinity;
  let max = -Infinity;
  for (let i = 0; i < n; i++) {
    const d = room.dollarsOf(i);
    if (d < povertyLine) povertyCount++;
    if (d > 0 && d < minPos) minPos = d;
    if (d > max) max = d;
  }
  const volume = room.volume;
  let peak = 0;
  for (const v of volume) if (Number.isFinite(v) && v > peak) peak = v;
  const last = volume.length > 0 ? volume[volume.length - 1] : 0;
  return {
    gini,
    topShare,
    taxRate: room.taxRate,
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

/** Whoever the camera caught: where do they sit in the room? */
export interface Subject {
  /** "a red pentagon with a blue edge" / "the one at the top edge". */
  noun: string;
  dollars: number;
  /** Fraction of the room poorer than the subject. */
  percentile: number;
}

export type SubjectKind = 'rich' | 'poor' | 'middling';

export function subjectKind(subject: Subject): SubjectKind {
  if (subject.percentile >= 0.9) return 'rich';
  if (subject.percentile <= 0.35) return 'poor';
  return 'middling';
}

const money = (d: number) =>
  d >= 100 ? `$${Math.round(d).toLocaleString('en-US')}` : d >= 0.01 ? `$${d.toFixed(2)}` : 'pocket dust';

/** The Ledger on a poor subject: it is never the coin's fault. */
const LEDGER_POOR: readonly { text: string; source: string }[] = [
  { text: 'Bootstraps, anyone?', source: 'Down to $DOLLARS, and still blaming “the coin”. Our winners page begs to differ' },
  { text: 'A cautionary tale of poor choices', source: 'Experts agree: $NOUN with $DOLLARS should simply have traded better' },
  { text: 'Why won’t they hustle?', source: 'Opinion: the safety net is a hammock. Exhibit A: $NOUN' },
];

const LEDGER_MID: readonly { text: string; source: string }[] = [
  { text: 'One to watch', source: '$NOUN, sitting on a respectable $DOLLARS — grit, clearly. Watch this space' },
  { text: 'The quiet climber', source: 'Neither rich nor ruined: $DOLLARS and, our sources say, excellent instincts' },
];

/** The Gazette photographs actual people, not portfolios. */
const GAZETTE_POOR: readonly { text: string; source: string }[] = [
  { text: 'Meet $NOUN, living on $DOLLARS', source: 'Same start, same coin, same rules as the winners — the flips just never landed' },
  { text: 'Down to $DOLLARS and still in the game', source: 'A portrait of ordinary luck inside an extraordinary machine' },
];

const GAZETTE_RICH: readonly { text: string; source: string }[] = [
  { text: 'The fortune next door', source: '$NOUN now holds $DOLLARS. No secret, no strategy — the coin compounds, and it compounded here' },
  { text: 'What $DOLLARS looks like up close', source: 'We asked $NOUN for their method. There isn’t one. That’s the story' },
];

/**
 * One front page, one paper, one subject (owner review 2026-07-15). The
 * Ledger worships a rich subject (or pivots anti-tax when the levy leveled
 * things) and blames a poor one; the Gazette humanizes whoever it sees, and
 * with a middling subject it falls back to its measured-stats lead.
 */
export function frontPageFor(
  paper: 'ledger' | 'gazette',
  subject: Subject,
  stats: RoomStats,
  winnerLine: WinnerHeadline,
  run = 0,
): FrontPage {
  const kind = subjectKind(subject);
  const fill = (pick: { text: string; source: string }, name: string): FrontPage => ({
    paper: name,
    text: pick.text.replaceAll('$NOUN', subject.noun).replaceAll('$DOLLARS', money(subject.dollars)),
    source: pick.source.replaceAll('$NOUN', subject.noun).replaceAll('$DOLLARS', money(subject.dollars)),
  });
  if (paper === 'ledger') {
    if (kind === 'rich') return ledgerPage(stats, winnerLine, run);
    const pool = kind === 'poor' ? LEDGER_POOR : LEDGER_MID;
    return fill(pool[Math.abs(run) % pool.length], 'The Morning Ledger');
  }
  if (kind === 'middling') return gazettePage(stats, run);
  const pool = kind === 'poor' ? GAZETTE_POOR : GAZETTE_RICH;
  return fill(pool[Math.abs(run) % pool.length], 'The People’s Gazette');
}

export type GazetteStat = 'ratio' | 'poverty' | 'volume' | 'fairness';

const GAZETTE: Record<GazetteStat, readonly { text: string; source: string }[]> = {
  ratio: [
    { text: 'One neighbor outweighs the street', source: 'Same start, same coin, same rules — and the man next door now holds $RATIO times more' },
    { text: 'Living next to $RATIO-to-one', source: 'He could buy every house on the block, $RATIO times over. The block has noticed' },
  ],
  poverty: [
    { text: 'Fourth job, still sinking', source: '$POOR of $N neighbors — $PCT of the room — hold less than a tenth of what they started with' },
    { text: 'The middle of the room is gone', source: 'Ordinary traders say every flip feels rigged. The arithmetic quietly agrees — $POOR households under the line' },
  ],
  volume: [
    { text: 'The corner shop went quiet', source: 'Money passes one door and never comes back — $DROP less of it moves at all' },
    { text: 'Nothing left to trade with', source: 'When one player holds the board, everyone else stops playing. Takings down $DROP' },
  ],
  fairness: [
    { text: 'An ordinary day, at last', source: 'Families keep roughly what they started with; the levy returns what the coin sweeps away. Gini $GINI' },
    { text: 'Good news is boring news', source: 'Nobody got rich today. Nobody got ruined either. Gini $GINI and holding' },
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
