<script lang="ts">
  /**
   * The pair stage — Scenes 1–11 of the iteration-2 brief, on the step player.
   *
   * One stage, one continuous subject (ADR-015): the two circles the crowd
   * leaves standing ARE Blue and Red, the same two DOM nodes from the title to
   * the room. Everything the reader can see is drawn from the current step's
   * pose (script.ts); `settle` draws a pose at once and `play` animates into
   * it. The step player decides when; this file decides what.
   *
   * Words are never written here: every line is a message key (A2), and every
   * number in a line is read off the pose on screen. The talk reads like a chat
   * window (bubbles.ts): time runs down the column, lines stay while they are
   * still context, and what happened is logged among them.
   */
  import { getContext, onMount } from 'svelte';
  import { gsap } from '../../gsap';
  import Bubble from '../../Bubble.svelte';
  import CardStack, { type Card } from '../../CardStack.svelte';
  import Coin from '../Coin.svelte';
  import Reel from './Reel.svelte';
  import Teletype from './Teletype.svelte';
  import { STEP_STAGE_CONTEXT, readingMs, type Speaker, type StepStageContext } from '../../steps';
  import { CALLS, PAIR_STEPS, REACTIONS, RUN_MS, indexOf, panelStart, valuesFor, type Pose } from './script';
  import { createRun } from './run.svelte';
  import { BIG, COINS, CROWD, RAINED, SMALL } from './crowd';
  import { FALL, hopsFor, noise, planRain } from './rain';
  import { deciderFace, pairLayout, pile } from './layout';
  import type { Point } from '../../../shared/layout';
  import { bubbleLines, bubbleWords, chatColumn, stackChat, type BubbleChoice } from '../../bubbles';
  import {
    CLASSIC_AGENT_FILL,
    CLASSIC_AGENT_STROKE,
    PROTAGONISTS,
    headlineForStyle,
    spreadStyles,
    styleNoun,
    type AgentStyle,
  } from '../../../shared/agentStyle';
  import { svgShapePath } from '../../../shared/shapePath';
  import { ambientClock, breath } from '../../ambient';
  import { formatNumber, getTextDirection, say } from '$lib/i18n';
  import {
    BETS,
    PREDICTIONS,
    PREDICTION_PICTURES,
    answer,
    recallAnswers,
    session,
    type BetId,
    type PredictionId,
  } from '../../../shared/runLog.svelte';
  import { REVEAL_BETA, REVEAL_TRADES, START_DOLLARS } from '../../../shared/presets';
  import { collectStats, frontPageFor } from '../../../sandbox/newsroom';
  import { measureWealth } from '$lib/research';
  import { openBranch } from '../../branch';

  const stage = getContext<StepStageContext | undefined>(STEP_STAGE_CONTEXT);

  const SOURCE_URL =
    'https://www.investing.com/news/stock-market-news/spacex-ipo-makes-elon-musk-worlds-first-trillionaire-4741087';
  const CREDIT_URL = 'https://github.com/hamed';

  /** A `·` list from prose.md arrives as numbered messages; read them back in order. */
  function words(key: string): string[] {
    const out: string[] = [];
    for (let i = 1; i < 40; i++) {
      const word = say(`${key}_${i}`);
      if (word === `${key}_${i}`) break;
      out.push(word);
    }
    return out;
  }

  const MATH_WORDS = words('open_reel_math');
  /** The reel lands third from last, with two wrong words after it to overshoot onto. */
  const MATH_AT = MATH_WORDS.length - 3;

  /** Which crowd circle each protagonist is. */
  const WHO: Record<Speaker, number> = { blue: BIG, red: SMALL };
  const PAIR: readonly Speaker[] = ['blue', 'red'];
  const whoIs = (i: number): Speaker | null => (i === BIG ? 'blue' : i === SMALL ? 'red' : null);
  const other = (who: Speaker): Speaker => (who === 'blue' ? 'red' : 'blue');

  /** A bubble's lines arrive this far apart (3.1: "they feel timed"). */
  const LINE_BEAT_MS = 700;

  // ---- measuring -----------------------------------------------------------

  let host: HTMLDivElement;
  let mathReel: HTMLSpanElement;
  let titleEl: HTMLElement;
  let widestWord = 0;
  /**
   * The largest the title may be so the reel's widest word stays on the stage
   * (owner review 2026-09-26). Everything in the title scales together, so one
   * measurement at any size gives the answer: the title is centred, and the
   * widest word starts where MATH starts.
   */
  let titleMax = $state(Infinity);

  function fitTitle(): void {
    if (!titleEl || !mathReel || !widestWord || !width) return;
    const size = parseFloat(getComputedStyle(titleEl).fontSize);
    const title = titleEl.offsetWidth;
    const start = rtl ? title - (mathReel.offsetLeft + mathReel.offsetWidth) : mathReel.offsetLeft;
    const reach = start + widestWord - title / 2;
    if (reach <= 0) return;
    titleMax = (size * (width / 2 - 16)) / reach;
  }
  let width = $state(0);
  let height = $state(0);
  /** MERIT and Blue come first in the reading direction: in Farsi they stand on the right. */
  const rtl = getTextDirection() === 'rtl';
  const L = $derived(pairLayout(width, height, 100, rtl));

  /** The room's other ninety-eight wear the ordinary costumes (A5 keeps them off the pair's). */
  const roomStyles = $derived(spreadStyles(L.room.positions, L.room.radius * 3.2));

  // ---- the view: every number the stage draws, tweened by GSAP ---------------

  interface Person {
    x: number;
    y: number;
    r: number;
    alpha: number;
    /** 1 — holds nothing: an empty ring, visible but with no area. */
    empty: number;
    /** Squash and stretch, about the point where they touch the ground. */
    sx: number;
    sy: number;
  }
  interface Token {
    x: number;
    y: number;
    on: number;
    face: 'front' | 'back';
  }

  const view = $state({
    type: 0,
    meritOn: 0,
    orOn: 0,
    mathOn: 0,
    mathPos: 0,
    markOn: 0,
    compact: 0,
    titleOn: 1,
    lift: 0,
    people: Array.from({ length: CROWD }, () => ({ x: 0, y: 0, r: 0, alpha: 1, empty: 1, sx: 1, sy: 1 })) as Person[],
    /** The room's other ninety-eight (Scene 10), each on its way in or in place. */
    room: Array.from({ length: 100 }, () => ({ x: 0, y: 0, alpha: 0, sx: 1, sy: 1 })),
    paint: { blue: 0, red: 0 },
    coinsOn: 0,
    held: { blue: 15, red: 1 },
    table: { blue: 0, red: 0 },
    flipOn: 0,
    /** The decider's turn, radians: faces change exactly when it is edge-on. */
    flipAngle: 0,
    flipLift: 0,
    /** 0 — a plain coin, nobody's colour yet; 1 — each face in its owner's colour. */
    flipTint: 0,
    roomOn: 0,
    payout: Array.from({ length: COINS }, () => ({ x: 0, y: 0, on: 0, face: 'front' })) as Token[],
    fly: [] as Token[],
  });

  // ---- poses → the view ----------------------------------------------------

  /** A hold still waiting is drawn from what the reader has done so far. */
  const reader = $state({ named: { blue: false, red: false }, held: { blue: 15, red: 1 } });

  function poseAt(index: number): Pose {
    const step = PAIR_STEPS[index];
    if (step.wait.kind !== 'action' || stage?.isReleased(step.id)) return step.pose;
    if (step.id === 'equal') return { ...step.pose, holdings: { ...reader.held } };
    // only the one calling is still waiting; whoever was clicked before stays named
    const caller = callerOf(step.id);
    return caller ? { ...step.pose, named: { ...step.pose.named, [caller]: reader.named[caller] } } : step.pose;
  }

  function pairSpot(pose: Pose, who: Speaker) {
    if (pose.place === 'room') return L.room.positions[who === 'blue' ? L.room.blue : L.room.red];
    if (pose.place === 'seats') return who === 'blue' ? L.seatBlue : L.seatRed;
    return who === 'blue' ? L.markBlue : L.markRed;
  }

  function pairRadius(pose: Pose, who: Speaker): number {
    if (pose.place === 'room') return L.room.radius;
    return Math.max(L.minRadius, L.radius(pose.holdings[who]));
  }

  /** Where each of the sixteen is, and how big, in a pose. */
  function people(pose: Pose): Person[] {
    const nobody = L.presence;
    const still = { alpha: 1, sx: 1, sy: 1 };
    return L.crowdHomes.map((home, i) => {
      const who = whoIs(i);
      switch (pose.crowd) {
        case 'away':
          return { ...L.crowdEntries[i], r: nobody, empty: 1, ...still };
        case 'idle':
          return { ...home, r: nobody, empty: 1, ...still };
        case 'paid': {
          const at = rainPlan.finals[i] ?? home;
          return RAINED[i] > 0
            ? { x: at.x, y: at.y, r: L.radius(RAINED[i]), empty: 0, ...still }
            : { x: at.x, y: at.y, r: nobody, empty: 1, ...still };
        }
        default: {
          if (!who) return { ...L.crowdExits[i], r: nobody, empty: 1, ...still, alpha: 0 };
          const spot = pairSpot(pose, who);
          return { x: spot.x, y: spot.y, r: pairRadius(pose, who), empty: 0, ...still };
        }
      }
    });
  }

  /** The room's others: in place once the room has filled, off the stage before. */
  function roomPeople(pose: Pose) {
    const w = L.width;
    return L.room.positions.map((p, i) => {
      if (pose.place === 'room') return { x: p.x, y: p.y, alpha: 1, sx: 1, sy: 1 };
      return { x: p.x < w / 2 ? -L.room.radius * 4 : w + L.room.radius * 4, y: p.y, alpha: 0, sx: 1, sy: 1 };
    });
  }

  /** The decider at rest: plain before a toss, the winner's face after. */
  function restingAngle(pose: Pose): number {
    return pose.flip === 'blue' ? Math.PI : 0;
  }

  function target(pose: Pose) {
    return {
      type: pose.teletype ? 1 : 0,
      meritOn: pose.merit ? 1 : 0,
      orOn: pose.or ? 1 : 0,
      mathOn: pose.math ? 1 : 0,
      mathPos: pose.math ? MATH_AT : 0,
      markOn: pose.mark ? 1 : 0,
      compact: pose.compact ? 1 : 0,
      titleOn: pose.cleared ? 0 : 1,
      lift: pose.cleared ? -L.height * 0.2 : 0,
      paint: { blue: pose.named.blue ? 1 : 0, red: pose.named.red ? 1 : 0 },
      coinsOn: pose.coins && pose.place !== 'room' ? 1 : 0,
      held: { ...pose.holdings },
      table: { ...pose.table },
      flipOn: pose.flip === 'hidden' ? 0 : 1,
      flipAngle: restingAngle(pose),
      flipTint: pose.flip === 'blue' || pose.flip === 'red' ? 1 : 0,
      roomOn: pose.place === 'room' ? 1 : 0,
    };
  }

  let timeline: ReturnType<typeof gsap.timeline> | null = null;

  function stopMotion(): void {
    timeline?.kill();
    timeline = null;
    for (const token of view.fly) gsap.killTweensOf(token);
    view.fly = [];
    for (const token of view.payout) token.on = 0;
    dragging = null;
  }

  /** Draw a pose at once. */
  function draw(pose: Pose): void {
    const t = target(pose);
    view.type = t.type;
    view.meritOn = t.meritOn;
    view.orOn = t.orOn;
    view.mathOn = t.mathOn;
    view.mathPos = t.mathPos;
    view.markOn = t.markOn;
    view.compact = t.compact;
    view.titleOn = t.titleOn;
    view.lift = t.lift;
    view.paint.blue = t.paint.blue;
    view.paint.red = t.paint.red;
    view.coinsOn = t.coinsOn;
    view.held = t.held;
    view.table = t.table;
    view.flipOn = t.flipOn;
    view.flipAngle = t.flipAngle;
    view.flipLift = 0;
    view.flipTint = t.flipTint;
    view.roomOn = t.roomOn;
    people(pose).forEach((p, i) => Object.assign(view.people[i], p));
    roomPeople(pose).forEach((p, i) => Object.assign(view.room[i], p));
  }

  // ---- the player's verbs ----------------------------------------------------

  let current = $state(0);

  function settle(index: number): void {
    current = index;
    stopMotion();
    stopCalls();
    reaction = null;
    logReady = true;
    cardOpen = PAIR_STEPS[index].pose.cardOpen;
    stopBanter();
    banterShown = Infinity;
    dropPaper();
    if (PAIR_STEPS[index].pose.ran) run.ended();
    else run.clear();
    draw(poseAt(index));
    showAll(index);
    enter(index);
  }

  function play(index: number, from: number): void {
    current = index;
    stopMotion();
    stopCalls();
    reaction = null;
    if (from >= 0) draw(poseAt(from));
    const step = PAIR_STEPS[index];
    const pose = poseAt(index);
    logReady = !step.log;
    cardOpen = step.pose.cardOpen;
    stopBanter();
    banterShown = Infinity;
    dropPaper();
    if (step.action === 'run') {
      if (stage?.reduced) {
        run.start();
        run.finish();
        logReady = true;
      } else
        run.start(() => {
          logReady = true;
          printPaper();
        });
    } else if (step.pose.ran) run.ended();
    else run.clear();
    if (step.id === 'run.banter') playBanter();
    timeline = gsap.timeline();
    choreograph(step.action, pose, timeline);
    revealLines(index);
    enter(index);
  }

  function nudge(index: number): void {
    const id = PAIR_STEPS[index].id;
    const caller = callerOf(id);
    if (caller) callOut(caller);
    if (id === 'equal') wiggle('blue');
  }

  function hurry(index: number): boolean {
    const id = PAIR_STEPS[index].id;
    if (bigPaper) {
      shrinkPaper();
      return true;
    }
    if (id === 'run' && run.state.running) {
      run.finish();
      return true;
    }
    if (id === 'run.banter' && banterShown < banterLines().length) {
      stopBanter();
      banterShown = Infinity;
      return true;
    }
    if (reveal.id !== PAIR_STEPS[index].id || reveal.shown >= reveal.total) return false;
    showAll(index);
    return true;
  }

  function readingTime(index: number): number {
    const step = PAIR_STEPS[index];
    if (step.id === 'run.banter') return banterLines().reduce((sum, line) => sum + readingMs(bubbleWords(line.text)), 0);
    const dynamic = step.id === 'guess.react' && session.bet ? REACTIONS.betLines[session.bet].message : null;
    const line = step.lines?.[0];
    if (!line && !dynamic) return readingMs(0);
    const text = dynamic ? say(dynamic) : say(line!.message, valuesFor(step));
    return readingMs(bubbleWords(text)) + (bubbleLines(text).length - 1) * LINE_BEAT_MS;
  }

  /** Things a step starts that are not tweens: the calls, the coin mover. */
  function enter(index: number): void {
    const id = PAIR_STEPS[index].id;
    const caller = callerOf(id);
    if (caller && !stage?.isReleased(id)) startCalls(caller);
    if (id === 'equal' && !stage?.isReleased('equal')) reacted = { first: false, eleven: false, over: false };
  }

  // ---- Scene 13: the run --------------------------------------------------------

  /** The room of a hundred, played for real: unseeded, as the reveal always was. */
  const run = createRun(100, REVEAL_BETA, REVEAL_TRADES, RUN_MS);
  const ROOM_TOTAL_DOLLARS = 100 * START_DOLLARS;

  /** A room member's radius: area is wealth, and everyone started at the room's radius. */
  function roomR(i: number): number {
    void run.state.revision;
    return Math.max(0.8, L.room.radius * Math.sqrt(Math.max(0, run.wealth()[i]) * 100));
  }

  /** Whether the room's sizes come from a run (from the run on) rather than from the pose. */
  const runShown = $derived(PAIR_STEPS[current].pose.ran && (run.state.running || run.state.done));

  /** Largest first, so a giant never hides the small ones under it. */
  const roomOrder = $derived.by(() => {
    void run.state.revision;
    const w = run.wealth();
    return L.room.positions.map((_, i) => i).sort((a, b) => (runShown ? w[b] - w[a] : 0) || a - b);
  });

  /** Where a room member stands right now: Blue and Red are their own circles. */
  function roomSpot(i: number) {
    if (i === L.room.blue) return view.people[BIG];
    if (i === L.room.red) return view.people[SMALL];
    return view.room[i];
  }

  function styleOfRoom(i: number): AgentStyle {
    if (i === L.room.blue) return PROTAGONISTS.blue;
    if (i === L.room.red) return PROTAGONISTS.red;
    return roomStyles[i];
  }

  /** The morning paper on whoever finished richest — the sandbox's own newsroom. */
  function frontPage(): Said['paper'] | null {
    const winner = run.state.winner;
    if (winner < 0) return null;
    const w = run.wealth();
    const style = styleOfRoom(winner);
    let poorer = 0;
    for (let i = 0; i < w.length; i++) if (w[i] < w[winner]) poorer++;
    const m = measureWealth(w);
    const stats = collectStats(
      { n: 100, startDollars: START_DOLLARS, taxRate: 0, dollarsOf: (i) => w[i] * ROOM_TOTAL_DOLLARS, volume: [] },
      m.gini,
      m.topShare,
    );
    const edition = Math.max(0, run.state.finished - 1);
    const page = frontPageFor(
      'ledger',
      { noun: styleNoun(style), dollars: w[winner] * ROOM_TOTAL_DOLLARS, percentile: poorer / w.length },
      stats,
      headlineForStyle(style, edition),
      edition,
    );
    return { masthead: page.paper, text: page.text, source: page.source, style };
  }

  /**
   * The front page lands big over the room first — the headline is the news —
   * then shrinks into its line in the talk (owner review 2026-09-26).
   */
  let bigPaper = $state<Said['paper'] | null>(null);
  let bigEl = $state<HTMLElement>();
  let paperTimer: number | undefined;

  function dropPaper(): void {
    if (paperTimer !== undefined) window.clearTimeout(paperTimer);
    paperTimer = undefined;
    if (bigEl) gsap.killTweensOf(bigEl);
    bigPaper = null;
  }

  function printPaper(): void {
    dropPaper();
    if (stage?.reduced) return;
    bigPaper = frontPage();
    paperTimer = window.setTimeout(shrinkPaper, 3800);
  }

  /** Into the talk: the big page flies to where its line already waits, unseen. */
  function shrinkPaper(): void {
    if (paperTimer !== undefined) window.clearTimeout(paperTimer);
    paperTimer = undefined;
    const target = host?.querySelector<HTMLElement>('.bubble.paper');
    if (!bigPaper || !bigEl || !target) {
      bigPaper = null;
      return;
    }
    const a = bigEl.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    gsap.to(bigEl, {
      x: b.left - a.left,
      y: b.top - a.top,
      scaleX: b.width / a.width,
      scaleY: b.height / a.height,
      transformOrigin: '0 0',
      duration: 0.75,
      ease: 'power2.inOut',
      onComplete: () => (bigPaper = null),
    });
  }

  /** Who finished richest, as far as the banter goes. */
  const runBranch = $derived.by((): 'blue' | 'red' | 'other' => {
    void run.state.revision;
    if (run.state.winner === L.room.blue) return 'blue';
    if (run.state.winner === L.room.red) return 'red';
    return 'other';
  });

  const dollars = (i: number) => formatNumber(run.wealth()[i] * ROOM_TOTAL_DOLLARS, { style: 'currency', currency: 'USD' });

  /** The banter's lines for how the run went, with what the two actually hold. */
  function banterLines(): Said[] {
    void run.state.revision;
    return REACTIONS.runBanter[runBranch].map((line, k) => ({
      id: `run.banter:${runBranch}:${run.state.finished}:${k}`,
      who: line.who,
      at: line.who,
      text: say(line.message, { blue: dollars(L.room.blue), red: dollars(L.room.red) }),
    }));
  }

  /** The banter plays out line by line, each once the one before has been read. */
  let banterShown = $state(Infinity);
  let banterTimer: number | undefined;

  function stopBanter(): void {
    if (banterTimer !== undefined) window.clearTimeout(banterTimer);
    banterTimer = undefined;
  }

  function playBanter(): void {
    stopBanter();
    const lines = banterLines();
    if (stage?.reduced) {
      banterShown = Infinity;
      return;
    }
    banterShown = 1;
    const next = () => {
      if (banterShown >= lines.length) return;
      banterTimer = window.setTimeout(() => {
        banterShown += 1;
        next();
      }, readingMs(bubbleWords(lines[banterShown - 1].text)));
    };
    next();
  }

  // ---- the bubbles: one comic panel per topic --------------------------------

  interface Said {
    id: string;
    /** Whose colours the bubble wears; null for a circle not yet introduced. */
    who: Speaker | null;
    /** Which circle it points at; null for a logged event, which points at nobody. */
    at: Speaker | null;
    text: string;
    kind?: 'line' | 'event' | 'paper';
    /** An event's coin: the face that landed. */
    coin?: Speaker;
    /** The morning paper's front page, printed in the talk. */
    paper?: { masthead: string; text: string; source: string; style: AgentStyle };
    choices?: readonly BubbleChoice[];
  }

  /** The line of a Scene 3 hold, once more and a little louder each time. */
  const callLevel = $state({ blue: 0, red: 0 });
  /** A coin-moving reaction (Scene 5), spoken on an event rather than a step. */
  let reaction = $state<Said | null>(null);

  const callerOf = (id: string): Speaker | null => (id === CALLS.red ? 'red' : id === CALLS.blue ? 'blue' : null);

  /** Whether the current step's result may be logged yet: a toss logs once it has landed. */
  let logReady = $state(true);

  /** A step that says something or logs something, as far as the reader can see it now. */
  const speaks = (i: number) => !!PAIR_STEPS[i].lines?.[0]?.who || (!!PAIR_STEPS[i].log && (i < current || logReady));

  const said = $derived.by((): Said[] => {
    const out: Said[] = [];
    for (let i = panelStart(current); i <= current; i++) {
      const step = PAIR_STEPS[i];
      const line = step.lines?.[0];
      if (step.log && (i < current || logReady)) out.push(...logFor(step.id, step.log, step.pose));
      if (step.id === 'run.banter') {
        out.push(...banterLines().slice(0, i === current ? banterShown : Infinity));
        continue;
      }
      if (step.id === 'why.after') {
        const line = run.state.finished > 1 ? REACTIONS.whyAgain : REACTIONS.whyAfter;
        out.push({ id: `${step.id}:${line.message}`, who: line.who, at: line.who, text: say(line.message) });
        continue;
      }
      if (step.id === 'guess.react') {
        const bet = session.bet ? REACTIONS.betLines[session.bet] : null;
        if (bet) out.push({ id: `${step.id}:${session.bet}`, who: bet.who, at: bet.who, text: say(bet.message) });
        continue;
      }
      if (!line || !line.who) continue;
      // a brief line goes as soon as anyone says the next thing
      if (step.brief) {
        let superseded = false;
        for (let k = i + 1; k <= current && !superseded; k++) superseded = speaks(k);
        if (superseded) continue;
      }
      const caller = callerOf(step.id);
      if (caller) {
        const waiting = !(view.paint[caller] > 0.5);
        const level = waiting ? callLevel[caller] : 0;
        const pool = caller === 'red' ? REACTIONS.callRed : REACTIONS.callBlue;
        out.push({ id: `${step.id}#${level}`, who: waiting ? null : caller, at: caller, text: say(pool[level]) });
        continue;
      }
      out.push({ id: step.id, who: line.who, at: line.who, text: say(line.message, valuesFor(step)) });
    }
    if (reaction && current === indexOf('equal')) out.push(reaction);
    const last = out[out.length - 1];
    const choices = choicesAt(current);
    if (last && choices) out[out.length - 1] = { ...last, choices };
    return out;
  });

  /** What a finished step leaves in the talk: a toss's result, the reader's answers, the run and its paper. */
  function logFor(id: string, key: string, pose: Pose): Said[] {
    if (key === 'log_toss') {
      const winner: Speaker = pose.flip === 'blue' ? 'blue' : 'red';
      const text = say(key, { winner: say(`name_${winner}`), blue: pose.holdings.blue, red: pose.holdings.red });
      return [{ id: `log:${id}`, who: null, at: null, text, kind: 'event', coin: winner }];
    }
    if (key === 'log_guess' && session.prediction) {
      const choice = say(REACTIONS.guesses[PREDICTIONS.findIndex((p) => p.id === session.prediction)]);
      return [{ id: `log:${id}`, who: null, at: null, text: say(key, { choice }), kind: 'event' }];
    }
    if (key === 'log_bet' && session.bet) {
      const bet = say(REACTIONS.bets[BETS.indexOf(session.bet)]);
      return [{ id: `log:${id}`, who: null, at: null, text: say(key, { bet }), kind: 'event' }];
    }
    if (key === 'log_run' && run.state.done) {
      void run.state.revision;
      const text = say(key, {
        trades: formatNumber(run.state.trades),
        share: formatNumber(run.state.share, { style: 'percent' }),
      });
      const paper = frontPage();
      const edition = run.state.finished;
      return [
        { id: `log:${id}:${edition}`, who: null, at: null, text, kind: 'event' },
        ...(paper ? [{ id: `paper:${edition}`, who: null, at: null, text: paper.text, kind: 'paper' as const, paper }] : []),
      ];
    }
    return [];
  }

  /** The reader's choices, set inside the current speaker's bubble. */
  function choicesAt(index: number): readonly BubbleChoice[] | null {
    const id = PAIR_STEPS[index].id;
    if (PAIR_STEPS[index].pose.choice) {
      return [
        { label: say('more_choice_1'), act: tellMe },
        { label: say('more_choice_2'), act: () => stage?.advance() },
      ];
    }
    if (id === 'run.again') {
      return [
        { label: say(REACTIONS.runChoices[0]), act: () => stage?.replay('run') },
        { label: say(REACTIONS.runChoices[1]), act: () => stage?.advance() },
      ];
    }
    if (id === 'guess.what') {
      return PREDICTIONS.map((p, k) => ({
        label: say(REACTIONS.guesses[k]),
        glyph: PREDICTION_PICTURES[p.id],
        chosen: session.prediction === p.id,
        act: () => pick('guess.what', () => answer('prediction', p.id as PredictionId)),
      }));
    }
    if (id === 'guess.stake') {
      return BETS.map((bet, k) => ({
        label: say(REACTIONS.bets[k]),
        chosen: session.bet === bet,
        act: () => pick('guess.stake', () => answer('bet', bet as BetId)),
      }));
    }
    return null;
  }

  /** Record the reader's answer; if it was what the stage waited for, move on. */
  function pick(hold: string, record: () => void): void {
    record();
    if (current === indexOf(hold) && !stage?.isReleased(hold)) stage?.release(hold);
  }

  // ---- the concept cards -----------------------------------------------------

  let cardOpen = $state<string | null>(null);
  let cardHeight = $state(0);

  /** The rule card reads the rule that is running: the live stake, never typed in. */
  function cardFor(id: string): Card | null {
    if (id !== 'rule') return null;
    const stake = formatNumber(REVEAL_BETA, { style: 'percent' });
    return {
      id,
      title: say('card_rule_title'),
      lines: [say('card_rule_1'), say('card_rule_2', { stake }), say('card_rule_3'), say('card_rule_4')],
    };
  }

  const cards = $derived(
    PAIR_STEPS[current].pose.cards.map(cardFor).filter((card): card is Card => card !== null),
  );

  /** The newest bubble's lines, arriving one by one. */
  let reveal = $state({ id: '', shown: Infinity, total: 0 });
  let revealTimer: number | undefined;

  function stopReveal(): void {
    if (revealTimer !== undefined) window.clearInterval(revealTimer);
    revealTimer = undefined;
  }

  function revealLines(index: number): void {
    stopReveal();
    const step = PAIR_STEPS[index];
    const line = step.lines?.[0];
    if (!line) return;
    const total = bubbleLines(say(line.message)).length;
    if (total <= 1 || stage?.reduced) {
      reveal = { id: step.id, shown: Infinity, total };
      return;
    }
    reveal = { id: step.id, shown: 1, total };
    revealTimer = window.setInterval(() => {
      reveal.shown += 1;
      if (reveal.shown >= total) stopReveal();
    }, LINE_BEAT_MS);
  }

  function showAll(index: number): void {
    stopReveal();
    reveal = { id: PAIR_STEPS[index].id, shown: Infinity, total: 0 };
  }

  const sizes = $state<Record<string, { w: number; h: number }>>({});

  /** The title's size, as its CSS computes it: clamp(2.4rem, min(11.5vw, 19svh), 10rem). */
  const titleFont = $derived(Math.min(titleMax, Math.min(160, Math.max(38.4, Math.min(width * 0.115, height * 0.19)))));
  /** How small the title gets once they start talking. */
  const COMPACT = 0.4;

  /** The band the talk lives in: under the title (small by now), over the two. */
  const region = $derived.by(() => {
    const pose = poseAt(current);
    const top = pose.cleared ? Math.max(height * 0.05, pose.cards.length > 0 ? 68 : 0) : height * 0.03 + titleFont * 1.2 * COMPACT + 12;
    // in the room the talk floats over the crowd, down to just above the two
    const tops =
      pose.place === 'room'
        ? [L.room.positions[L.room.blue].y - L.room.radius * 3.2]
        : PAIR.map((who) => pairSpot(pose, who).y - Math.max(pairRadius(pose, who), L.minRadius));
    // on a narrow stage an open card sits over the talk's space: start below it
    const card = cardOpen && width < 760 && cardHeight > 0 ? 12.8 + 44 + 8 + cardHeight + 10 : 0;
    const start = Math.max(top, card);
    const bottom = Math.max(start + 90, Math.min(...tops) - 6);
    return { top: start, bottom, left: 16, right: width - 16 };
  });

  const column = $derived(
    chatColumn(
      PAIR.map((who) => anchorOf(who)),
      width,
      region.top,
      region.bottom,
    ),
  );
  const bubbleWidth = $derived(Math.min(368, (column.right - column.left) * 0.8));

  const placed = $derived(
    stackChat(
      said.map((b) => ({ w: sizes[b.id]?.w ?? 0, h: sizes[b.id]?.h ?? 0, anchor: b.at ? anchorOf(b.at) : null })),
      column,
      PAIR_STEPS[current].pose.place === 'room' ? 4 : 6,
    ),
  );

  function anchorOf(who: Speaker) {
    const p = view.people[WHO[who]];
    return { x: p.x, y: p.y, r: Math.max(p.r, L.minRadius) };
  }

  // ---- choreography ----------------------------------------------------------

  function tweenTo(pose: Pose, tl: ReturnType<typeof gsap.timeline>, at = 0, duration = 0.6): void {
    const t = target(pose);
    tl.to(
      view,
      {
        type: t.type,
        meritOn: t.meritOn,
        orOn: t.orOn,
        mathOn: t.mathOn,
        markOn: t.markOn,
        compact: t.compact,
        titleOn: t.titleOn,
        lift: t.lift,
        coinsOn: t.coinsOn,
        flipOn: t.flipOn,
        roomOn: t.roomOn,
        duration,
        ease: 'power2.inOut',
      },
      at,
    );
    tl.to(view.paint, { ...t.paint, duration: 0.35, ease: 'back.out(2)' }, at);
    people(pose).forEach((p, i) => tl.to(view.people[i], { ...p, duration, ease: 'power2.inOut' }, at));
    tl.call(
      () => {
        view.held = t.held;
        view.table = t.table;
        view.flipAngle = t.flipAngle;
        view.flipTint = t.flipTint;
      },
      [],
      at + duration,
    );
  }

  function spin(tl: ReturnType<typeof gsap.timeline>, answer: number): void {
    tl.set(view, { mathPos: 0 });
    tl.to(view, { mathOn: 1, duration: 0.25, ease: 'none' });
    // Slow enough to read the two funny words, then a steady readable run past
    // the answer (never under about a quarter second a word), two words over,
    // and back to rest.
    tl.to(view, { mathPos: 2, duration: 1.1, ease: 'sine.in' });
    tl.to(view, { mathPos: answer + 2, duration: answer / 3.6, ease: 'none' });
    tl.to(view, { mathPos: answer, duration: 0.75, ease: 'power2.inOut' });
  }

  function choreograph(action: string | undefined, pose: Pose, tl: ReturnType<typeof gsap.timeline>): void {
    switch (action) {
      case 'type':
        tl.to(view, { type: 1, duration: 3.6, ease: 'none' }, 0.5);
        arrive(tl);
        return;
      case 'merit':
        tl.to(view, { meritOn: 1, duration: 0.9, ease: 'power1.out' });
        return;
      case 'or':
        tl.to(view, { orOn: 1, duration: 0.6, ease: 'none' });
        return;
      case 'reel-math':
        spin(tl, MATH_AT);
        return;
      case 'payout':
        payout(tl);
        return;
      case 'gather':
        leave(pose, tl);
        return;
      case 'clear':
        tweenTo(pose, tl, 0, 1.1);
        return;
      case 'ante':
        ante(pose, tl);
        return;
      case 'toss':
        toss(pose, tl);
        return;
      case 'room':
        fillRoom(pose, tl);
        return;
      default:
        tweenTo(pose, tl, 0, 0.6);
    }
  }

  type Timeline = ReturnType<typeof gsap.timeline>;
  interface Hopper {
    x: number;
    y: number;
    sx: number;
    sy: number;
  }

  /**
   * Small hops from `from` to `to`, leaving at `depart` and landing for good at
   * `arrive` — the Pixar lamp, not a cannonball (owner review 2026-09-26):
   * crouch, stretch into the air, squash on landing, and no two hops alike.
   * Nobody flies: a long way is many small hops, never one big arc.
   */
  function hopAlong(tl: Timeline, p: Hopper, from: Point, to: Point, depart: number, arrive: number, height: number, key: number): void {
    const n = hopsFor(Math.hypot(to.x - from.x, to.y - from.y), L.radius(1) * 2.2);
    if (n === 0 || arrive <= depart) return;
    const weights = Array.from({ length: n }, (_, k) => 0.8 + noise(key, k) * 0.55);
    const total = weights.reduce((sum, w) => sum + w, 0);
    let t = depart;
    for (let k = 0; k < n; k++) {
      const dur = ((arrive - depart) * weights[k]) / total;
      const a = { x: from.x + ((to.x - from.x) * k) / n, y: from.y + ((to.y - from.y) * k) / n };
      const b = { x: from.x + ((to.x - from.x) * (k + 1)) / n, y: from.y + ((to.y - from.y) * (k + 1)) / n };
      const h = height * (0.6 + noise(key, k + 50) * 0.7);
      const crouch = dur * 0.16;
      const air = dur * 0.62;
      const land = dur * 0.22;
      tl.to(p, { sx: 1.16, sy: 0.82, duration: crouch, ease: 'power1.out' }, t);
      tl.to(p, { sx: 0.9, sy: 1.13, duration: air * 0.4, ease: 'power1.out' }, t + crouch);
      tl.to(p, { x: b.x, duration: air, ease: 'none' }, t + crouch);
      tl.to(p, { y: Math.min(a.y, b.y) - h, duration: air / 2, ease: 'power2.out' }, t + crouch);
      tl.to(p, { y: b.y, duration: air / 2, ease: 'power2.in' }, t + crouch + air / 2);
      tl.to(p, { sx: 1, sy: 1, duration: air * 0.3 }, t + crouch + air * 0.45);
      tl.to(p, { sx: 1.2, sy: 0.8, duration: land * 0.4, ease: 'power1.out' }, t + crouch + air);
      tl.to(p, { sx: 1, sy: 1, duration: land * 0.6, ease: 'back.out(3)' }, t + crouch + air + land * 0.4);
      t += dur;
    }
  }

  /** A jump on the spot whose top is at `peak`: crouch, up, down, squash. */
  function jumpAt(tl: Timeline, p: Hopper, spot: Point, peak: number, height: number): void {
    tl.to(p, { sx: 1.18, sy: 0.8, duration: 0.09, ease: 'power1.out' }, peak - 0.27);
    tl.to(p, { sx: 0.88, sy: 1.16, y: spot.y - height, duration: 0.18, ease: 'power2.out' }, peak - 0.18);
    tl.to(p, { sx: 1, sy: 1, y: spot.y, duration: 0.2, ease: 'power2.in' }, peak);
    tl.to(p, { sx: 1.22, sy: 0.78, duration: 0.06, ease: 'power1.out' }, peak + 0.2);
    tl.to(p, { sx: 1, sy: 1, duration: 0.16, ease: 'back.out(3)' }, peak + 0.26);
  }

  /** Scene 2 begins: people hop in from the nearer side, each at their own pace, and settle. */
  function arrive(tl: Timeline): void {
    const one = L.radius(1);
    view.people.forEach((person, i) => {
      tl.set(person, { ...L.crowdEntries[i], r: L.presence, empty: 1, alpha: 1, sx: 1, sy: 1 }, 0);
      const from = L.crowdEntries[i];
      const to = L.crowdHomes[i];
      const hops = hopsFor(Math.hypot(to.x - from.x, to.y - from.y), one * 2.2);
      const depart = 0.15 + noise(i, 1) * 1.4;
      // everyone has settled before the title's first word lands
      const arrive = Math.min(4.3, depart + hops * (0.26 + noise(i, 2) * 0.12) + noise(i, 3) * 0.5);
      hopAlong(tl, person, from, to, depart, arrive, one * (0.7 + noise(i, 4) * 0.5), i * 7 + 1);
    });
  }

  /** Where the crowd ends the rain: the scramble, planned once for this stage's size. */
  const rainPlan = $derived(planRain(L.crowdHomes, L.crowdBand, L.radius(1)));

  /**
   * Coins pop out of the MATH reel and rain down, and everyone scrambles for
   * them (owner, 2026-09-26): each drop's owner hops under it and jumps to meet
   * it; the nearest one or two go for it too and arrive a beat late. One
   * catches a lot, one very little — those two stay.
   */
  function payout(tl: Timeline): void {
    const hostBox = host.getBoundingClientRect();
    const reelBox = mathReel.getBoundingClientRect();
    const from = { x: reelBox.left - hostBox.left + reelBox.width / 2, y: reelBox.top - hostBox.top + reelBox.height / 2 };
    const one = L.radius(1);
    const caught = new Array<number>(CROWD).fill(0);
    tl.to(view, { markOn: 1, duration: 0.5, ease: 'none' }, 0);
    let token = 0;
    for (const c of rainPlan.catches) {
      const person = view.people[c.who];
      hopAlong(tl, person, c.from, c.spot, c.depart, c.land - 0.28, one * 0.8, c.drop * 13 + 3);
      const before = caught[c.who];
      caught[c.who] += c.count;
      const r = before > 0 ? L.radius(before) : L.presence;
      jumpAt(tl, person, c.spot, c.land, Math.max(one * 1.1, r * 0.45));
      for (let k = 0; k < c.count; k++) {
        const coin = view.payout[token++];
        const off = (k - (c.count - 1) / 2) * L.coinRadius * 1.3;
        tl.set(coin, { x: from.x, y: from.y, on: 1 }, c.land - FALL + k * 0.04);
        tl.to(coin, { x: c.spot.x + off, duration: FALL, ease: 'power1.out' }, c.land - FALL + k * 0.04);
        tl.to(coin, { y: c.spot.y - one * 1.1 - r, duration: FALL, ease: 'power2.in' }, c.land - FALL + k * 0.04);
        tl.set(coin, { on: 0 }, c.land + k * 0.04);
      }
      tl.set(person, { empty: 0 }, c.land);
      tl.to(person, { r: L.radius(caught[c.who]), duration: 0.25, ease: 'back.out(3)' }, c.land);
    }
    for (const [k, c] of rainPlan.chases.entries()) {
      hopAlong(tl, view.people[c.who], c.from, c.to, c.depart, c.arrive, one * 0.7, k * 17 + 5);
    }
  }

  /** Everyone else hops off the stage with what they caught; the two hop under their words. */
  function leave(pose: Pose, tl: Timeline): void {
    const targets = people(pose);
    const one = L.radius(1);
    view.people.forEach((person, i) => {
      const from = { x: person.x, y: person.y };
      if (whoIs(i)) {
        const to = { x: targets[i].x, y: targets[i].y };
        hopAlong(tl, person, from, to, 0.4, 2.1, Math.max(one * 0.6, person.r * 0.25), i * 5 + 2);
        tl.to(person, { r: targets[i].r, duration: 0.5 }, 1.6);
        return;
      }
      const depart = noise(i, 3) * 0.7;
      const exit = L.crowdExits[i];
      const hops = hopsFor(Math.abs(exit.x - from.x), one * 2.2);
      hopAlong(tl, person, from, { x: exit.x, y: from.y }, depart, depart + hops * 0.22, one * 0.6, i * 11 + 4);
      tl.set(person, { alpha: 0 }, depart + hops * 0.22);
    });
  }

  /**
   * Scene 10: the camera pulls back about the middle — the two shrink and keep
   * their places relative to each other — while ninety-eight people hop in one
   * by one from both sides (brief 3.6).
   */
  function fillRoom(pose: Pose, tl: Timeline): void {
    const t = target(pose);
    tl.to(view, { roomOn: 1, coinsOn: t.coinsOn, flipOn: t.flipOn, duration: 0.3 }, 0);
    people(pose).forEach((p, i) => tl.to(view.people[i], { ...p, duration: 1.1, ease: 'power2.inOut' }, 0));
    const w = L.width;
    L.room.positions.forEach((spot, i) => {
      if (i === L.room.blue || i === L.room.red) return;
      const entry = { x: spot.x < w / 2 ? -L.room.radius * 3 : w + L.room.radius * 3, y: spot.y };
      const depart = 0.4 + (i / L.room.positions.length) * 2.2 + noise(i, 4) * 0.3;
      tl.set(view.room[i], { ...entry, alpha: 1, sx: 1, sy: 1 }, depart);
      hopAlong(tl, view.room[i], entry, spot, depart, depart + 0.9 + noise(i, 5) * 0.4, L.room.radius * 1.3, i * 3 + 9);
    });
    tl.call(() => {
      view.held = t.held;
      view.table = t.table;
    }, [], 1.1);
  }

  /** Where coin `k` of a fortune of `count` sits on the stage right now. */
  function coinSpot(who: Speaker, count: number, k: number) {
    const person = view.people[WHO[who]];
    const spots = pile(count, L.coinRadius, Math.max(L.minRadius, L.radius(count)));
    const spot = spots[Math.max(0, Math.min(k, spots.length - 1))] ?? { x: 0, y: 0 };
    return { x: person.x + spot.x, y: person.y + spot.y };
  }

  /** Stakes leave each fortune, one coin at a time, and land on the table. */
  function ante(pose: Pose, tl: ReturnType<typeof gsap.timeline>): void {
    const stake = pose.table.blue;
    const before = { blue: pose.holdings.blue + stake, red: pose.holdings.red + stake };
    const starts: Token[] = [];
    for (const who of ['red', 'blue'] as Speaker[]) {
      for (let k = 0; k < stake; k++) {
        const from = coinSpot(who, before[who], before[who] - 1 - k);
        starts.push({ x: from.x, y: from.y, on: 1, face: k % 2 ? 'back' : 'front' });
      }
    }
    view.fly = starts;
    const slots = tableSlots(stake, stake);
    tl.call(() => {
      view.held = { ...pose.holdings };
    });
    view.fly.forEach((token, k) => {
      tl.to(token, { x: slots[k].x, y: slots[k].y, duration: 0.75, ease: 'power2.inOut' }, 0.05 + k * 0.09);
    });
    for (const who of ['blue', 'red'] as Speaker[]) {
      tl.to(view.people[WHO[who]], { r: pairRadius(pose, who), duration: 0.6, ease: 'power2.inOut' }, 0.15);
    }
    tl.call(() => {
      view.fly = [];
      view.table = { ...pose.table };
    });
  }

  /**
   * The decider goes up turning and comes down on the winner's face. A face
   * only ever changes while the coin is edge-on, and each face wears its
   * owner's colour from the moment it is tossed: Marx is Red's, the bank is
   * Blue's (brief 3.5). Then the table goes to the winner.
   */
  function toss(pose: Pose, tl: ReturnType<typeof gsap.timeline>): void {
    const winner: Speaker = pose.flip === 'blue' ? 'blue' : 'red';
    const start = view.flipAngle;
    const turns = 5;
    const end = start - (start % (2 * Math.PI)) + turns * 2 * Math.PI + (winner === 'blue' ? Math.PI : 0);
    const high = -L.whole * 0.9;
    tl.to(view, { flipOn: 1, duration: 0.2 }, 0);
    tl.set(view, { flipTint: 1 }, 0.15);
    tl.to(view, { flipAngle: end, duration: 2.1, ease: 'power3.out' }, 0.15);
    tl.to(view, { flipLift: high, duration: 0.95, ease: 'power2.out' }, 0.15);
    tl.to(view, { flipLift: 0, duration: 0.9, ease: 'bounce.out' }, 1.1);
    const landed = 2.4;
    // The stakes on the table become flying coins once the coin has landed;
    // they are made now, hidden, so the timeline owns every tween it plays.
    const slots = tableSlots(view.table.blue, view.table.red);
    view.fly = slots.map((slot, k) => ({ x: slot.x, y: slot.y, on: 0, face: k % 2 ? 'back' : 'front' }));
    const to = view.people[WHO[winner]];
    tl.call(
      () => {
        for (const token of view.fly) token.on = 1;
        view.table = { blue: 0, red: 0 };
      },
      [],
      landed,
    );
    view.fly.forEach((token, k) => {
      tl.to(token, { x: to.x, y: to.y, duration: 0.5, ease: 'power2.in' }, landed + 0.05 + k * 0.05);
    });
    const done = landed + 0.6 + slots.length * 0.05;
    tl.call(
      () => {
        view.fly = [];
        view.held = { ...pose.holdings };
      },
      [],
      done,
    );
    for (const who of ['blue', 'red'] as Speaker[]) {
      tl.to(view.people[WHO[who]], { r: pairRadius(pose, who), duration: 0.35, ease: 'back.out(2)' }, done);
    }
    // the result joins the talk once everything has come to rest
    tl.call(() => (logReady = true), [], done + 0.4);
  }

  /** Where staked coins sit: each one's half-stack on his own side of the table. */
  function tableSlots(blue: number, red: number) {
    const r = L.coinRadius;
    const toward = (who: Speaker) => Math.sign(pairSpot(poseAt(current), who).x - L.table.x) || (who === 'blue' ? -1 : 1);
    const slots: { x: number; y: number }[] = [];
    for (let k = 0; k < red; k++) slots.push({ x: L.table.x + toward('red') * r * (1.3 + k * 1.15), y: L.table.y });
    for (let k = 0; k < blue; k++) slots.push({ x: L.table.x + toward('blue') * r * (1.3 + k * 1.15), y: L.table.y });
    return slots;
  }

  // ---- Scene 3: meeting them -------------------------------------------------

  let callTimer: number | undefined;

  function stopCalls(): void {
    if (callTimer !== undefined) window.clearTimeout(callTimer);
    callTimer = undefined;
  }

  function startCalls(who: Speaker): void {
    callLevel[who] = 0;
    callTimer = window.setTimeout(() => callOut(who), 4200);
  }

  /** The caller tries again, a little louder, while the reader has not clicked. */
  function callOut(who: Speaker): void {
    stopCalls();
    if (view.paint[who] > 0.5) return;
    const pool = who === 'red' ? REACTIONS.callRed : REACTIONS.callBlue;
    callLevel[who] = Math.min(pool.length - 1, callLevel[who] + 1);
    if (stage?.reduced) return;
    callTimer = window.setTimeout(() => callOut(who), 4000 + Math.random() * 2500);
  }

  function name(who: Speaker): void {
    const id = CALLS[who];
    if (current !== indexOf(id) || reader.named[who]) return;
    reader.named = { ...reader.named, [who]: true };
    stopCalls();
    gsap.fromTo(view.paint, { [who]: 0 }, { [who]: 1, duration: 0.4, ease: 'back.out(2.5)' });
    stage?.release(id);
  }

  // ---- Scene 5: the reader makes them equal ----------------------------------

  let reacted = { first: false, eleven: false, over: false };
  const holding = $derived(current === indexOf('equal') && !stage?.isReleased('equal') && stage?.index === indexOf('equal'));

  function react(key: string, who: Speaker): void {
    reaction = { id: `react:${key}`, who, at: who, text: say(key) };
  }

  /** A coin on its way from one fortune to the other, drawn where it is. */
  interface Flight {
    token: Token;
    to: Speaker;
  }
  let flights: Flight[] = [];

  function launch(from: Speaker, start: { x: number; y: number }): void {
    const to = other(from);
    reader.held = { ...reader.held, [from]: reader.held[from] - 1 };
    view.held = { ...view.held, [from]: view.held[from] - 1 };
    gsap.to(view.people[WHO[from]], { r: Math.max(L.minRadius, L.radius(reader.held[from])), duration: 0.3, ease: 'back.out(2)' });
    view.fly = [...view.fly, { x: start.x, y: start.y, on: 1, face: 'front' }];
    const token = view.fly[view.fly.length - 1];
    const flight = { token, to };
    flights.push(flight);
    const landing = reader.held[to] + flights.filter((f) => f.to === to).length;
    const spot = coinSpot(to, landing, landing - 1);
    const reduced = stage?.reduced ?? false;
    gsap.to(token, {
      x: spot.x,
      y: spot.y,
      duration: reduced ? 0 : 0.5,
      ease: 'power2.inOut',
      onComplete: () => land(flight),
    });
  }

  function land(flight: Flight): void {
    flights = flights.filter((f) => f !== flight);
    flight.token.on = 0;
    if (flights.length === 0) view.fly = [];
    const to = flight.to;
    reader.held = { ...reader.held, [to]: reader.held[to] + 1 };
    view.held = { ...view.held, [to]: view.held[to] + 1 };
    gsap.to(view.people[WHO[to]], { r: Math.max(L.minRadius, L.radius(reader.held[to])), duration: 0.3, ease: 'back.out(2)' });
    const held = reader.held;
    if (held.blue === 8 && held.red === 8 && flights.length === 0) {
      reaction = null;
      stage?.release('equal');
      return;
    }
    if (!reacted.first) {
      reacted.first = true;
      react(REACTIONS.equalFirst, 'blue');
    } else if (held.blue === 11 && !reacted.eleven) {
      reacted.eleven = true;
      react(REACTIONS.equalEleven, 'blue');
    } else if (held.red > 8 && !reacted.over) {
      reacted.over = true;
      react(REACTIONS.equalOverBlue, 'blue');
      window.setTimeout(() => {
        if (holding) react(REACTIONS.equalOverRed, 'red');
      }, 1700);
    } else if (held.red <= 8) {
      reacted.over = false;
    }
  }

  /** A tap or a key on a fortune sends one of its coins, visibly, to the other. */
  function give(from: Speaker): void {
    if (!holding || reader.held[from] <= 0) return;
    launch(from, coinSpot(from, reader.held[from], reader.held[from] - 1));
  }

  /** A coin being dragged across by the reader: it follows the finger. */
  let dragging = $state<{ from: Speaker; x: number; y: number; start: { x: number; y: number }; moved: boolean } | null>(null);

  function local(event: PointerEvent) {
    const box = host.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  }

  function dragStart(event: PointerEvent, who: Speaker): void {
    if (!holding || reader.held[who] <= 0) return;
    const at = local(event);
    dragging = { from: who, x: at.x, y: at.y, start: at, moved: false };
    (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
  }

  function dragMove(event: PointerEvent): void {
    if (!dragging) return;
    const at = local(event);
    dragging.x = at.x;
    dragging.y = at.y;
    if (Math.hypot(at.x - dragging.start.x, at.y - dragging.start.y) > 6) dragging.moved = true;
  }

  function dragEnd(event: PointerEvent): void {
    if (!dragging) return;
    const { from, moved } = dragging;
    const at = local(event);
    dragging = null;
    pointerDone = true;
    if (!moved) {
      give(from);
      return;
    }
    const p = view.people[WHO[other(from)]];
    // dropped on the other fortune: it lands there; anywhere else: it goes home
    if (Math.hypot(at.x - p.x, at.y - p.y) <= Math.max(p.r, 44)) launch(from, at);
  }

  /** A pointer tap is handled by pointerup; a click with no pointer is a key. */
  let pointerDone = false;
  function onKeyClick(event: MouseEvent, who: Speaker): void {
    if (pointerDone || event.detail !== 0) {
      pointerDone = false;
      return;
    }
    give(who);
  }

  /** At a hold, a forward gesture wiggles whoever is waiting to be acted on. */
  let wiggling = $state<{ who: Speaker; until: number } | null>(null);
  function wiggle(who: Speaker): void {
    wiggling = { who, until: seconds + 0.6 };
  }

  // ---- Scene 11: the choice ---------------------------------------------------

  function tellMe(): void {
    openBranch('cow');
  }

  // ---- drawing helpers -------------------------------------------------------

  let seconds = $state(0);

  function costumeFill(i: number): string {
    const who = whoIs(i);
    if (!who) return CLASSIC_AGENT_FILL;
    return view.paint[who] > 0.5 ? PROTAGONISTS[who].fill : CLASSIC_AGENT_FILL;
  }

  function costumeStroke(i: number): string {
    const who = whoIs(i);
    if (!who) return CLASSIC_AGENT_STROKE;
    return view.paint[who] > 0.5 ? PROTAGONISTS[who].stroke : CLASSIC_AGENT_STROKE;
  }

  /**
   * Once named, the two wear a heavier edge than anyone else, so they stay
   * findable in a costumed room of a hundred (brief checklist). Not the dashed
   * halo — that already means "the richest" (4.2).
   */
  function strokeWidth(i: number): number {
    const who = whoIs(i);
    if (!who) return 1.3;
    return view.paint[who] > 0.5 ? 2.6 : i === BIG ? 1.8 : 1.3;
  }

  function pop(i: number): number {
    const who = whoIs(i);
    if (!who) return 1;
    const p = view.paint[who];
    return p > 0 && p < 1 ? 1 + Math.sin(p * Math.PI) * 0.12 : 1;
  }

  /** Squash and stretch about the bottom of a shape of radius `r`, where it meets the ground. */
  function squash(r: number, sx: number, sy: number): string {
    if (Math.abs(sx - 1) < 1e-3 && Math.abs(sy - 1) < 1e-3) return '';
    return `translate(0 ${r.toFixed(2)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(0 ${(-r).toFixed(2)})`;
  }

  /** Breath for the pair, a hop and a jiggle for the crowd — ambient, on the inner group only. */
  function life(i: number): string {
    if (stage?.reduced) return '';
    const b = breath(seconds, i);
    const crowdPhase = PAIR_STEPS[current]?.pose.crowd;
    let hop = 0;
    let tremble = 0;
    if ((crowdPhase === 'idle' || crowdPhase === 'paid') && !timeline?.isActive()) {
      // each at their own rhythm: now and then a little hop, and never quite still
      const r = view.people[i].r;
      const rate = 0.45 + noise(i, 30) * 0.7;
      hop = Math.max(0, Math.sin(seconds * rate * Math.PI * 2 + noise(i, 31) * 6)) ** 14 * r * (0.5 + noise(i, 32) * 0.6);
      tremble = Math.sin(seconds * (3 + noise(i, 33) * 4) + i) * 0.6 + Math.sin(seconds * (9 + noise(i, 34) * 5) + 2 * i) * 0.3;
    }
    let shake = 0;
    if (wiggling && whoIs(i) === wiggling.who && seconds < wiggling.until) shake = Math.sin(seconds * 42) * 4;
    return `translate(${(b.dx + shake + tremble).toFixed(2)} ${(b.dy - hop).toFixed(2)}) scale(${(b.scale * pop(i)).toFixed(4)})`;
  }


  onMount(() => {
    const observer = new ResizeObserver(() => {
      width = host.clientWidth;
      height = host.clientHeight;
      fitTitle();
      // a resize re-lays everything out: draw the current step where it now belongs
      if (!timeline || !timeline.isActive()) draw(poseAt(current));
    });
    width = host.clientWidth;
    height = host.clientHeight;
    observer.observe(host);
    stage?.attach(PAIR_STEPS, { play, settle, nudge, hurry, readingMs: readingTime });
    fitTitle();
    void document.fonts?.ready.then(fitTitle);
    recallAnswers();
    const stopAmbient = ambientClock((s) => (seconds = s), stage?.reduced ?? false);
    return () => {
      observer.disconnect();
      stopAmbient();
      stopMotion();
      stopCalls();
      stopReveal();
      stopBanter();
      dropPaper();
      run.stop();
    };
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="pair-scene" bind:this={host} onpointermove={dragMove}>
  <!-- Once the stage is cleared (Scene 5) its words are gone, so their links
       must not stay in the tab order, invisible. -->
  <div class="words" style={`opacity:${view.titleOn}; transform: translateY(${view.lift}px)`} inert={view.titleOn < 0.5}>
    <div class="teletype-slot" style={`opacity:${1 - view.compact}`} inert={view.compact > 0.5}>
      <Teletype
        headline={say('open_headline')}
        source={say('open_source')}
        href={SOURCE_URL}
        progress={view.type}
        shown={1}
      />
    </div>

    <!-- In reading order: the common sense first, the question second. -->
    <h1
      class="title"
      bind:this={titleEl}
      aria-label={say('open_title')}
      style={`--title-max:${Number.isFinite(titleMax) ? `${titleMax.toFixed(1)}px` : '10rem'}; transform: translateY(${(-view.compact * height * 0.18).toFixed(1)}px) scale(${(1 - view.compact * (1 - COMPACT)).toFixed(3)})`}
    >
      <span class="word merit" style={`opacity:${view.meritOn}`} aria-hidden="true">{say('open_title_merit')}</span>
      <span class="word or" style={`opacity:${view.orOn}`} aria-hidden="true">{say('open_title_or')}</span>
      <span class="word math" bind:this={mathReel}>
        <Reel
          words={MATH_WORDS}
          answer={MATH_AT}
          position={view.mathPos}
          shown={view.mathOn}
          onmeasure={(w) => {
            widestWord = w;
            fitTitle();
          }}
        /><span
          class="mark"
          style={`opacity:${view.markOn}`}
          aria-hidden="true">{say('open_title_mark')}</span
        >
      </span>
    </h1>

    <a class="credit" href={CREDIT_URL} target="_blank" rel="author noreferrer" style={`opacity:${view.markOn}`}
      >{say('open_credit')}</a
    >
  </div>

  {#if width > 0}
    <svg class="art" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {#if view.roomOn > 0}
        <g class="room" opacity={view.roomOn}>
          {#each roomOrder as i (i)}
            {@const spot = view.room[i]}
            {#if i !== L.room.blue && i !== L.room.red && spot.alpha > 0.01 && roomStyles[i]}
              <path
                d={svgShapePath(roomStyles[i].shape, runShown ? roomR(i) : L.room.radius)}
                transform={`translate(${spot.x.toFixed(1)} ${spot.y.toFixed(1)}) ${squash(L.room.radius, spot.sx, spot.sy)}`}
                fill={roomStyles[i].fill}
                stroke={roomStyles[i].stroke}
                fill-opacity="0.75"
                stroke-width="1.3"
                opacity={spot.alpha}
              />
            {/if}
          {/each}
        </g>
      {/if}

      {#each view.people as person, i (i)}
        {#if person.alpha > 0.01 && person.r > 0.05}
          <g transform={`translate(${person.x.toFixed(2)} ${person.y.toFixed(2)})`} opacity={person.alpha}>
            <g transform={squash(person.r, person.sx, person.sy)}>
            <g transform={life(i)}>
              <circle
                r={runShown && whoIs(i) ? roomR(whoIs(i) === 'blue' ? L.room.blue : L.room.red) : person.r}
                fill={person.empty > 0.5 ? 'none' : costumeFill(i)}
                stroke={costumeStroke(i)}
                stroke-dasharray={person.empty > 0.5 ? '3 3' : undefined}
                fill-opacity={whoIs(i) && view.paint[whoIs(i)!] > 0.5 ? 0.75 : 1}
                stroke-width={strokeWidth(i)}
                vector-effect="non-scaling-stroke"
              />
              {#if whoIs(i) && view.coinsOn > 0.01}
                {@const count = view.held[whoIs(i)!]}
                <g opacity={view.coinsOn}>
                  {#each pile(count, L.coinRadius, Math.max(L.minRadius, L.radius(count))) as spot, k (k)}
                    <Coin cx={spot.x} cy={spot.y} r={L.coinRadius} face={k % 2 ? 'back' : 'front'} />
                  {/each}
                </g>
              {/if}
            </g>
            </g>
          </g>
        {/if}
      {/each}

      {#if runShown && run.state.winner >= 0}
        {@const spot = roomSpot(run.state.winner)}
        <!-- the dashed ring means "the richest", as everywhere in the essay -->
        <path
          class="halo"
          d={svgShapePath(styleOfRoom(run.state.winner).shape, roomR(run.state.winner) + 6)}
          transform={`translate(${spot.x.toFixed(1)} ${spot.y.toFixed(1)})`}
          fill="none"
          stroke="var(--ink-mid)"
          stroke-width="1.4"
          stroke-dasharray="4 4"
          stroke-linejoin="round"
        />
      {/if}

      {#each view.payout as token, i (i)}
        {#if token.on > 0}<Coin cx={token.x} cy={token.y} r={L.coinRadius * 0.8} face={i % 2 ? 'back' : 'front'} />{/if}
      {/each}

      {#if view.table.blue + view.table.red > 0}
        {#each tableSlots(view.table.blue, view.table.red) as slot, k (k)}
          <Coin cx={slot.x} cy={slot.y} r={L.coinRadius} face={k % 2 ? 'back' : 'front'} />
        {/each}
      {/if}

      {#each view.fly as token, k (k)}
        {#if token.on > 0}<Coin cx={token.x} cy={token.y} r={L.coinRadius} face={token.face} />{/if}
      {/each}

      {#if dragging}
        <g class="dragged"><Coin cx={dragging.x} cy={dragging.y} r={L.coinRadius * 1.1} face="front" /></g>
      {/if}

      {#if view.flipOn > 0.01}
        {@const face = deciderFace(view.flipAngle)}
        <g transform={`translate(${L.flip.x} ${(L.flip.y + view.flipLift).toFixed(2)})`} opacity={view.flipOn}>
          <g transform={`scale(${face.squash.toFixed(3)} 1)`}>
            <Coin
              r={L.coinRadius * 1.6}
              face={face.side === 'red' ? 'front' : 'back'}
              tint={view.flipTint > 0.5 ? PROTAGONISTS[face.side].fill : undefined}
            />
          </g>
        </g>
      {/if}
    </svg>

    {#if runShown}
      <p class="readout" aria-live="off">
        {say('run_readout', {
          trades: formatNumber(run.state.trades),
          share: formatNumber(run.state.share, { style: 'percent' }),
        })}
      </p>
    {/if}

    <!-- the two circles as controls, over the art: each clicked in Scene 3, handed coins in Scene 5 -->
    {#each PAIR as who (who)}
      {@const p = view.people[WHO[who]]}
      {@const r = Math.max(p.r, 30)}
      {#if current === indexOf(CALLS[who]) && !reader.named[who] && !stage?.isReleased(CALLS[who])}
        <button
          type="button"
          class="hit"
          style={`left:${p.x - r}px; top:${p.y - r}px; width:${r * 2}px; height:${r * 2}px;`}
          aria-label={say(who === 'blue' ? REACTIONS.callBlue[0] : REACTIONS.callRed[0])}
          onclick={() => name(who)}
        ></button>
      {:else if holding}
        <button
          type="button"
          class="hit coins"
          style={`left:${p.x - r}px; top:${p.y - r}px; width:${r * 2}px; height:${r * 2}px;`}
          aria-label={say('equal_give', { name: say(`name_${who}`), other: say(`name_${other(who)}`), count: reader.held[who] })}
          onclick={(e) => onKeyClick(e, who)}
          onpointerdown={(e) => dragStart(e, who)}
          onpointerup={dragEnd}
        ></button>
      {/if}
    {/each}

    <div class="bubbles" aria-live="polite">
      {#each said as bubble, i (bubble.id)}
        {@const place = placed[i]}
        {#if place}
          <Bubble
            id={bubble.id}
            text={bubble.text}
            speaker={bubble.who}
            name={bubble.who ? say(`name_${bubble.who}`) : ''}
            x={place.x}
            y={place.y}
            tail={place.tail}
            kind={bubble.kind}
            coin={bubble.coin}
            paper={bubble.paper}
            hidden={bubble.kind === 'paper' && bigPaper !== null}
            maxWidth={bubbleWidth}
            gone={place.gone}
            shown={bubble.id === reveal.id ? reveal.shown : Infinity}
            choices={bubble.choices}
            onsize={(w, h) => (sizes[bubble.id] = { w, h })}
            onrest={(on) => stage?.pause(on)}
            reduced={stage?.reduced ?? false}
          />
        {/if}
      {/each}
    </div>

    {#if bigPaper}
      <article class="big-paper" bind:this={bigEl} aria-hidden="true">
        <p class="big-masthead">{bigPaper.masthead}</p>
        <div class="big-spread">
          <svg class="big-photo" viewBox="-14 -14 28 28">
            <path d={svgShapePath(bigPaper.style.shape, 10)} fill={bigPaper.style.fill} stroke={bigPaper.style.stroke} stroke-width="1.4" />
          </svg>
          <div>
            <p class="big-headline">{bigPaper.text}</p>
            <p class="big-source">{bigPaper.source}</p>
          </div>
        </div>
      </article>
    {/if}

    <CardStack
      {cards}
      open={cardOpen}
      ontoggle={(id) => (cardOpen = id)}
      label={say('card_stack')}
      closeLabel={say('card_close')}
      onsize={(h) => (cardHeight = h)}
    />
  {/if}
</div>

<style>
  .pair-scene {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: var(--paper);
  }

  .art {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
  }

  .words {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    will-change: transform, opacity;
  }

  .teletype-slot {
    position: absolute;
    inset-block-start: 5%;
    inset-inline-start: clamp(1rem, 10%, 7rem);
    pointer-events: auto;
  }

  .title {
    position: absolute;
    inset-block-start: 21%;
    inset-inline: 0;
    display: flex;
    justify-content: center;
    align-items: baseline;
    gap: clamp(0.4rem, 1.4vw, 1.4rem);
    margin: 0;
    font-family: var(--font-serif);
    font-size: min(clamp(2.4rem, min(11.5vw, 19svh), 10rem), var(--title-max, 10rem));
    font-weight: 750;
    letter-spacing: -0.035em;
    line-height: 1.2;
    color: var(--ink-strong);
    white-space: nowrap;
    transform-origin: 50% 0;
  }

  .word.or {
    color: var(--accent);
    font-weight: 600;
  }

  .credit {
    position: absolute;
    inset-block-end: 3%;
    inset-inline-end: 5%;
    color: var(--ink-soft);
    font-family: var(--font-mono);
    font-size: 0.78rem;
    text-decoration-color: var(--line);
    pointer-events: auto;
  }

  .hit {
    position: absolute;
    z-index: 3;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: transparent;
    cursor: pointer;
    touch-action: none;
  }

  .hit.coins {
    cursor: grab;
  }

  .hit:focus-visible {
    outline: 2px dashed var(--accent);
    outline-offset: 3px;
  }

  /* in the top bar, beside the card deck: never under the talk */
  /* the morning paper as it lands: the headline is the news */
  .big-paper {
    position: absolute;
    z-index: 6;
    inset-block-start: 22%;
    left: calc(50% - min(17rem, 46vw));
    inline-size: min(34rem, 92vw);
    padding: 0.9rem 1.2rem 1rem;
    border: 1px solid #c9bca5;
    border-radius: 0.6rem;
    background: #fffdf8;
    box-shadow: 0 1.2rem 3rem rgb(65 50 29 / 24%);
    color: var(--ink);
    font-family: var(--font-serif);
    animation: land 520ms cubic-bezier(0.2, 1.3, 0.4, 1) both;
  }

  .big-masthead {
    margin: 0 0 0.6rem;
    padding-block-end: 0.4rem;
    border-block-end: 3px solid var(--ink);
    font-size: clamp(0.95rem, 1.6vw, 1.2rem);
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    text-align: center;
  }

  .big-spread {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .big-photo {
    flex: none;
    inline-size: clamp(4rem, 9vw, 6.5rem);
    block-size: clamp(4rem, 9vw, 6.5rem);
    padding: 0.35rem;
    border: 1px solid #d8cdb9;
    background: var(--paper-bright);
    transform: rotate(-3deg);
  }

  .big-headline {
    margin: 0;
    font-size: clamp(1.6rem, 3.4vw, 2.6rem);
    font-weight: 800;
    line-height: 1.05;
    letter-spacing: -0.01em;
  }

  .big-source {
    margin: 0.45rem 0 0;
    color: var(--ink-soft);
    font-family: var(--font-sans);
    font-size: clamp(0.78rem, 1.2vw, 0.9rem);
    line-height: 1.35;
  }

  @keyframes land {
    from {
      opacity: 0;
      transform: scale(1.25) rotate(-4deg);
    }
  }

  .readout {
    position: absolute;
    z-index: 3;
    inset-block-start: 1.05rem;
    inset-inline-start: 7.2rem;
    max-inline-size: calc(100% - 7.2rem - 8.5rem);
    margin: 0;
    line-height: 1.25;
    color: var(--ink-mid);
    font-family: var(--font-sans);
    font-size: 0.85rem;
    font-weight: 650;
    font-variant-numeric: tabular-nums;
  }

  .dragged {
    filter: drop-shadow(0 3px 4px rgb(40 37 31 / 25%));
  }

  .bubbles {
    position: absolute;
    inset: 0;
    z-index: 4;
    pointer-events: none;
  }

  .bubbles :global(.bubble) {
    pointer-events: auto;
  }
</style>
