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
  import { CALLS, PAIR_STEPS, REACTIONS, indexOf, panelStart, valuesFor, type Pose } from './script';
  import { BIG, BITES, CROWD, RAIN, RAINED, SMALL } from './crowd';
  import { deciderFace, pairLayout, pile } from './layout';
  import { bubbleLines, bubbleWords, chatColumn, stackChat, type BubbleChoice } from '../../bubbles';
  import {
    CLASSIC_AGENT_FILL,
    CLASSIC_AGENT_STROKE,
    PROTAGONISTS,
    spreadStyles,
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
  import { REVEAL_BETA } from '../../../shared/presets';
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
  /** How far the reel's words may reach, from where MATH starts to the stage's edge (unscaled px). */
  let reelRoom = $state(Infinity);

  function measureReel(): void {
    if (!mathReel || !host) return;
    const box = mathReel.getBoundingClientRect();
    const stage = host.getBoundingClientRect();
    const scale = 1 - view.compact * (1 - COMPACT);
    const reach = rtl ? box.right - stage.left : stage.right - box.left;
    reelRoom = Math.max(40, (reach - 16) / scale);
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
    people: Array.from({ length: CROWD }, () => ({ x: 0, y: 0, r: 0, alpha: 1, empty: 1 })) as Person[],
    /** The room's other ninety-eight (Scene 10), each on its way in or in place. */
    room: Array.from({ length: 100 }, () => ({ x: 0, y: 0, alpha: 0 })),
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
    payout: Array.from({ length: CROWD }, () => ({ x: 0, y: 0, on: 0, face: 'front' })) as Token[],
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
    return L.crowdHomes.map((home, i) => {
      const who = whoIs(i);
      switch (pose.crowd) {
        case 'away':
          return { ...L.crowdEntries[i], r: nobody, alpha: 1, empty: 1 };
        case 'idle':
          return { ...home, r: nobody, alpha: 1, empty: 1 };
        case 'paid':
          return RAINED[i] > 0 ? { ...home, r: L.radius(RAINED[i]), alpha: 1, empty: 0 } : { ...home, r: nobody, alpha: 1, empty: 1 };
        case 'bitten':
          if (!who) return { ...home, r: nobody, alpha: 1, empty: 1 };
          return { ...home, r: L.radius(who === 'blue' ? 15 : 1), alpha: 1, empty: 0 };
        default: {
          if (!who) return { ...L.crowdExits[i], r: nobody, alpha: 0, empty: 1 };
          const spot = pairSpot(pose, who);
          return { x: spot.x, y: spot.y, r: pairRadius(pose, who), alpha: 1, empty: 0 };
        }
      }
    });
  }

  /** The room's others: in place once the room has filled, off the stage before. */
  function roomPeople(pose: Pose) {
    const w = L.width;
    return L.room.positions.map((p, i) => {
      if (pose.place === 'room') return { x: p.x, y: p.y, alpha: 1 };
      const side = i % 3 === 0 ? { x: p.x, y: L.height + L.room.radius * 4 } : { x: p.x < w / 2 ? -L.room.radius * 4 : w + L.room.radius * 4, y: p.y };
      return { ...side, alpha: 0 };
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
    if (reveal.id !== PAIR_STEPS[index].id || reveal.shown >= reveal.total) return false;
    showAll(index);
    return true;
  }

  function readingTime(index: number): number {
    const step = PAIR_STEPS[index];
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

  // ---- the bubbles: one comic panel per topic --------------------------------

  interface Said {
    id: string;
    /** Whose colours the bubble wears; null for a circle not yet introduced. */
    who: Speaker | null;
    /** Which circle it points at; null for a logged event, which points at nobody. */
    at: Speaker | null;
    text: string;
    kind?: 'line' | 'event';
    /** An event's coin: the face that landed. */
    coin?: Speaker;
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
      if (step.log && (i < current || logReady)) {
        const logged = logFor(step.id, step.log, step.pose);
        if (logged) out.push(logged);
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

  /** What a finished step leaves in the talk: a toss's result, the reader's own answer. */
  function logFor(id: string, key: string, pose: Pose): Said | null {
    if (key === 'log_toss') {
      const winner: Speaker = pose.flip === 'blue' ? 'blue' : 'red';
      const text = say(key, { winner: say(`name_${winner}`), blue: pose.holdings.blue, red: pose.holdings.red });
      return { id: `log:${id}`, who: null, at: null, text, kind: 'event', coin: winner };
    }
    if (key === 'log_guess' && session.prediction) {
      const choice = say(REACTIONS.guesses[PREDICTIONS.findIndex((p) => p.id === session.prediction)]);
      return { id: `log:${id}`, who: null, at: null, text: say(key, { choice }), kind: 'event' };
    }
    if (key === 'log_bet' && session.bet) {
      const bet = say(REACTIONS.bets[BETS.indexOf(session.bet)]);
      return { id: `log:${id}`, who: null, at: null, text: say(key, { bet }), kind: 'event' };
    }
    return null;
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
  const titleFont = $derived(Math.min(160, Math.max(38.4, Math.min(width * 0.115, height * 0.19))));
  /** How small the title gets once they start talking. */
  const COMPACT = 0.4;

  /** The band the talk lives in: under the title (small by now), over the two. */
  const region = $derived.by(() => {
    const pose = poseAt(current);
    const top = pose.cleared ? height * 0.05 : height * 0.03 + titleFont * 1.2 * COMPACT + 12;
    const tops =
      pose.place === 'room'
        ? [L.room.top]
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
      case 'bites':
        bites(tl);
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

  /** A deterministic wobble per person, so every visit bounces the same way. */
  const jitter = (i: number, k: number) => {
    const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };

  /** Across to `to` in three hops, each lower than the last, landing where it belongs. */
  function bounce(tl: ReturnType<typeof gsap.timeline>, who: { x: number; y: number }, to: { x: number; y: number }, at: number, duration: number, height: number): void {
    tl.to(who, { x: to.x, duration, ease: 'none' }, at);
    const hops = [1, 0.42, 0.16];
    const piece = duration / (hops.length * 2);
    hops.forEach((k, n) => {
      const t = at + n * piece * 2;
      tl.to(who, { y: to.y - height * k, duration: piece, ease: 'power1.out' }, t);
      tl.to(who, { y: to.y, duration: piece, ease: 'power1.in' }, t + piece);
    });
  }

  /** Scene 2 begins: people bounce in from every side and settle where they like. */
  function arrive(tl: ReturnType<typeof gsap.timeline>): void {
    const hop = L.radius(1) * 1.4;
    view.people.forEach((person, i) => {
      tl.set(person, { ...L.crowdEntries[i], r: L.presence, empty: 1, alpha: 1 }, 0);
      bounce(tl, person, L.crowdHomes[i], 0.3 + jitter(i, 1) * 2.8, 1.1 + jitter(i, 2) * 0.5, hop);
    });
  }

  /** Sixteen coins pop out of the MATH reel and fall where they fall — some catch two, some none. */
  function payout(tl: ReturnType<typeof gsap.timeline>): void {
    const hostBox = host.getBoundingClientRect();
    const reelBox = mathReel.getBoundingClientRect();
    const from = { x: reelBox.left - hostBox.left + reelBox.width / 2, y: reelBox.top - hostBox.top + reelBox.height / 2 };
    const caught = new Array<number>(CROWD).fill(0);
    tl.to(view, { markOn: 1, duration: 0.5, ease: 'none' }, 0);
    RAIN.forEach((who, k) => {
      const token = view.payout[k];
      const person = view.people[who];
      const at = 0.15 + k * 0.19;
      caught[who] += 1;
      const r = L.radius(caught[who]);
      tl.set(token, { x: from.x, y: from.y, on: 1 }, at);
      tl.to(token, { x: L.crowdHomes[who].x, duration: 0.65, ease: 'power1.out' }, at);
      tl.to(token, { y: L.crowdHomes[who].y, duration: 0.65, ease: 'power2.in' }, at);
      tl.set(token, { on: 0 }, at + 0.65);
      tl.set(person, { empty: 0 }, at + 0.65);
      tl.to(person, { r, duration: 0.25, ease: 'back.out(3)' }, at + 0.65);
    });
  }

  /** The bumps, exactly as crowd.ts scripts them — the rule on every contact. */
  function bites(tl: ReturnType<typeof gsap.timeline>): void {
    const wealth = [...RAINED];
    for (let k = 0; k < BITES.length; k++) {
      const bite = BITES[k];
      const next = BITES[k + 1]?.at ?? bite.at + 0.4;
      const move = Math.min(0.22, (next - bite.at) * 0.55);
      const a = bite.a;
      const b = bite.b;
      const loser = bite.winner === a ? b : a;
      const ha = L.crowdHomes[a];
      const hb = L.crowdHomes[b];
      // they meet halfway, touch, and bounce back home
      const ra = L.radius(wealth[a]);
      const rb = L.radius(wealth[b]);
      const d = Math.hypot(hb.x - ha.x, hb.y - ha.y) || 1;
      const touch = Math.max(0, (d - ra - rb) / 2);
      const ux = (hb.x - ha.x) / d;
      const uy = (hb.y - ha.y) / d;
      tl.to(view.people[a], { x: ha.x + ux * touch, y: ha.y + uy * touch, duration: move, ease: 'power2.in' }, bite.at);
      tl.to(view.people[b], { x: hb.x - ux * touch, y: hb.y - uy * touch, duration: move, ease: 'power2.in' }, bite.at);
      tl.to(view.people[a], { x: ha.x, y: ha.y, duration: move * 1.4, ease: 'back.out(2)' }, bite.at + move);
      tl.to(view.people[b], { x: hb.x, y: hb.y, duration: move * 1.4, ease: 'back.out(2)' }, bite.at + move);
      for (const who of [a, b]) {
        const r = bite.after[who] > 0 ? L.radius(bite.after[who]) : L.presence;
        tl.to(view.people[who], { r, duration: move, ease: 'power1.out' }, bite.at + move * 0.8);
      }
      if (bite.absorbed === loser) tl.set(view.people[loser], { empty: 1 }, bite.at + move * 1.6);
      for (let i = 0; i < CROWD; i++) wealth[i] = bite.after[i];
    }
  }

  /** Everyone with nothing bounces off the stage; the two glide under their words. */
  function leave(pose: Pose, tl: ReturnType<typeof gsap.timeline>): void {
    const targets = people(pose);
    const hop = L.radius(1) * 1.2;
    view.people.forEach((person, i) => {
      if (whoIs(i)) {
        tl.to(person, { ...targets[i], duration: 1.3, ease: 'power2.inOut' }, 0.5);
        return;
      }
      const at = jitter(i, 3) * 0.9;
      bounce(tl, person, L.crowdExits[i], at, 1.2, hop);
      tl.to(person, { alpha: 0, duration: 0.3 }, at + 1.0);
    });
  }

  /**
   * Scene 10: the camera pulls back about the middle — the two shrink and keep
   * their places relative to each other — while ninety-eight people bounce in
   * one by one from every side (brief 3.6).
   */
  function fillRoom(pose: Pose, tl: ReturnType<typeof gsap.timeline>): void {
    const t = target(pose);
    tl.to(view, { roomOn: 1, coinsOn: t.coinsOn, flipOn: t.flipOn, duration: 0.3 }, 0);
    people(pose).forEach((p, i) => tl.to(view.people[i], { ...p, duration: 1.1, ease: 'power2.inOut' }, 0));
    const hop = L.room.radius * 2.2;
    L.room.positions.forEach((spot, i) => {
      if (i === L.room.blue || i === L.room.red) return;
      const at = 0.6 + (i / L.room.positions.length) * 2.4 + jitter(i, 4) * 0.25;
      tl.set(view.room[i], { alpha: 1 }, at);
      bounce(tl, view.room[i], spot, at, 0.8, hop);
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

  /** Breath for the pair, a hop and a jiggle for the crowd — ambient, on the inner group only. */
  function life(i: number): string {
    if (stage?.reduced) return '';
    const b = breath(seconds, i);
    const crowdPhase = PAIR_STEPS[current]?.pose.crowd;
    let hop = 0;
    if (crowdPhase === 'idle' || crowdPhase === 'paid') {
      const r = view.people[i].r;
      hop = Math.max(0, Math.sin(seconds * 2.1 + i * 1.3)) ** 6 * r * 0.9;
    }
    let shake = 0;
    if (wiggling && whoIs(i) === wiggling.who && seconds < wiggling.until) shake = Math.sin(seconds * 42) * 4;
    return `translate(${(b.dx + shake).toFixed(2)} ${(b.dy - hop).toFixed(2)}) scale(${(b.scale * pop(i)).toFixed(4)})`;
  }


  onMount(() => {
    const observer = new ResizeObserver(() => {
      width = host.clientWidth;
      height = host.clientHeight;
      measureReel();
      // a resize re-lays everything out: draw the current step where it now belongs
      if (!timeline || !timeline.isActive()) draw(poseAt(current));
    });
    width = host.clientWidth;
    height = host.clientHeight;
    observer.observe(host);
    stage?.attach(PAIR_STEPS, { play, settle, nudge, hurry, readingMs: readingTime });
    measureReel();
    void document.fonts?.ready.then(measureReel);
    recallAnswers();
    const stopAmbient = ambientClock((s) => (seconds = s), stage?.reduced ?? false);
    return () => {
      observer.disconnect();
      stopAmbient();
      stopMotion();
      stopCalls();
      stopReveal();
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
      aria-label={say('open_title')}
      style={`transform: translateY(${(-view.compact * height * 0.18).toFixed(1)}px) scale(${(1 - view.compact * (1 - COMPACT)).toFixed(3)})`}
    >
      <span class="word merit" style={`opacity:${view.meritOn}`} aria-hidden="true">{say('open_title_merit')}</span>
      <span class="word or" style={`opacity:${view.orOn}`} aria-hidden="true">{say('open_title_or')}</span>
      <span class="word math" bind:this={mathReel}>
        <Reel words={MATH_WORDS} answer={MATH_AT} position={view.mathPos} shown={view.mathOn} room={reelRoom} /><span
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
          {#each view.room as spot, i (i)}
            {#if i !== L.room.blue && i !== L.room.red && spot.alpha > 0.01 && roomStyles[i]}
              <path
                d={svgShapePath(roomStyles[i].shape, L.room.radius)}
                transform={`translate(${spot.x.toFixed(1)} ${spot.y.toFixed(1)})`}
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
            <g transform={life(i)}>
              <circle
                r={person.r}
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
        {/if}
      {/each}

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
    font-size: clamp(2.4rem, min(11.5vw, 19svh), 10rem);
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
