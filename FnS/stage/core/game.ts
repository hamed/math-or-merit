/**
 * The game: N people, total wealth 1, the master's yard-sale trade, and a few
 * "rules of the world" a reader can change. Headless and deterministic: a seed
 * and a list of game commands reproduce a state bit for bit, which is what a
 * shared link stores.
 *
 * Wealth never reaches zero (beta < 1, gifts and levies keep a remainder), so
 * the log measure always has a finite poorest.
 */
import { applyYardSaleTrade } from '../essay/sim/Trade.ts';
import { Rng } from './rng.ts';
import { POT, type Move } from './transfer.ts';

export type Pairing = 'rounds' | 'random';

export interface Rules {
  /** Share of the poorer party's wealth at stake in a trade, [0, 1). */
  readonly beta: number;
  /** Levy per round: everyone pays this share, the pot is split equally. [0, 1]. */
  readonly tax: number;
  /**
   * Who trades with whom. `rounds`: each round pairs everyone off at random
   * (one sits out when N is odd), one trade a pair, then the round's levy.
   * `random`: the essay's YardSaleEngine, one random pair at a time, a levy
   * every N trades.
   */
  readonly pairing: Pairing;
}

export const DEFAULT_RULES: Rules = Object.freeze({ beta: 0.2, tax: 0, pairing: 'rounds' as Pairing });

/** Most trades a single command may run: keeps a typo from freezing the page. */
export const MAX_TRADES = 10_000_000;

export function checkRules(rules: Partial<Rules> & Pick<Rules, 'beta' | 'tax'>): Rules {
  const { beta, tax } = rules;
  const pairing = rules.pairing ?? DEFAULT_RULES.pairing;
  if (!(beta >= 0 && beta < 1)) throw new RangeError('beta must be in [0, 1)');
  if (!(tax >= 0 && tax <= 1)) throw new RangeError('tax must be in [0, 1]');
  if (pairing !== 'rounds' && pairing !== 'random') throw new RangeError('pairing must be rounds or random');
  return Object.freeze({ beta, tax, pairing });
}

export class Game {
  readonly n: number;
  readonly seed: number;
  readonly wealth: Float64Array;
  rules: Rules;
  /** Trades since the last reset. */
  trades = 0;
  /** Bumps on every change of wealth: views compare it instead of the array. */
  revision = 0;
  private readonly rng: Rng;
  private sinceLevy = 0;
  /**
   * Every change of hands, after the wealth has moved: a trade's or a gift's
   * one move, a levy's n payments into the pot (POT) and n shares out of it.
   * Off when null. A trade's array is reused: copy what you keep.
   */
  onMoves: ((kind: 'trade' | 'levy' | 'give', moves: readonly Move[]) => void) | null = null;
  private readonly one: { from: number; to: number; amount: number }[] = [{ from: 0, to: 0, amount: 0 }];

  constructor(n: number, seed = 1, rules: Partial<Rules> & Pick<Rules, 'beta' | 'tax'> = DEFAULT_RULES) {
    if (!Number.isSafeInteger(n) || n < 1 || n > 100_000) throw new RangeError('n must be an integer in [1, 100000]');
    this.rules = checkRules(rules);
    this.rng = new Rng(seed);
    this.n = n;
    this.seed = seed;
    this.wealth = new Float64Array(n).fill(1 / n);
  }

  /** Everyone equal again, and the dice back at the seed. */
  reset(): void {
    this.rng.reset();
    this.wealth.fill(1 / this.n);
    this.trades = 0;
    this.sinceLevy = 0;
    this.revision++;
  }

  setRules(rules: Partial<Rules> & Pick<Rules, 'beta' | 'tax'>): void {
    this.rules = checkRules(rules);
  }

  /** `k` yard-sale trades, sampled exactly as the master's YardSaleEngine does. */
  trade(k: number): void {
    if (!Number.isSafeInteger(k) || k < 0 || k > MAX_TRADES) throw new RangeError(`trades must be an integer in [0, ${MAX_TRADES}]`);
    const { n, wealth: w } = this;
    if (n < 2 || k === 0) return;
    const { beta, tax } = this.rules;
    for (let s = 0; s < k; s++) {
      const i = Math.floor(this.rng.next() * n);
      let j = Math.floor(this.rng.next() * (n - 1));
      if (j >= i) j++;
      const iWins = this.rng.next() < 0.5;
      const stake = applyYardSaleTrade(w, i, j, beta, iWins);
      if (this.onMoves && stake > 0) this.moved(iWins ? j : i, iWins ? i : j, stake);
      if (tax > 0 && ++this.sinceLevy >= n) {
        this.sinceLevy = 0;
        this.levy(tax, false);
      }
    }
    this.trades += k;
    this.revision++;
  }

  /**
   * `k` rounds: each pairs everyone off at random (Fisher–Yates on the seeded
   * dice; with N odd the last one sits out), each pair trades once, and then,
   * under a tax, the round's levy.
   */
  round(k = 1): void {
    if (!Number.isSafeInteger(k) || k < 0 || k * Math.floor(this.n / 2) > MAX_TRADES) throw new RangeError(`rounds must be a whole number, at most ${MAX_TRADES} trades`);
    for (let r = 0; r < k; r++) this.play(this.pair());
  }

  /**
   * The next round's pairs, from the seeded dice: everyone in a shuffled order,
   * partners side by side (order[0] with order[1], …). `play` them next: a
   * page can first walk the partners together, and the dice are the same.
   */
  pair(): Int32Array {
    const n = this.n;
    const order = Int32Array.from({ length: n }, (_, i) => i);
    for (let a = n - 1; a > 0; a--) {
      const b = Math.floor(this.rng.next() * (a + 1));
      const t = order[a];
      order[a] = order[b];
      order[b] = t;
    }
    return order;
  }

  /** The pairs the next round will have, without rolling the dice: `round(1)` then pairs exactly these. */
  peek(): Int32Array {
    const state = this.rng.state;
    const order = this.pair();
    this.rng.state = state;
    return order;
  }

  /** One round on the pairs `pair` gave: each pair trades once, then, under a tax, the round's levy. */
  play(order: Int32Array): void {
    const { n, wealth: w } = this;
    const { beta, tax } = this.rules;
    for (let p = 0; p + 1 < n; p += 2) {
      const i = order[p];
      const j = order[p + 1];
      const iWins = this.rng.next() < 0.5;
      const stake = applyYardSaleTrade(w, i, j, beta, iWins);
      if (this.onMoves && stake > 0) this.moved(iWins ? j : i, iWins ? i : j, stake);
    }
    this.trades += Math.floor(n / 2);
    if (tax > 0) this.levy(tax, false);
    this.revision++;
  }

  /** A trade's move, reported. */
  private moved(from: number, to: number, amount: number): void {
    const m = this.one[0];
    m.from = from;
    m.to = to;
    m.amount = amount;
    this.onMoves!('trade', this.one);
  }

  /** Everyone pays `rate` of their wealth; the pot is shared equally. Conserves the total. */
  levy(rate: number, count = true): void {
    if (!(rate >= 0 && rate <= 1)) throw new RangeError('rate must be in [0, 1]');
    const w = this.wealth;
    const n = w.length;
    const pays = this.onMoves && rate > 0 ? Float64Array.from(w, (x) => rate * x) : null;
    let pot = 0;
    for (let i = 0; i < n; i++) pot += rate * w[i];
    const share = pot / n;
    for (let i = 0; i < n; i++) w[i] = w[i] * (1 - rate) + share;
    if (pays) {
      const moves: Move[] = [];
      for (let i = 0; i < n; i++) moves.push({ from: i, to: POT, amount: pays[i] });
      for (let i = 0; i < n; i++) moves.push({ from: POT, to: i, amount: share });
      this.onMoves!('levy', moves);
    }
    if (count) this.revision++;
  }

  /** `from` gives `to` up to `amount` (a share of the total), keeping a remainder. Returns what moved. */
  give(from: number, to: number, amount: number): number {
    this.checkIndex(from);
    this.checkIndex(to);
    if (!(amount >= 0 && Number.isFinite(amount))) throw new RangeError('amount must be finite and non-negative');
    if (from === to) return 0;
    const moved = Math.min(amount, this.wealth[from] * (1 - 1e-9));
    this.wealth[from] -= moved;
    this.wealth[to] += moved;
    if (this.onMoves && moved > 0) this.onMoves('give', [{ from, to, amount: moved }]);
    this.revision++;
    return moved;
  }

  /** Everything a command may change, for rolling back a command that fails halfway. */
  snapshot(): { wealth: Float64Array; rng: number; trades: number; sinceLevy: number; rules: Rules } {
    return { wealth: this.wealth.slice(), rng: this.rng.state, trades: this.trades, sinceLevy: this.sinceLevy, rules: this.rules };
  }

  restore(s: ReturnType<Game['snapshot']>): void {
    this.wealth.set(s.wealth);
    this.rng.state = s.rng;
    this.trades = s.trades;
    this.sinceLevy = s.sinceLevy;
    this.rules = s.rules;
    this.revision++;
  }

  private checkIndex(i: number): void {
    if (!Number.isInteger(i) || i < 0 || i >= this.n) throw new RangeError(`agent must be an integer in [0, ${this.n - 1}]`);
  }
}
