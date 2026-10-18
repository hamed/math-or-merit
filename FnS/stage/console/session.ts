/**
 * A session: one game, one stage, one recipe, and the console that drives
 * them. Headless, so every command can be tested without a page. The page
 * (main.ts) only forwards keystrokes and pointer events and draws.
 *
 * Every command is atomic: it is parsed and checked before anything changes,
 * and if it still fails halfway everything it touched is put back.
 *
 * The game part of a session is replayable: a seed, the rules, and the game
 * commands since the last reset (`history`). That plus the recipe is the
 * share link, so a link reproduces a state to the bit.
 */
import { LOOKS, type FaceLook } from '../essay/face/face.ts';
import { DEFAULT_RULES, Game, MAX_TRADES, type Pairing, type Rules } from '../core/game.ts';
import { compile, measureOf, potRoom, type Figure } from '../core/figure.ts';
import { DEFAULT_RECIPE, PRESETS, RECIPE_WORDS, formatRecipe, isRecipeWord, parseRecipe, type Recipe } from '../core/recipe.ts';
import { Stage, type YieldRule } from '../core/stage.ts';
import { statsOf } from '../core/stats.ts';
import { Transit, type MoveKind } from '../core/transit.ts';
import { POT, type Move } from '../core/transfer.ts';
import type { Live } from '../acts/track.ts';
import { afterAttach, afterCut } from '../core/aspect.ts';
import { SCRIPTS } from './scripts.ts';

export interface SessionOptions {
  readonly n?: number;
  readonly seed?: number;
  readonly rules?: Rules;
  readonly recipe?: Recipe;
}

interface Command {
  readonly usage: string;
  readonly help: string;
  /** Game commands change wealth: they record themselves in the history, and links replay them. */
  readonly game?: boolean;
  run(s: Session, args: string[]): string;
}

interface Script {
  readonly name: string;
  readonly lines: readonly string[];
  at: number;
  wait: number;
  until: boolean;
}

/** Script-only steps: a console line containing one of these runs as a script. */
const STEP = /^(wait|until)\b/i;

const LOG_LIMIT = 400;
/** Recompile a live chart at most this often while trades run, seconds. */
const LIVE_EVERY = 0.25;
/** Longest a levy waits for the room to clear the pot's spot, and a round for partners to meet, seconds. */
const CLEAR_WAIT = 3;
const MEET_WAIT = 4;
/** Longest trading waits for a chart to form, seconds. */
const FORM_WAIT = 6;

export class Session {
  game: Game;
  stage: Stage;
  recipe: Recipe;
  figure: Figure;
  playing = false;
  /** Trades per second while playing; null follows N (one round a second). */
  rate: number | null = null;
  speed = 1;
  look: FaceLook | 'off' = 'manga';
  axes = false;
  hud = true;
  /** A question carried by the share link. */
  question = '';
  /** A line on the stage, from `say` (tutorials). */
  caption = '';
  /** The script running, if any. */
  script: Script | null = null;
  /** Money on its way (trade pieces, tax waves), and the wealth drawn: the game's less that. */
  transit: Transit;
  shown: Float64Array;
  /** Each person's width ÷ height as drawn: trades change it (aspect.ts), `equalize` squares everyone. */
  aspect: Float64Array;
  /** Everyone's proportions once every move the game has made has landed. */
  ahead: Float64Array;
  /** Camera: the whole yard, or (once formed) just the chart. */
  zoom: 'yard' | 'chart' = 'yard';
  /** How many characters fit across the console: help lays itself out to it. */
  columns = 80;
  /** What a drag does: push through the crowd, lift over it, or nothing. */
  drag: 'push' | 'lift' | 'off' = 'push';
  selected = -1;
  /** The partners standing together (the next round's pairs) while meeting. */
  pairs: Int32Array | null = null;
  /** Rounds the `round` command asked for, each played once its partners have met. */
  queued = 0;
  /** Game commands since the last reset, consecutive trades merged. */
  history: string[] = [];
  readonly log: string[] = [];
  /** The rules when the history starts: a link sets these, then replays the history (which may change them). */
  private origin: Rules;
  /** Seconds the room has been still, so a momentary pause does not count as rest. */
  private calm = 0;
  /** Milliseconds the last compile took. */
  private compileCost = 0;
  private debt = 0;
  private compiled = -1;
  private compiledFx = -1;
  private compiledAt = -Infinity;
  /** The pot's space the room was last laid out with. */
  private laidPot = 0;
  /** Seconds a levy has waited for the pot's spot, and partners for each other. */
  private clearing = 0;
  private walked = 0;
  /** Seconds a chart has been forming. */
  private forming = 0;

  constructor(options: SessionOptions = {}) {
    this.game = new Game(options.n ?? 36, options.seed ?? 1, options.rules ?? DEFAULT_RULES);
    this.origin = this.game.rules;
    this.recipe = options.recipe ?? DEFAULT_RECIPE;
    this.figure = compile(this.recipe, this.game.wealth);
    this.compiled = this.game.revision;
    this.stage = new Stage(this.figure, this.game.wealth, this.game.seed);
    this.transit = new Transit(this.game.n);
    this.shown = Float64Array.from(this.game.wealth);
    this.aspect = new Float64Array(this.game.n).fill(1);
    this.ahead = new Float64Array(this.game.n).fill(1);
    this.hook();
  }

  /**
   * Every move the game makes is shown (trades while `animated` runs, levies
   * always) or, if not, takes effect on everyone's proportions at once; shown,
   * it does so as its money comes off and on (frame). Either way by the same
   * rule, so links replay to the same shapes.
   */
  private hook(): void {
    this.game.onMoves = (kind, moves) => this.moved(kind, moves);
  }

  private animating = false;
  /** Trades now are a met round's: tossed. */
  private tossing = false;
  private together = false;

  private moved(kind: MoveKind, moves: readonly Move[]): void {
    // proportions are decided now, in the order the game moves money (so a link replays them);
    // shown, each holder takes them as its money comes off or on
    const shaped = this.shapeMoves(moves);
    let played = false;
    if (kind === 'levy') {
      // a levy that is played waits for room in the middle; in a chart (everyone locked in
      // place) it happens at once and the chart re-forms
      let pot = 0;
      for (const m of moves) if (m.to === POT) pot += m.amount;
      this.transit.hold = this.showsMoney && this.crowded(pot);
      played = this.showsMoney && this.transit.play(kind, shaped, this.live);
    } else if (this.animating) {
      // a toss only where partners have met; any other trade in toss mode is shown as a piece
      played = this.transit.play(kind, shaped, this.live, { style: this.tossing ? 'toss' : 'piece', together: this.together || this.transit.sync });
    }
    if (!played) {
      // happening at once: whatever is still showing lands first (its money and shapes came
      // earlier), so no balance is spent twice and no older shape lands on a newer one
      this.finishTransit();
      for (const m of shaped) {
        if (m.from >= 0) this.aspect[m.from] = m.offShape!;
        if (m.to >= 0) this.aspect[m.to] = m.onShape!;
      }
    }
  }

  /** Every act still showing, landed now: its money off and on, its shapes taken, in order. */
  finishTransit(): void {
    const from = this.transit.events.length;
    this.transit.finish();
    for (const e of this.transit.events.slice(from)) {
      if ((e.kind === 'off' || e.kind === 'on') && e.holder >= 0 && Number.isFinite(e.shape)) this.aspect[e.holder] = e.shape;
    }
    // drawn as it is now
    this.transit.shown(this.game.wealth, this.shown);
  }

  /**
   * The single rule for proportions (aspect.ts), in wealth: money off cuts
   * across the longer side, money on joins the long edge. Worked out on
   * `ahead`, everyone's proportions once every move so far has landed; any
   * pose draws them at its own sizes. Scale-free, so the same history gives
   * the same shapes whatever was on screen.
   */
  private shapeMoves(moves: readonly Move[]): Move[] {
    const w = this.game.wealth;
    const a = this.ahead;
    // what each holder had before these moves (the game has made them already)
    const had = new Map<number, number>();
    const get = (i: number) => had.get(i) ?? w[i];
    for (const m of moves) {
      if (m.from >= 0) had.set(m.from, get(m.from) + m.amount);
      if (m.to >= 0) had.set(m.to, get(m.to) - m.amount);
    }
    return moves.map((m) => {
      let offShape = NaN;
      let onShape = NaN;
      if (m.from >= 0) {
        const before = get(m.from);
        offShape = a[m.from] = afterCut(a[m.from], before, m.amount);
        had.set(m.from, before - m.amount);
      }
      if (m.to >= 0) {
        const before = get(m.to);
        onShape = a[m.to] = afterAttach(a[m.to], before, m.amount);
        had.set(m.to, before + m.amount);
      }
      return { from: m.from, to: m.to, amount: m.amount, offShape, onShape };
    });
  }

  /** Everyone square, now and ahead (what is on its way is shown at once: its shapes were decided before). */
  equalize(): void {
    this.transit.clear();
    this.aspect.fill(1);
    this.ahead.fill(1);
  }

  /** Money is shown moving: animations on, people free to move, and rectangles (a cut off a triangle or hexagon is not a slice of it). */
  get showsMoney(): boolean {
    const shape = this.recipe.shape;
    return !this.locked && shape !== 'tri' && shape !== 'hex';
  }

  /** The area a wealth is drawn at now, in the pose's scale (everyone else as drawn now). */
  measure(): (w: number) => number {
    const w = this.game.wealth;
    let total = 0;
    for (let i = 0; i < w.length; i++) total += w[i];
    return measureOf(this.recipe, this.transit.shown(w, new Float64Array(w.length)), total);
  }

  /**
   * The stage as acts see it: each body's box now (lifted ones where they are
   * drawn), the walls, the wealth each is drawn with, and the area a wealth is
   * drawn at in the pose's scale.
   */
  get live(): Live {
    const st = this.stage;
    const w = this.game.wealth;
    const owed = this.transit.owed;
    let measure: ((x: number) => number) | null = null;
    return {
      n: st.n,
      box: (i) => ({ x: st.x[i], y: st.y[i] + st.lift(i), w: st.w[i], h: st.h[i] }),
      right: st.wallGoal.right,
      top: st.wallGoal.top,
      drawn: (i) => Math.max(w[i] - owed[i], w[i] * 1e-6),
      measure: (x) => (measure ??= this.measure())(x),
    };
  }

  /**
   * Trades are played beat by beat: animations on, and people free to move.
   * In a chart (stack, row, pack, fold) everyone is locked to a place, so
   * pairs, stakes and spinners mean nothing: trades happen at once and the
   * chart re-forms.
   */
  get plays(): boolean {
    return this.transit.trade !== 'off' && this.showsMoney;
  }

  /** Everyone has a place in a chart. */
  get locked(): boolean {
    const p = this.recipe.pose;
    return p !== 'free' && p !== 'wander' && p !== 'still';
  }

  /** Run `fn` with each trade offered to the transit to play (a few of them, or, `together`, all on one clock). */
  animated(fn: () => void, together = false): void {
    this.animating = this.plays;
    this.together = together;
    try {
      fn();
    } finally {
      this.animating = false;
      this.together = false;
    }
  }

  get tradeRate(): number {
    return this.rate ?? this.game.n;
  }

  /** Run one line: commands separated by ';'. Output goes to the log and is returned. */
  run(line: string): string {
    const parts = line
      .split(';')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    if (parts.some((p) => STEP.test(p))) {
      this.print(`> ${line.trim()}`);
      this.start('(typed)', parts);
      return 'script started';
    }
    const outputs: string[] = [];
    for (const part of line.split(';')) {
      const text = part.trim();
      if (!text) continue;
      this.print(`> ${text}`);
      const out = this.exec(text);
      if (out) this.print(out);
      outputs.push(out);
    }
    return outputs.join('\n');
  }

  print(text: string): void {
    this.log.push(text);
    if (this.log.length > LOG_LIMIT) this.log.splice(0, this.log.length - LOG_LIMIT);
  }

  /** One command, all or nothing. Errors come back as text starting with "error:". */
  exec(text: string): string {
    const saved = this.save();
    try {
      return this.dispatch(text);
    } catch (e) {
      this.restore(saved);
      return `error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  /** The page's tick: trades if playing, a live chart, and the stage. */
  frame(dt: number): void {
    if (!(dt > 0)) return;
    const t = dt * this.speed;
    // last frame's events have been seen by the page
    this.transit.events = [];
    this.calm = this.still ? this.calm + t : 0;
    this.advance(t);
    // a levy waits (a little while at most) for the room to clear the pot's spot
    const levy = this.transit.levy;
    if (levy && !levy.act && this.transit.hold) {
      this.clearing += t;
      this.transit.hold = this.clearing < CLEAR_WAIT && this.crowded(levy.pot);
    } else {
      this.clearing = 0;
      this.transit.hold = false;
    }
    // a chart forms before trading moves it (a dense chart whose places change four times a
    // second never settles: the walkers jam), for a while at most
    this.forming = this.locked && this.stage.posing && !this.stage.done ? this.forming + t : 0;
    const forming = this.forming > 0 && this.forming < FORM_WAIT;
    // a round asked for whose partners can no longer meet (toss mode off, a chart, triangles):
    // played the way rounds are played now
    if (this.queued > 0 && !this.meeting) {
      const k = this.queued;
      this.queued = 0;
      if (this.plays) this.animated(() => this.game.round(k), true);
      else this.game.round(k);
      this.record(`round ${k}`);
    }
    // trading waits while a levy plays, and between the rounds of synchronous trades
    if (this.meeting && !this.transit.holding) this.meetUp(t);
    else if (this.playing && this.game.n > 1 && !this.transit.holding && !forming) {
      if (this.game.rules.pairing === 'rounds') this.playRounds(t);
      else if (this.transit.sync && this.plays) {
        // a handful of pairs, every beat together, as many as the rate allows
        const most = Math.max(1, Math.round(this.game.n / 6));
        this.debt = Math.min(most, this.debt + this.tradeRate * t);
        const k = Math.floor(this.debt);
        if (k > 0) {
          this.debt -= k;
          this.animated(() => this.game.trade(k));
          this.record(`trade ${k}`);
        }
      } else if (this.plays) {
        // played trades: one at a time, each only when it can be seen, so no size changes unseen
        this.debt = Math.min(1, this.debt + this.tradeRate * t);
        let k = 0;
        while (this.debt >= 1 && this.transit.canPlay && !this.transit.levy) {
          this.debt -= 1;
          this.animated(() => this.game.trade(1));
          k++;
        }
        if (k > 0) this.record(`trade ${k}`);
      } else {
        this.debt += this.tradeRate * t;
        const k = Math.min(MAX_TRADES, Math.floor(this.debt));
        if (k > 0) {
          this.debt -= k;
          this.game.trade(k);
          this.record(`trade ${k}`);
        }
      }
    }
    // the meeting over and its last round landed: everyone goes home
    if (this.pairs && !this.meeting && !this.transit.busy) {
      this.pairs = null;
      this.recompile();
    }
    this.transit.step(t, this.live);
    // money coming off and on, as it is shown: the same rule as when it is not (drawn wealth still before it here)
    for (const e of this.transit.events) {
      if ((e.kind === 'off' || e.kind === 'on') && e.holder >= 0 && Number.isFinite(e.shape)) this.aspect[e.holder] = e.shape;
    }
    // a live chart recompiles a few times a second (never spending over a fifth of the time
    // compiling); a beat of an animation shows at once
    const every = Math.max(LIVE_EVERY, (5 * this.compileCost) / 1000);
    const fx = this.transit.revision !== this.compiledFx;
    if (fx || (this.game.revision !== this.compiled && (!this.playing || this.stage.time - this.compiledAt >= every))) {
      this.recompile(this.playing || fx);
    }
    this.stage.step(t);
  }

  /**
   * Rounds while playing: played, a round starts when the last one (and its
   * levy) has landed, every pair through every beat together; not played, as
   * many rounds as the rate allows (N/2 trades a round).
   */
  private playRounds(t: number): void {
    const pairs = Math.max(1, Math.floor(this.game.n / 2));
    if (this.plays) {
      // a round when the last has landed, and the rate allows one (N/2 trades a round)
      this.debt = Math.min(1, this.debt + (this.tradeRate * t) / pairs);
      if (this.transit.busy || this.debt < 1) return;
      this.debt -= 1;
      this.animated(() => this.game.round(1), true);
      this.record('round 1');
      return;
    }
    this.debt += (this.tradeRate * t) / pairs;
    const k = Math.min(Math.floor(MAX_TRADES / pairs), Math.floor(this.debt));
    if (k > 0) {
      this.debt -= k;
      this.game.round(k);
      this.record(`round ${k}`);
    }
  }

  /** The demo mode (fx trade toss): partners walk up to each other before each round, and a spinner decides. */
  get meets(): boolean {
    return this.transit.trade === 'toss';
  }

  /** No round waits for its partners any more, and nobody stands paired. */
  cancelMeeting(): void {
    this.queued = 0;
    this.pairs = null;
    this.walked = 0;
  }

  /** Partners meet before a round: toss mode, trades shown, and a round to play (playing in rounds, or asked for). */
  get meeting(): boolean {
    if (!this.meets || !this.plays || this.game.n < 2) return false;
    return (this.playing && this.game.rules.pairing === 'rounds') || this.queued > 0;
  }

  /**
   * The next round's partners walk up to each other (the dice only peeked at),
   * then the round is played, every pair together; after it lands, the next
   * partners. A pair that cannot get together in time trades where it is.
   */
  private meetUp(t: number): void {
    // playing, a meeting waits for the rate to allow its round (a round asked for does not)
    const paced = this.queued === 0;
    if (paced) this.debt = Math.min(1, this.debt + (this.tradeRate * t) / Math.max(1, Math.floor(this.game.n / 2)));
    if (this.transit.busy || (paced && this.debt < 1 && !this.pairs)) return;
    const order = this.game.peek();
    const pairs = this.pairs;
    if (!pairs || pairs.length !== order.length || order.some((v, k) => v !== pairs[k])) {
      this.pairs = order;
      this.walked = 0;
      this.recompile();
      return;
    }
    this.walked += t;
    if (this.stage.posing && !this.stage.done && this.walked < MEET_WAIT) return;
    if (paced && this.debt < 1) return;
    if (paced) this.debt -= 1;
    this.tossing = true;
    try {
      this.animated(() => this.game.round(1), true);
    } finally {
      this.tossing = false;
    }
    this.record('round 1');
    if (this.queued > 0) this.queued--;
  }

  /** Someone stands on the spot a pot of area `pot` needs (the room only: a chart stays as it is). */
  private crowded(pot: number): boolean {
    if (this.recipe.pose !== 'free' || !this.transit.tax || !(pot > 0)) return false;
    const st = this.stage;
    const half = Math.sqrt(2 * pot) / 2;
    const cx = st.wallGoal.right / 2;
    const cy = st.wallGoal.top / 2;
    for (let i = 0; i < st.n; i++) {
      if (Math.abs(st.x[i] + st.w[i] / 2 - cx) < st.w[i] / 2 + half && Math.abs(st.y[i] + st.h[i] / 2 - cy) < st.h[i] / 2 + half) return true;
    }
    return false;
  }

  /** The empty square the room keeps in the middle: room for the pot of the levy playing, or of the tax's. */
  get potSpace(): number {
    if (!this.transit.tax) return 0;
    // a pot's area is its rate of all the wealth there is, which is 1
    return potRoom(Math.max(this.game.rules.tax, this.transit.levy?.pot ?? 0));
  }

  /** Run `lines` as a script from the next frame on (the first lines run now, up to the first wait). */
  start(name: string, lines: readonly string[]): void {
    this.script = { name, lines, at: 0, wait: 0, until: false };
    this.advance(0);
  }

  /** Everything is where it is going: the pose is finished, or (wandering) nobody is moving and the walls are home. */
  get still(): boolean {
    const st = this.stage;
    if (st.posing) return st.done;
    if (st.walls.right !== st.wallGoal.right || st.walls.top !== st.wallGoal.top) return false;
    for (let i = 0; i < st.n; i++) if (st.air[i] > 0 || Math.hypot(st.vx[i], st.vy[i]) > 0.02) return false;
    return true;
  }

  /**
   * `until done`: nothing left to do: no round waiting for its partners, no
   * trade or levy playing, and a finished pose, or a room that has stayed at
   * rest for a moment.
   */
  get settled(): boolean {
    if (this.queued > 0 || this.transit.busy) return false;
    return this.stage.posing ? this.stage.done : this.calm >= 0.4;
  }

  /** The script's next lines, until it has to wait. */
  private advance(dt: number): void {
    const sc = this.script;
    if (!sc) return;
    if (sc.wait > 0) {
      sc.wait -= dt;
      if (sc.wait > 0) return;
    }
    if (sc.until) {
      if (!this.settled) return;
      sc.until = false;
    }
    while (sc.at < sc.lines.length) {
      const line = sc.lines[sc.at++].trim();
      if (!line || line.startsWith('#')) continue;
      const wait = /^wait\s+(\S+)$/i.exec(line);
      if (wait) {
        const t = Number(wait[1]);
        if (!(t >= 0 && t <= 600)) {
          this.print(`error: ${sc.name}: wait takes seconds in [0, 600]`);
          this.script = null;
          return;
        }
        sc.wait = t;
        return;
      }
      if (/^until\s+done$/i.test(line)) {
        sc.until = true;
        return;
      }
      if (STEP.test(line)) {
        this.print(`error: ${sc.name}: "${line}" (wait <seconds> or until done)`);
        this.script = null;
        return;
      }
      this.print(`» ${line}`);
      const out = this.exec(line);
      if (out) this.print(out);
      if (out.startsWith('error:')) {
        this.script = null;
        return;
      }
      // the line itself ran or stopped a script
      if (this.script !== sc) return;
    }
    this.script = null;
  }

  /**
   * Same pose, new wealth. `live` (trading in small steps while playing): those
   * in place are carried along with the chart. Otherwise (a one-off command,
   * a big change) they walk to their new places.
   */
  recompile(live = false): void {
    const pot = this.potSpace;
    // the pot's spot growing or shrinking moves the whole room: everyone walks
    if (pot !== this.laidPot) live = false;
    this.laidPot = pot;
    const t0 = performance.now();
    const before = this.figure;
    this.figure = this.figureOf(this.recipe);
    // partners stand where they met: while paired, sizes change in place (laid out afresh, the
    // rows could reshuffle mid-act); the next meeting lays the room out again
    if (live && this.pairs && !before.free && before.kind.length === this.figure.kind.length) {
      const f = this.figure;
      for (let i = 0; i < f.kind.length; i++) {
        f.x[i] = before.x[i] + (before.w[i] - f.w[i]) / 2;
        f.y[i] = before.y[i] + (before.h[i] - f.h[i]) / 2;
      }
    }
    this.compileCost = performance.now() - t0;
    this.stage.apply(this.figure, this.shown, live);
    this.compiled = this.game.revision;
    this.compiledFx = this.transit.revision;
    this.compiledAt = this.stage.time;
  }

  /** The recipe on the wealth as drawn: what is in transit is no one's yet. */
  private figureOf(recipe: Recipe): Figure {
    this.transit.shown(this.game.wealth, this.shown);
    let total = 0;
    for (let i = 0; i < this.game.n; i++) total += this.game.wealth[i];
    return compile(recipe, this.shown, total, this.aspect, { pot: this.potSpace, pairs: this.pairs ?? undefined, stake: this.game.rules.beta });
  }

  /** The state as a URL hash. */
  share(): string {
    const p = new URLSearchParams();
    p.set('n', String(this.game.n));
    p.set('seed', String(this.game.seed));
    if (this.origin.beta !== DEFAULT_RULES.beta) p.set('beta', String(this.origin.beta));
    if (this.origin.tax !== DEFAULT_RULES.tax) p.set('tax', String(this.origin.tax));
    if (this.origin.pairing !== DEFAULT_RULES.pairing) p.set('pairing', this.origin.pairing);
    if (this.stage.yieldRule !== 'equal') p.set('yield', this.stage.yieldRule);
    if (this.history.length) p.set('do', this.history.join(';'));
    const pose = formatRecipe(this.recipe);
    if (pose) p.set('pose', pose);
    if (this.look !== 'manga') p.set('look', this.look);
    // the default rate (N a second, following N) is `auto`; any number is that rate
    if (this.playing) p.set('play', this.rate === null ? 'auto' : String(this.rate));
    if (this.zoom !== 'yard') p.set('zoom', this.zoom);
    if (this.question) p.set('q', this.question);
    return `#${p.toString()}`;
  }

  /** A session from a share link's hash. Throws on anything malformed. */
  static load(hash: string): Session {
    const p = new URLSearchParams(hash.replace(/^#/, ''));
    const int = (key: string, fallback: number) => {
      const v = p.get(key);
      if (v === null) return fallback;
      if (!/^\d+$/.test(v)) throw new RangeError(`${key} must be a whole number`);
      return Number(v);
    };
    const num = (key: string, fallback: number) => {
      const v = p.get(key);
      if (v === null) return fallback;
      const x = Number(v);
      if (!Number.isFinite(x)) throw new RangeError(`${key} must be a number`);
      return x;
    };
    const s = new Session({
      n: int('n', 36),
      seed: int('seed', 1),
      rules: { beta: num('beta', DEFAULT_RULES.beta), tax: num('tax', DEFAULT_RULES.tax), pairing: checkPairing(p.get('pairing') ?? DEFAULT_RULES.pairing) },
      recipe: parseRecipe(p.get('pose') ?? ''),
    });
    const yieldRule = p.get('yield');
    if (yieldRule !== null) s.stage.yieldRule = checkYield(yieldRule);
    // the history replays at once: nothing to watch, and every trade's shape lands now
    const fx = { trade: s.transit.trade, tax: s.transit.tax };
    s.transit.trade = 'off';
    s.transit.tax = false;
    for (const step of (p.get('do') ?? '').split(';')) {
      const text = step.trim();
      if (!text) continue;
      const [head] = text.split(/\s+/);
      if (!Object.hasOwn(COMMANDS, head) || !COMMANDS[head].game) throw new Error(`"${head}" cannot be replayed from a link`);
      const out = s.exec(text);
      if (out.startsWith('error:')) throw new Error(`${text}: ${out.slice(7)}`);
    }
    s.transit.trade = fx.trade;
    s.transit.tax = fx.tax;
    const look = p.get('look');
    if (look !== null) s.look = checkLook(look);
    const play = p.get('play');
    if (play !== null) {
      s.playing = true;
      s.rate = play === 'auto' ? null : checkRate(Number(play));
    }
    s.question = (p.get('q') ?? '').slice(0, 280);
    const zoom = p.get('zoom');
    if (zoom !== null) s.zoom = checkZoom(zoom);
    s.transit.clear();
    s.recompile();
    s.stage.scatter();
    s.stage.finish();
    // a link may carry a tutorial: a built-in script by name, or lines of its own
    const name = p.get('run');
    if (name !== null) {
      if (!Object.hasOwn(SCRIPTS, name)) throw new Error(`no script "${name}"`);
      s.start(name, SCRIPTS[name].split('\n'));
    }
    const text = p.get('script');
    if (text !== null) s.start('link', text.split(/[;\n]/));
    return s;
  }

  // ——— internals ———

  private dispatch(text: string): string {
    const words = text.split(/\s+/);
    const head = words[0].toLowerCase();
    if (Object.hasOwn(COMMANDS, head)) return COMMANDS[head].run(this, words.slice(1));
    if (head === 'preset' || Object.hasOwn(PRESETS, head)) {
      const name = head === 'preset' ? words[1]?.toLowerCase() : head;
      if (!name || !Object.hasOwn(PRESETS, name)) throw new Error(`presets: ${Object.keys(PRESETS).join(', ')}`);
      const rest = words.slice(head === 'preset' ? 2 : 1).join(' ');
      return this.pose(parseRecipe(rest, parseRecipe(PRESETS[name])));
    }
    if (isRecipeWord(head) || ['rescale', 'resize', 'reshape', 'sort', 'group', 'arrange'].includes(head)) {
      return this.pose(parseRecipe(expandPresets(text), this.recipe));
    }
    throw new Error(`unknown command "${head}" (try help)`);
  }

  pose(recipe: Recipe): string {
    // a pose that shows no money moving (a chart, triangles, hexagons): what is showing lands now
    const before = this.recipe;
    this.recipe = recipe;
    const shows = this.showsMoney;
    this.recipe = before;
    if (!shows) this.finishTransit();
    const figure = this.figureOf(recipe);
    this.recipe = recipe;
    this.figure = figure;
    this.stage.apply(figure, this.shown);
    this.compiled = this.game.revision;
    this.compiledFx = this.transit.revision;
    return `pose: ${formatRecipe(recipe) || 'room'}`;
  }

  /** A game command, into the history; consecutive trades merge into one. */
  record(text: string): void {
    if (text === 'reset') {
      this.history = [];
      this.origin = this.game.rules;
      return;
    }
    const last = this.history[this.history.length - 1];
    const m = /^(trade|round) (\d+)$/.exec(text);
    const lm = last ? /^(trade|round) (\d+)$/.exec(last) : null;
    // merged, a step must still be one its command accepts, so links replay it
    const most = m?.[1] === 'round' ? Math.floor(MAX_TRADES / Math.max(1, Math.floor(this.game.n / 2))) : MAX_TRADES;
    if (m && lm && m[1] === lm[1] && Number(lm[2]) + Number(m[2]) <= most) {
      this.history[this.history.length - 1] = `${m[1]} ${Number(lm[2]) + Number(m[2])}`;
    } else {
      this.history.push(text);
    }
  }

  private save() {
    return {
      game: this.game,
      wealth: this.game.snapshot(),
      origin: this.origin,
      stage: this.stage,
      yieldRule: this.stage.yieldRule,
      recipe: this.recipe,
      figure: this.figure,
      playing: this.playing,
      rate: this.rate,
      speed: this.speed,
      look: this.look,
      axes: this.axes,
      hud: this.hud,
      question: this.question,
      caption: this.caption,
      selected: this.selected,
      history: this.history.slice(),
    };
  }

  private restore(s: ReturnType<Session['save']>): void {
    this.game = s.game;
    this.game.restore(s.wealth);
    this.origin = s.origin;
    this.stage = s.stage;
    this.stage.yieldRule = s.yieldRule;
    this.recipe = s.recipe;
    this.figure = s.figure;
    this.playing = s.playing;
    this.rate = s.rate;
    this.speed = s.speed;
    this.look = s.look;
    this.axes = s.axes;
    this.hud = s.hud;
    this.question = s.question;
    this.caption = s.caption;
    this.selected = s.selected;
    this.history = s.history;
    this.stage.apply(this.figure, this.shown);
  }

  /** A new population: new game and stage built first, then swapped in. */
  rebuild(n: number, seed: number): void {
    const game = new Game(n, seed, this.game.rules);
    const figure = compile(this.recipe, game.wealth);
    const stage = new Stage(figure, game.wealth, seed);
    stage.yieldRule = this.stage.yieldRule;
    const transit = new Transit(n);
    transit.trade = this.transit.trade;
    transit.tax = this.transit.tax;
    transit.sync = this.transit.sync;
    this.game = game;
    this.figure = figure;
    this.stage = stage;
    this.transit = transit;
    this.shown = Float64Array.from(game.wealth);
    this.aspect = new Float64Array(n).fill(1);
    this.ahead = new Float64Array(n).fill(1);
    this.hook();
    this.compiled = game.revision;
    this.compiledFx = transit.revision;
    this.history = [];
    this.origin = game.rules;
    this.selected = -1;
    this.pairs = null;
    this.queued = 0;
  }
}

/**
 * `text` wrapped to `width` characters at spaces. Its leading spaces are kept;
 * later lines start with `indent` spaces. A word longer than a line is broken.
 */
function wrap(text: string, width: number, indent: number): string {
  if (text.length <= width) return text;
  const lead = /^\s*/.exec(text)![0];
  return hang(lead, text.slice(lead.length), width, indent);
}

/** `prefix` as given (a padded usage column), then `text` wrapped beside it, later lines indented by `indent`. */
function hang(prefix: string, text: string, width: number, indent: number): string {
  const room = Math.max(8, width - indent);
  const lines: string[] = [];
  let line = prefix;
  let first = true;
  for (let word of text.split(/\s+/).filter(Boolean)) {
    for (;;) {
      const limit = first ? width : indent + room;
      const gap = line.length > (first ? prefix.length : indent) ? 1 : 0;
      if (line.length + gap + word.length <= limit) {
        line += (gap ? ' ' : '') + word;
        break;
      }
      if (line.length > (first ? prefix.length : indent)) {
        lines.push(line);
        line = ' '.repeat(indent);
        first = false;
        continue;
      }
      // a word longer than the line: break it
      const take = Math.max(1, limit - line.length);
      lines.push(line + word.slice(0, take));
      word = word.slice(take);
      line = ' '.repeat(indent);
      first = false;
    }
  }
  lines.push(line);
  return lines.join('\n');
}

/** Preset names inside a recipe stand for their words: "squared ccdf" is "squared log bar desc stack". */
function expandPresets(text: string): string {
  return text
    .split(/\s+/)
    .map((w) => (Object.hasOwn(PRESETS, w.toLowerCase()) ? PRESETS[w.toLowerCase()] : w))
    .join(' ');
}

// ——— argument checks: all throw before anything changes ———

function count(arg: string | undefined, name: string, lo: number, hi: number): number {
  if (arg === undefined || !/^\d+$/.test(arg)) throw new RangeError(`${name} must be a whole number`);
  const v = Number(arg);
  if (v < lo || v > hi) throw new RangeError(`${name} must be in [${lo}, ${hi}]`);
  return v;
}

function real(arg: string | undefined, name: string, lo: number, hi: number): number {
  const v = arg === undefined ? NaN : Number(arg);
  if (!(v >= lo && v <= hi)) throw new RangeError(`${name} must be a number in [${lo}, ${hi}]`);
  return v;
}

function onOff(arg: string | undefined, current: boolean): boolean {
  if (arg === undefined) return !current;
  if (arg === 'on') return true;
  if (arg === 'off') return false;
  throw new RangeError('expected on or off');
}

function checkLook(v: string): FaceLook | 'off' {
  if (v === 'off' || (LOOKS as readonly string[]).includes(v)) return v as FaceLook | 'off';
  throw new RangeError(`look: ${LOOKS.join(', ')}, off`);
}

function checkPairing(v: string): Pairing {
  if (v === 'rounds' || v === 'random') return v;
  throw new RangeError('pairing: rounds or random');
}

function checkZoom(v: string): 'yard' | 'chart' {
  if (v === 'yard' || v === 'chart') return v;
  throw new RangeError('zoom: chart or yard');
}

function checkYield(v: string): YieldRule {
  if (v === 'equal' || v === 'mass') return v;
  throw new RangeError('yield: equal or mass');
}

function checkRate(v: number): number {
  if (!(v >= 0 && v <= 1e6)) throw new RangeError('rate must be in [0, 1000000] trades a second');
  return v;
}

const pct = (x: number) => `${(100 * x).toFixed(1)}%`;
const fmt = (x: number) => (Math.abs(x) >= 0.01 || x === 0 ? x.toFixed(4) : x.toExponential(2));

export const COMMANDS: Readonly<Record<string, Command>> = {
  help: {
    usage: 'help [command]',
    help: 'list commands, or explain one',
    run(s, [name]) {
      const width = Math.max(24, s.columns - 1);
      if (name) {
        if (Object.hasOwn(COMMANDS, name)) return wrap(`${COMMANDS[name].usage} — ${COMMANDS[name].help}`, width, 2);
        if (Object.hasOwn(PRESETS, name)) return `${name} = ${PRESETS[name] || '(the room)'}`;
        if (name === 'pose' || name === 'recipe') return RECIPE_HELP;
        throw new Error(`no help for "${name}"`);
      }
      // wide: usage and help side by side; narrow: help under its usage
      const column = Math.min(28, Object.values(COMMANDS).reduce((m, c) => Math.max(m, c.usage.length <= 28 ? c.usage.length : 0), 0) + 2);
      const wide = width >= column + 30;
      // (a usage too long for its column gets its help on the next line, as when narrow)
      const lines = Object.values(COMMANDS).map((c) =>
        wide && c.usage.length <= column ? hang(`  ${c.usage.padEnd(column)} `, c.help, width, column + 3) : `${wrap(`  ${c.usage}`, width, 4)}\n${hang('      ', c.help, width, 6)}`,
      );
      const block = (text: string) => text.split('\n').map((l) => wrap(l, width, 4)).join('\n');
      return ['commands:', ...lines, '', block(RECIPE_HELP), '', wrap(`presets: ${Object.keys(PRESETS).join(', ')}`, width, 2), '', block(SCRIPT_HELP)].join('\n');
    },
  },
  n: {
    usage: 'n <count>',
    help: 'a new population of <count> (2 to 2000), everyone equal',
    run(s, [arg]) {
      const n = count(arg, 'count', 2, 2000);
      s.rebuild(n, s.game.seed);
      return `${n} people, each with 1/${n}`;
    },
  },
  seed: {
    usage: 'seed <number>',
    help: 'new dice (everyone equal again)',
    run(s, [arg]) {
      const seed = count(arg, 'seed', 0, 0xffff_ffff);
      s.rebuild(s.game.n, seed);
      return `seed ${seed}`;
    },
  },
  reset: {
    usage: 'reset',
    help: 'everyone equal, dice back to the seed',
    game: true,
    run(s) {
      s.game.reset();
      s.cancelMeeting();
      s.equalize();
      s.record('reset');
      s.recompile();
      return 'equal again';
    },
  },
  trade: {
    usage: 'trade [k]',
    help: 'k yard-sale trades now (default: one round, N trades)',
    game: true,
    run(s, [arg]) {
      const k = arg === undefined ? s.game.n : count(arg, 'trades', 0, MAX_TRADES);
      // a few trades are worth watching one by one; many are a jump
      if (k <= 8) s.animated(() => s.game.trade(k));
      else s.game.trade(k);
      s.record(`trade ${k}`);
      s.recompile();
      return `${k} trades (total ${s.game.trades})`;
    },
  },
  round: {
    usage: 'round [k]',
    help: 'k rounds (default 1): everyone paired off at random, one trade a pair, then any tax',
    game: true,
    run(s, [arg]) {
      const k = arg === undefined ? 1 : count(arg, 'rounds', 0, Math.floor(MAX_TRADES / Math.max(1, Math.floor(s.game.n / 2))));
      if (k === 1 && s.meets && s.plays && s.game.n > 1) {
        // partners walk up to each other first; the round is played (and recorded) when they have
        s.queued++;
        return 'partners meeting, then 1 round';
      }
      // one round is worth watching beat by beat; many are a jump
      if (k <= 1) s.animated(() => s.game.round(k), true);
      else s.game.round(k);
      s.record(`round ${k}`);
      s.recompile();
      return `${k} round${k === 1 ? '' : 's'} (trades ${s.game.trades})`;
    },
  },
  levy: {
    usage: 'levy <rate>',
    help: 'everyone pays <rate> of their wealth, the pot is shared equally',
    game: true,
    run(s, [arg]) {
      const rate = real(arg, 'rate', 0, 1);
      s.game.levy(rate);
      s.record(`levy ${rate}`);
      s.recompile();
      return 'levied and shared';
    },
  },
  give: {
    usage: 'give <from> <to> <amount>',
    help: 'a gift; amount is a share of all wealth (0.01 = 1%)',
    game: true,
    run(s, [a, b, c]) {
      const from = count(a, 'from', 0, s.game.n - 1);
      const to = count(b, 'to', 0, s.game.n - 1);
      const amount = real(c, 'amount', 0, 1);
      const moved = s.game.give(from, to, amount);
      s.record(`give ${from} ${to} ${amount}`);
      s.recompile();
      return `${from} gave ${to} ${fmt(moved)}`;
    },
  },
  play: {
    usage: 'play [rate]',
    help: 'trade continuously, <rate> trades a second (default N)',
    run(s, [arg]) {
      if (arg !== undefined) s.rate = checkRate(Number(arg));
      s.playing = true;
      return `playing, ${s.tradeRate} trades/s`;
    },
  },
  pause: {
    usage: 'pause',
    help: 'stop trading (the room keeps moving)',
    run(s) {
      s.playing = false;
      return 'paused';
    },
  },
  rule: {
    usage: 'rule [beta|tax|pairing|yield] [value]',
    help: 'the rules of the world: stake, levy per round, who gives way',
    game: true,
    run(s, [name, value]) {
      if (name === undefined) {
        const r = s.game.rules;
        return `beta ${r.beta} (stake: share of the poorer's wealth)\ntax ${r.tax} (levy per round)\npairing ${r.pairing} (rounds: everyone paired off each round; random: one random pair at a time)\nyield ${s.stage.yieldRule} (who gives way)`;
      }
      if (name === 'beta' || name === 'tax') {
        const v = real(value, name, 0, name === 'beta' ? 0.999 : 1);
        s.game.setRules({ ...s.game.rules, [name]: v });
        s.record(`rule ${name} ${v}`);
        // a tax keeps the pot's spot in the room
        if (name === 'tax') s.recompile();
      } else if (name === 'pairing') {
        s.game.setRules({ ...s.game.rules, pairing: checkPairing(value ?? '') });
        s.record(`rule pairing ${value}`);
      } else if (name === 'yield') s.stage.yieldRule = checkYield(value ?? '');
      else throw new RangeError('rules: beta, tax, pairing, yield');
      return `${name} ${value}`;
    },
  },
  pose: {
    usage: 'pose [words]',
    help: 'a fresh recipe from defaults (bare words edit the current one)',
    run(s, words) {
      if (words.length === 0) return `pose: ${formatRecipe(s.recipe) || 'room'}`;
      return s.pose(parseRecipe(expandPresets(words.join(' '))));
    },
  },
  presets: {
    usage: 'presets',
    help: 'named recipes',
    run() {
      return Object.entries(PRESETS)
        .map(([k, v]) => `  ${k.padEnd(10)} ${v || '(the room)'}`)
        .join('\n');
    },
  },
  finish: {
    usage: 'finish',
    help: 'everyone straight to their place',
    run(s) {
      s.stage.finish();
      return s.stage.posing ? 'done' : 'nothing to finish in the room';
    },
  },
  scatter: {
    usage: 'scatter',
    help: 'put everyone back on the grid',
    run(s) {
      s.stage.scatter();
      if (s.stage.posing) s.stage.finish();
      return 'scattered';
    },
  },
  look: {
    usage: 'look <face>|off',
    help: `faces from the essay's engine: ${LOOKS.join(', ')}`,
    run(s, [arg]) {
      s.look = checkLook(arg ?? '');
      return `look ${s.look}`;
    },
  },
  speed: {
    usage: 'speed <x>',
    help: 'time scale, 0 to 4 (keys [ and ] halve and double it): slow motion to watch the beats',
    run(s, [arg]) {
      s.speed = real(arg, 'speed', 0, 4);
      return `speed ${s.speed}`;
    },
  },
  axes: {
    usage: 'axes [on|off]',
    help: 'dev ticks on the yard (readers never see these)',
    run(s, [arg]) {
      s.axes = onOff(arg, s.axes);
      return `axes ${s.axes ? 'on' : 'off'}`;
    },
  },
  hud: {
    usage: 'hud [on|off]',
    help: 'dev readout in the corner',
    run(s, [arg]) {
      s.hud = onOff(arg, s.hud);
      return `hud ${s.hud ? 'on' : 'off'}`;
    },
  },
  who: {
    usage: 'who [i]',
    help: 'one person: wealth, rank, size, density, state',
    run(s, [arg]) {
      const i = arg === undefined ? s.selected : count(arg, 'person', 0, s.game.n - 1);
      if (i < 0) throw new Error('click someone, or: who <i>');
      s.selected = i;
      const w = s.game.wealth[i];
      let rank = 1;
      for (let j = 0; j < s.game.n; j++) if (s.game.wealth[j] > w) rank++;
      const st = s.stage;
      const state = st.air[i] > 0 ? 'in the air' : st.settled[i] ? 'in place' : i === st.dragged ? 'held' : 'walking';
      return `#${i}: wealth ${fmt(w)} (${(w * s.game.n).toFixed(3)}× equal), rank ${rank}/${s.game.n}, box ${fmt(st.w[i])}×${fmt(st.h[i])}, density ${st.density(i).toFixed(2)}, ${state}`;
    },
  },
  fx: {
    usage: 'fx [on|off] | fx trade off|piece|toss | fx tax|sync on|off',
    help: 'animate trades and levies. piece (the default): trades where people stand, the loser\'s slice flies to the winner. toss (for demos): before each round partners walk up to each other, both stakes come off, a spinner picks the winner, who keeps its own and takes the other. tax: levies through a shared pot. sync: streamed trades in rounds. In a chart everyone is locked in place: trades and levies happen at once and the chart re-forms',
    run(s, [a, b]) {
      const t = s.transit;
      const say = () => `fx trade ${t.trade}, tax ${t.tax ? 'on' : 'off'}, sync ${t.sync ? 'on' : 'off'}`;
      if (a === undefined) return say();
      if (a === 'trade') {
        if (b !== 'off' && b !== 'toss' && b !== 'piece') throw new RangeError('fx trade off, piece or toss');
        t.trade = b;
      } else if (a === 'tax') t.tax = onOff(b, t.tax);
      else if (a === 'sync') t.sync = onOff(b, t.sync);
      else {
        const v = onOff(a, t.trade !== 'off' || t.tax);
        t.trade = v ? 'piece' : 'off';
        t.tax = v;
      }
      // nothing shown any more: what is showing lands now, shapes and all
      if (t.trade === 'off' && !t.tax) s.finishTransit();
      // with or without the pot's spot
      s.recompile();
      return say();
    },
  },
  zoom: {
    usage: 'zoom [chart|yard]',
    help: 'chart: once a pose is formed, it fills the screen; yard: always the whole yard',
    run(s, [arg]) {
      s.zoom = arg === undefined ? (s.zoom === 'yard' ? 'chart' : 'yard') : checkZoom(arg);
      return `zoom ${s.zoom}`;
    },
  },
  drag: {
    usage: 'drag [push|lift|off]',
    help: 'push: a held person shoves through the crowd; lift: carried over everyone, dropped where there is room; off',
    run(s, [arg]) {
      if (arg !== 'push' && arg !== 'lift' && arg !== 'off') throw new RangeError('drag: push, lift or off');
      s.drag = arg;
      return `drag ${arg}`;
    },
  },
  equalize: {
    usage: 'equalize',
    help: 'everyone square again (trades leave people a little oblong)',
    game: true,
    run(s) {
      s.equalize();
      s.record('equalize');
      s.recompile();
      return 'everyone square';
    },
  },
  say: {
    usage: 'say [text]',
    help: 'a line on the stage, for tutorials (empty clears)',
    run(s, words) {
      s.caption = words.join(' ').slice(0, 280);
      return '';
    },
  },
  run: {
    usage: 'run <script>',
    help: `run a script: ${Object.keys(SCRIPTS).join(', ')} (or type lines with wait / until done)`,
    run(s, [name]) {
      if (!name || !Object.hasOwn(SCRIPTS, name)) throw new Error(`scripts: ${Object.keys(SCRIPTS).join(', ')}`);
      s.start(name, SCRIPTS[name].split('\n'));
      return `running ${name} (stop to stop)`;
    },
  },
  demo: {
    usage: 'demo',
    help: 'run the demo: every important function in about three minutes (stop to stop)',
    run(s) {
      s.start('demo', SCRIPTS.demo.split('\n'));
      return 'running demo (stop to stop)';
    },
  },
  scripts: {
    usage: 'scripts [name]',
    help: 'list the scripts, or show one',
    run(_s, [name]) {
      if (name === undefined) return `scripts: ${Object.keys(SCRIPTS).join(', ')}`;
      if (!Object.hasOwn(SCRIPTS, name)) throw new Error(`no script "${name}"`);
      return SCRIPTS[name].trim();
    },
  },
  stop: {
    usage: 'stop',
    help: 'stop the running script',
    run(s) {
      const name = s.script?.name;
      s.script = null;
      return name ? `stopped ${name}` : 'no script running';
    },
  },
  stats: {
    usage: 'stats',
    help: 'gini, N_eff, shares (for you, not for readers)',
    run(s) {
      const t = statsOf(s.game.wealth);
      return `trades ${s.game.trades}  gini ${t.gini.toFixed(3)}  N_eff ${t.neff.toFixed(2)} of ${s.game.n}  top10% ${pct(t.top10)}  bottom50% ${pct(t.bottom50)}  min ${fmt(t.poorest)}  max ${fmt(t.richest)}  Σ−1 ${(t.total - 1).toExponential(1)}`;
    },
  },
  check: {
    usage: 'check',
    help: 'the law: overlaps on the ground, bodies outside, repairs so far',
    run(s) {
      const o = s.stage.overlaps();
      return `overlapping pairs ${o.pairs} (deepest ${o.depth.toExponential(1)}), outside ${o.outside}, undone ${s.stage.reverts}, unrepaired ${s.stage.violations}, hops ${s.stage.hops}`;
    },
  },
  ask: {
    usage: 'ask [question]',
    help: 'attach a question to the share link (empty clears)',
    run(s, words) {
      s.question = words.join(' ').slice(0, 280);
      return s.question ? `asking: ${s.question}` : 'no question';
    },
  },
  share: {
    usage: 'share',
    help: 'this state as a link',
    run(s) {
      return s.share();
    },
  },
  clear: {
    usage: 'clear',
    help: 'clear this log',
    run(s) {
      s.log.length = 0;
      return '';
    },
  },
};

const SCRIPT_HELP = [
  'scripts: console lines plus',
  '  wait <seconds>   until done   say <text>   # comment',
  '  a typed line with wait or until runs as a script: ccdf; until done; wait 2; neff',
].join('\n');

const RECIPE_HELP = [
  'pose words (any order; bare words edit the current pose):',
  '  rescale  wealth | log | logarea',
  '  resize   natural | equal | squared',
  '  reshape  square | bar [t] | col [t] | tri | hex',
  '  sort     id | asc | desc | shuffle',
  '  group    none | median | quartiles | tmb | deciles',
  '  pose     free (spread out) | wander | stack | row | pack | fold',
  '  extras   gap <g>, prints | noprints',
].join('\n');

/** Every word the console understands, for tab completion. */
export const VOCABULARY: readonly string[] = [...Object.keys(COMMANDS), ...Object.keys(PRESETS), ...RECIPE_WORDS, ...LOOKS, ...Object.keys(SCRIPTS), 'wait', 'until', 'done', 'chart', 'yard', 'push', 'lift', 'trade', 'tax', 'sync', 'toss', 'piece', 'pairing', 'rounds', 'random', 'beta', 'tax', 'yield', 'mass', 'equal', 'on', 'off'];
