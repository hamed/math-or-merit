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
  import { getContext, onMount, tick, untrack, type Snippet } from 'svelte';
  import { gsap } from '../../gsap';
  import Bubble from '../../Bubble.svelte';
  import CardStack, { type Card, type CardLine } from '../../CardStack.svelte';
  import TimePlayer from '../../TimePlayer.svelte';
  import Coin from '../Coin.svelte';
  import Reel from './Reel.svelte';
  import Teletype from './Teletype.svelte';
  import { STEP_STAGE_CONTEXT, type Speaker, type StepStageContext } from '../../steps';
  import {
    CALLS,
    CARDS,
    HEADLINE,
    JOKE_SKIP,
    MAP_LABEL,
    NUDGE_MS,
    PAIR_STEPS,
    PRESENT_MS,
    REACTIONS,
    REEL,
    REEL_ANSWER,
    reelSpin,
    START,
    actEnd,
    RUN_MS,
    indexOf,
    levyLesson,
    panelStart,
    readFor,
    valuesFor,
    type MatchedValue,
    type Pose,
    type RoomMode,
    type RoomSource,
  } from './script';
  import { DEFAULT_RUN, type RunSettings } from './recording';
  import { MAP_LEVIES, MAP_PARTICIPANTS, MAP_STAKES } from './outcomeMap';
  import { GAME, nextClosureDuration, type GameResult } from './taxGame';
  import { GINI_RAMP } from '../../../shared/presets';
  import { effectiveCount, imaginedShares, line, piles, ruler, type Tick } from './roomPoses';
  import { toDollars } from '../../../distribution/binning';
  import Histogram from '../../../sandbox/Histogram.svelte';
  import LorenzPlot from '../../../sandbox/LorenzPlot.svelte';
  import { compactNumber, niceLinearTicks } from '../../../sandbox/ticks';
  import StageAxes from './StageAxes.svelte';
  import TurnoverPlot from './TurnoverPlot.svelte';
  import StopSlider, { RATE_STOPS } from '../../../sandbox/StopSlider.svelte';
  import { createRun } from './run.svelte';
  import { BIG, BLUE_CATCHES, COINS, CROWD, RAINED, RED_CATCHES, SMALL, START as CROWD_START } from './crowd';
  import { GATHER_SECONDS, noise, planArrival, planRain } from './rain';
  import { OUT_SCALE, ROUND_STAKE, planRounds, windowTimes } from './roomRounds';
  import { CROSSING, FALL, RISE, arrival, fallTime, gravity, hopsBy, squashed, type Hop } from './hops';
  import { titleFeet } from './titleFeet';
  import { deciderFace, pairLayout, pile } from './layout';
  import type { Point } from '../../../shared/layout';
  import { bubbleLines, bubbleWords, chatColumn, stackChat, talkSpan, type BubbleChoice } from '../../bubbles';
  import {
    CLASSIC_AGENT_FILL,
    CLASSIC_AGENT_STROKE,
    PROTAGONISTS,
    headlineForStyle,
    spreadStyles,
    styleNoun,
    type AgentShape,
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
  import { START_DOLLARS } from '../../../shared/presets';
  import { loadTuning, runSettings, tuning } from './tuning.svelte';
  import DebugPanel from './DebugPanel.svelte';
  import { collectStats, frontPageFor } from '../../../sandbox/newsroom';
  import { fitSquareRelationship, measureWealth } from '$lib/research';
  import { goToStep, openBranch } from '../../branch';
  import { PICTURES as POSTED } from '../cast/pictures';
  import AgentFace from '../../../shared/face/AgentFace.svelte';
  import { GROUND, drawStill } from '../../../shared/face/draw';
  import { faceRadius } from '../../../shared/face/face';
  import { FaceBoard, type FaceColours } from '../../../shared/face/faceElement';
  import { CONTEMPT, stillOf, type Affect } from '../../../shared/face/moments';
  import { photoMood } from '../../../shared/face/field';
  import { FACE_CHOICES, chooseFace, faceStyle, loadFaceStyle, type FaceChoice } from '../../../shared/face/faceStyle.svelte';
  import { StageFaces, talkSeconds, type Body, type FaceScene, type HeldLine, type TitleCue } from './stageFaces';

  const stage = getContext<StepStageContext | undefined>(STEP_STAGE_CONTEXT);

  const SOURCE_URL =
    'https://www.investing.com/news/stock-market-news/spacex-ipo-makes-elon-musk-worlds-first-trillionaire-4741087';
  const CREDIT_URL = 'https://github.com/hamed';

  /** The reel's words, as the script lists them under \reveal{math}. */
  const MATH_WORDS = REEL.map((key) => say(key));
  /** The reel lands third from last, with two wrong words after it to overshoot onto. */
  const MATH_AT = REEL_ANSWER;

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
  /** The reel's words, px wide at the title's size (Reel.svelte measures them). */
  let reelWidths: readonly number[] = [];
  /** The space between the title's words, em: its CSS `gap`. */
  const TITLE_GAP = 0.16;
  /**
   * The title's words, in em of its own size: MERIT, OR, MATH with its mark,
   * and each of the reel's words. Everything in the title scales together, so
   * one measurement at any size sizes it (`titleFit`).
   */
  let titleEm = $state<{ merit: number; or: number; math: number; reel: readonly number[] }>({ merit: 0, or: 0, math: 0, reel: [] });

  function measureTitle(): void {
    if (!titleEl || !mathReel || !reelWidths.length) return;
    const size = parseFloat(getComputedStyle(titleEl).fontSize);
    const em = (el: HTMLElement | null) => (el?.offsetWidth ?? 0) / size;
    const next = {
      merit: em(titleEl.querySelector<HTMLElement>('.word.merit')),
      or: em(titleEl.querySelector<HTMLElement>('.word.or')),
      // the reel holds the answer's width; the mark follows it
      math: em(mathReel.querySelector<HTMLElement>('.reel')) + em(mathReel.querySelector<HTMLElement>('.mark')),
      reel: reelWidths.map((w) => w / size),
    };
    // measured again at every size the title takes: only a new face changes the answer
    const near = (a: number, b: number) => Math.abs(a - b) < 0.02;
    const same =
      near(next.merit, titleEm.merit) &&
      near(next.or, titleEm.or) &&
      near(next.math, titleEm.math) &&
      next.reel.length === titleEm.reel.length &&
      next.reel.every((w, i) => near(w, titleEm.reel[i]));
    if (!same) titleEm = next;
  }

  /**
   * How big the title is, and how it stands (owner, 2026-10-07: "as big as
   * possible"). On one line it is as wide as the stage allows with the reel's
   * widest word in place — the line slides aside while that word spins past
   * (`spin`) — and no taller than leaves the crowd its room. On a narrow stage,
   * when that is bigger, it stands on two lines, MERIT OR over MATH, and only
   * the lower line slides.
   */
  const titleFit = $derived.by(() => {
    const e = titleEm;
    if (!e.reel.length || !width || !height) return null;
    const room = width - 32;
    const widest = Math.max(...e.reel);
    const start = e.merit + e.or + 2 * TITLE_GAP;
    const one = Math.min(height * 0.2, room / Math.max(start + e.math, start + widest));
    const two = Math.min(height * 0.1, room / Math.max(e.merit + TITLE_GAP + e.or, e.math, widest));
    return two > one * 1.2 ? { size: two, lines: 2 } : { size: one, lines: 1 };
  });

  /** The title's line slid `em` toward its start, away from the reel's long words. */
  const slideX = (em: number) => (em ? `translateX(${((rtl ? 1 : -1) * em).toFixed(3)}em) ` : '');

  /** How far, em, the title's line slides aside so the reel's word `i` — or a wider one before it — stays on the stage. */
  function titleShift(i: number): number {
    const shown = Math.max(0, ...titleEm.reel.slice(0, i + 1));
    return Math.max(0, shown - titleEm.math) / 2;
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
    /**
     * Squash and stretch, about the point where they touch the ground: e^q
     * wide, e^−q tall (hops.ts `squashed`). One number, tweened, so the area
     * holds at every frame of a squash, not only at its ends.
     */
    q: number;
  }
  interface Token {
    x: number;
    y: number;
    on: number;
    face: 'front' | 'back';
    /** Its radius, px, when not the pair's coin: the room's rounds play at the room's scale. */
    r?: number;
  }

  const view = $state({
    type: 0,
    meritOn: 0,
    orOn: 0,
    mathOn: 0,
    mathPos: 0,
    /** How far the title's line has slid aside for a long word on the reel, em. */
    titleSlide: 0,
    markOn: 0,
    compact: 0,
    titleOn: 1,
    lift: 0,
    people: Array.from({ length: CROWD }, () => ({ x: 0, y: 0, r: 0, alpha: 1, empty: 1, q: 0 })) as Person[],
    /** The room's other ninety-eight (Scene 10), each on its way in or in place. */
    room: Array.from({ length: 100 }, () => ({ x: 0, y: 0, r: 0, alpha: 0, q: 0, empty: 0 })),
    /** How much of the turnover chart is drawn, 0–1 (Scene 18). */
    turnDraw: 0,
    /** How much of the Lorenz curve is drawn, 0–1 (Scene 16's walk). */
    lorenzDraw: 0,
    /** Scene 23's mirror room, 0–1, and how far its copy has slid out of the room, 0–1. */
    mirrorOn: 0,
    mirrorShift: 1,
    /** How much of Scene 24's map has filled in, 0–1. */
    mapOn: 0,
    /** The ruler's marks, keyed so a decade slides from the ordinary ruler to the multiplying one. */
    ticks: {} as Record<string, { x: number; alpha: number }>,
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
    /** Where the decider is tossed when it is not at the pair's table, and how big it is there: the room's demonstration rounds. */
    flipAt: null as Point | null,
    flipR: 0,
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
    // whoever has not been clicked yet is still waiting
    const callers = callersOf(step.id);
    if (!callers.length) return step.pose;
    const named = { ...step.pose.named };
    for (const who of callers) named[who] = reader.named[who];
    return { ...step.pose, named };
  }

  function pairSpot(pose: Pose, who: Speaker) {
    if (pose.place === 'room') return modeTarget(pose.roomMode, who === 'blue' ? L.room.blue : L.room.red, pose.source);
    if (pose.place === 'seats') return who === 'blue' ? L.seatBlue : L.seatRed;
    return who === 'blue' ? L.markBlue : L.markRed;
  }

  function pairRadius(pose: Pose, who: Speaker): number {
    if (pose.place === 'room') return modeTarget(pose.roomMode, who === 'blue' ? L.room.blue : L.room.red, pose.source).r;
    return Math.max(L.minRadius, L.radius(pose.holdings[who]));
  }

  /** Where each of the sixteen is, and how big, in a pose. */
  function people(pose: Pose): Person[] {
    const nobody = L.presence;
    const still = { alpha: 1, q: 0 };
    return L.crowdHomes.map((home, i) => {
      const who = whoIs(i);
      switch (pose.crowd) {
        // plain circles from the start, already different sizes (owner review 2026-09-27)
        case 'away':
          return { ...L.crowdEntries[i], r: L.radius(CROWD_START[i]), empty: 0, ...still };
        case 'idle':
          return { ...home, r: L.radius(CROWD_START[i]), empty: 0, ...still };
        case 'paid': {
          const at = rainPlan.finals[i] ?? home;
          return { x: at.x, y: at.y, r: L.radius(RAINED[i]), empty: 0, ...still };
        }
        default: {
          if (!who) return { ...L.crowdExits[i], r: L.radius(RAINED[i]), empty: 0, ...still, alpha: 0 };
          const spot = pairSpot(pose, who);
          // in the line, the two are eaten by the walk's circle like everyone else
          const alpha = pose.place === 'room' && pose.roomMode === 'line' ? (spot as { alpha?: number }).alpha ?? 1 : 1;
          return { x: spot.x, y: spot.y, r: pairRadius(pose, who), empty: 0, ...still, alpha };
        }
      }
    });
  }

  /** The room's others: in place once the room has filled, off the stage before. */
  function roomPeople(pose: Pose) {
    const w = L.width;
    return L.room.positions.map((p, i) => {
      if (pose.place === 'room') {
        const t = modeTarget(pose.roomMode, i, pose.source);
        return { x: t.x, y: t.y, r: t.r, alpha: t.alpha, q: 0, empty: t.empty ? 1 : 0 };
      }
      return { x: p.x < w / 2 ? -L.room.radius * 4 : w + L.room.radius * 4, y: p.y, r: L.room.radius, alpha: 0, q: 0 };
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
      titleSlide: 0,
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
      // in its colours once it has been shown (round one); plain before
      flipTint: pose.flip !== 'hidden' && pose.presented ? 1 : 0,
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
    // a step cut short still lands its results on the faces
    for (const feel of [...unfelt]) feel();
  }

  /** Results waiting on a playing timeline: a step cut short lands them at once (`stopMotion`). */
  const unfelt = new Set<() => void>();
  function feelAt(tl: ReturnType<typeof gsap.timeline>, at: number, feel: () => void): void {
    const once = () => {
      if (unfelt.delete(once)) feel();
    };
    unfelt.add(once);
    tl.call(once, [], at);
  }

  /** Draw a pose at once. */
  function draw(pose: Pose): void {
    view.lorenzDraw = pose.roomMode === 'line' && pose.lorenz >= 1 ? 1 : 0;
    const t = target(pose);
    view.type = t.type;
    view.meritOn = t.meritOn;
    view.orOn = t.orOn;
    view.mathOn = t.mathOn;
    view.mathPos = t.mathPos;
    view.titleSlide = t.titleSlide;
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
    view.flipAt = null;
    view.flipR = 0;
    view.roomOn = t.roomOn;
    // the decider rests once a pose is drawn; a toss playing lifts it
    cue.air = false;
    people(pose).forEach((p, i) => Object.assign(view.people[i], p));
    roomPeople(pose).forEach((p, i) => Object.assign(view.room[i], p));
    view.ticks = Object.fromEntries(ticksFor(pose.roomMode).map((t) => [t.key, { x: t.x, alpha: t.shown ? 1 : 0 }]));
    view.lorenzDraw = pose.roomMode === 'line' && pose.lorenz >= 1 ? 1 : 0;
    view.turnDraw = pose.roomMode === 'turnover' ? 1 : 0;
    view.mirrorOn = pose.roomMode === 'matched' ? 1 : 0;
    view.mirrorShift = 1;
    view.mapOn = pose.map > 0 ? 1 : 0;
  }

  // ---- the player's verbs ----------------------------------------------------

  let current = $state(0);

  function settle(index: number): void {
    current = index;
    titleCue = null;
    hush = false;
    placeDial(index, false);
    stopMotion();
    stopCalls();
    reaction = null;
    logReady = true;
    cardOpen = cardsPop ? PAIR_STEPS[index].pose.cardOpen : null;
    stopBanter();
    banterShown = Infinity;
    dropPaper();
    arranging = false;
    cardPlaying = null;
    fourPick = null;
    if (PAIR_STEPS[index].id === 'eff.try') fourCoins = [4, 4, 4, 4];
    prepareRooms(index, false);
    levyView = levyLesson(PAIR_STEPS[index].pose.levy);
    draw(poseAt(index));
    settleWindow(index);
    showAll(index);
    enter(index);
    settleFaces();
  }

  function play(index: number, from: number): void {
    current = index;
    stopMotion();
    stopCalls();
    reaction = null;
    if (from >= 0) {
      levyView = levyLesson(PAIR_STEPS[from].pose.levy);
      draw(poseAt(from));
    } else draw(START); // a fresh stage plays its first step from nothing
    const step = PAIR_STEPS[index];
    const pose = poseAt(index);
    logReady = !step.log;
    cardOpen = cardsPop ? step.pose.cardOpen : null;
    stopBanter();
    banterShown = Infinity;
    dropPaper();
    arranging = false;
    cardPlaying = null;
    fourPick = null;
    if (step.id === 'eff.try') fourCoins = [4, 4, 4, 4];
    hush = false;
    placeDial(index, true);
    if (step.action === 'run' && stage?.reduced) {
      run.start();
      run.finish();
      logReady = true;
    }
    prepareRooms(index, true);
    if (step.action !== 'coins') levyView = levyLesson(step.pose.levy);
    if (step.id === 'run.banter') playBanter();
    timeline = gsap.timeline();
    if (step.action === 'run' && !stage?.reduced) {
      // no talk over a running room: it fades first, the run starts, and its result brings the talk back
      hush = true;
      feelAt(timeline, RUN_HUSH, () =>
        run.start(() => {
          hush = false;
          logReady = true;
          printPaper();
        }),
      );
    }
    choreograph(step.action, pose, timeline);
    revealLines(index);
    enter(index);
  }

  function nudge(index: number): void {
    const id = PAIR_STEPS[index].id;
    // a press while they call brings the next line at once, from whoever's turn it is
    if (callersOf(id).length) callTurn();
    if (id === 'equal') wiggle('blue');
  }

  function hurry(index: number): boolean {
    const id = PAIR_STEPS[index].id;
    if (bigPaper && paperTimer !== undefined) {
      shrinkPaper();
      return true;
    }
    // a press while a room plays is not a skip (owner, 2026-10-09: "a wrong click
    // or scroll misses a part, for example skips the simulation"): it shows the
    // Skip button, which is
    if (playing().length > 0) {
      skipCalled++;
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

  /** The rooms playing by themselves right now (never the live game: that one is the reader's). */
  const playing = () => [run, dialRun, leftRun, rightRun].filter((r) => r.state.running);
  /** Counts the presses a run swallowed: each one draws the eye to Skip. */
  let skipCalled = $state(0);
  /** The reader asked to see the end: every room still playing finishes. */
  function skipRuns(): void {
    playing().forEach((r) => r.finish());
  }

  /** A picture posted in the talk takes about this long to look at, ms. */
  const PICTURE_MS = 2500;
  /** How long a bubble stays before the talk moves on: its words, a beat for each line after the first, a look at each picture, and its own pause. */
  const readOf = (b: { text: string; pauseMs?: number; pictures?: readonly string[] }) => readFor(bubbleWords(b.text)) + Math.max(0, bubbleLines(b.text).length - 1) * LINE_BEAT_MS + (b.pictures?.length ?? 0) * PICTURE_MS + (b.pauseMs ?? 0);
  /** What a line brings with it onto the bubble that says it: its `\\pause`, its pictures. */
  const withPause = (line: { pauseMs?: number; pictures?: readonly string[] }) => ({
    ...(line.pauseMs ? { pauseMs: line.pauseMs } : {}),
    ...(line.pictures?.length ? { pictures: line.pictures } : {}),
  });

  /** How long step `index` stays, ms, when it moves on by itself: what it says, and the step's own `\\pause` after. */
  function readingTime(index: number): number {
    const step = PAIR_STEPS[index];
    const pause = step.pauseMs ?? 0;
    if (step.id === 'run') return RUN_HUSH * 1000 + Math.max(1500, tuning.runMs) + 5500 + pause;
    if (step.id === 'run.banter') return banterLines().reduce((sum, line) => sum + readOf(line), 0) + pause;
    const concept = conceptLine(step.id);
    if (concept) return readOf(concept) + pause;
    const bet = step.id === 'guess.react' && session.bet ? REACTIONS.betLines[session.bet] : null;
    if (bet) return readOf({ text: say(bet.message), ...withPause(bet) }) + pause;
    if (step.id === 'why.after') {
      const line = run.state.finished > 1 ? REACTIONS.whyAgain : REACTIONS.whyAfter;
      return readOf({ text: say(line.message), ...withPause(line) }) + pause;
    }
    const line = step.lines?.[0];
    // words read, and the step's action played out, whichever is longer
    const played = (step.actionMs ?? 0) + tossHang(index) * 1000;
    if (!line) return Math.max(readOf({ text: '' }), played) + pause;
    return Math.max(readOf({ text: say(line.message, valuesOf(step)), pictures: step.pictures }), played) + pause;
  }

  /** Things a step starts that are not tweens: the calls, the coin mover. */
  function enter(index: number): void {
    const id = PAIR_STEPS[index].id;
    if (callersOf(id).length && !stage?.isReleased(id)) startCalls(callersOf(id));
    if (id === 'equal' && !stage?.isReleased('equal')) reacted = { first: false, eleven: false, over: false };
  }

  // ---- Scenes 19–23: the reader's own rooms -------------------------------------

  /**
   * Every room a step shows, made ready: the run of Scene 13 rebuilt, the
   * reader's own rooms as they were left — or, on the way into their scene,
   * emptied to everyone equal before the new one starts.
   */
  function prepareRooms(index: number, animate: boolean): void {
    const step = PAIR_STEPS[index];
    const pose = step.pose;
    const entering = animate ? step.action : undefined;
    if (entering !== 'run') {
      if (pose.ran) run.ended();
      else run.clear();
    }
    // the game ends when the reader leaves its step: nothing is locked behind winning
    if (game.playing && step.id !== 'stop.how') endGame(null);
    if (pose.source === 'dial') {
      if (entering === 'dial') dialRun.clear();
      else dialRun.ended();
    }
    if (pose.source === 'game' && entering === 'game') {
      gameRun.clear();
      game.result = null;
    }
    if (pose.source === 'sandbox' && entering === 'room') {
      sandboxRun.clear();
      sandboxPapers = [];
    }
    if (pose.source !== 'sandbox' && sandboxRun.isLive()) sandboxRun.pause();
    if (pose.source === 'pair') {
      if (entering === 'match') {
        leftRun.clear();
        rightRun.clear();
      } else if (!leftRun.recording() || !rightRun.recording()) startMatch(true);
    }
  }

  /** Scene 19: the same room, played on with fresh dice, ten times closer to one owner each time. */
  let longers = $state(0);
  function runLonger(): void {
    const rec = run.recording();
    if (!rec || run.state.running) return;
    const share = run.state.share;
    const more: RunSettings = { ...rec.settings, stop: { kind: 'share', share: Math.min(0.9999, 1 - (1 - share) / 10) }, cap: 400_000 };
    run.longer(more, 7_000, () => longers++);
    if (stage?.reduced) run.finish();
  }

  /** Scene 20: every turn of the dial rolls a fresh room at that stake and plays it. */
  function turnDial(stake: number): void {
    dialStake = stake;
    dialThumb = stake;
    dialRun.start(undefined, undefined, DIAL_MS);
    if (stage?.reduced) dialRun.finish();
  }

  /** The sandbox's slider, stop by stop: the room restarts once the hand rests. */
  let dialTimer: number | undefined;
  function nudgeDial(stake: number): void {
    dialThumb = stake;
    if (dialTimer !== undefined) window.clearTimeout(dialTimer);
    dialTimer = window.setTimeout(() => {
      turnDial(stake);
      dockDial();
    }, 250);
  }

  /**
   * Scene 20's dial (owner, 2026-10-07): Red hands it over in her bubble; once
   * the reader has turned it, or has had the time to read the bubble, it moves
   * out of the room's way — to the charts' column, or on a phone to the rail at
   * the foot — gliding from where it was. Never from under a hand still on it.
   */
  let dialDocked = $state(true);
  let dockTimer: number | undefined;
  let dialHeld = false;
  let dockPending = false;
  const dialHere = $derived(PAIR_STEPS[current].pose.source === 'dial' && (PAIR_STEPS[current].pose.control !== 'stake' || dialDocked));

  function dockDial(): void {
    if (dialDocked) return;
    if (dialHeld) {
      dockPending = true;
      return;
    }
    const from = host?.querySelector('.bubble .stake-dial')?.getBoundingClientRect();
    dialDocked = true;
    if (!from || stage?.reduced) return;
    void tick().then(() => {
      const el = host?.querySelector<HTMLElement>('.stake-dial');
      const to = el?.getBoundingClientRect();
      if (!el || !to) return;
      el.animate([{ transform: `translate(${from.x - to.x}px, ${from.y - to.y}px)` }, { transform: 'none' }], {
        duration: 700,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      });
    });
  }

  function releaseDial(): void {
    dialHeld = false;
    if (dockPending) {
      dockPending = false;
      dockDial();
    }
  }

  /** Where the dial starts as step `index` begins: in Red's bubble only as she hands it over. */
  function placeDial(index: number, playing: boolean): void {
    window.clearTimeout(dockTimer);
    dockPending = false;
    dialDocked = !(playing && PAIR_STEPS[index].action === 'dial');
    if (!dialDocked) dockTimer = window.setTimeout(dockDial, readingTime(index));
  }

  /** A stake the way the sandbox writes it: 0.1%, 25%, 99.99%. */
  const stakeLabel = (v: number) => `${formatNumber(Number((v * 100).toPrecision(4)))}%`;

  /** Scene 23: both rooms on one seed, played side by side. */
  function startMatch(atOnce = false): void {
    const seed = Math.floor(Math.random() * 0xffff_ffff);
    leftRun.start(undefined, seed);
    rightRun.start(undefined, seed);
    if (atOnce || stage?.reduced) {
      leftRun.finish();
      rightRun.finish();
    }
  }

  /** Scene 23's mirror room at the moment on screen. */
  const mirror = $derived.by(() => {
    void rightRun.state.revision;
    return { wealth: rightRun.wealth(), sized: rightRun.state.running || rightRun.state.done };
  });

  /** Scene 23: how many still count in each room, at the moment on screen. */
  const matchCounts = $derived.by(() => {
    void leftRun.state.revision;
    void rightRun.state.revision;
    const a = measureWealth(leftRun.wealth()).effectiveParticipants;
    const b = measureWealth(rightRun.wealth()).effectiveParticipants;
    const whole = (x: number) => formatNumber(x, { maximumFractionDigits: 0 });
    return { a: whole(a), b: whole(b) };
  });

  /** Scene 21: the game's clock, the reader's taps, and how it went. */
  const game = $state({ playing: false, elapsed: 0, below: 0, taps: 0, round: 0, result: null as GameResult | null });

  function startGame(): void {
    game.playing = true;
    game.elapsed = 0;
    game.below = 0;
    game.taps = 0;
    game.result = null;
    game.round++;
    gameRun.live(GAME.perSecond, (dt) => {
      game.elapsed += dt;
      const count = measureWealth(gameRun.wealth()).effectiveParticipants;
      game.below = nextClosureDuration(game.below, count, dt, GAME.target);
      if (game.below >= GAME.closeAfterMs) endGame({ won: false, seconds: Math.round(game.elapsed / 1000), taps: game.taps });
      else if (game.elapsed >= GAME.seconds * 1000) endGame({ won: true, count: Math.round(count) });
    });
  }

  function endGame(result: GameResult | null): void {
    game.playing = false;
    game.result = result;
    gameRun.endLive();
  }

  /** A tap on a fortune: in the game, a quarter of it into the pool, shared back by everyone; in the machine, whatever the reader chose. */
  function tapRoom(i: number): void {
    if (PAIR_STEPS[current].pose.control === 'sandbox') {
      if (sb.tap === 'photo') {
        photograph(i);
        return;
      }
      if (!sandboxRun.isLive()) return;
      sandboxRun.take(i, sb.take);
    } else {
      if (!game.playing) return;
      gameRun.take(i, GAME.rate);
      game.taps++;
    }
    if (stage?.reduced) return;
    const v = agentView(i);
    const id = ++rippleId;
    ripples = [...ripples, { id, x: v.x, y: v.y, r: Math.max(v.r, 6), ink: styleOfRoom(i).stroke }];
    window.setTimeout(() => (ripples = ripples.filter((q) => q.id !== id)), 1500);
    // the tax game shows what a tap does (owner, 2026-10-09: "the tax, easy to miss"): a quarter
    // leaves the fortune, and the pool goes back to everyone — a ring across the whole room
    if (PAIR_STEPS[current].pose.control === 'tax') {
      const box = L.room.box;
      taken = [...taken, { id, x: v.x, y: v.y - Math.max(v.r, 6) - 6 }];
      returns = [...returns, { id, x: box.x + box.w / 2, y: box.y + box.h / 2, r: Math.hypot(box.w, box.h) / 2 }];
      window.setTimeout(() => {
        taken = taken.filter((q) => q.id !== id);
        returns = returns.filter((q) => q.id !== id);
      }, 1400);
    }
  }

  /** The fortune under a finger: the circle it lands in, or the nearest within a few pixels. */
  function tapAt(event: PointerEvent): void {
    const p = local(event);
    let best = -1;
    let bestD = 14;
    for (let i = 0; i < L.room.positions.length; i++) {
      const v = agentView(i);
      const d = Math.hypot(p.x - v.x, p.y - v.y) - v.r;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    if (best >= 0) tapRoom(best);
  }

  /** Where a tap lands: the game, or the reader's machine. */
  const tapping = $derived((game.playing && current === indexOf('stop.how')) || PAIR_STEPS[current].pose.control === 'sandbox');

  /** The five largest fortunes, as buttons for the keyboard. */
  const topFive = $derived.by(() => {
    void shown.state.revision;
    const w = shown.wealth();
    return Array.from(w.keys())
      .sort((a, b) => w[b] - w[a])
      .slice(0, 5);
  });

  /** Scene 22: a quarter of every pile flies to the pool, or the pool flies back, a coin at a time. */
  function levyCoins(pose: Pose, tl: Timeline): void {
    const before = levyLesson(pose.levy === 2 ? 1 : 0);
    const after = levyLesson(pose.levy);
    levyView = { coins: [...before.coins], pool: before.pool };
    const pool = poolSpot();
    const out = pose.levy === 1;
    // one token per coin that moves, handed to the view first: the view draws its own copies
    const flights: { k: number; c: number }[] = [];
    cast.four.forEach((_, k) => {
      const moves = Math.abs(after.coins[k] - before.coins[k]);
      for (let c = 0; c < moves; c++) flights.push({ k, c });
    });
    view.fly = flights.map(({ k, c }) => {
      const home = fourSpot(k);
      return { x: out ? home.x : pool.x, y: out ? home.y : pool.y, on: 0, face: c % 2 ? 'back' : 'front' } as Token;
    });
    let t = 0.3;
    let n = 0;
    cast.four.forEach((agent, k) => {
      const moves = Math.abs(after.coins[k] - before.coins[k]);
      for (let c = 0; c < moves; c++) {
        const home = fourSpot(k);
        const token = view.fly[n++];
        const at = t;
        tl.call(
          () => {
            token.on = 1;
            if (out) levyView.coins[k] -= 1;
            else levyView.pool -= 1;
          },
          [],
          at,
        );
        tl.to(token, { x: out ? pool.x : home.x, y: out ? pool.y : home.y, duration: 0.55, ease: 'power2.inOut' }, at);
        tl.call(
          () => {
            token.on = 0;
            if (out) levyView.pool += 1;
            else levyView.coins[k] += 1;
          },
          [],
          at + 0.55,
        );
        t += 0.16;
      }
      t += 0.2;
    });
    // each circle follows its coins
    cast.four.forEach((agent, k) => {
      tl.to(agentView(agent), { r: L.radius(after.coins[k]), duration: Math.max(0.6, t - 0.3), ease: 'power1.inOut' }, 0.3);
    });
    tl.call(() => (levyView = after), [], t + 0.6);
  }

  // ---- Scene 13: the run --------------------------------------------------------

  /** The room of a hundred, played for real: unseeded, as the reveal always was. */
  const run = createRun(
    () => runSettings(100, START_DOLLARS),
    () => tuning.runMs,
  );
  void RUN_MS;
  const ROOM_TOTAL_DOLLARS = 100 * START_DOLLARS;
  type Run = typeof run;

  /** The reader's own rooms after it: fresh luck each time, never remembered, never logged. */
  const OWN = { remember: false, log: false };
  const fixed = (beta: number, trades: number, levy = 0): RunSettings => ({
    n: 100,
    beta,
    stop: { kind: 'trades', trades },
    cap: trades,
    levy,
  });

  /**
   * Scene 20: a fresh room at the reader's stake, the same length every time:
   * at the essay's tenth, 250,000 trades leave about five effective
   * participants and the richest near a third (40 seeds), as 40,000 did at a
   * quarter.
   */
  const DIAL_TRADES = 250_000;
  const DIAL_MS = 5_000;
  let dialStake = $state(DEFAULT_RUN.beta);
  /** Where the dial's thumb is while it is being dragged. */
  let dialThumb = $state(DEFAULT_RUN.beta);
  const dialRun = createRun(() => fixed(dialStake, DIAL_TRADES), () => DIAL_MS, OWN);

  /** Scene 21: the room trades live; the game's own clock ends it. */
  const gameRun = createRun(() => fixed(GAME.beta, 10_000_000), () => 0, OWN);

  /**
   * Scene 23: one seed, twice — trades only, and trades with a levy shared
   * back. At the essay's tenth over 375,000 trades a 0.3% levy leaves about 4
   * against about 41 still counting (40 seeds) — at a quarter it took 60,000
   * trades and 2%: two-fifths the stake, about a seventh of the levy.
   */
  const MATCH_TRADES = 375_000;
  const MATCH_LEVY = 0.003;
  const MATCH_MS = 7_000;
  const leftRun = createRun(() => fixed(DEFAULT_RUN.beta, MATCH_TRADES), () => MATCH_MS, OWN);
  const rightRun = createRun(() => fixed(DEFAULT_RUN.beta, MATCH_TRADES, MATCH_LEVY), () => MATCH_MS, OWN);
  const anyRunning = $derived(run.state.running || dialRun.state.running || leftRun.state.running || rightRun.state.running);

  /**
   * Scene 26: the reader's machine — the sandbox's dials, on the same room,
   * with Blue and Red in it (brief 5.10). It trades live while played, and
   * rewinds like any run when paused.
   */
  const SPEEDS = [1, 4, 16];
  const PER_SPEED = 250;
  const EVERY_STOPS = [1, 2, 5, 10, 20, 50, 100];
  const sb = $state({ stake: DEFAULT_RUN.beta, levy: 0, every: 1, speed: 4, tap: 'levy' as 'levy' | 'photo', take: 0.25 });
  const sandboxRun = createRun(
    () => ({ n: 100, beta: sb.stake, stop: { kind: 'trades', trades: 2_000_000 }, cap: 2_000_000, levy: sb.levy, levyEvery: sb.every }),
    () => 0,
    { remember: false, log: false, pace: sb.speed * PER_SPEED },
  );
  // a dial turned while the room trades plays from the next trade on
  $effect(() => {
    sandboxRun.setRules({ beta: sb.stake, levy: sb.levy, levyEvery: sb.every });
    sandboxRun.setPace(sb.speed * PER_SPEED);
  });

  /** Play: a fresh room goes live; a paused one plays on from where it stands. */
  function sandboxPlay(): void {
    if (sandboxRun.isLive()) return;
    if (!sandboxRun.recording()) sandboxRun.live(sb.speed * PER_SPEED, () => {});
    else sandboxRun.play();
  }

  function sandboxNew(): void {
    const wasPlaying = sandboxRun.isLive();
    sandboxRun.clear();
    sandboxPapers = [];
    if (wasPlaying) sandboxRun.live(sb.speed * PER_SPEED, () => {});
  }

  /** The papers the reader has had printed, in the talk. */
  let sandboxPapers = $state<Said[]>([]);
  /** A phone's deck, folded to one row until the reader opens the dials. */
  let deckOpen = $state(false);
  let photos = 0;

  function photograph(i: number): void {
    const paper = paperOn(i, Float64Array.from(sandboxRun.wealth()), photos++);
    sandboxPapers = [...sandboxPapers.slice(-2), { id: `paper:sandbox:${photos}`, who: null, at: null, text: paper.text, kind: 'paper', paper }];
    dropPaper();
    if (stage?.reduced) return;
    bigPaper = paper;
    paperTimer = window.setTimeout(shrinkPaper, 3200);
  }

  const RUNS: Record<RoomSource, Run> = { run, dial: dialRun, game: gameRun, pair: leftRun, sandbox: sandboxRun };
  /** The room on screen now. */
  const shown = $derived(RUNS[PAIR_STEPS[current].pose.source]);

  /** Whether a source's sizes come from its run rather than from the pose (everyone equal). */
  function isShown(source: RoomSource): boolean {
    const r = RUNS[source];
    return PAIR_STEPS[current].pose.ran && (r.state.running || r.state.done);
  }

  /** A room member's radius: area is wealth, and everyone started at the room's radius. */
  function roomR(i: number, source: RoomSource = PAIR_STEPS[current].pose.source): number {
    const r = RUNS[source];
    void r.state.revision;
    return Math.max(0.8, L.room.radius * Math.sqrt(Math.max(0, r.wealth()[i]) * 100));
  }

  /** Whether the room's sizes come from a run (from the run on) rather than from the pose. */
  const runShown = $derived(isShown(PAIR_STEPS[current].pose.source));

  /** Largest first, so a giant never hides the small ones under it. */
  const roomOrder = $derived.by(() => {
    void shown.state.revision;
    const w = shown.wealth();
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

  // ---- Scenes 15–17: the room's poses ------------------------------------------

  /** What everyone holds, in the room's dollars (everyone started with $100). */
  const amounts = $derived.by(() => {
    void shown.state.revision;
    return toDollars(shown.wealth(), START_DOLLARS);
  });
  const pilesPose = $derived(piles(amounts, L.room.box));
  const rulerPose = $derived(ruler(amounts, L.room.box));
  const linePose = $derived(line(amounts, L.room.box, amounts.map((_, i) => roomR(i)), L.column !== null));
  const metrics = $derived.by(() => {
    void shown.state.revision;
    return measureWealth(shown.wealth());
  });

  /** Room member `i`'s circle on the stage: Blue and Red are their own. */
  function agentView(i: number): { x: number; y: number; r: number; alpha: number; empty: number } {
    if (i === L.room.blue) return view.people[BIG];
    if (i === L.room.red) return view.people[SMALL];
    return view.room[i];
  }

  /** The room member nearest the middle of the room, other than those in `not`; a circle, when asked. */
  function nearMiddle(not: readonly number[], circle = false): number {
    const box = L.room.box;
    const c = { x: box.x + box.w / 2, y: box.y + box.h / 2 };
    let best = 0;
    let bestD = Infinity;
    L.room.positions.forEach((p, i) => {
      if (not.includes(i)) return;
      if (circle && roomStyles[i]?.shape !== 'circle') return;
      const d = Math.hypot(p.x - c.x, p.y - c.y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  }

  /**
   * Who Scene 17 empties, who gets that money, and the two who join Blue and
   * Red in the four — circles, like the two (owner review 2026-09-26: coins
   * sit best in a circle).
   */
  const cast = $derived.by(() => {
    const pair = [L.room.blue, L.room.red];
    const emptied = nearMiddle(pair, true);
    const given = nearMiddle([...pair, emptied], true);
    const third = nearMiddle([...pair, emptied, given]);
    const fourth = nearMiddle([...pair, emptied, given, third]);
    const medianX = [...L.room.positions].map((p) => p.x).sort((a, b) => a - b)[50];
    return { emptied, given, four: [L.room.blue, L.room.red, emptied, given], spare: [third, fourth], medianX };
  });

  /** Scene 17's imagined rooms, as shares; the owner of everything is whoever the run made richest. */
  function imagined(mode: 'equal' | 'zero' | 'double' | 'half' | 'one'): Float64Array {
    return imaginedShares(mode, L.room.positions.length, {
      emptied: cast.emptied,
      given: cast.given,
      owner: Math.max(0, run.state.winner),
      half: (i) => L.room.positions[i].x < cast.medianX,
    });
  }

  /** Scene 17's four: square corners in the middle of the room. */
  function fourSpot(k: number): Point {
    const box = L.room.box;
    const side = Math.min(box.w, box.h) * 0.44;
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    return { x: cx + (k % 2 ? 1 : -1) * (side / 2), y: cy + (k < 2 ? -1 : 1) * (side / 2) };
  }

  /** Scene 22: the four's coins and the pool, as the lesson stands on screen. */
  let levyView = $state(levyLesson(0));

  /** The pool, in the middle of the four. */
  function poolSpot(): Point {
    const box = L.room.box;
    return { x: box.x + box.w / 2, y: box.y + box.h / 2 };
  }

  /**
   * Scene 23: the room at half size in one half of its box — trades only first
   * in reading order, its mirror copy with the levy second.
   */
  const matchBox = $derived.by(() => {
    const box = L.room.box;
    const gap = Math.max(14, box.w * 0.04);
    const scale = (box.w - gap) / 2 / box.w;
    const h = box.h * scale;
    const top = box.y + Math.max(0, (box.h - h) / 2);
    const lefts = [box.x, box.x + box.w * scale + gap];
    return { scale, top, h, w: box.w * scale, lefts: rtl ? [lefts[1], lefts[0]] : lefts };
  });

  function matchedAt(side: 0 | 1, p: Point): Point {
    const box = L.room.box;
    return { x: matchBox.lefts[side] + (p.x - box.x) * matchBox.scale, y: matchBox.top + (p.y - box.y) * matchBox.scale };
  }

  /** Scene 24: the map in the lower part of the room's box, the talk above it. */
  const mapBox = $derived.by(() => {
    const box = L.room.box;
    const side = Math.min(box.w * 0.62, box.h * 0.62);
    const below = 74;
    const y = box.y + box.h - side - below;
    const x = box.x + (box.w - side) / 2 + 14;
    return { x, y, side, cw: side / MAP_STAKES.length, ch: side / MAP_LEVIES.length };
  });

  /** Blue and Red beside the map, low on either side: speakers here, not squares on it. */
  function mapSpeaker(who: 0 | 1, real: number): Target {
    const box = L.room.box;
    const m = mapBox;
    const margin = Math.max(8, (box.w - m.side) / 2 - 42);
    const r = Math.min(real, margin * 0.4, m.side * 0.09);
    const first = rtl ? 1 - who : who;
    const x = first === 0 ? m.x - 42 - margin / 2 : m.x + m.side + margin / 2 + 6;
    return { x, y: m.y + m.side - r, r, alpha: 1, empty: false };
  }

  /** Every square of the map at once, and the curve fitted through where half still count. */
  const MAP_FIT = fitSquareRelationship(MAP_PARTICIPANTS, MAP_STAKES, MAP_LEVIES, 50, 'increases');
  /** The order the squares fill in: scattered, the same every time. */
  const MAP_ORDER = MAP_PARTICIPANTS.map((row, iy) => row.map((_, ix) => noise(ix * 31 + iy, 77)));

  function mapColour(count: number): string {
    const closed = 1 - (count - 1) / 99;
    return GINI_RAMP[Math.min(GINI_RAMP.length - 1, Math.max(0, Math.floor(closed * GINI_RAMP.length)))];
  }

  const mapCurve = $derived.by(() => {
    if (!MAP_FIT) return '';
    const m = mapBox;
    const b0 = MAP_STAKES[0];
    const b1 = MAP_STAKES[MAP_STAKES.length - 1];
    const t1 = MAP_LEVIES[MAP_LEVIES.length - 1];
    const xOf = (b: number) => m.x + ((b - b0) / (b1 - b0)) * (m.side - m.cw) + m.cw / 2;
    const yOf = (t: number) => m.y + m.side - ((t - MAP_LEVIES[0]) / (t1 - MAP_LEVIES[0])) * (m.side - m.ch) - m.ch / 2;
    const points: string[] = [];
    // only over the range it was measured on
    for (let b = b0; b <= b1 + 1e-9; b += 0.005) {
      const t = MAP_FIT.c * b * b;
      if (t > t1) break;
      points.push(`${points.length ? 'L' : 'M'}${xOf(b).toFixed(1)} ${yOf(t).toFixed(1)}`);
    }
    return points.join(' ');
  });

  /** Coins each of the four holds (sixteen between them), while the reader moves them. */
  let fourCoins = $state([4, 4, 4, 4]);
  let fourPick = $state<number | null>(null);

  interface Target {
    x: number;
    y: number;
    r: number;
    alpha: number;
    empty: boolean;
  }

  /** Where room member `i` stands, how big, and how visible, in a room pose — sized from `source`'s room. */
  function modeTarget(mode: RoomMode, i: number, source: RoomSource = PAIR_STEPS[current].pose.source): Target {
    const free = L.room.positions[i];
    const real = isShown(source) ? roomR(i, source) : L.room.radius;
    const at = (x: number, y: number, r: number, alpha = 1, empty = false): Target => ({ x, y, r, alpha, empty });
    switch (mode) {
      case 'piles':
        return at(pilesPose.spots[i].x, pilesPose.spots[i].y, pilesPose.marker);
      case 'ruler':
        return at(rulerPose.spots[i].x, rulerPose.spots[i].y, rulerPose.marker);
      case 'line':
        // the walk's circle eats everyone it has added up (owner review 2026-09-26)
        return at(linePose.spots[i].x, linePose.spots[i].y, linePose.radii[i], linePose.rank[i] < walker.k ? 0 : 1);
      case 'equal':
      case 'zero':
      case 'double':
      case 'half':
      case 'one': {
        const share = imagined(mode)[i];
        return share > 0
          ? at(free.x, free.y, L.room.radius * Math.sqrt(share * L.room.positions.length))
          : at(free.x, free.y, L.room.radius * 0.45, 1, true);
      }
      case 'four': {
        const k = cast.four.indexOf(i);
        if (k < 0) return at(free.x, free.y, real, 0.18);
        const spot = fourSpot(k);
        return fourCoins[k] > 0 ? at(spot.x, spot.y, L.radius(fourCoins[k])) : at(spot.x, spot.y, L.presence * 1.6, 1, true);
      }
      case 'turnover':
        return at(free.x, free.y, real, 0.16);
      case 'levy4': {
        const k = cast.four.indexOf(i);
        if (k < 0) return at(free.x, free.y, real, 0.14);
        const spot = fourSpot(k);
        return at(spot.x, spot.y, L.radius(levyView.coins[k]));
      }
      case 'matched': {
        const spot = matchedAt(0, free);
        return at(spot.x, spot.y, real * matchBox.scale);
      }
      case 'map': {
        if (i === L.room.blue) return mapSpeaker(0, real);
        if (i === L.room.red) return mapSpeaker(1, real);
        return at(free.x, free.y, real, 0.08);
      }
      default: {
        // a fortune that has grown past the room's edge is drawn a little further in
        const box = L.room.box;
        const x = real * 2 < box.w ? Math.min(Math.max(free.x, box.x + real), box.x + box.w - real) : free.x;
        const y = real * 2 < box.h ? Math.min(Math.max(free.y, box.y + real), box.y + box.h - real) : free.y;
        return at(x, y, real);
      }
    }
  }

  function ticksFor(mode: RoomMode): readonly Tick[] {
    if (mode === 'piles') return pilesPose.ticks;
    if (mode === 'ruler') return rulerPose.ticks;
    return [];
  }

  /** While the room is rearranging, the tween owns everyone's place, not the run. */
  let arranging = $state(false);

  // the room follows the moment on screen: the run as it plays, or the time dial
  $effect(() => {
    void shown.state.revision;
    void fourCoins;
    const pose = PAIR_STEPS[current].pose;
    if (!runShown || arranging || pose.place !== 'room') return;
    for (let i = 0; i < L.room.positions.length; i++) {
      const t = modeTarget(pose.roomMode, i);
      const v = agentView(i);
      v.x = t.x;
      v.y = t.y;
      v.r = t.r;
      v.alpha = t.alpha;
      v.empty = t.empty ? 1 : 0;
    }
  });

  /**
   * The room moves into its next picture: everyone makes their own way, a
   * little early or late, a little faster or slower — people sorting
   * themselves, not a slide (brief 5.1).
   */
  function arrange(pose: Pose, tl: Timeline): void {
    arranging = true;
    const mode = pose.roomMode;
    const n = L.room.positions.length;
    const still = ['equal', 'zero', 'double', 'half', 'one', 'turnover'];
    const inPlace = still.includes(mode) && (still.includes(PAIR_STEPS[current - 1]?.pose.roomMode ?? '') || PAIR_STEPS[current - 1]?.pose.roomMode === 'free');
    const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => modeTarget(mode, a).x - modeTarget(mode, b).x);
    const slow = mode === 'ruler' ? 1.5 : 1;
    let end = 0;
    // into piles: first to above their own pile at their own size, and only
    // then, all at once, one size each, dropping into place (owner review
    // 2026-09-26: "first move them to above respective bins, then change their sizes")
    if (mode === 'piles') {
      const settleAt = 0.05 + 1.1 + 0.3 + 1.3 + 0.35;
      order.forEach((i, k) => {
        const v = agentView(i);
        const t = modeTarget(mode, i);
        const pile = pilesPose.piles[pilesPose.pileOf[i]];
        const box = L.room.box;
        const above = {
          x: pile.x0 + (pile.x1 - pile.x0) * (0.2 + noise(i, 62) * 0.6),
          y: Math.max(box.y + v.r, Math.min(pile.top, t.y) - v.r - 10 - noise(i, 63) * 26),
        };
        const at = 0.05 + (k / n) * 1.1 + noise(i, 60) * 0.3;
        const dur = 0.8 + noise(i, 61) * 0.5;
        tl.to(v, { x: above.x, duration: dur, ease: 'power1.inOut' }, at);
        tl.to(v, { y: above.y, duration: dur, ease: 'power2.inOut' }, at);
        tl.to(v, { alpha: t.alpha, duration: 0.4 }, at);
        const drop = settleAt + noise(i, 64) * 0.35;
        tl.to(v, { r: t.r, duration: 0.45, ease: 'power2.inOut' }, drop);
        tl.to(v, { x: t.x, y: t.y, duration: 0.6, ease: 'power2.in' }, drop + 0.2);
        tl.set(v, { empty: t.empty ? 1 : 0 }, drop);
        end = Math.max(end, drop + 0.8);
      });
    } else {
      order.forEach((i, k) => {
        const v = agentView(i);
        const t = modeTarget(mode, i);
        const at = inPlace ? noise(i, 60) * 0.3 : (0.05 + (k / n) * 1.1 + noise(i, 60) * 0.3) * slow;
        const dur = (0.8 + noise(i, 61) * 0.5) * slow;
        tl.to(v, { x: t.x, duration: dur, ease: 'power1.inOut' }, at);
        tl.to(v, { y: t.y, duration: dur, ease: 'power2.inOut' }, at);
        tl.to(v, { r: t.r, alpha: t.alpha, duration: Math.min(0.7, dur), ease: 'power1.inOut' }, at);
        tl.set(v, { empty: t.empty ? 1 : 0 }, t.empty ? at + Math.min(0.7, dur) : at);
        end = Math.max(end, at + dur);
      });
    }
    // the ruler's marks: a decade on both rulers slides; the rest fade
    const next = Object.fromEntries(ticksFor(mode).map((t) => [t.key, t]));
    for (const [key, state] of Object.entries(view.ticks)) {
      const to = next[key];
      if (to && Number.isFinite(to.x)) tl.to(state, { x: to.x, alpha: to.shown ? 1 : 0, duration: 1.8 * slow, ease: 'power2.inOut' }, 0.1);
      else tl.to(state, { alpha: 0, duration: 0.4 }, 0);
    }
    for (const t of ticksFor(mode)) {
      if (view.ticks[t.key] || !Number.isFinite(t.x)) continue;
      view.ticks[t.key] = { x: t.x, alpha: 0 };
      tl.to(view.ticks[t.key], { alpha: t.shown ? 1 : 0, duration: 0.6 }, end * 0.6);
    }
    if (mode !== 'line') tl.to(view, { lorenzDraw: 0, duration: 0.4 }, 0);
    if (mode === 'turnover') tl.fromTo(view, { turnDraw: 0 }, { turnDraw: 1, duration: 2.6, ease: 'power1.inOut' }, 0.4);
    else tl.to(view, { turnDraw: 0, duration: 0.3 }, 0);
    tl.call(() => (arranging = false), [], Math.max(end, mode === 'turnover' ? 3 : 0) + 0.05);
  }

  /** Scene 16: walking along the line, the money is added up, poorest first, and each point plotted. */
  function walk(tl: Timeline): void {
    tl.fromTo(view, { lorenzDraw: 0 }, { lorenzDraw: 1, duration: 4.2, ease: 'none' });
  }

  /** How far along the line the walk has come: the running total, and its point. */
  const walker = $derived.by(() => {
    const n = L.room.positions.length;
    const k = Math.min(n, Math.floor(view.lorenzDraw * n));
    const point = linePose.curve[k];
    const share = 1 - (point.y - linePose.frame.y) / Math.max(1, linePose.frame.h);
    return { k, point, people: k / n, share };
  });

  /** The walk's circle: everyone added up so far, rolling along the floor after the last one it ate. */
  const eater = $derived.by(() => {
    const k = walker.k;
    if (k === 0) return null;
    const r = linePose.eaten[k];
    const last = linePose.spots[linePose.order[k - 1]];
    const f = linePose.frame;
    const x = Math.max(f.x + r, Math.min(last.x, f.x + f.w - r));
    return { x, y: last.y + linePose.radii[linePose.order[k - 1]] - r, r };
  });

  /** A share as a percent, for the plots' axes and readings. */
  const pct = (v: number) => formatNumber(v, { style: 'percent' });

  // ---- Scene 17's four: coins moved by the reader --------------------------------

  const fourCount = $derived(effectiveCount(fourCoins));
  /** The reader's hands are in the scene: a missed tap must not move the story on. */
  const handsOn = $derived(game.playing || PAIR_STEPS[current].pose.control === 'sandbox' || current === indexOf('eff.try'));

  /** Tap one of the four to take a coin from them, then another to give it. */
  function tapFour(k: number): void {
    if (current !== indexOf('eff.try')) return;
    if (fourDragged) {
      // the click that ends a drag is not a tap
      fourDragged = false;
      return;
    }
    if (fourPick === null) {
      if (fourCoins[k] > 0) fourPick = k;
      return;
    }
    if (fourPick === k) {
      fourPick = null;
      return;
    }
    const from = fourPick;
    fourPick = null;
    sendCoin(from, k);
  }

  /** A coin of the four's dragged across by the reader (owner, 2026-10-09: the toy "is not smooth"): drop it on another of them. */
  let fourDrag = $state<{ from: number; x: number; y: number; start: Point; moved: boolean } | null>(null);
  let fourDragged = false;

  function fourDown(event: PointerEvent, k: number): void {
    if (current !== indexOf('eff.try') || fourCoins[k] <= 0) return;
    const at = local(event);
    fourDrag = { from: k, x: at.x, y: at.y, start: at, moved: false };
    (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
  }

  function fourMove(event: PointerEvent): void {
    if (!fourDrag) return;
    const at = local(event);
    fourDrag.x = at.x;
    fourDrag.y = at.y;
    if (Math.hypot(at.x - fourDrag.start.x, at.y - fourDrag.start.y) > 6) fourDrag.moved = true;
  }

  function fourUp(event: PointerEvent): void {
    if (!fourDrag) return;
    const { from, moved } = fourDrag;
    const at = local(event);
    fourDrag = null;
    if (!moved) return;
    fourDragged = true;
    fourPick = null;
    // dropped on another of the four: the coin is theirs; anywhere else, it goes home
    const to = cast.four.findIndex((agent, j) => {
      const v = agentView(agent);
      return j !== from && Math.hypot(at.x - v.x, at.y - v.y) <= Math.max(v.r, 34);
    });
    if (to >= 0) sendCoin(from, to, at);
  }

  /** One coin from one of the four to another, flying, from where it is (their circle, or the reader's finger). */
  function sendCoin(from: number, k: number, start: Point | null = null): void {
    if (fourCoins[from] <= 0) return;
    const a = start ?? agentView(cast.four[from]);
    const b = agentView(cast.four[k]);
    const token = { x: a.x, y: a.y, on: 1, face: 'front' as const };
    view.fly = [...view.fly, token];
    const flying = view.fly[view.fly.length - 1];
    fourCoins = fourCoins.map((c, j) => (j === from ? c - 1 : c));
    gsap.to(flying, {
      x: b.x,
      y: b.y,
      duration: stage?.reduced ? 0 : 0.45,
      ease: 'power2.inOut',
      onComplete: () => {
        flying.on = 0;
        fourCoins = fourCoins.map((c, j) => (j === k ? c + 1 : c));
      },
    });
  }

  // ---- Scene 18: turnover ------------------------------------------------------

  /** Each round's turnover up to the moment on screen, and its mean at the start and near the end. */
  /** A run's turnover so far: each round's share of the money that changed hands, as the chart draws it. */
  function turnoverOf(r: Run) {
    void r.state.revision;
    const rec = r.recording();
    if (!rec) return { rounds: [] as number[], early: 0, late: 0, max: 0, recent: 0 };
    const raw = rec.turnover.slice(1, Math.max(1, r.state.frame) + 1);
    const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);
    // drawn as a five-round moving average, so the trend reads through the noise of single rounds
    const rounds = raw.map((_, k) => mean(raw.slice(Math.max(0, k - 2), k + 3)));
    // the last tenth of the rounds on screen: where the room has settled
    const recent = mean(raw.slice(-Math.max(3, Math.ceil(raw.length / 10))));
    return { rounds, early: mean(raw.slice(0, 3)), late: mean(raw.slice(-3)), max: Math.max(1e-9, ...rounds), recent };
  }
  const turnover = $derived(turnoverOf(shown));
  /** Scene 23's two rooms, each measured the same way: without the levy, and with it. */
  const matchTurnover = $derived([turnoverOf(leftRun), turnoverOf(rightRun)]);
  const matchMetrics = $derived.by(() => {
    void leftRun.state.revision;
    void rightRun.state.revision;
    return [measureWealth(leftRun.wealth()), measureWealth(rightRun.wealth())];
  });
  /**
   * What the review says (owner, 2026-10-09: "how even a small levy improves
   * all"), for any line said while the matched rooms stand: the levy, and each
   * measure for both rooms — a without the levy, b with it.
   */
  const matchedValues = $derived.by((): Record<MatchedValue, string> => {
    const [a, b] = matchMetrics;
    const [ta, tb] = matchTurnover;
    const share = (x: number) => formatNumber(x, { style: 'percent', maximumFractionDigits: x < 0.01 ? 2 : 1 });
    const gini = (x: number) => formatNumber(x, { maximumFractionDigits: 2 });
    return {
      levy: formatNumber(MATCH_LEVY, { style: 'percent', maximumFractionDigits: 1 }),
      a: matchCounts.a,
      b: matchCounts.b,
      giniA: gini(a.gini),
      giniB: gini(b.gini),
      topA: share(a.topShare),
      topB: share(b.topShare),
      turnA: share(ta.recent),
      turnB: share(tb.recent),
    };
  });
  /** A step's live values: the pair's coins, and while the matched rooms stand, the review's measures. */
  /** The morning paper's headline on the run's winner: what Blue repeats as the reason (`\\val{headline}`). */
  const headline = $derived(run.state.done && run.state.winner >= 0 ? (frontPage()?.text ?? '') : '');
  const valuesOf = (step: (typeof PAIR_STEPS)[number]) => ({
    ...valuesFor(step),
    ...(step.pose.ran ? { headline } : {}),
    ...(step.pose.roomMode === 'matched' ? matchedValues : {}),
  });

  // ---- the side rail, the sheets (optional toys) --------------------------------


  /** The charts column's plots, two across and two down, as large as the column allows. */
  const plotCell = $derived(
    L.column ? Math.max(110, Math.min((L.column.w - 10) / 2, (L.column.h - (PAIR_STEPS[current].pose.control === 'sandbox' ? 330 : 140)) / 2)) : 0,
  );

  /** What the debug panel shows (owner only, `?debug=1`). */
  const debugLines = $derived.by((): [string, string][] => {
    if (!tuning.debug) return [];
    const step = PAIR_STEPS[current];
    const pose = step.pose;
    const w = shown.wealth();
    const dollars = Array.from(w, (x) => x * 100 * START_DOLLARS);
    const rec = shown.recording();
    return [
      ['step', `${current} ${step.id} (${step.wait.kind}${step.action ? ', ' + step.action : ''})`],
      ['pose', `${pose.place}/${pose.roomMode} crowd:${pose.crowd} lorenz:${pose.lorenz} ran:${pose.ran}`],
      ['room', `${pose.source} · β ${rec?.settings.beta ?? '–'}${rec?.settings.levy ? ` · levy ${rec.settings.levy}` : ''}`],
      ['run', `${shown.state.running ? 'playing' : shown.state.done ? 'done' : 'none'} · frame ${shown.state.frame}/${Math.max(0, shown.state.frames - 1)} · seed ${rec?.seed ?? '–'}`],
      ['trades', formatNumber(shown.state.trades)],
      ['richest', `${(shown.state.share * 100).toFixed(1)}% (#${shown.state.winner})`],
      ['gini', metrics.gini.toFixed(3)],
      ['eff. N', metrics.effectiveParticipants.toFixed(2)],
      ['≥10¢ / ≥$10', `${dollars.filter((d) => d >= 0.1).length} / ${dollars.filter((d) => d >= 10).length}`],
      ['turnover', `first ${(turnover.early * 100).toFixed(2)}% · last ${(turnover.late * 100).toFixed(2)}% per round`],
      ['stage', `${Math.round(width)}×${Math.round(height)} ${L.column ? 'wide' : 'narrow'}`],
    ];
  });

  /** The morning paper on whoever finished richest — the sandbox's own newsroom. */
  function frontPage(): Said['paper'] | null {
    return run.state.winner < 0 ? null : paperOn(run.state.winner, run.wealth(), Math.max(0, run.state.finished - 1));
  }

  /** The morning paper on room member `who`, whatever their fortune — the sandbox's newsroom. */
  function paperOn(winner: number, w: Float64Array, edition: number): NonNullable<Said['paper']> {
    const style = styleOfRoom(winner);
    let poorer = 0;
    for (let i = 0; i < w.length; i++) if (w[i] < w[winner]) poorer++;
    const m = measureWealth(w);
    const stats = collectStats(
      { n: 100, startDollars: START_DOLLARS, taxRate: 0, dollarsOf: (i) => w[i] * ROOM_TOTAL_DOLLARS, volume: [] },
      m.gini,
      m.topShare,
    );
    const page = frontPageFor(
      'ledger',
      { noun: styleNoun(style), dollars: w[winner] * ROOM_TOTAL_DOLLARS, percentile: poorer / w.length },
      stats,
      headlineForStyle(style, edition),
      edition,
    );
    // the richest looks down on the room; anyone else wears how their fortune feels
    const mood = photoMood(w[winner], w.length, m.topShare > 0 && w[winner] >= Math.max(...w));
    return { masthead: page.paper, text: page.text, source: page.source, style, mood };
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
    const all = host?.querySelectorAll<HTMLElement>('.bubble.paper');
    const target = all && all.length > 0 ? all[all.length - 1] : null;
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
      ...withPause(line),
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
      }, readOf(lines[banterShown - 1]));
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
    paper?: { masthead: string; text: string; source: string; style: AgentStyle; mood?: Affect };
    /** Said to the reader, not to the other one: on the speaker's outer side. */
    aside?: boolean;
    /** A passing line (a call): it never pushes an aside away. */
    brief?: boolean;
    /** The feeling words it is said with: they show on the speaker's face (stageFaces `feel`). */
    feel?: readonly string[];
    /** Its own `\\pause`, ms: it stays this much longer than its words take to read. */
    pauseMs?: number;
    /** Pictures posted with it, by name (cast/pictures.ts): the joke's plates. */
    pictures?: readonly string[];
    choices?: readonly BubbleChoice[];
    /** A control the reader holds, inside the bubble (Scene 20's dial). */
    control?: Snippet;
  }

  /** The line of a Scene 3 hold, once more and a little louder each time. */
  const callLevel = $state({ blue: -1, red: -1 });
  /** When each last called, and when each was clicked: the talk plays them in that order. */
  const callAt = $state({ blue: 0, red: 0 });
  const metAt = $state({ blue: 0, red: 0 });
  /** A coin-moving reaction (Scene 5), spoken on an event rather than a step. */
  let reaction = $state<Said | null>(null);

  /** Who calls at a step: both, in the meeting (owner review 2026-09-27: each on its own, at random). */
  const callersOf = (id: string): Speaker[] => (PAIR.filter((who) => CALLS[who] === id) as Speaker[]);

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
      const dynamic = conceptLine(step.id);
      if (dynamic) {
        out.push(dynamic);
        continue;
      }
      if (step.id === 'why.after') {
        const line = run.state.finished > 1 ? REACTIONS.whyAgain : REACTIONS.whyAfter;
        out.push({ id: `${step.id}:${line.message}`, who: line.who, at: line.who, text: say(line.message), ...withPause(line) });
        continue;
      }
      if (step.id === 'guess.react') {
        const bet = session.bet ? REACTIONS.betLines[session.bet] : null;
        if (bet) out.push({ id: `${step.id}:${session.bet}`, who: bet.who, at: bet.who, text: say(bet.message), aside: true, ...withPause(bet) });
        continue;
      }
      if (step.id === 'end.longer' && line?.who) {
        out.push({ id: step.id, who: line.who, at: line.who, text: say(line.message), aside: step.aside, feel: step.feel });
        // what the room did, each time it was played on
        if (longers > 0 && !(i === current && run.state.running)) {
          const text = say('log_run', { trades: formatNumber(run.state.trades), share: formatNumber(run.state.share, { style: 'percent' }) });
          out.push({ id: `log:end.longer:${longers}`, who: null, at: null, text, kind: 'event' });
        }
        continue;
      }
      if (step.id === 'stop.how' && line?.who) {
        out.push({ id: step.id, who: line.who, at: line.who, text: say(line.message, valuesOf(step)), feel: step.feel });
        const result = game.result;
        if (result) {
          const said = result.won ? REACTIONS.stopWon : REACTIONS.stopLost;
          const values: Record<string, number> = result.won ? { count: result.count } : { seconds: result.seconds, taps: result.taps };
          out.push({ id: `stop.result:${game.round}`, who: said.who, at: said.who, text: say(said.message, values), ...withPause(said) });
        }
        continue;
      }
      if (!line || !line.who) continue;
      // a brief line goes as soon as anyone says the next thing
      if (step.brief) {
        let superseded = false;
        for (let k = i + 1; k <= current && !superseded; k++) superseded = speaks(k);
        if (superseded) continue;
      }
      const callers = callersOf(step.id);
      if (callers.length) {
        // each calls on his own clock until clicked, then introduces himself: in the order it happened
        const heard: { at: number; said: Said }[] = [];
        for (const who of callers) {
          if (reader.named[who] || stage?.isReleased(step.id)) {
            const intro = who === 'red' ? REACTIONS.introRed : REACTIONS.introBlue;
            heard.push({ at: metAt[who], said: { id: `${step.id}:met-${who}`, who, at: who, text: say(intro.message), aside: true, ...withPause(intro) } });
          } else if (callLevel[who] >= 0) {
            const pool = who === 'red' ? REACTIONS.callRed : REACTIONS.callBlue;
            heard.push({ at: callAt[who], said: { id: `${step.id}:${who}#${callLevel[who]}`, who: null, at: who, text: say(pool[callLevel[who]]), aside: true, brief: true } });
          }
        }
        out.push(...heard.sort((a, b) => a.at - b.at).map((h) => h.said));
        continue;
      }
      out.push({ id: step.id, who: line.who, at: line.who, text: say(line.message, valuesOf(step)), aside: step.aside, brief: step.brief, feel: step.feel, pictures: step.pictures });
    }
    if (reaction && current === indexOf('equal')) out.push(reaction);
    if (PAIR_STEPS[current].pose.control === 'sandbox') out.push(...sandboxPapers);
    const last = out[out.length - 1];
    // an open toy has its own Done: the offer's links go while it is open
    const choices = choicesAt(current);
    if (last && choices) out[out.length - 1] = { ...last, choices };
    // the stake dial sits in Red's newest bubble while she hands it over
    if (PAIR_STEPS[current].pose.control === 'stake' && !dialDocked) {
      let k = out.length - 1;
      while (k >= 0 && !(out[k].who === 'red' && !out[k].kind)) k--;
      if (k >= 0) out[k] = { ...out[k], control: stakeDial };
    }
    if (current === indexOf('eff.try')) {
      const line = REACTIONS.effReadout;
      out.push({
        id: `eff.readout:${fourCoins.join('-')}`,
        who: line.who,
        at: line.who,
        text: say(line.message, { count: formatNumber(fourCount, { maximumFractionDigits: 2 }) }),
        aside: true,
        ...withPause(line),
      });
    }
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

  /** Scenes 15–17: the lines whose words are what the room shows right now. */
  function conceptLine(id: string): Said | null {
    const said = (line: { who: Speaker; message: string; pauseMs?: number }, values: Record<string, string | number>): Said => ({
      id: `${id}:${JSON.stringify(values)}`,
      who: line.who,
      at: line.who,
      text: say(line.message, values),
      ...withPause(line),
    });
    const count = formatNumber(metrics.effectiveParticipants, { maximumFractionDigits: 1 });
    switch (id) {
      case 'sort.there':
        return said(REACTIONS.sortThere, { count: pilesPose.piles[pilesPose.pileOf[L.room.blue]].count - 1 });
      case 'gini.value':
        return said(REACTIONS.giniValue, { gini: formatNumber(metrics.gini, { maximumFractionDigits: 2 }) });
      case 'eff.brutal':
      case 'eff.give':
      case 'eff.half':
      case 'eff.one': {
        const mode = ({ 'eff.brutal': 'zero', 'eff.give': 'double', 'eff.half': 'half', 'eff.one': 'one' } as const)[id];
        const n = effectiveCount(imagined(mode));
        return said((REACTIONS.effCases as Record<string, { who: Speaker; message: string }>)[id], {
          count: formatNumber(n, { maximumFractionDigits: n > 10 ? 2 : 1 }),
        });
      }
      case 'turn.busy':
        return said(REACTIONS.turnBusy, { trades: formatNumber(run.state.trades) });
      case 'turn.start':
        return said(REACTIONS.turnStart, { early: formatNumber(turnover.early, { style: 'percent', maximumFractionDigits: 1 }) });
      case 'turn.now':
        return said(REACTIONS.turnNow, { late: formatNumber(turnover.late, { style: 'percent', maximumFractionDigits: 1 }) });
      case 'eff.room':
        return said(REACTIONS.effRoom, { count });
      case 'eff.end':
        return said(REACTIONS.effEnd, { count });
      case 'dial.said': {
        // one bubble per room: its number grows as the room plays
        const stake = dialRun.recording()?.settings.beta ?? dialStake;
        const kind = stake <= 0 ? 'zero' : stake >= 1 ? 'all' : Math.abs(stake - DEFAULT_RUN.beta) < 1e-9 ? 'same' : stake < DEFAULT_RUN.beta ? 'slow' : 'fast';
        const line = REACTIONS.dialSaid[kind];
        void dialRun.state.revision;
        return {
          id: `dial.said:${dialRun.recording()?.seed ?? 0}:${kind}`,
          who: line.who,
          at: line.who,
          ...withPause(line),
          text: say(line.message, {
            stake: formatNumber(stake, { style: 'percent' }),
            share: formatNumber(dialRun.state.share, { style: 'percent' }),
          }),
        };
      }
      case 'match.result': {
        void leftRun.state.revision;
        void rightRun.state.revision;
        const line = REACTIONS.matchResult;
        return {
          id: `match.result:${leftRun.recording()?.seed ?? 0}`,
          who: line.who,
          at: line.who,
          ...withPause(line),
          text: say(line.message, { a: matchCounts.a, b: matchCounts.b }),
        };
      }
      default:
        return null;
    }
  }

  /** The reader's choices, set inside the current speaker's bubble. */
  function choicesAt(index: number): readonly BubbleChoice[] | null {
    const id = PAIR_STEPS[index].id;
    if (PAIR_STEPS[index].pose.choice) {
      // the joke is told in the talk: "Yes" lets the offer go, on into the joke; "Not now" jumps past it
      return [
        { label: say(REACTIONS.joke[0]), act: () => stage?.release(id) },
        { label: say(REACTIONS.joke[1]), act: () => goToStep('pair', JOKE_SKIP, true) },
      ];
    }
    const link = (REACTIONS.links as Record<string, string>)[id];
    if (link) return [{ label: say(link), act: () => stage?.advance() }];
    if (id === 'gini.toy') {
      const [yes, no] = REACTIONS.giniToy;
      return [
        {
          label: say(yes),
          act: () => {
            cardOpen = 'gini';
            cardPlaying = 'gini';
          },
        },
        { label: say(no), act: () => stage?.advance() },
      ];
    }
    if (id === 'end.longer') {
      if (run.state.running) return null;
      const [yes, no] = REACTIONS.endChoice;
      return [
        { label: say(yes), act: runLonger },
        { label: say(no), act: () => stage?.advance() },
      ];
    }
    if (id === 'stop.how') return game.playing ? null : [{ label: say(REACTIONS.stopStart), act: startGame }];
    if (id === 'sandbox.2') return [{ label: say(REACTIONS.workshop), act: () => openBranch('workshop') }];
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
  /** The card whose toy is out (the Gini toy lives in the Gini card). */
  let cardPlaying = $state<string | null>(null);
  let cardHeight = $state(0);

  /** The rule card reads the rule that is running: the live stake, never typed in. */
  /** The picture the stage draws for a card, by the plot the script names (read when needed: snippets come after the script). */
  const pictureOf = (plot: string): Snippet | undefined =>
    ({ histogram: histogramPicture, lorenz: giniPicture, participants: participantsPicture, turnover: turnoverPicture })[plot];
  /** The toy a card can hold, by the name the script gives it. */
  const toyOf = (name: string): Snippet | undefined => ({ gini: giniToy })[name];

  /**
   * A card as the script writes it (script/cards/): title, lines, formulas, a
   * picture, a toy. The rule card reads the rule that is running: the live
   * stake, never typed in.
   */
  function cardFor(id: string): Card | null {
    const card = CARDS[id];
    if (!card) return null;
    const stake = formatNumber(tuning.beta, { style: 'percent' });
    const all = card.blocks.flatMap((b): CardLine[] => (b.kind === 'line' ? [say(b.key, { stake })] : b.kind === 'formula' ? [{ formula: b.tex }] : []));
    // only what the reader has been told so far (`\\learn`, owner 2026-10-09: "items appear one by one after the reader knows them")
    const lines = all.slice(0, PAIR_STEPS[current].pose.learned[id] ?? all.length);
    const plot = card.blocks.find((b) => b.kind === 'plot');
    const picture = plot?.kind === 'plot' ? pictureOf(plot.id) : undefined;
    const toy = card.toy ? toyOf(card.toy) : undefined;
    return { id, title: say(card.title), lines, ...(picture ? { picture } : {}), ...(toy ? { toy } : {}) };
  }

  /** On a wide stage the rule stands in the charts' column: nothing pops open over the room for it. */
  const cardsPop = $derived(!L.column);

  const cards = $derived(
    [...PAIR_STEPS[current].pose.cards, ...(cardPlaying && !PAIR_STEPS[current].pose.cards.includes(cardPlaying) ? [cardPlaying] : [])]
      .map(cardFor)
      .filter((card): card is Card => card !== null),
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

  /**
   * Whoever speaks sends out a ripple, so the eye finds him — in a room of a
   * hundred he is a dot (owner review 2026-09-26: "here he is").
   */
  let ripples = $state<{ id: number; x: number; y: number; r: number; ink: string }[]>([]);
  /** The tax game's taps, as the reader sees them: the quarter taken, and the pool coming back to everyone. */
  let taken = $state<{ id: number; x: number; y: number }[]>([]);
  let returns = $state<{ id: number; x: number; y: number; r: number }[]>([]);
  let rippleId = 0;
  let lastSpoken = '';
  $effect(() => {
    const newest = said[said.length - 1];
    if (!newest || newest.id === lastSpoken || !newest.at || stage?.reduced) return;
    lastSpoken = newest.id;
    const a = anchorOf(newest.at);
    // only where the eye needs it: a speaker who is a dot among a hundred (owner review 2026-09-26: "too distracting")
    if (PAIR_STEPS[current].pose.place !== 'room' || view.people[WHO[newest.at]].r > 12) return;
    const id = ++rippleId;
    ripples = [...ripples, { id, x: a.x, y: a.y, r: a.r, ink: PROTAGONISTS[newest.at].stroke }];
    window.setTimeout(() => (ripples = ripples.filter((q) => q.id !== id)), 1500);
  });

  /** The title's size, px: as `titleFit` sets it, or as its CSS starts it before its words are measured. */
  const titleFont = $derived(titleFit?.size ?? Math.min(160, Math.max(38.4, Math.min(width * 0.115, height * 0.19))));
  /** How small the title gets once they start talking. */
  const COMPACT = 0.4;

  /** The band the talk lives in: under the title (small by now), over the two. */
  const region = $derived.by(() => {
    const pose = poseAt(current);
    const top = pose.cleared ? Math.max(height * 0.05, pose.cards.length > 0 ? 68 : 0) : height * 0.03 + titleFont * 1.2 * (titleFit?.lines ?? 1) * COMPACT + 12;
    // in the room the talk floats over the crowd, down to just above the two;
    // over a picture, it stops above the picture
    const chartTop: Record<string, number> = {
      four: fourSpot(0).y - L.radius(8) - 24,
      levy4: fourSpot(0).y - L.radius(16) - 24,
      matched: matchBox.top - (matchBox.w < 260 ? 50 : 34),
      map: mapBox.y - 16,
      piles: Math.min(...pilesPose.piles.map((p) => p.top)) - 22,
      ruler: Math.min(...rulerPose.spots.map((p) => p.y)) - rulerPose.marker - 20,
      line: L.column ? L.room.box.y + L.room.box.h - 8 : linePose.frame.y - 18,
    };
    const tops =
      pose.place === 'room'
        ? [chartTop[pose.roomMode] ?? L.room.positions[L.room.blue].y - L.room.radius * 3.2]
        : PAIR.map((who) => pairSpot(pose, who).y - Math.max(pairRadius(pose, who), L.minRadius));
    // on a narrow stage an open card sits over the talk's space: start below it
    const card = cardOpen && width < 760 && cardHeight > 0 ? 12.8 + 44 + 8 + cardHeight + 10 : 0;
    const start = Math.max(top, card);
    // on a narrow stage an open toy takes the lower two thirds: talk above it
    const bottom = Math.max(start + 90, Math.min(...tops) - 6);
    return { top: start, bottom, left: 16, right: width - 16 };
  });

  /** Poses where Blue and Red are markers inside a picture, not people to talk beside. */
  const PICTURES = ['piles', 'ruler', 'line', 'four', 'turnover', 'levy4', 'matched', 'map'];
  /** Pictures that are not the room on screen: its charts step aside. */
  const APART: readonly RoomMode[] = ['levy4', 'matched', 'map'];
  const inPicture = $derived(PAIR_STEPS[current].pose.place === 'room' && PICTURES.includes(PAIR_STEPS[current].pose.roomMode));

  const column = $derived.by(() => {
    // the charts' column is only kept clear while there are charts: in the room
    const right = L.column && PAIR_STEPS[current].pose.place === 'room' ? L.column.x - 8 : width;
    const c = chatColumn(PAIR.map((who) => anchorOf(who)), right, region.top, region.bottom);
    if (!inPicture) return c;
    const box = L.room.box;
    // on a wide stage the Lorenz plot is square and the talk has the room beside it
    if (PAIR_STEPS[current].pose.roomMode === 'line' && L.column) {
      const left = linePose.frame.x + linePose.frame.w + 28;
      return { ...c, left, mid: (left + c.right) / 2 };
    }
    return { ...c, mid: box.x + box.w / 2 };
  });
  const bubbleWidth = $derived(Math.min(368, (column.right - column.left) * 0.8));

  /** Asides beside their speaker need room on both sides; a phone keeps one column, and so does the room. */
  const beside = $derived(!inPicture && width >= 700 && PAIR_STEPS[current].pose.place !== 'room');
  /** Where the talk runs when it sits beside the two: from one centre to the other. */
  const span = $derived(beside ? talkSpan(PAIR.map((who) => ({ w: 0, h: 0, anchor: anchorOf(who) })), column) : null);

  const placed = $derived(
    stackChat(
      said.map((b) => ({ w: sizes[b.id]?.w ?? 0, h: sizes[b.id]?.h ?? 0, anchor: b.at ? anchorOf(b.at) : null, aside: b.aside, brief: b.brief })),
      column,
      PAIR_STEPS[current].pose.place === 'room' ? 4 : 6,
      2,
      beside,
    ),
  );

  function anchorOf(who: Speaker) {
    const p = view.people[WHO[who]];
    // eaten by the walk's circle: they are in it
    if (PAIR_STEPS[current].pose.roomMode === 'line' && eater && linePose.rank[WHO[who] === BIG ? L.room.blue : L.room.red] < walker.k) {
      return { x: eater.x, y: eater.y, r: eater.r };
    }
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

  function spin(tl: ReturnType<typeof gsap.timeline>): void {
    tl.set(view, { mathPos: 0, titleSlide: 0 });
    // the crowd looks up at the reel, and follows it while it spins
    tl.call(() => lookUp(mathReel, true));
    tl.to(view, { mathOn: 1, duration: 0.25, ease: 'none' });
    // the line slides aside as the words grow longer, and back as the reel comes home to the answer
    let reached = 0;
    for (const x of reelSpin()) {
      const slide = x.to < reached ? 0 : titleShift(x.to);
      tl.to(view, { mathPos: x.to, titleSlide: slide, duration: x.seconds, ease: x.ease });
      reached = Math.max(reached, x.to);
    }
    // landed: a last look at the answer, each for their own while
    tl.call(() => lookUp(mathReel));
  }

  /** The title's newest word, as the crowd sees it (stageFaces `TitleCue`); set as each word arrives. */
  let titleCue: TitleCue | null = null;
  function lookUp(word: Element | null, live = false): void {
    if (!word || !host) return;
    const box = word.getBoundingClientRect();
    const at = host.getBoundingClientRect();
    titleCue = { x: box.x + box.width / 2 - at.x, y: box.y + box.height / 2 - at.y, since: seconds, live };
  }

  /** The title's words, as `lookUp` follows them: they arrive without moving anyone. */
  const TITLE_ACTIONS = new Set(['merit', 'or', 'reel-math']);
  /** The opening's crowd stands about, at ease — chatting, now and then a hop — unless the timeline is moving them. */
  function atEase(): boolean {
    const step = PAIR_STEPS[current];
    const phase = step?.pose.crowd;
    return (phase === 'idle' || phase === 'paid') && (!timeline?.isActive() || TITLE_ACTIONS.has(step.action ?? ''));
  }

  function choreograph(action: string | undefined, pose: Pose, tl: ReturnType<typeof gsap.timeline>): void {
    switch (action) {
      case 'type':
        tl.to(view, { type: 1, duration: 3.6, ease: 'none' }, 0.5);
        return;
      case 'arrive':
        arrive(tl);
        return;
      case 'merit':
        tl.call(() => lookUp(titleEl.querySelector('.word.merit')));
        tl.to(view, { meritOn: 1, duration: 0.9, ease: 'power1.out' });
        return;
      case 'or':
        tl.call(() => lookUp(titleEl.querySelector('.word.or')));
        tl.to(view, { orOn: 1, duration: 0.6, ease: 'none' });
        return;
      case 'reel-math':
        spin(tl);
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
      case 'present':
        present(pose, tl);
        return;
      case 'room':
        fillRoom(pose, tl);
        return;
      case 'pairs':
        playWindow(tl, current);
        return;
      case 'arrange':
        arrange(pose, tl);
        return;
      case 'walk':
        walk(tl);
        return;
      case 'dial':
        // everyone equal again, then a fresh room at the dial's stake
        arrange(pose, tl);
        if (stage?.reduced) turnDial(dialStake);
        else tl.call(() => turnDial(dialStake), [], 1.6);
        return;
      case 'game':
        arrange(pose, tl);
        return;
      case 'coins':
        levyCoins(pose, tl);
        return;
      case 'match':
        // the room shrinks to one side; an exact copy lifts off it and slides
        // to the other — the same room twice (owner review 2026-09-26: "somehow
        // apparent that it is the same")
        arrange(pose, tl);
        tl.set(view, { mirrorOn: 1, mirrorShift: 0 }, 1.5);
        tl.to(view, { mirrorShift: 1, duration: 1.2, ease: 'power2.inOut' }, 1.75);
        tl.call(startMatch, [], 3.2);
        return;
      case 'map':
        arrange(pose, tl);
        tl.fromTo(view, { mapOn: 0 }, { mapOn: 1, duration: 2.4, ease: 'power1.inOut' }, 0.5);
        return;
      case 'empty':
        emptyRoom(pose, tl);
        return;
      default:
        tweenTo(pose, tl, 0, 0.6);
    }
  }

  type Timeline = ReturnType<typeof gsap.timeline>;
  interface Hopper {
    x: number;
    y: number;
    q: number;
  }

  /** The stage's gravity, px/s² (hops.ts): every hop and every falling coin obeys it. */
  const G = $derived(gravity(L.whole));

  /**
   * Plays hops (hops.ts) on a timeline (owner, 2026-10-07: "physics should
   * work here"): a crouch that squashes, a stretched take-off, a parabola under
   * the stage's gravity — x steady, y slowing to the top and quickening down —
   * and a landing squash that settles: quick on a small, hard body, slow and
   * wobbling on a big, soft one. Every squash keeps the area.
   */
  function playHops(tl: Timeline, p: Hopper, hops: readonly Hop[]): void {
    for (const h of hops) {
      const gt = h.gait;
      const up = h.apex - h.lift;
      tl.to(p, { q: gt.squash * 0.8, duration: Math.max(0.02, h.lift - h.start), ease: 'power2.out' }, h.start);
      tl.to(p, { q: -gt.stretch, duration: up * 0.5, ease: 'power1.out' }, h.lift);
      tl.to(p, { q: 0, duration: up * 0.5, ease: 'power1.in' }, h.lift + up * 0.5);
      // across at a steady speed, up and down as a parabola under g
      tl.to(p, { x: h.to.x, duration: h.land - h.lift, ease: 'none' }, h.lift);
      tl.to(p, { y: h.top, duration: up, ease: RISE }, h.lift);
      tl.to(p, { y: h.to.y, duration: h.land - h.apex, ease: FALL }, h.apex);
      tl.to(p, { q: gt.squash, duration: 0.05, ease: 'power1.out' }, h.land);
      tl.to(p, { q: 0, duration: Math.max(0.08, h.end - h.land - 0.05), ease: gt.soft > 0.4 ? 'elastic.out(1, 0.55)' : 'back.out(2.5)' }, h.land + 0.05);
    }
  }

  /**
   * `p`, a body of radius `r`, hops from `from` to `to`, leaving at `depart`,
   * at its own gait — and, given `by`, bounding further if it must to be there
   * by then; returns when it has settled there.
   */
  function hopTo(tl: Timeline, p: Hopper, from: Point, to: Point, depart: number, r: number, stride = 1, by = Infinity): number {
    const hops = hopsBy(from, to, depart, r, L.radius(1), G, by, stride);
    playHops(tl, p, hops);
    return arrival(hops, depart);
  }

  /** Scene 2 begins: people hop in from the nearer side, each at their own gait — the small quick and short, the big slow and long. */
  const arrivalPlan = $derived(planArrival({ entries: L.crowdEntries, homes: L.crowdHomes, radius: L.radius, g: G }));
  function arrive(tl: Timeline): void {
    view.people.forEach((person, i) => {
      tl.set(person, { ...L.crowdEntries[i], r: L.radius(CROWD_START[i]), empty: 0, alpha: 1, q: 0 }, 0);
      playHops(tl, person, arrivalPlan[i]);
    });
  }

  /**
   * Where the coins drop from: every flat foot of the title's letters on its
   * line (titleFeet.ts), measured whenever the title is laid out; until then,
   * evenly along the title.
   */
  let feet = $state<Point[]>([]);
  function measureFeet(): void {
    // only the title at rest: not shrunk to the top, nor slid aside
    if (!titleEl || !host || !mathReel || view.compact > 0 || view.titleSlide !== 0) return;
    // on two lines, only the lower one: a coin from the upper would fall through it
    const words = [
      ...(titleFit?.lines === 2 ? [] : [titleEl.querySelector<HTMLElement>('.word.merit'), titleEl.querySelector<HTMLElement>('.word.or')]),
      mathReel.querySelectorAll<HTMLElement>('.strip .slot')[MATH_AT] ?? null,
      titleEl.querySelector<HTMLElement>('.mark'),
    ].filter((w): w is HTMLElement => w !== null);
    const box = host.getBoundingClientRect();
    feet = titleFeet(words, box, rtl);
  }
  // once the title has its size and shape, and stands at rest, measure where it stands on its line
  const titleAtRest = $derived(view.compact === 0 && view.titleSlide === 0);
  $effect(() => {
    void [titleFit?.size, titleFit?.lines, width, height];
    if (titleAtRest) requestAnimationFrame(measureFeet);
  });
  const dropFeet = $derived.by((): Point[] => {
    if (feet.length) return feet;
    const box = L.crowdBand;
    return Array.from({ length: COINS }, (_, k) => ({ x: box.x + ((k + 0.5) / COINS) * box.w, y: L.height * 0.35 }));
  });

  /** Where the crowd ends the rain: the scramble, planned once for this stage's size and title. */
  const rainPlan = $derived(planRain({ homes: L.crowdHomes, band: L.crowdBand, feet: dropFeet, radius: L.radius, g: G }));

  /**
   * Coins drop straight down from the title's feet, under the stage's gravity,
   * and land on whoever is under them (owner, 2026-10-07): each coin's owner
   * hops over at their own gait until its line falls inside them, and gives a
   * little under the blow; now and then a neighbour goes for it too, a beat
   * late. One catches a lot, one nothing — those two stay.
   */
  function payout(tl: Timeline): void {
    const held = [...CROWD_START];
    tl.to(view, { markOn: 1, duration: 0.5, ease: 'none' }, 0);
    for (const [token, c] of rainPlan.catches.entries()) {
      const person = view.people[c.who];
      playHops(tl, person, c.hops);
      const had = held[c.who];
      held[c.who] += c.count;
      // a straight fall from the foot, from rest: y quickening, x still
      const coin = view.payout[token];
      tl.set(coin, { x: c.foot.x, y: c.foot.y, on: 1 }, c.release);
      tl.to(coin, { y: c.meet.y, duration: c.land - c.release, ease: FALL }, c.release);
      tl.set(coin, { on: 0 }, c.land);
      // the blow: a squash that keeps the area, the softer the deeper; and the coin is theirs
      const soft = Math.min(1, Math.max(0, (L.radius(had) / L.radius(1) - 1) / 3.5));
      tl.to(person, { q: 0.05 + 0.12 * soft, duration: 0.05, ease: 'power1.out' }, c.land);
      tl.to(person, { q: 0, duration: 0.2 + 0.3 * soft, ease: soft > 0.4 ? 'elastic.out(1, 0.55)' : 'back.out(2.5)' }, c.land + 0.05);
      tl.to(person, { r: L.radius(held[c.who]), duration: 0.25, ease: 'back.out(3)' }, c.land);
      // a coin caught is a result: one coin to someone with one is joy, to someone with eight a shrug
      feelAt(tl, c.land, () => faces.field.react(c.who, had, had + c.count));
    }
    for (const c of rainPlan.chases) playHops(tl, view.people[c.who], c.hops);
  }

  /** Everyone else hops off the stage with what they caught; the two hop under their words. */
  function leave(pose: Pose, tl: Timeline): void {
    const targets = people(pose);
    view.people.forEach((person, i) => {
      const from = { x: person.x, y: person.y };
      if (whoIs(i)) {
        const to = { x: targets[i].x, y: targets[i].y };
        const there = hopTo(tl, person, from, to, 0.4, person.r, CROSSING, GATHER_SECONDS);
        tl.to(person, { r: targets[i].r, duration: 0.5 }, Math.max(0.4, there - 0.5));
        return;
      }
      const exit = L.crowdExits[i];
      const gone = hopTo(tl, person, from, { x: exit.x, y: from.y }, noise(i, 3) * 0.6, person.r, CROSSING, GATHER_SECONDS);
      tl.set(person, { alpha: 0 }, gone);
    });
  }

  /**
   * Scene 25: everyone but the two hops out of the room, each to the nearer
   * side; Blue and Red go back to their seats, equal, as the reader once
   * made them (brief 5.10: "everything leaves except the two").
   */
  function emptyRoom(pose: Pose, tl: Timeline): void {
    const w = L.width;
    arranging = true;
    L.room.positions.forEach((spot, i) => {
      if (i === L.room.blue || i === L.room.red) return;
      const v = view.room[i];
      const exit = { x: v.x < w / 2 ? -L.room.radius * 4 : w + L.room.radius * 4, y: v.y };
      // dust hops out like the small, or it would take all day
      const gone = hopTo(tl, v, { x: v.x, y: v.y }, exit, noise(i, 7) * 1.2, Math.max(v.r, L.room.radius * 0.5), CROSSING);
      tl.set(v, { alpha: 0 }, gone);
    });
    tweenTo(pose, tl, 1.4, 1.2);
    tl.to(view, { roomOn: 0, duration: 0.4 }, 2.8);
    tl.call(() => (arranging = false), [], 3.3);
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
      // one by one over five seconds or so, unhurried: long, low hops (owner review 2026-09-26)
      const depart = 0.5 + (i / L.room.positions.length) * 4.6 + noise(i, 4) * 0.5;
      tl.set(view.room[i], { ...entry, alpha: 1, q: 0 }, depart);
      hopTo(tl, view.room[i], entry, spot, depart, L.room.radius, CROSSING);
    });
    tl.call(() => {
      view.held = t.held;
      view.table = t.table;
    }, [], 1.1);
  }

  /** Scene 10's demonstration rounds, planned for this stage (roomRounds.ts): every round up to the step's last. */
  const roundPlan = $derived.by(() => {
    const w = PAIR_STEPS[current]?.rounds;
    return planRounds(
      { positions: L.room.positions, radius: L.room.radius, box: L.room.box, blue: L.room.blue, red: L.room.red, unit: L.radius(1), g: G },
      w ? w.first + w.count : 1,
    );
  });

  /**
   * The stretch of the demonstration a step plays (`\\pairs`): the whole of it
   * is built, and the step plays its window — a part of the first round as Red
   * tells it, or the rounds after it, quicker. A step arrived at by a jump
   * shows the end of its window.
   */
  function playWindow(tl: Timeline, index: number): void {
    const w = PAIR_STEPS[index].rounds;
    if (!w) return;
    const all = gsap.timeline({ paused: true });
    playRounds(all);
    const [from, to] = windowTimes(w);
    tl.add(all.tweenFromTo(from, to, { duration: (to - from) / w.speed, ease: 'none' }), 0);
  }

  /** A jump to a step inside the demonstration: the room as that step leaves it, the two still out front if their round goes on. */
  function settleWindow(index: number): void {
    const w = PAIR_STEPS[index].rounds;
    if (!w || w.to === 'end') return;
    const all = gsap.timeline({ paused: true });
    playRounds(all);
    all.seek(windowTimes(w)[1], true);
  }

  /**
   * Before the room plays by itself, it plays by hand (owner, 2026-10-09): two
   * at a time step out to the front, grown so the reader sees them, while the
   * rest step back; each puts in a tenth of the poorer one's fortune, the
   * decider is tossed between them, the winner takes both, and they hop home.
   * Nothing it does is kept: the run starts the room fresh.
   */
  function playRounds(tl: Timeline): void {
    const r0 = L.room.radius;
    // coins at the players' scale: a stake about a third of a player across, the decider a little bigger
    const coinR = r0 * OUT_SCALE * 0.32;
    view.fly = roundPlan.flatMap(() => [0, 1].map((k) => ({ x: 0, y: 0, on: 0, face: (k ? 'back' : 'front') as Token['face'], r: coinR })));
    roundPlan.forEach((round, k) => {
      const [a, b] = [view.room[round.a], view.room[round.b]];
      const rest = view.room.filter((_, i) => i !== round.a && i !== round.b && i !== L.room.blue && i !== L.room.red);
      const wins = round.winner === round.a ? [a, b] : [b, a];
      tl.to(rest, { alpha: 0.3, duration: 0.5 }, round.start);
      tl.to([a, b], { r: r0 * OUT_SCALE, duration: 0.7, ease: 'power2.out' }, round.start + 0.1);
      playHops(tl, a, round.outA);
      playHops(tl, b, round.outB);
      // the stakes in: a coin from each, to the middle between them
      const coins = view.fly.slice(2 * k, 2 * k + 2);
      [round.spotA, round.spotB].forEach((spot, j) => {
        tl.set(coins[j], { x: spot.x, y: spot.y, on: 1 }, round.stake);
        tl.to(coins[j], { x: round.coin.x + (j ? 1 : -1) * coinR * 1.2, y: round.coin.y + coinR * 2.2, duration: 0.45, ease: 'power2.inOut' }, round.stake + 0.05);
      });
      // the decider, tossed between them; everyone watches it
      const turns = 4 + k;
      tl.set(view, { flipAt: round.coin, flipR: coinR * 1.35, flipTint: 0, flipLift: 0 }, round.flip - 0.2);
      tl.to(view, { flipOn: 1, duration: 0.2 }, round.flip - 0.2);
      tl.call(() => (cue.air = true), [], round.flip);
      tl.to(view, { flipAngle: `+=${turns * 2 * Math.PI + (k % 2 ? Math.PI : 0)}`, duration: round.landed - round.flip, ease: 'power3.out' }, round.flip);
      tl.to(view, { flipLift: -r0 * OUT_SCALE * 3, duration: (round.landed - round.flip) * 0.5, ease: RISE }, round.flip);
      tl.to(view, { flipLift: 0, duration: (round.landed - round.flip) * 0.5, ease: FALL }, round.flip + (round.landed - round.flip) * 0.5);
      tl.call(() => (cue.air = false), [], round.landed);
      // the winner takes both stakes, and both feel it
      for (const coin of coins) tl.to(coin, { x: wins[0].x, y: wins[0].y, duration: 0.35, ease: 'power2.in' }, round.landed + 0.1);
      tl.set(coins, { on: 0 }, round.landed + 0.45);
      tl.to(wins[0], { r: r0 * OUT_SCALE * Math.sqrt(1 + ROUND_STAKE), duration: 0.35, ease: 'back.out(2)' }, round.landed + 0.45);
      tl.to(wins[1], { r: r0 * OUT_SCALE * Math.sqrt(1 - ROUND_STAKE), duration: 0.35, ease: 'power2.out' }, round.landed + 0.45);
      feelAt(tl, round.landed + 0.45, () => {
        faces.field.react(faces.roomSlot(round.winner), 1, 1 + ROUND_STAKE);
        faces.field.react(faces.roomSlot(round.winner === round.a ? round.b : round.a), 1, 1 - ROUND_STAKE);
      });
      tl.to(view, { flipOn: 0, duration: 0.3 }, round.back);
      // home, their own size again — a tenth richer, a tenth poorer
      playHops(tl, a, round.backA);
      playHops(tl, b, round.backB);
      tl.to(wins[0], { r: r0 * Math.sqrt(1 + ROUND_STAKE), duration: 0.6 }, round.back + 0.1);
      tl.to(wins[1], { r: r0 * Math.sqrt(1 - ROUND_STAKE), duration: 0.6 }, round.back + 0.1);
      tl.to(rest, { alpha: 1, duration: 0.5 }, round.end - 0.3);
    });
    tl.call(() => (view.fly = []), [], roundPlan.at(-1)?.end ?? 0);
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
   * The decider comes out (owner, 2026-10-09: "one side is red, one side is
   * blue. coin changes color and makes a few turns so both sides show and ends
   * with the Marx side"): plain at first, then in its colours — Marx is Red's,
   * the bank is Blue's — turning slowly, twice round, to rest on Marx.
   */
  function present(pose: Pose, tl: Timeline): void {
    tweenTo(pose, tl, 0, 0.4);
    tl.set(view, { flipAngle: 0, flipTint: 0 }, 0.41);
    tl.set(view, { flipTint: 1 }, 0.9);
    tl.to(view, { flipAngle: 4 * Math.PI, duration: PRESENT_MS / 1000 - 1.2, ease: 'sine.inOut' }, 0.9);
  }

  /** When a toss lands, seconds after it starts, if nothing is said over it. */
  const TOSS_LANDS = 2.4;

  /**
   * A toss said over (round one, owner 2026-10-09: "we flip it, coin starts
   * turning. red I win, blue you win. coin lands"): the decider stays up,
   * turning, until the words are said. Seconds it hangs there.
   */
  function tossHang(index: number): number {
    const step = PAIR_STEPS[index];
    const line = step.lines?.[0];
    if (step.action !== 'toss' || !line) return 0;
    return Math.max(0, readOf({ text: say(line.message) }) / 1000 - TOSS_LANDS + 0.4);
  }

  /**
   * The decider goes up turning and comes down on the winner's face. A face
   * only ever changes while the coin is edge-on, and each face wears its
   * owner's colour from the moment it is tossed: Marx is Red's, the bank is
   * Blue's (brief 3.5). Then the table goes to the winner.
   */
  function toss(pose: Pose, tl: ReturnType<typeof gsap.timeline>): void {
    const winner: Speaker = pose.flip === 'blue' ? 'blue' : 'red';
    // both start and watch the coin until it lands, and only then feel the result
    cue.air = true;
    faces.field.startle(BIG);
    faces.field.startle(SMALL);
    const before = { blue: view.held.blue + view.table.blue, red: view.held.red + view.table.red };
    const start = view.flipAngle;
    const turns = 5;
    const hang = tossHang(current);
    const end = start - (start % (2 * Math.PI)) + (turns + Math.round(hang * 2)) * 2 * Math.PI + (winner === 'blue' ? Math.PI : 0);
    const high = -L.whole * 0.9;
    tl.to(view, { flipOn: 1, duration: 0.2 }, 0);
    tl.set(view, { flipTint: 1 }, 0.15);
    tl.to(view, { flipAngle: end, duration: 2.1 + hang, ease: hang ? 'power2.out' : 'power3.out' }, 0.15);
    tl.to(view, { flipLift: high, duration: 0.95, ease: 'power2.out' }, 0.15);
    tl.to(view, { flipLift: 0, duration: 0.9, ease: 'bounce.out' }, 1.1 + hang);
    const landed = TOSS_LANDS + hang;
    tl.call(() => (cue.air = false), [], landed);
    feelAt(tl, landed, () => {
      for (const who of PAIR) faces.field.react(WHO[who], before[who], pose.holdings[who]);
    });
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

  /**
   * The meeting's one clock (owner, 2026-10-09: "they both talk, but do not
   * talk over each other … they inspire the next thing of the next one"): the
   * two take turns, each line answering the other's last, Red first, as the
   * script's two lists are written. One left alone calls at his own pace.
   */
  let callTimer: number | undefined;
  let nextCaller: Speaker = 'red';
  let releaseTimer: number | undefined;

  function stopCalls(): void {
    if (callTimer !== undefined) window.clearTimeout(callTimer);
    callTimer = undefined;
    if (releaseTimer !== undefined) window.clearTimeout(releaseTimer);
    releaseTimer = undefined;
  }

  /** The calling starts: Red opens, a moment after the step. */
  function startCalls(who: readonly Speaker[]): void {
    stopCalls();
    for (const w of who) if (!reader.named[w]) callLevel[w] = -1;
    nextCaller = who.includes('red') ? 'red' : who[0];
    if (stage?.reduced) for (const w of who) callOut(w);
    else callTimer = window.setTimeout(callTurn, 700);
  }

  /** The one whose turn it is calls his next line; the other answers once it is read. */
  function callTurn(): void {
    if (callTimer !== undefined) window.clearTimeout(callTimer);
    callTimer = undefined;
    const waiting = callersOf(PAIR_STEPS[current].id).filter((w) => !reader.named[w]);
    if (waiting.length === 0) return;
    const who = waiting.includes(nextCaller) ? nextCaller : waiting[0];
    callOut(who);
    nextCaller = other(who);
    if (stage?.reduced) return;
    const pool = who === 'red' ? REACTIONS.callRed : REACTIONS.callBlue;
    // two share the decl.tex \nudge between them; one alone takes all of it
    const beat = (waiting.length > 1 ? NUDGE_MS / 2 : NUDGE_MS) * (0.85 + Math.random() * 0.3);
    callTimer = window.setTimeout(callTurn, Math.max(beat, readOf({ text: say(pool[callLevel[who]]) })));
  }

  /** A caller says his next line, a little more insistent, while the reader has not clicked him. */
  function callOut(who: Speaker): void {
    if (reader.named[who]) return;
    const pool = who === 'red' ? REACTIONS.callRed : REACTIONS.callBlue;
    callLevel[who] = Math.min(pool.length - 1, callLevel[who] + 1);
    callAt[who] = performance.now();
  }

  /** The reader clicks a circle: it takes its colours and introduces itself; once both have, the talk moves on. */
  function name(who: Speaker): void {
    const id = CALLS[who];
    if (current !== indexOf(id) || reader.named[who]) return;
    reader.named = { ...reader.named, [who]: true };
    metAt[who] = performance.now();
    gsap.fromTo(view.paint, { [who]: 0 }, { [who]: 1, duration: 0.4, ease: 'back.out(2.5)' });
    if (!callersOf(id).every((w) => reader.named[w])) return;
    // the second introduction is read before the talk goes on
    const intro = who === 'red' ? REACTIONS.introRed : REACTIONS.introBlue;
    const wait = stage?.reduced ? 0 : readOf({ text: say(intro.message), ...withPause(intro) });
    releaseTimer = window.setTimeout(() => stage?.release(id), wait);
  }

  // ---- Scene 5: the reader makes them equal ----------------------------------

  let reacted = { first: false, eleven: false, over: false };
  const holding = $derived(current === indexOf('equal') && !stage?.isReleased('equal') && stage?.index === indexOf('equal'));

  function react(line: { who: Speaker; message: string; feel?: readonly string[] }): void {
    reaction = { id: `react:${line.message}`, who: line.who, at: line.who, text: say(line.message), aside: true, feel: line.feel };
  }

  /**
   * Blue gives his coins up one at a time, and minds every one (owner,
   * 2026-10-09: "he doesn't feel good, still, he loves money, and hard to give
   * it away"): worried at the first, sadder as they go, cross by the end; a
   * coin coming back is a relief.
   */
  function blueFeels(gave: boolean): void {
    if (!gave) {
      faces.feel(WHO.blue, 'glad');
      return;
    }
    const given = reader.held.blue < BLUE_CATCHES ? BLUE_CATCHES - reader.held.blue : 0;
    faces.feel(WHO.blue, given <= 1 ? 'worried' : given <= 4 ? 'sad' : 'annoyed');
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
    if (from === 'blue') blueFeels(true);
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
    if (to === 'blue') blueFeels(false);
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
      react(REACTIONS.equalFirst);
    } else if (held.blue === 11 && !reacted.eleven) {
      reacted.eleven = true;
      react(REACTIONS.equalEleven);
    } else if (held.red > 8 && !reacted.over) {
      reacted.over = true;
      react(REACTIONS.equalOverBlue);
      window.setTimeout(() => {
        if (holding) react(REACTIONS.equalOverRed);
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

  // ---- drawing helpers -------------------------------------------------------

  let seconds = $state(0);

  // ---- faces (owner, 2026-10-07) ---------------------------------------------------

  /** The decider is in the air: a toss sets it as it plays. */
  const cue = $state({ air: false });
  /**
   * The talk steps back while the room runs (owner, 2026-10-07: "no point to
   * have the speech bubble over the running simulation"): it fades before the
   * run starts and stays faded while any run plays; the result brings it back.
   */
  let hush = $state(false);
  const RUN_HUSH = 0.5;
  const hushed = $derived(hush || (run.state.running && !game.playing));

  /** Whose mouth moves, until when on the ambient clock; an aside is said to the reader. */
  let talking = $state<{ who: Speaker; until: number; aside: boolean } | null>(null);
  let lastTalk = '';
  /** When the newest line was said, on the ambient clock. */
  let lineSince = 0;
  $effect(() => {
    const newest = said[said.length - 1];
    if (!newest || newest.id === lastTalk || !newest.at) return;
    lastTalk = newest.id;
    lineSince = untrack(() => seconds);
    talking = { who: newest.at, until: lineSince + talkSeconds(newest.text), aside: !!newest.aside };
    // the feeling it is said with, on the speaker's face
    for (const word of newest.feel ?? []) faces.feel(WHO[newest.at], word);
  });

  /**
   * The newest line still on show (stageFaces `HeldLine`): while its bubble
   * shows it holds the pair's eyes — on each other, or an aside's speaker on
   * the reader — and the room attends to it, each in their own time. An
   * event in the talk does not end it; the next line, or its bubble going, does.
   */
  function heldLine(): HeldLine | null {
    if (hushed) return null;
    for (let k = said.length - 1; k >= 0; k--) {
      const b = said[k];
      if (b.kind === 'event' || b.kind === 'paper' || !b.at) continue;
      if (!placed[k] || placed[k].gone) return null;
      return { who: b.at, aside: !!b.aside, since: b.id === lastTalk ? lineSince : 0 };
    }
    return null;
  }

  /** The reader's pointer over the stage, and when it last moved (ambient clock): a few in the room follow it. */
  let pointer: (Point & { at: number }) | null = null;
  function trackPointer(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') return;
    const p = local(event);
    pointer = { x: p.x, y: p.y, at: seconds };
  }
  /** Everyone's feelings, looks and drawings (stageFaces.ts): the eight, the room's hundred, the matched copies. */
  const faces = new StageFaces(CROWD, 100, BIG, SMALL);
  /** Where faces are drawn: groups placed by the template (`mountFace`), written to by the tick. */
  const board = new FaceBoard();
  const mountFace = board.mount;
  const faceLook = $derived(faceStyle.look);
  /** Where the room stands as people. Elsewhere its members are marks on a chart, and marks have no face. */
  const PEOPLE_MODES: readonly RoomMode[] = ['free', 'equal', 'zero', 'double', 'half', 'one', 'four', 'levy4', 'map'];
  /** The game's sixteen coins, shared equally: a face of normal proportions at the seats. */
  const EQUAL_COINS = (BLUE_CATCHES + RED_CATCHES) / 2;
  /** An equal share's radius: eight coins at the seats, the room's own in the room. */
  const equalR = $derived(L.radius(EQUAL_COINS) + (L.room.radius - L.radius(EQUAL_COINS)) * view.roomOn);
  const peopleStand = $derived(PAIR_STEPS[current].pose.place !== 'room' || PEOPLE_MODES.includes(PAIR_STEPS[current].pose.roomMode));

  /** A face's radius, in quarter pixels, for the overlap rule. */
  const faceSize = (r: number, r0: number) => Math.round(faceRadius(r, r0) * 4) / 4;
  /** Room member `j`'s face: Blue's and Red's seats are their own bodies. */
  const slotOfRoom = (j: number) => (j === L.room.blue ? BIG : j === L.room.red ? SMALL : faces.roomSlot(j));
  const roomSlots = $derived(Int32Array.from(L.room.positions, (_, j) => slotOfRoom(j)));

  /** The matched room's Blue and Red, where they stand in its copy. */
  function mirrorBodies(): [Body, Body] | null {
    if (view.mirrorOn <= 0.01 || PAIR_STEPS[current].pose.roomMode !== 'matched') return null;
    const body = (i: number): Body => {
      const at = matchedAt(1, L.room.positions[i]);
      const r = (mirror.sized ? L.room.radius * Math.sqrt(Math.max(0, mirror.wealth[i]) * 100) : L.room.radius) * matchBox.scale;
      return { x: at.x, y: at.y, r: Math.max(0.5, r), alpha: view.mirrorOn };
    };
    return [body(L.room.blue), body(L.room.red)];
  }

  /** What the faces can see now. */
  function faceScene(): FaceScene {
    const pose = PAIR_STEPS[current].pose;
    const moving: Point[] = [];
    for (const t of view.payout) if (t.on > 0.5) moving.push(t);
    for (const t of view.fly) if (t.on > 0.5) moving.push(t);
    return {
      depth: L.whole * 2.5,
      people: view.people,
      room: view.roomOn > 0.01 && peopleStand ? view.room : null,
      mirror: mirrorBodies(),
      speaker: talking?.who ?? null,
      aside: talking?.aside ?? false,
      facing: pose.place === 'seats',
      coin: cue.air ? { x: (view.flipAt ?? L.flip).x, y: (view.flipAt ?? L.flip).y + view.flipLift } : null,
      moving,
      held: heldLine(),
      // they let go of it a little after it stops
      pointer: pointer && seconds - pointer.at < 2.5 ? pointer : null,
      chat: atEase(),
      // the reel holds them only while it is still spinning
      title: titleCue && atEase() ? (titleCue.live && !timeline?.isActive() ? { ...titleCue, live: false } : titleCue) : null,
    };
  }

  /** The room's colours, as each face is drawn in them. */
  const roomColours = $derived(roomStyles.map((st): FaceColours => ({ stroke: st.stroke, fill: st.fill, fillOpacity: 0.75 })));
  const twinColours = (['blue', 'red'] as const).map((who): FaceColours => ({ stroke: PROTAGONISTS[who].stroke, fill: PROTAGONISTS[who].fill, fillOpacity: 0.75 }));

  /** Every face on show, drawn as it stands now, in one pass; only what changed reaches the page. */
  function paintFaces(now = Infinity): void {
    const look = faceLook;
    const reduced = !!stage?.reduced;
    view.people.forEach((p, i) => {
      // Blue and Red have faces the whole game; the rest while they stand as people
      const faced = look !== 'none' && (whoIs(i) !== null || peopleStand) && p.alpha > 0.01 && p.r > 0.05;
      const named = !!whoIs(i) && view.paint[whoIs(i)!] > 0.5;
      const colours = { stroke: costumeStroke(i), fill: costumeFill(i), fillOpacity: named ? 0.75 : 1 };
      board.render(i, look !== 'none' && faced ? faces.paint(i, look, 'circle', p, equalR, reduced, now) : null, colours);
    });
    const roomFaced = look !== 'none' && view.roomOn > 0.01 && peopleStand;
    view.room.forEach((spot, j) => {
      const faced = roomFaced && j !== L.room.blue && j !== L.room.red && spot.alpha > 0.3 && !!roomStyles[j];
      const slot = faces.roomSlot(j);
      board.render(slot, faced ? faces.paint(slot, look, roomStyles[j].shape, spot, L.room.radius, reduced, now) : null, roomColours[j]);
    });
    const twins = look === 'none' ? null : mirrorBodies();
    (['blue', 'red'] as const).forEach((who, k) => {
      const slot = faces.mirrorSlot(who);
      board.render(slot, twins && look !== 'none' ? faces.paint(slot, look, 'circle', twins[k], L.room.radius * matchBox.scale, reduced, now) : null, twinColours[k]);
    });
  }

  /** The room's frame the faces last saw: each new frame's results are felt, so faces are a moving average of them. */
  let runSeen: Float64Array | null = null;
  let runFrame = -1;
  let runSeeks = 0;
  let runOf: Run | null = null;
  /** Where the matched room's copies last stood in the right room's recording (−1: not yet seen), and its seeks then. */
  let mirrorFrame = -1;
  let mirrorSeeks = 0;
  /** The copies of Blue and Red among the right room's shares; nobody else in it has a face. */
  const mirrorSlots = $derived(Int32Array.from(L.room.positions, (_, j) => (j === L.room.blue ? faces.mirrorSlot('blue') : j === L.room.red ? faces.mirrorSlot('red') : -1)));

  /**
   * Results from the room on screen, felt by everyone in it (stageFaces
   * `followFrames`: playback felt result by result, a seek rebuilt); the
   * richest's contempt rising with their share.
   */
  function followRun(): void {
    const field = faces.field;
    field.contemptTo.fill(0);
    if (!runShown) {
      runSeen = null;
      runOf = null;
      mirrorFrame = -1;
      return;
    }
    const st = shown.state;
    const w = shown.wealth();
    if (runSeen && runOf === shown && runSeen.length === w.length && (st.frame !== runFrame || st.seeks !== runSeeks)) {
      const rec = shown.recording();
      if (rec && rec.frames.length > Math.max(st.frame, runFrame)) faces.followFrames(roomSlots, rec.frames, runFrame, st.frame, st.seeks !== runSeeks);
      // a live room ahead of its recording: what changed since the last look
      else field.reactAll(roomSlots, runSeen, w);
    }
    if (runOf !== shown || st.frame !== runFrame || st.seeks !== runSeeks || !runSeen || runSeen.length !== w.length) {
      runSeen = Float64Array.from(w);
      runFrame = st.frame;
      runSeeks = st.seeks;
      runOf = shown;
    }
    // the richest looks down on everyone: from nothing to all of it as their share reaches the run's 40%
    if (st.winner >= 0) field.contemptTo[slotOfRoom(st.winner)] = Math.min(1, st.share / 0.4);
    // the matched room's copies follow their own room's recording the same way: first seen, or after a seek, as at that moment
    const right = rightRun.recording();
    const ms = rightRun.state;
    if (view.mirrorOn > 0.01 && right && right.frames.length > ms.frame) {
      if (mirrorFrame < 0 || mirrorFrame >= right.frames.length) faces.recallFrames(mirrorSlots, right.frames, ms.frame);
      else if (ms.frame !== mirrorFrame || ms.seeks !== mirrorSeeks) faces.followFrames(mirrorSlots, right.frames, mirrorFrame, ms.frame, ms.seeks !== mirrorSeeks);
      mirrorFrame = ms.frame;
      mirrorSeeks = ms.seeks;
    } else mirrorFrame = -1;
  }

  /** The room's faces as they would be at the moment on screen. */
  function recallRun(): void {
    const rec = shown.recording();
    if (rec) faces.recallFrames(roomSlots, rec.frames, shown.state.frame);
  }

  /**
   * Under reduced motion nothing on a face moves by itself, but the faces still
   * follow what the stage shows (PR #21 review): a room scrubbed to another
   * moment, a step's new sizes and looks, a new line, a resize — each settles
   * them at once.
   */
  let stillKey = '';
  function stillFaces(): void {
    const rooms = runShown ? `${shown.state.revision}:${shown.state.frame}` : '-';
    const mirrored = view.mirrorOn > 0.01 ? `${leftRun.state.revision}:${rightRun.state.revision}` : '-';
    const key = `${current}|${rooms}|${mirrored}|${width}x${height}|${faceLook}|${lastTalk}|${hushed}`;
    if (key === stillKey) return;
    stillKey = key;
    settleFaces();
  }

  let lastTick = 0;
  /** One tick a frame, on the ambient clock: who looks where, feelings and rhythms, then the drawings. */
  function tickFaces(now: number): void {
    // the ambient clock can start before the stage knows the reader asked for no motion: ask every tick
    if (stage?.reduced) {
      stillFaces();
      return;
    }
    const dt = Math.min(0.1, Math.max(0, now - lastTick));
    lastTick = now;
    if (talking && now >= talking.until) talking = null;
    // the coin in the air holds them: the startle lasts the whole flight
    if (cue.air) for (const i of [BIG, SMALL]) faces.field.startle(i, 0.8);
    followRun();
    if (faceLook !== 'none') {
      faces.aim(faceScene(), now, dt);
      faces.field.step(dt);
    }
    paintFaces(now);
  }

  /** A settled stage: everyone at rest, then what this step has just seen, all at once. */
  function settleFaces(): void {
    faces.rest();
    const field = faces.field;
    const pose = PAIR_STEPS[current].pose;
    // a toss that has just played: its result shows until the next stakes
    if (pose.place === 'seats' && (pose.flip === 'blue' || pose.flip === 'red') && pose.table.blue + pose.table.red === 0) {
      let t = current;
      while (t > 0 && PAIR_STEPS[t].action !== 'toss') t--;
      if (t > 0) {
        const before = PAIR_STEPS[t - 1].pose;
        for (const who of PAIR) field.react(WHO[who], before.holdings[who] + before.table[who], PAIR_STEPS[t].pose.holdings[who]);
      }
    }
    // the rain has fallen: what each one caught
    if (pose.crowd === 'paid') CROWD_START.forEach((had, i) => field.react(i, had, RAINED[i]));
    // a room on screen: its last few frames
    runSeen = null;
    runOf = null;
    mirrorFrame = -1;
    if (runShown) recallRun();
    // the line on show, as it was said
    const newest = said[said.length - 1];
    if (newest?.at) for (const word of newest.feel ?? []) faces.feel(WHO[newest.at], word);
    followRun();
    // where everyone looks when settled; with no motion, the same whenever the page was opened
    faces.aim(faceScene(), stage?.reduced ? 0 : seconds, 0);
    field.settle();
    paintFaces();
  }

  // a new look redraws every face at once, motion or not
  $effect(() => {
    void faceLook;
    untrack(paintFaces);
  });

  /**
   * How much of a face shows, 0 … 1, when faces drawn after it may sit on it: it fades as
   * one comes near, so a huddle never wears two faces in one place (the rain's crowd).
   * `faces` are in drawing order, each a centre and a face radius.
   */
  function unhidden(k: number, list: readonly { x: number; y: number; f: number }[]): number {
    const a = list[k];
    let shown = 1;
    for (let j = k + 1; j < list.length; j++) {
      const b = list[j];
      if (b.f <= 0) continue;
      // 1: their features just touch
      const apart = Math.hypot(b.x - a.x, b.y - a.y) / (0.55 * (a.f + b.f));
      shown = Math.min(shown, Math.max(0, Math.min(1, (apart - 0.7) / 0.5)));
    }
    return shown;
  }
  /** The eight in drawing order (Blue and Red last, on top), their faces, and how much of each shows. */
  const peopleOrder = $derived([...view.people.keys()].filter((i) => !whoIs(i)).concat([BIG, SMALL]));
  const personFaces = $derived(peopleOrder.map((i) => ({ x: view.people[i].x, y: view.people[i].y, f: view.people[i].alpha > 0.3 ? faceSize(view.people[i].r, equalR) : 0 })));
  const personShown = $derived.by(() => {
    const out = new Array<number>(CROWD).fill(1);
    peopleOrder.forEach((i, k) => (out[i] = unhidden(k, personFaces)));
    return out;
  });
  /** The richest in the room, when a run shows one and it is not Blue or Red: their face goes on top of everyone's. */
  const roomWinner = $derived.by(() => {
    if (!runShown) return -1;
    const w = shown.state.winner;
    return w >= 0 && w !== L.room.blue && w !== L.room.red ? w : -1;
  });
  /** The room's faces as drawn — largest first, then the richest's on top, then Blue and Red — and how much of each shows. */
  const roomShown = $derived.by(() => {
    const order = roomOrder.filter((i) => i !== roomWinner).concat(roomWinner >= 0 ? [roomWinner] : []);
    const list = [
      ...order.map((i) => {
        const spot = view.room[i];
        const own = i !== L.room.blue && i !== L.room.red && spot.alpha > 0.3;
        return { x: spot.x, y: spot.y, f: own ? faceSize(spot.r, L.room.radius) : 0 };
      }),
      ...[BIG, SMALL].map((i) => ({ x: view.people[i].x, y: view.people[i].y, f: faceSize(view.people[i].r, equalR) })),
    ];
    const out = new Array<number>(view.room.length).fill(0);
    order.forEach((i, k) => (out[i] = list[k].f > 0 ? unhidden(k, list) : 0));
    return out;
  });

  /**
   * Coins drawn inside person `i` of the eight, under their face: the
   * fortunes at the seats, or the four's (Scenes 17 and 22).
   */
  function personCoins(i: number): { count: number; fit: number; opacity: number } | null {
    const who = whoIs(i);
    if (!who) return null;
    const four = fourCoinsOf(who === 'blue' ? L.room.blue : L.room.red);
    if (four !== null) return { count: four, fit: Math.max(view.people[i].r, L.coinRadius), opacity: 1 };
    if (view.coinsOn <= 0.01) return null;
    const count = view.held[who];
    return { count, fit: Math.max(L.minRadius, L.radius(count)), opacity: view.coinsOn };
  }

  /** The coins one of the four holds, by their room seat, while their lesson shows; null otherwise. */
  function fourCoinsOf(j: number): number | null {
    const pose = PAIR_STEPS[current].pose;
    if (pose.place !== 'room') return null;
    const k = cast.four.indexOf(j);
    if (k < 0) return null;
    if (pose.roomMode === 'four') return fourCoins[k];
    if (pose.roomMode === 'levy4' && !arranging) return levyView.coins[k];
    return null;
  }

  /** The winner's picture in the paper: a very contemptuous face in the reader's look. */
  function paperFace(paper: NonNullable<Said['paper']>) {
    return faceLook === 'none' ? null : drawStill(faceLook, paper.style.shape, 10, 10, stillOf(paper.mood ?? CONTEMPT));
  }

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
  function squash(r: number, q: number): string {
    if (Math.abs(q) < 1e-3) return '';
    const { sx, sy } = squashed(q);
    return `translate(0 ${r.toFixed(2)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(0 ${(-r).toFixed(2)})`;
  }

  /**
   * Breath for everyone, and now and then a little hop for the crowd standing
   * about — ambient, on the inner group only. The faces carry the life now
   * (owner, 2026-10-07: "not jump too much … just play with faces"): a hop is
   * rare, a parabola under the stage's gravity, and the breath stretches a
   * body without changing its area, because area is wealth.
   */
  function life(i: number): string {
    if (stage?.reduced) return '';
    const b = breath(seconds, i);
    let hop = 0;
    if (atEase()) {
      const h = 0.3 * view.people[i].r;
      const flight = 2 * fallTime(h, G);
      const every = 7 + noise(i, 30) * 6;
      const t = (seconds + noise(i, 31) * every) % every;
      if (t < flight) hop = Math.max(0, h - (G / 2) * (t - flight / 2) ** 2);
      // a laugh shared with a partner: both hop once, a little
      const laugh = faceLook === 'none' ? -1 : faces.laughing(i, seconds);
      const lh = 0.18 * view.people[i].r;
      const lf = 2 * fallTime(lh, G);
      if (laugh >= 0 && laugh < lf) hop = Math.max(hop, lh - (G / 2) * (laugh - lf / 2) ** 2);
    }
    let shake = 0;
    if (wiggling && whoIs(i) === wiggling.who && seconds < wiggling.until) shake = Math.sin(seconds * 42) * 4;
    const q = squashed(-(b.scale - 1) * 1.5);
    return `translate(${(b.dx + shake).toFixed(2)} ${(b.dy - hop).toFixed(2)}) scale(${(q.sx * pop(i)).toFixed(4)} ${(q.sy * pop(i)).toFixed(4)})`;
  }


  onMount(() => {
    const observer = new ResizeObserver(() => {
      width = host.clientWidth;
      height = host.clientHeight;
      measureTitle();
      // a resize re-lays everything out: draw the current step where it now belongs
      if (!timeline || !timeline.isActive()) draw(poseAt(current));
      paintFaces();
    });
    width = host.clientWidth;
    height = host.clientHeight;
    observer.observe(host);
    stage?.attach(PAIR_STEPS, { play, settle, nudge, hurry, readingMs: readingTime });
    measureTitle();
    void document.fonts?.ready.then(measureTitle);
    recallAnswers();
    loadTuning();
    loadFaceStyle();
    const stopAmbient = ambientClock((s) => {
      seconds = s;
      tickFaces(s);
    }, stage?.reduced ?? false);
    return () => {
      observer.disconnect();
      stopAmbient();
      stopMotion();
      stopCalls();
      stopReveal();
      stopBanter();
      dropPaper();
      for (const r of [run, dialRun, gameRun, leftRun, rightRun]) r.stop();
    };
  });
</script>

{#snippet richest(state: { share: number; trades: number })}
  <!-- the number first, big; what it is, small, on the same line; then when (owner, 2026-10-09) -->
  {@const [before, after = ''] = say('run_richest', { share: '\u0000' }).split('\u0000')}
  <p class="richest">{before}<strong>{formatNumber(state.share, { style: 'percent' })}</strong>{after}</p>
  <p class="after">{say('run_after', { trades: formatNumber(state.trades) })}</p>
{/snippet}

{#snippet histogramPicture()}
  <div class="card-plot">
    <Histogram wealth={shown.wealth()} totalDollars={ROOM_TOTAL_DOLLARS} n={100} revision={shown.state.revision} startDollars={START_DOLLARS} />
  </div>
{/snippet}

{#snippet giniPicture()}
  <div class="card-plot"><LorenzPlot wealth={shown.wealth()} gini={metrics.gini} revision={shown.state.revision} /></div>
{/snippet}

{#snippet participantsPicture()}
  <p class="card-big">{`≈ ${formatNumber(metrics.effectiveParticipants, { maximumFractionDigits: 1 })}`}</p>
{/snippet}

{#snippet turnoverPicture()}
  <div class="card-plot">
    <TurnoverPlot
      rounds={turnover.rounds}
      trades={shown.state.trades}
      title={say('card_turnover_title')}
      xLabel={say('turn_axis_trades')}
      yLabel={say('turn_axis_short')}
    />
  </div>
{/snippet}

{#snippet player(runs: Run[])}
  {@const lead = runs[0]}
  <TimePlayer
    frame={lead.state.frame}
    frames={lead.state.frames}
    playing={lead.state.playing}
    label={say('dial_label', { trades: formatNumber(lead.state.trades) })}
    names={{
      play: say('player_play'),
      pause: say('player_pause'),
      start: say('player_start'),
      end: say('player_end'),
      scrub: say('player_scrub'),
    }}
    onscrub={(f) => runs.forEach((r) => r.scrub(f))}
    onplay={() => runs.forEach((r) => r.play())}
    onpause={() => runs.forEach((r) => r.pause())}
  />
{/snippet}

<!--
  Scene 23's review: each measure the pair has pinned, for both rooms, side by
  side on the same footing — without the levy, then with it (owner, 2026-10-09).
  The newest pinned on top, the earlier ones below it.
-->
{#snippet compared(measures: readonly string[], cell: number)}
  <div class="compared" style={`--cell:${cell.toFixed(0)}px`}>
    {#each [...measures].reverse() as measure, k (measure)}
      <section class="pair-row" class:newest={k === 0} aria-label={say(`card_${measure}_title`)}>
        <p class="pair-title">{say(`card_${measure}_title`)}</p>
        <div class="pair-cells">
          {#each [leftRun, rightRun] as r, side (side)}
            <div class="plot">
              {#if measure === 'histogram'}
                <Histogram wealth={r.wealth()} totalDollars={ROOM_TOTAL_DOLLARS} n={100} revision={r.state.revision} startDollars={START_DOLLARS} />
              {:else if measure === 'gini'}
                <LorenzPlot wealth={r.wealth()} gini={matchMetrics[side].gini} revision={r.state.revision} />
              {:else if measure === 'participants'}
                <div class="stat">
                  <p class="big">{`≈ ${formatNumber(matchMetrics[side].effectiveParticipants, { maximumFractionDigits: 1 })}`}</p>
                  <p class="of">{say('card_participants_title')}</p>
                </div>
              {:else}
                <TurnoverPlot
                  rounds={matchTurnover[side].rounds}
                  trades={r.state.trades}
                  title={say('card_turnover_title')}
                  xLabel={say('turn_axis_trades')}
                  yLabel={say('turn_axis_short')}
                />
              {/if}
            </div>
          {/each}
        </div>
        <p class="pair-sides" class:hidden={k > 0}>
          <span>{say('match_left', { levy: formatNumber(MATCH_LEVY, { style: 'percent', maximumFractionDigits: 1 }) })}</span>
          <span>{say('match_right', { levy: formatNumber(MATCH_LEVY, { style: 'percent', maximumFractionDigits: 1 }) })}</span>
        </p>
      </section>
    {/each}
  </div>
{/snippet}

{#snippet sandboxDeck(folded: boolean)}
  <!-- the sandbox's own dials and stops, in one tidy panel (brief 5.10: "much tidier");
       on a phone it folds to one row, so the room stays in sight and in reach -->
  <div class="deck">
    <div class="deck-buttons">
      {#if sandboxRun.state.playing}
        <button type="button" class="primary" onclick={() => sandboxRun.pause()}>{say('sandbox_pause')}</button>
      {:else}
        <button type="button" class="primary" onclick={sandboxPlay}>{say('sandbox_play')}</button>
      {/if}
      <button type="button" onclick={sandboxNew}>{say('sandbox_new')}</button>
      {#if folded}
        <button type="button" class:on={deckOpen} aria-expanded={deckOpen} onclick={() => (deckOpen = !deckOpen)}>{say('sandbox_dials')}</button>
      {/if}
    </div>
    {#if !folded || deckOpen}
    <div class="deck-dials">
      <StopSlider label={say('dial_name')} bind:value={sb.stake} stops={RATE_STOPS} format={stakeLabel} />
      <StopSlider label={say('sandbox_levy')} bind:value={sb.levy} stops={RATE_STOPS} format={stakeLabel} />
      <StopSlider label={say('sandbox_every')} bind:value={sb.every} stops={EVERY_STOPS} format={(v) => say('sandbox_rounds', { count: v })} />
      <StopSlider label={say('sandbox_speed')} bind:value={sb.speed} stops={SPEEDS} format={(v) => `${v}×`} />
    </div>
    <div class="deck-tap" role="group" aria-label={say('sandbox_tap')}>
      <span>{say('sandbox_tap')}</span>
      <button type="button" class:on={sb.tap === 'levy'} aria-pressed={sb.tap === 'levy'} onclick={() => (sb.tap = 'levy')}>{say('sandbox_tap_levy')}</button>
      <button type="button" class:on={sb.tap === 'photo'} aria-pressed={sb.tap === 'photo'} onclick={() => (sb.tap = 'photo')}>{say('sandbox_tap_photo')}</button>
    </div>
    {#if sb.tap === 'levy'}
      <div class="deck-dials one"><StopSlider label={say('sandbox_take')} bind:value={sb.take} stops={RATE_STOPS} format={stakeLabel} /></div>
    {/if}
    <!-- every face on the stage, now and on the way back up (owner, 2026-10-07); one line, so the charts stay in view -->
    <label class="deck-tap">
      <span>{say('sandbox_faces')}</span>
      <select value={faceLook} onchange={(e) => chooseFace(e.currentTarget.value as FaceChoice)}>
        {#each FACE_CHOICES as choice (choice)}
          <option value={choice}>{say(`sandbox_face_${choice}`)}</option>
        {/each}
      </select>
    </label>
    {/if}
  </div>
{/snippet}

{#snippet stakeDial()}
  <!-- the sandbox's own slider and stops: 0.1% to 99.99% (owner review 2026-09-26); a hand on it holds it in place -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="stake-dial" onpointerdown={() => (dialHeld = true)}>
    <StopSlider label={say('dial_name')} value={dialThumb} stops={RATE_STOPS} format={stakeLabel} onChange={nudgeDial} />
  </div>
{/snippet}

{#snippet giniToy()}
  {#await import('../../../distribution/GiniStage.svelte') then toy}
    <toy.default />
  {/await}
{/snippet}

<svelte:window onpointerup={releaseDial} onpointercancel={releaseDial} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- while the reader's hand is in a live room or on the four's coins, a click anywhere is theirs, never a step -->
<div
  class="pair-scene"
  bind:this={host}
  onpointermove={(event) => {
    dragMove(event);
    fourMove(event);
    trackPointer(event);
  }}
  onpointerdown={(event) => {
    // a tap beside the four lets go of the coin picked up
    if (fourPick !== null && !(event.target as Element).closest('.hit')) fourPick = null;
  }}
  data-control={handsOn ? '' : undefined}>
  <!-- Once the stage is cleared (Scene 5) its words are gone, so their links
       must not stay in the tab order, invisible. -->
  <div class="words" style={`opacity:${view.titleOn}; transform: translateY(${view.lift}px)`} inert={view.titleOn < 0.5}>
    <div class="teletype-slot" style={`opacity:${1 - view.compact}`} inert={view.compact > 0.5}>
      <Teletype
        headline={say(HEADLINE)}
        source={say('open_source')}
        href={SOURCE_URL}
        progress={view.type}
        shown={1}
      />
    </div>

    <!-- In reading order: the common sense first, the question second. -->
    <h1
      class="title"
      class:stacked={titleFit?.lines === 2}
      bind:this={titleEl}
      aria-label={say('open_title')}
      style={`${titleFit ? `--title-size:${titleFit.size.toFixed(1)}px; ` : ''}transform: ${titleFit?.lines === 1 ? slideX(view.titleSlide) : ''}translateY(${(-view.compact * height * 0.18).toFixed(1)}px) scale(${(1 - view.compact * (1 - COMPACT)).toFixed(3)})`}
    >
      <span class="word merit" style={`opacity:${view.meritOn}`} aria-hidden="true">{say('open_title_merit')}</span>
      <span class="word or" style={`opacity:${view.orOn}`} aria-hidden="true">{say('open_title_or')}</span>
      <span
        class="word math"
        bind:this={mathReel}
        style={titleFit?.lines === 2 && view.titleSlide ? `transform: ${slideX(view.titleSlide)}` : undefined}
      >
        <Reel
          words={MATH_WORDS}
          answer={MATH_AT}
          position={view.mathPos}
          shown={view.mathOn}
          onmeasure={(widths) => {
            reelWidths = widths;
            measureTitle();
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
              {@const four = fourCoinsOf(i)}
              <path
                d={svgShapePath(roomStyles[i].shape, Math.max(0.6, spot.r))}
                transform={`translate(${spot.x.toFixed(1)} ${spot.y.toFixed(1)}) ${squash(L.room.radius, spot.q)}`}
                fill={spot.empty > 0.5 ? 'none' : roomStyles[i].fill}
                stroke={roomStyles[i].stroke}
                stroke-dasharray={spot.empty > 0.5 ? '2.5 2.5' : undefined}
                fill-opacity="0.75"
                stroke-width="1.3"
                opacity={spot.alpha}
              />
              {#if four}
                <!-- one of the four: their coins inside them, under a wash, as at the seats (owner, 2026-10-07) -->
                <g transform={`translate(${spot.x.toFixed(1)} ${spot.y.toFixed(1)})`}>
                  {#each pile(four, L.coinRadius, Math.max(spot.r, L.coinRadius)) as c, j (j)}
                    <Coin cx={c.x} cy={c.y} r={L.coinRadius} face={j % 2 ? 'back' : 'front'} />
                  {/each}
                  {#if faceLook !== 'none' && peopleStand}<path d={svgShapePath(roomStyles[i].shape, Math.max(0.6, spot.r))} fill={roomStyles[i].fill} fill-opacity="0.5" />{/if}
                </g>
              {/if}
              <!-- mounted while faces show, faded by opacity: a face that comes and goes costs no new nodes -->
              {#if faceLook !== 'none' && peopleStand && i !== roomWinner}
                <g transform={`translate(${spot.x.toFixed(1)} ${spot.y.toFixed(1)}) ${squash(L.room.radius, spot.q)}`} opacity={spot.alpha * roomShown[i]}>
                  <g class="face" data-slot={faces.roomSlot(i)} use:mountFace={faces.roomSlot(i)}></g>
                </g>
              {/if}
            {/if}
          {/each}
          {#if roomWinner >= 0 && faceLook !== 'none' && peopleStand}
            <!-- the richest's face over everyone's: what the run made them is the news (owner, 2026-10-07) -->
            {@const spot = view.room[roomWinner]}
            <g transform={`translate(${spot.x.toFixed(1)} ${spot.y.toFixed(1)}) ${squash(L.room.radius, spot.q)}`} opacity={spot.alpha * roomShown[roomWinner]}>
              <g class="face" data-slot={faces.roomSlot(roomWinner)} use:mountFace={faces.roomSlot(roomWinner)}></g>
            </g>
          {/if}
        </g>
      {/if}

      {#if view.mirrorOn > 0.01 && PAIR_STEPS[current].pose.roomMode === 'matched'}
        {@const w = mirror.wealth}
        {@const sized = mirror.sized}
        {@const slide = (1 - view.mirrorShift) * (matchBox.lefts[0] - matchBox.lefts[1])}
        <!-- both rooms framed alike; the copy's frame travels with it -->
        <rect class="room-frame" x={matchBox.lefts[0] - 8} y={matchBox.top - 8} width={matchBox.w + 16} height={matchBox.h + 16} rx="12" opacity={view.mirrorOn} />
        <rect
          class="room-frame"
          x={matchBox.lefts[1] - 8 + slide}
          y={matchBox.top - 8}
          width={matchBox.w + 16}
          height={matchBox.h + 16}
          rx="12"
          opacity={view.mirrorOn}
        />
        <g class="mirror" opacity={view.mirrorOn} transform={`translate(${slide.toFixed(1)} 0)`}>
          {#each L.room.positions as p, i (i)}
            {@const at = matchedAt(1, p)}
            {@const r = Math.max(0.5, (sized ? L.room.radius * Math.sqrt(Math.max(0, w[i]) * 100) : L.room.radius) * matchBox.scale)}
            {@const style = styleOfRoom(i)}
            <path
              d={svgShapePath(style.shape, r)}
              transform={`translate(${at.x.toFixed(1)} ${at.y.toFixed(1)})`}
              fill={style.fill}
              stroke={style.stroke}
              fill-opacity="0.75"
              stroke-width={i === L.room.blue || i === L.room.red ? 2.2 : 1.1}
            />
            {#if (i === L.room.blue || i === L.room.red) && faceLook !== 'none'}
              <g transform={`translate(${at.x.toFixed(1)} ${at.y.toFixed(1)})`} class="face" data-mirror={i === L.room.blue ? 'blue' : 'red'} use:mountFace={faces.mirrorSlot(i === L.room.blue ? 'blue' : 'red')}></g>
            {/if}
          {/each}
        </g>
        <g class="match-labels" opacity={view.mirrorShift}>
          {#each [0, 1] as side (side)}
            {@const label = say(side === 0 ? 'match_left' : 'match_right', { levy: formatNumber(MATCH_LEVY, { style: 'percent', maximumFractionDigits: 1 }) })}
            <!-- a label wider than its room breaks after its first comma -->
            {@const parts = matchBox.w < 260 && label.includes(', ') ? [label.slice(0, label.indexOf(', ') + 1), label.slice(label.indexOf(', ') + 2)] : [label]}
            <text x={matchBox.lefts[side] + matchBox.w / 2} y={matchBox.top - 10 - (parts.length - 1) * 15} text-anchor="middle"
              >{#each parts as part, k (k)}<tspan x={matchBox.lefts[side] + matchBox.w / 2} dy={k ? 15 : 0}>{part}</tspan>{/each}</text
            >
            <text class="count" x={matchBox.lefts[side] + matchBox.w / 2} y={matchBox.top + matchBox.h + 22} text-anchor="middle"
              >{say('stop_meter', { count: side === 0 ? matchCounts.a : matchCounts.b })}</text
            >
          {/each}
        </g>
      {/if}

      {#if PAIR_STEPS[current].pose.roomMode === 'map' && view.mapOn > 0.001}
        {@const m = mapBox}
        <g class="map" role="img" aria-label={say(MAP_LABEL)}>
          {#each MAP_PARTICIPANTS as row, iy (iy)}
            {#each row as count, ix (ix)}
              {#if view.mapOn >= MAP_ORDER[iy][ix]}
                <rect x={m.x + ix * m.cw} y={m.y + m.side - (iy + 1) * m.ch} width={m.cw - 1} height={m.ch - 1} fill={mapColour(count)}>
                  <title>{`${formatNumber(MAP_STAKES[ix], { style: 'percent' })} · ${formatNumber(MAP_LEVIES[iy], { style: 'percent' })} → ${formatNumber(count, { maximumFractionDigits: 0 })}`}</title>
                </rect>
              {/if}
            {/each}
          {/each}
          {#if PAIR_STEPS[current].pose.map >= 2 && mapCurve}
            <path class="fit" d={mapCurve} />
          {/if}
          <StageAxes
            frame={{ x: m.x, y: m.y, w: m.side, h: m.side }}
            x={{ lo: MAP_STAKES[0] - 0.025, hi: MAP_STAKES[MAP_STAKES.length - 1] + 0.025, ticks: [0.1, 0.2, 0.3, 0.4, 0.5], format: pct, label: say('map_stake') }}
            y={{ lo: MAP_LEVIES[0] - 0.005, hi: MAP_LEVIES[MAP_LEVIES.length - 1] + 0.005, ticks: [0, 0.02, 0.04, 0.06, 0.08, 0.1, 0.12, 0.14], format: pct, label: say('map_levy') }}
            grid={false}
          />
          <g class="legend" transform={`translate(${m.x + m.side / 2 - GINI_RAMP.length * 8} ${m.y + m.side + 50})`}>
            {#each GINI_RAMP as colour, k (k)}
              <rect x={k * 16} y="0" width="15" height="8" fill={colour} />
            {/each}
            <text class="tick" x="-6" y="8" text-anchor="end">{say('map_many')}</text>
            <text class="tick" x={GINI_RAMP.length * 16 + 6} y="8">{say('map_few')}</text>
          </g>
          {#if PAIR_STEPS[current].pose.map >= 2 && MAP_FIT}
            {@const b = MAP_STAKES[MAP_STAKES.length - 1]}
            {@const t = Math.min(MAP_FIT.c * b * b, MAP_LEVIES[MAP_LEVIES.length - 1])}
            <text class="fit-label" x={m.x + m.side - 4} y={m.y + m.side - (t / MAP_LEVIES[MAP_LEVIES.length - 1]) * (m.side - m.ch) - m.ch / 2 - 10} text-anchor="end"
              >{say('map_half')}</text
            >
          {/if}
        </g>
      {/if}

      {#if PAIR_STEPS[current].pose.roomMode === 'line' && eater && !arranging}
        <!-- the running total as one circle: its area is everyone it has eaten -->
        <circle class="eater" cx={eater.x} cy={eater.y} r={eater.r} />
      {/if}

      {#each peopleOrder as i (i)}
        {@const person = view.people[i]}
        {#if person.alpha > 0.01 && person.r > 0.05}
          {@const coins = personCoins(i)}
          <g transform={`translate(${person.x.toFixed(2)} ${person.y.toFixed(2)})`} opacity={person.alpha}>
            <g transform={squash(person.r, person.q)}>
            <g transform={life(i)}>
              {#if whoIs(i) && person.empty <= 0.5}
                <!-- the two who stay are a little less see-through, and on top of everyone (owner, 2026-10-07) -->
                <circle r={person.r} fill={GROUND} fill-opacity="0.6" />
              {/if}
              <circle
                r={person.r}
                fill={person.empty > 0.5 ? 'none' : costumeFill(i)}
                stroke={costumeStroke(i)}
                stroke-dasharray={person.empty > 0.5 ? '3 3' : undefined}
                fill-opacity={whoIs(i) && view.paint[whoIs(i)!] > 0.5 ? 0.75 : 1}
                stroke-width={strokeWidth(i)}
                vector-effect="non-scaling-stroke"
              />
              {#if coins && coins.count > 0}
                <g opacity={coins.opacity}>
                  {#each pile(coins.count, L.coinRadius, coins.fit) as spot, k (k)}
                    <Coin cx={spot.x} cy={spot.y} r={L.coinRadius} face={k % 2 ? 'back' : 'front'} />
                  {/each}
                </g>
              {/if}
              {#if coins && coins.count > 0 && faceLook !== 'none'}
                <!-- the coins lie under the skin: a wash of the body's own colour, so the face reads on top -->
                <circle r={person.r} fill={costumeFill(i)} fill-opacity={0.5 * coins.opacity} />
              {/if}
              <!-- the face: drawn by the frame's tick (stageFaces.ts), not by a component -->
              <g class="face" opacity={personShown[i]} use:mountFace={i}></g>
            </g>
            </g>
          </g>
        {/if}
      {/each}

      {#if runShown && shown.state.winner >= 0 && PAIR_STEPS[current].pose.roomMode === 'free' && !arranging}
        {@const spot = roomSpot(shown.state.winner)}
        <!-- the dashed ring means "the richest", as everywhere in the essay -->
        <path
          class="halo"
          d={svgShapePath(styleOfRoom(shown.state.winner).shape, agentView(shown.state.winner).r + 6)}
          transform={`translate(${spot.x.toFixed(1)} ${spot.y.toFixed(1)})`}
          fill="none"
          stroke="var(--ink-mid)"
          stroke-width="1.4"
          stroke-dasharray="4 4"
          stroke-linejoin="round"
        />
      {/if}

      {#if PAIR_STEPS[current].pose.place === 'room'}
        {@const pose = PAIR_STEPS[current].pose}
        {@const box = L.room.box}
        {#if pose.roomMode === 'piles' || pose.roomMode === 'ruler' || Object.values(view.ticks).some((t) => t.alpha > 0.01)}
          {@const axisY = pose.roomMode === 'ruler' ? rulerPose.axisY : pilesPose.axisY}
          <g class="ruler">
            <line x1={box.x} x2={box.x + box.w} y1={axisY} y2={axisY} />
            {#if !arranging}
              <text class="axis-label" x={box.x + box.w} y={axisY + 36} text-anchor="end">{say('sort_axis_money')}</text>
              {#if box.x >= 28}
                <!-- where there is a margin for it: a phone's piles start at its edge -->
                <text class="axis-label" transform={`translate(${box.x - 14} ${(box.y + axisY) / 2}) rotate(-90)`} text-anchor="middle">{say('sort_axis_people')}</text>
              {/if}
            {/if}
            {#each Object.entries(view.ticks) as [key, tick] (key)}
              {#if tick.alpha > 0.01 && Number.isFinite(tick.x)}
                {@const label = [...pilesPose.ticks, ...rulerPose.ticks].find((t) => t.key === key)?.label ?? ''}
                <g opacity={tick.alpha} transform={`translate(${tick.x.toFixed(1)} ${axisY})`}>
                  <line y1="0" y2="5" />
                  <text y="18" text-anchor={key === 'round-0' ? 'start' : 'middle'}>{label}</text>
                </g>
              {/if}
            {/each}
          </g>
        {/if}
        {#if pose.roomMode === 'piles' && !arranging}
          <g class="counts">
            {#each pilesPose.piles as pile, b (b)}
              {#if pile.count > 0}
                <text x={(pile.x0 + pile.x1) / 2} y={pile.top} text-anchor="middle">{formatNumber(pile.count)}</text>
              {/if}
            {/each}
          </g>
        {/if}
        {#if pose.roomMode === 'ruler' && !arranging && rulerPose.dust.count > 0}
          <g class="dust">
            <rect x={rulerPose.dust.x} y={rulerPose.dust.y} width={rulerPose.dust.w} height={rulerPose.dust.h} rx="5" />
            <text x={rulerPose.dust.x + rulerPose.dust.w / 2} y={rulerPose.dust.y - 6} text-anchor="middle">
              {`< ${formatNumber(0.01, { style: 'currency', currency: 'USD' })}: ${formatNumber(rulerPose.dust.count)}`}
            </text>
          </g>
        {/if}
        {#if pose.roomMode === 'line' && !arranging}
          {@const quarters = [0, 0.25, 0.5, 0.75, 1]}
          <g class="appear">
            <StageAxes
              frame={linePose.frame}
              x={{ lo: 0, hi: 1, ticks: quarters, format: pct, label: say('gini_axis_people') }}
              y={{ lo: 0, hi: 1, ticks: quarters, format: pct, label: say('gini_axis_money') }}
              sharedZero
              xLabelY={linePose.labelY}
            />
          </g>
        {/if}
        {#if pose.roomMode === 'line' && view.lorenzDraw > 0}
          <!-- drawn exactly as far as the walk has added up: its tip is the running total (owner, 2026-10-09) -->
          {@const drawn = view.lorenzDraw >= 1 ? linePose.curve : linePose.curve.slice(0, walker.k + 1)}
          {@const curve = drawn.map((p, k) => `${k ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')}
          <g class="lorenz">
            {#if pose.lorenz >= 3}
              {@const [d0, d1] = linePose.diagonal}
              <path
                class="gap"
                d={`M${d0.x} ${d0.y} L${d1.x} ${d1.y} ${linePose.curve
                  .slice()
                  .reverse()
                  .map((p) => `L${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
                  .join(' ')} Z`}
              />
            {/if}
            {#if pose.lorenz >= 2}
              <line class="diagonal" x1={linePose.diagonal[0].x} y1={linePose.diagonal[0].y} x2={linePose.diagonal[1].x} y2={linePose.diagonal[1].y} />
            {/if}
            <path class="curve" d={curve} />
            {#if pose.lorenz >= 3}
              <text class="gini" x={linePose.frame.x + linePose.frame.w * 0.06} y={linePose.frame.y + linePose.frame.h * 0.12}>
                {`Gini ${formatNumber(metrics.gini, { maximumFractionDigits: 2 })}`}
              </text>
            {/if}
          </g>
        {/if}
      {/if}

      {#if PAIR_STEPS[current].pose.place === 'room'}
        {@const mode = PAIR_STEPS[current].pose.roomMode}
        {@const box = L.room.box}
        {#if mode === 'line' && view.lorenzDraw > 0 && view.lorenzDraw < 1 && walker.k > 0}
          <!-- the walk: added up, poorest first, each point plotted as it is
               reached and read off both axes (owner review 2026-09-26: the
               running total must not eat the line) -->
          {@const f = linePose.frame}
          <g class="walker">

            {#each linePose.curve.slice(1, walker.k + 1) as p, k (k)}
              <circle class="dot" cx={p.x} cy={p.y} r="1.8" />
            {/each}
            <line class="guide" x1={walker.point.x} y1={f.y + f.h} x2={walker.point.x} y2={walker.point.y} />
            <line class="guide" x1={f.x} y1={walker.point.y} x2={walker.point.x} y2={walker.point.y} />
            <circle class="total" cx={walker.point.x} cy={walker.point.y} r="4.5" />
            <text class="read" x={walker.point.x + 5} y={f.y + f.h - 6}>{pct(walker.people)}</text>
            <text class="read" x={f.x + 5} y={walker.point.y - 6}>{pct(walker.share)}</text>
          </g>
        {/if}
        {#if mode === 'four'}
          {#each cast.four as agent, k (agent)}
            {@const v = agentView(agent)}
            <g transform={`translate(${v.x.toFixed(1)} ${v.y.toFixed(1)})`}>
              {#if fourPick === k}<circle class="pick" r={v.r + 7} />{/if}
            </g>
          {/each}
        {/if}
        {#if mode === 'levy4' && !arranging}
          {@const pool = poolSpot()}
          <g class="pool" transform={`translate(${pool.x.toFixed(1)} ${pool.y.toFixed(1)})`}>
            <circle r={L.radius(8) + 4} />
            {#each pile(levyView.pool, L.coinRadius, L.radius(8)) as c, j (j)}
              <Coin cx={c.x} cy={c.y} r={L.coinRadius} face={j % 2 ? 'back' : 'front'} />
            {/each}
            <text y={L.radius(8) + 22} text-anchor="middle">{say('levy_pool')}</text>
          </g>
          {#each cast.four as agent, k (agent)}
            {@const v = agentView(agent)}
            <g transform={`translate(${v.x.toFixed(1)} ${v.y.toFixed(1)})`}>
              <text class="coin-count" y={Math.max(v.r, L.coinRadius) + 18} text-anchor="middle">{formatNumber(levyView.coins[k])}</text>
            </g>
          {/each}
        {/if}
        {#if view.turnDraw > 0.001 && turnover.rounds.length > 1}
          {@const chart = { x: box.x + 64, y: box.y + box.h * 0.1, w: box.w - 84, h: box.h * 0.72 }}
          {@const n = turnover.rounds.length}
          {@const drawn = Math.max(2, Math.round(view.turnDraw * n))}
          {@const trades = Math.max(1, shown.state.trades)}
          {@const top = turnover.max * 1.1}
          <g class="turnover" opacity={Math.min(1, view.turnDraw * 3)}>
            <StageAxes
              frame={chart}
              x={{ lo: 0, hi: trades, ticks: niceLinearTicks(0, trades, 4), format: compactNumber, label: say('turn_axis_trades') }}
              y={{ lo: 0, hi: top, ticks: niceLinearTicks(0, top, 4), format: (v) => formatNumber(v, { style: 'percent', maximumFractionDigits: 1 }), label: say('turn_axis_share') }}
            />
            <polyline
              points={turnover.rounds
                .slice(0, drawn)
                .map((t, k) => `${(chart.x + ((k + 1) / n) * chart.w).toFixed(1)},${(chart.y + chart.h - (t / top) * chart.h).toFixed(1)}`)
                .join(' ')}
            />
          </g>
        {/if}
      {/if}

      {#each ripples as ripple (ripple.id)}
        <circle class="ripple" cx={ripple.x} cy={ripple.y} r={ripple.r} style={`--ink:${ripple.ink}`} />
      {/each}

      {#if PAIR_STEPS[current].pose.control === 'tax'}
        <!-- the tax game: where to start, what a tap takes, and the pool going back to everyone -->
        {#if game.playing && game.elapsed < 4500 && topFive.length}
          {@const v = agentView(topFive[0])}
          <circle class="pulse" cx={v.x} cy={v.y} r={Math.max(v.r, 10) + 6} />
        {/if}
        {#each returns as ring (ring.id)}
          <circle class="pool-return" cx={ring.x} cy={ring.y} r={ring.r} />
        {/each}
        {#each taken as t (t.id)}
          <text class="taken" x={t.x} y={t.y} text-anchor="middle">{formatNumber(-GAME.rate, { style: 'percent' })}</text>
        {/each}
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
        {#if token.on > 0}<Coin cx={token.x} cy={token.y} r={token.r ?? L.coinRadius} face={token.face} />{/if}
      {/each}

      {#if dragging}
        <g class="dragged"><Coin cx={dragging.x} cy={dragging.y} r={L.coinRadius * 1.1} face="front" /></g>
      {/if}
      {#if fourDrag?.moved}
        <g class="dragged"><Coin cx={fourDrag.x} cy={fourDrag.y} r={L.coinRadius * 1.1} face="front" /></g>
      {/if}

      {#if view.flipOn > 0.01}
        {@const face = deciderFace(view.flipAngle)}
        {@const spot = view.flipAt ?? L.flip}
        <g transform={`translate(${spot.x} ${(spot.y + view.flipLift).toFixed(2)})`} opacity={view.flipOn}>
          <g transform={`scale(${face.squash.toFixed(3)} 1)`}>
            <Coin
              r={view.flipR || L.coinRadius * 1.6}
              face={face.side === 'red' ? 'front' : 'back'}
              tint={view.flipTint > 0.5 ? PROTAGONISTS[face.side].fill : undefined}
            />
          </g>
        </g>
      {/if}
    </svg>

    {#if !L.column && PAIR_STEPS[current].pose.roomMode === 'matched' && PAIR_STEPS[current].pose.compare.length > 0}
      <!-- a phone has no column: the newest measure of the review, both rooms' numbers, over the rooms -->
      {@const measure = PAIR_STEPS[current].pose.compare.at(-1)!}
      {@const value = (side: number) =>
        measure === 'gini'
          ? formatNumber(matchMetrics[side].gini, { maximumFractionDigits: 2 })
          : measure === 'participants'
            ? `≈ ${formatNumber(matchMetrics[side].effectiveParticipants, { maximumFractionDigits: 1 })}`
            : measure === 'turnover'
              ? formatNumber(matchTurnover[side].recent, { style: 'percent', maximumFractionDigits: 2 })
              : formatNumber(matchMetrics[side].topShare, { style: 'percent', maximumFractionDigits: 0 })}
      <div class="compare-strip" style={`top:${matchBox.top + matchBox.h + 34}px`}>
        <p class="pair-title">{say(`card_${measure}_title`)}</p>
        <p class="pair-values"><b>{value(0)}</b><b>{value(1)}</b></p>
      </div>
    {/if}

    {#if !L.column && PAIR_STEPS[current].pose.control === 'sandbox'}
      <div class="dial phone deck-phone">{@render sandboxDeck(true)}</div>
    {:else if !L.column && !inPicture && PAIR_STEPS[current].pose.place === 'room' && (dialHere || (runShown && shown.state.done && shown.state.frames > 1 && current > indexOf('run')))}
      <div class="dial phone">
        {#if runShown && shown.state.done && shown.state.frames > 1}{@render player([shown])}{/if}
        {#if dialHere}{@render stakeDial()}{/if}
      </div>
    {/if}

    {#if PAIR_STEPS[current].pose.control === 'tax' && (game.playing || game.result)}
      {@const box = L.room.box}
      {@const low = metrics.effectiveParticipants < GAME.target}
      <!-- over the middle of the room's top, where it is seen (owner, 2026-10-09); on a phone the talk covers that, so at its foot -->
      <div class="meter" class:low style={`left:${box.x + box.w / 2}px; top:${L.column ? box.y + 6 : box.y + box.h - 58}px`} aria-live="off">
        <span>{say('stop_meter', { count: formatNumber(metrics.effectiveParticipants, { maximumFractionDigits: 0 }) })}</span>
        <span class="clock" aria-hidden="true"><span style={`inline-size:${Math.max(0, 1 - game.elapsed / (GAME.seconds * 1000)) * 100}%`}></span></span>
      </div>
    {/if}

    {#if PAIR_STEPS[current].id === 'stop.how' && !game.playing}
      {@const box = L.room.box}
      <!-- the game's start, as big as the room's middle: the bubble's link alone was easy to miss -->
      <button type="button" class="start-game" style={`left:${box.x + box.w / 2}px; top:${box.y + box.h / 2}px`} onclick={startGame}>
        {say(REACTIONS.stopStart)}
      </button>
    {/if}

    {#if tapping}
      {@const box = L.room.box}
      <!-- a tap on any fortune; the five largest are buttons for the keyboard -->
      <div
        class="taps"
        data-control
        role="presentation"
        style={`left:${box.x}px; top:${box.y}px; width:${box.w}px; height:${box.h}px`}
        onpointerdown={tapAt}
      ></div>
      {#each topFive as i (i)}
        {@const v = agentView(i)}
        {@const r = Math.max(v.r, 14)}
        <button
          type="button"
          class="hit tap"
          style={`left:${v.x - r}px; top:${v.y - r}px; width:${r * 2}px; height:${r * 2}px;`}
          aria-label={PAIR_STEPS[current].pose.control === 'sandbox' && sb.tap === 'photo'
            ? `${say('sandbox_tap_photo')} ${formatNumber(shown.wealth()[i], { style: 'percent', maximumFractionDigits: 1 })}`
            : say('stop_tap', { share: formatNumber(shown.wealth()[i], { style: 'percent', maximumFractionDigits: 1 }) })}
          onclick={() => tapRoom(i)}
        ></button>
      {/each}
    {/if}

    {#if !L.column && runShown && current <= actEnd('run')}
      <div class="readout" aria-live="off">{@render richest(run.state)}</div>
    {/if}

    {#if anyRunning && !game.playing}
      {@const box = L.room.box}
      <!-- the only way to cut a run short: a stray click or scroll no longer does -->
      {#key skipCalled}
        <button type="button" class="skip" class:called={skipCalled > 0} style={`left:${box.x + box.w - 10}px; top:${box.y + 10}px`} onclick={skipRuns}>
          {say('run_skip')}
        </button>
      {/key}
    {/if}

    {#if current === indexOf('eff.try')}
      {#each cast.four as agent, k (agent)}
        {@const v = agentView(agent)}
        {@const r = Math.max(v.r, 28)}
        <button
          type="button"
          class="hit four"
          style={`left:${v.x - r}px; top:${v.y - r}px; width:${r * 2}px; height:${r * 2}px;`}
          aria-pressed={fourPick === k}
          aria-label={`${formatNumber(fourCoins[k])} ${fourPick === null ? '' : '←'}`}
          onclick={() => tapFour(k)}
          onpointerdown={(e) => fourDown(e, k)}
          onpointerup={fourUp}
        ></button>
      {/each}
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

    <!-- while the game plays, the talk steps back and lets taps through to the room -->
    <div class="bubbles" class:through={game.playing} class:hushed aria-live="polite">
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
            aside={bubble.aside ?? false}
            maxWidth={bubble.pictures?.length
              ? Math.min(460, column.right - column.left - 16)
              : span && !bubble.aside && bubble.at
                ? Math.min(bubbleWidth, span.right - span.left)
                : bubbleWidth}
            gone={place.gone}
            shown={bubble.id === reveal.id ? reveal.shown : Infinity}
            choices={bubble.choices}
            pictures={bubble.pictures?.flatMap((name) => (POSTED[name] ? [POSTED[name]] : []))}
            control={bubble.control}
            onsize={(w, h) => (sizes[bubble.id] = { w, h })}
            onrest={(on) => stage?.pause(on)}
            reduced={stage?.reduced ?? false}
          />
        {/if}
      {/each}
    </div>

    {#if bigPaper}
      {@const portrait = paperFace(bigPaper)}
      <article class="big-paper" bind:this={bigEl} aria-hidden="true">
        <p class="big-masthead">{bigPaper.masthead}</p>
        <div class="big-spread">
          <svg class="big-photo" viewBox="-14 -14 28 28">
            <path d={svgShapePath(bigPaper.style.shape, 10)} fill={bigPaper.style.fill} stroke={bigPaper.style.stroke} stroke-width="1.4" />
            {#if portrait}<AgentFace drawing={portrait} fill={bigPaper.style.fill} stroke={bigPaper.style.stroke} uid="face-paper" />{/if}
          </svg>
          <div>
            <p class="big-headline">{bigPaper.text}</p>
            <p class="big-source">{bigPaper.source}</p>
          </div>
        </div>
      </article>
    {/if}

    {#if L.column && PAIR_STEPS[current].pose.place === 'room'}
      {@const col = L.column}
      {@const pose = PAIR_STEPS[current].pose}
      <aside class="charts" style={`left:${col.x}px; top:${col.y}px; width:${col.w}px; max-height:${col.h}px`}>
        {#if pose.cards.includes('rule') && !pose.ran}
          {@const rule = cardFor('rule')}
          {#if rule}
            <section class="chart rule" class:glow={pose.cardOpen === 'rule'}>
              <h3>{rule.title}</h3>
              <ol>{#each rule.lines as line, k (k)}<li>{line}</li>{/each}</ol>
            </section>
          {/if}
        {/if}
        {#if pose.control === 'sandbox'}
          <section class="chart live">
            {#if runShown}
              {@render richest(shown.state)}
            {/if}
            {#if shown.state.done && !shown.state.playing && shown.state.frames > 1}
              <div class="dial">{@render player([shown])}</div>
            {/if}
            {@render sandboxDeck(false)}
          </section>
        {:else if runShown && pose.roomMode === 'matched'}
          {#if leftRun.state.done && leftRun.state.frames > 1}
            <section class="chart live"><div class="dial">{@render player([leftRun, rightRun])}</div></section>
          {/if}
          {#if pose.compare.length > 0}
            {@render compared(pose.compare, (L.column.w - 24) / 2)}
          {/if}
        {:else if runShown && !APART.includes(pose.roomMode)}
          <section class="chart live">
            {@render richest(shown.state)}
            {#if shown.state.done && shown.state.frames > 1}
              <div class="dial">{@render player([shown])}</div>
            {/if}
            {#if dialHere}{@render stakeDial()}{/if}
          </section>
        {/if}
        {#if !APART.includes(pose.roomMode) && pose.thumbs.length > 0}
          <!-- the sandbox's own plots, properly framed (owner review 2026-09-26) -->
          <div class="plots" style={`--cell:${plotCell.toFixed(0)}px`}>
            {#each pose.thumbs as thumb (thumb)}
              <section class="plot" aria-label={say(`card_${thumb}_title`)}>
                {#if thumb === 'histogram'}
                  <Histogram wealth={shown.wealth()} totalDollars={ROOM_TOTAL_DOLLARS} n={100} revision={shown.state.revision} startDollars={START_DOLLARS} />
                {:else if thumb === 'gini'}
                  <LorenzPlot wealth={shown.wealth()} gini={metrics.gini} revision={shown.state.revision} />
                {:else if thumb === 'participants'}
                  <div class="stat">
                    <p class="big">{`≈ ${formatNumber(metrics.effectiveParticipants, { maximumFractionDigits: 1 })}`}</p>
                    <p class="of">{say('card_participants_title')}</p>
                  </div>
                {:else}
                  <TurnoverPlot
                    rounds={turnover.rounds}
                    trades={shown.state.trades}
                    title={say('card_turnover_title')}
                    xLabel={say('turn_axis_trades')}
                    yLabel={say('turn_axis_short')}
                  />
                {/if}
              </section>
            {/each}
          </div>
        {/if}
      </aside>
    {/if}


    {#if tuning.debug}
      <DebugPanel lines={debugLines} onreplay={() => stage?.replay('run')} />
    {/if}

    <CardStack
      {cards}
      open={cardOpen}
      ontoggle={(id) => {
        cardOpen = id;
        if (id !== cardPlaying) cardPlaying = null;
      }}
      playing={cardPlaying}
      onplay={(id) => (cardPlaying = id)}
      playLabel={say('card_play')}
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
    /* em, so the words keep their places at every size (TITLE_GAP); no gap between two lines */
    gap: 0 0.16em;
    margin: 0;
    font-family: var(--font-serif);
    /* the scene sizes it (titleFit); this only until its words are measured */
    font-size: var(--title-size, clamp(2.4rem, min(11.5vw, 19svh), 10rem));
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

  /* MERIT OR over MATH, on a narrow stage */
  .title.stacked {
    flex-wrap: wrap;
  }

  .title.stacked .word.math {
    flex-basis: 100%;
    text-align: center;
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

  .ruler line {
    stroke: var(--ink-mid);
    stroke-width: 1.2;
  }

  .ruler text,
  .counts text,
  .dust text,
  .lorenz text {
    fill: var(--ink-mid);
    font-family: var(--font-sans);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  }

  .counts text {
    fill: var(--ink);
    font-size: 12px;
    font-weight: 700;
  }

  .dust rect {
    fill: none;
    stroke: var(--line);
    stroke-dasharray: 3 3;
  }

  .lorenz .curve {
    fill: none;
    stroke: var(--accent);
    stroke-width: 2.4;
    stroke-linejoin: round;
  }

  .lorenz .diagonal {
    stroke: var(--ink-soft);
    stroke-width: 1.2;
    stroke-dasharray: 5 5;
  }

  .lorenz .gap {
    fill: rgb(139 63 43 / 12%);
    stroke: none;
  }

  .lorenz .gini {
    fill: var(--accent-deep);
    font-size: 16px;
    font-weight: 750;
  }

  /* a card's plot: the sandbox's square frame, at a size the card can hold */
  .card-plot {
    inline-size: min(100%, 12rem);
    aspect-ratio: 1;
    margin-inline: auto;
  }

  .card-big {
    margin: 0;
    color: var(--accent-deep);
    font-family: var(--font-sans);
    font-size: 1.9rem;
    font-weight: 800;
    text-align: center;
  }

  .walker .dot {
    fill: var(--accent);
  }

  .walker .total {
    fill: var(--accent);
    stroke: var(--paper-bright, #fffaf0);
    stroke-width: 1.5;
  }

  .eater {
    fill: rgb(139 63 43 / 16%);
    stroke: var(--accent);
    stroke-width: 1.6;
  }

  .walker .guide {
    stroke: var(--accent);
    stroke-width: 1.1;
    stroke-dasharray: 3 3;
  }

  .walker .read {
    fill: var(--accent-deep);
    font-family: var(--font-sans);
    font-size: 12px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .appear {
    animation: fade-in 600ms ease-out both;
  }

  .ruler .axis-label {
    fill: var(--ink-soft);
    font-family: var(--font-sans);
    font-size: 12px;
    letter-spacing: 0.04em;
  }

  .pick {
    fill: none;
    stroke: var(--accent);
    stroke-width: 2;
    stroke-dasharray: 5 4;
  }

  .turnover polyline {
    fill: none;
    stroke: var(--accent);
    stroke-width: 2.4;
    stroke-linejoin: round;
  }

  /* Scene 20: the stake dial, inside Red's bubble */
  .stake-dial {
    margin-block-start: 0.5rem;
    min-inline-size: 11rem;
  }

  .stake-dial :global(.dial) {
    font-size: 0.8rem;
  }

  /* Scene 26: the reader's machine — one tidy deck of the sandbox's dials */
  .deck {
    display: grid;
    gap: 0.45rem;
    margin-block-start: 0.35rem;
  }

  .deck-buttons,
  .deck-tap {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
    font-family: var(--font-sans);
    font-size: 0.78rem;
    color: var(--ink-mid);
  }

  .deck-buttons button,
  .deck-tap button,
  .deck-tap select {
    padding: 0.3rem 0.8rem;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper-bright, #fffaf0);
    color: var(--ink);
    font: inherit;
    font-weight: 650;
    cursor: pointer;
  }

  .deck-buttons .primary,
  .deck-buttons .on,
  .deck-tap .on {
    border-color: var(--accent);
    background: var(--accent);
    color: #fffaf0;
  }

  .deck-dials {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.35rem 0.8rem;
  }

  .deck-dials.one {
    grid-template-columns: 1fr;
  }

  .deck-phone {
    max-block-size: 46%;
    overflow-y: auto;
  }

  /* Scene 21: the game's meter and clock, and the room under the reader's finger */
  .meter {
    position: absolute;
    z-index: 4;
    display: grid;
    gap: 0.3rem;
    min-inline-size: 13rem;
    padding: 0.45rem 1rem;
    border: 1.5px solid var(--accent);
    border-radius: 999px;
    background: rgb(255 250 240 / 94%);
    box-shadow: 0 3px 10px rgb(40 37 31 / 12%);
    color: var(--ink);
    font-family: var(--font-sans);
    font-size: 1.05rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    text-align: center;
    pointer-events: none;
    transform: translateX(-50%);
  }

  /* a run's one way to its end: quiet until a press asks for it */
  .skip {
    position: absolute;
    z-index: 5;
    padding: 0.3rem 0.9rem;
    border: 1.5px solid var(--line);
    border-radius: 999px;
    background: rgb(255 250 240 / 92%);
    color: var(--ink-mid);
    font-family: var(--font-sans);
    font-size: 0.85rem;
    font-weight: 700;
    white-space: nowrap;
    cursor: pointer;
    transform: translateX(-100%);
  }

  .skip:hover,
  .skip:focus-visible {
    border-color: var(--accent);
    color: var(--accent);
    outline: none;
  }

  .skip.called {
    animation: skip-called 900ms ease-out;
  }

  @keyframes skip-called {
    20% {
      border-color: var(--accent);
      color: var(--accent);
      transform: translateX(-100%) scale(1.15);
    }
  }

  /* the tax game's start, over the room's middle */
  .start-game {
    position: absolute;
    z-index: 5;
    padding: 0.7rem 2rem;
    border: 0;
    border-radius: 999px;
    background: var(--accent);
    box-shadow: 0 6px 18px rgb(40 37 31 / 25%);
    color: var(--paper-bright);
    font-family: var(--font-sans);
    font-size: 1.25rem;
    font-weight: 800;
    cursor: pointer;
    transform: translate(-50%, -50%);
    animation: start-game 1.6s ease-in-out infinite;
  }

  .start-game:hover,
  .start-game:focus-visible {
    background: var(--accent-deep);
    outline: none;
  }

  @keyframes start-game {
    50% {
      box-shadow: 0 6px 26px rgb(189 98 69 / 55%);
    }
  }

  /* where to tap first: the biggest fortune, for the first few seconds */
  .pulse {
    fill: none;
    stroke: var(--accent);
    stroke-width: 2.5;
    transform-box: fill-box;
    transform-origin: center;
    animation: pulse 900ms ease-out infinite;
  }

  @keyframes pulse {
    from {
      opacity: 0.9;
      transform: scale(0.85);
    }
    to {
      opacity: 0;
      transform: scale(1.5);
    }
  }

  /* what a tap takes, rising off the fortune */
  .taken {
    fill: var(--accent-deep);
    font-family: var(--font-sans);
    font-size: 15px;
    font-weight: 800;
    animation: taken 1300ms ease-out both;
  }

  @keyframes taken {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-26px);
    }
  }

  /* the pool going back to everyone: a ring that crosses the whole room */
  .pool-return {
    fill: none;
    stroke: var(--accent);
    stroke-width: 2;
    transform-box: fill-box;
    transform-origin: center;
    animation: pool-return 1300ms ease-out both;
  }

  @keyframes pool-return {
    from {
      opacity: 0.55;
      transform: scale(0.05);
    }
    to {
      opacity: 0;
      transform: scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .start-game,
    .skip.called,
    .pulse {
      animation: none;
    }
  }

  .meter.low {
    border-color: var(--accent);
    color: var(--accent);
  }

  .meter .clock {
    display: block;
    block-size: 3px;
    border-radius: 2px;
    background: var(--line);
  }

  .meter .clock span {
    display: block;
    block-size: 100%;
    border-radius: 2px;
    background: currentColor;
  }

  .taps {
    position: absolute;
    z-index: 2;
    cursor: crosshair;
    touch-action: manipulation;
  }

  .hit.tap {
    cursor: crosshair;
  }

  /* Scene 22: the pool, and every pile's count */
  .pool circle {
    fill: none;
    stroke: var(--ink-mid);
    stroke-width: 1.4;
    stroke-dasharray: 4 4;
  }

  .pool text,
  .coin-count,
  .match-labels text,
  .map text {
    fill: var(--ink-mid);
    font-family: var(--font-sans);
    font-size: 12px;
  }

  .coin-count,
  .match-labels .count {
    fill: var(--ink);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .match-labels text {
    font-size: 13px;
  }

  .room-frame {
    fill: none;
    stroke: var(--ink-soft);
    stroke-width: 1.2;
    stroke-dasharray: 5 4;
  }

  /* Scene 24: the outcome map */
  .map .fit {
    fill: none;
    stroke: var(--ink);
    stroke-width: 2;
    stroke-dasharray: 6 5;
    animation: fade-in 700ms ease-out both;
  }

  .map .fit-label {
    fill: var(--ink);
    font-weight: 700;
    animation: fade-in 700ms ease-out both;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
  }

  /* "here he is": a ring that spreads from whoever speaks */
  .ripple {
    fill: none;
    stroke: var(--ink);
    stroke-width: 1.4;
    transform-box: fill-box;
    transform-origin: center;
    animation: ripple 1100ms ease-out both;
  }

  @keyframes ripple {
    from {
      opacity: 0.55;
      transform: scale(1);
    }
    to {
      opacity: 0;
      transform: scale(2.2);
    }
  }

  /* the charts' own column on a wide stage: big enough to read */
  .charts {
    position: absolute;
    z-index: 4;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    overflow-y: auto;
  }

  .chart {
    padding: 0.5rem 0.65rem 0.55rem;
    border: 1px solid var(--line);
    border-radius: 0.55rem;
    background: rgb(255 250 240 / 92%);
    animation: drop 380ms cubic-bezier(0.34, 1.4, 0.64, 1) both;
  }

  .chart h3 {
    margin: 0 0 0.25rem;
    padding: 0;
    border: 0;
    color: var(--ink);
    font-family: var(--font-hand);
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.2;
  }

  .chart :global(svg) {
    display: block;
    inline-size: 100%;
    block-size: auto;
  }

  .chart :global(svg) {
    max-block-size: 7.5rem;
  }

  .plots {
    display: grid;
    grid-template-columns: repeat(2, var(--cell));
    gap: 10px;
    justify-content: center;
  }

  .plot {
    inline-size: var(--cell);
    block-size: var(--cell);
    border: 1px solid var(--line);
    border-radius: 10px;
    background: rgb(255 250 240 / 88%);
    overflow: hidden;
  }

  .compare-strip {
    position: absolute;
    z-index: 4;
    inset-inline: 12px;
    padding: 4px 10px;
    border: 1px solid var(--accent);
    border-radius: 10px;
    background: rgb(255 250 240 / 92%);
    text-align: center;
    pointer-events: none;
  }

  .compare-strip .pair-values {
    display: grid;
    grid-template-columns: 1fr 1fr;
    margin: 0;
    color: var(--accent-deep);
    font-family: var(--font-sans);
    font-size: 1.15rem;
    font-variant-numeric: tabular-nums;
  }

  /* Scene 23's review: a measure for both rooms, the newest pinned on top */
  .compared {
    display: grid;
    gap: 10px;
    margin-block-start: 10px;
  }

  .pair-row {
    padding: 6px 8px 8px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: rgb(255 250 240 / 70%);
  }

  .pair-row.newest {
    border-color: var(--accent);
  }

  /* the earlier measures stay, small, under the newest: the review adds up */
  .pair-row:not(.newest) .pair-cells .plot {
    block-size: calc(var(--cell) * 0.34);
  }

  .pair-row:not(.newest) .stat .big {
    font-size: 1.25rem;
  }

  .pair-row:not(.newest) .stat .of {
    display: none;
  }

  .pair-row:not(.newest) .pair-title {
    font-size: 0.88rem;
  }

  .pair-sides.hidden {
    display: none;
  }

  .pair-title {
    margin: 0 0 4px;
    color: var(--ink);
    font-family: var(--font-hand);
    font-size: 1rem;
    font-weight: 700;
  }

  .pair-cells {
    display: grid;
    grid-template-columns: repeat(2, var(--cell));
    gap: 8px;
  }

  .pair-cells .plot {
    inline-size: var(--cell);
    block-size: var(--cell);
  }

  .pair-sides {
    display: grid;
    grid-template-columns: repeat(2, var(--cell));
    gap: 8px;
    margin: 4px 0 0;
    color: var(--ink-mid);
    font-family: var(--font-sans);
    font-size: 0.72rem;
    text-align: center;
  }

  .plot .stat {
    display: grid;
    place-content: center;
    block-size: 100%;
    text-align: center;
  }

  .plot .stat .big {
    margin: 0;
    color: var(--accent-deep);
    font-family: var(--font-sans);
    font-size: 2.1rem;
    font-weight: 800;
  }

  .plot .stat .of {
    margin: 0.2rem 0 0;
    color: var(--ink-mid);
    font-family: var(--font-hand);
    font-size: 0.95rem;
  }

  .chart.glow {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgb(139 63 43 / 18%);
    transition: box-shadow 400ms ease;
  }

  .chart .big {
    margin: 0;
    color: var(--accent-deep);
    font-family: var(--font-sans);
    font-size: 1.7rem;
    font-weight: 800;
    line-height: 1.1;
  }

  /* the run's result: the share big and bold, what it is in small type beside it, and when below */
  .richest {
    margin: 0;
    color: var(--ink-mid);
    font-family: var(--font-sans);
    font-size: 0.82rem;
    font-weight: 600;
    line-height: 1.15;
  }

  .richest strong {
    margin-inline-end: 0.3em;
    color: var(--accent-deep);
    font-size: 2.1rem;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    vertical-align: -0.12em;
  }

  .after {
    margin: 0.1rem 0 0;
    color: var(--ink-soft);
    font-family: var(--font-sans);
    font-size: 0.78rem;
    font-variant-numeric: tabular-nums;
  }

  .chart.rule ol {
    margin: 0;
    padding-inline-start: 1.1rem;
    font-family: var(--font-hand);
    font-size: 0.92rem;
    line-height: 1.3;
  }

  .dial {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    margin-block-start: 0.45rem;
    color: var(--ink-mid);
    font-family: var(--font-sans);
    font-size: 0.75rem;
  }

  .dial.phone {
    position: absolute;
    z-index: 5;
    inset-block-end: 0.4rem;
    inset-inline: 1rem;
    margin: 0;
    padding: 0.3rem 0.6rem;
    border-radius: 0.5rem;
    background: rgb(255 250 240 / 88%);
  }

  /* concepts already built, small, on the far side */
  @keyframes drop {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
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
    max-inline-size: calc(100% - 7.2rem - 5.5rem);
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
    transition: opacity 400ms ease;
  }

  .bubbles.hushed {
    opacity: 0;
    transition: opacity 500ms ease;
  }

  .bubbles.hushed :global(.bubble) {
    pointer-events: none;
  }

  .bubbles.through {
    opacity: 0.35;
    pointer-events: none;
    transition: opacity 300ms ease;
  }

  .bubbles.through :global(.bubble) {
    pointer-events: none;
  }

  .bubbles :global(.bubble) {
    pointer-events: auto;
  }
</style>
