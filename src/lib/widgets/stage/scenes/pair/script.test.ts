import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateSteps } from '../../steps';
import { ROUNDS, UNITS } from './game';
import { BETS, PREDICTIONS } from '../../../shared/runLog.svelte';
import { CARDS, EXPECT_PROBLEMS, PAIR_STEPS, REACTIONS, REEL, REEL_ANSWER, ROLE_PROBLEMS, actEnd, indexOf, labelStep, levyLesson, panelStart, reelSpin } from './script';
import { STORY } from '../../../../content/story.gen';
import { CAPTION_BEATS, sideTrip } from '../../../../content/story';

/*
 * What the stage must hold whatever the script says. The script decides the
 * words, the order, the manners and the waits (ADR-019); these tests guard what
 * the machinery promises — every line spoken, every coin kept, every number the
 * script expects on screen — so the owner can edit the script freely and the
 * build still says no when an edit breaks the game.
 */

const messages: Record<string, string> = JSON.parse(readFileSync('messages/en.json', 'utf8'));
const step = (id: string) => PAIR_STEPS[indexOf(id)];

/** Every message key the scene speaks on events, flattened. */
const reactionKeys = (): string[] => {
  const keys: string[] = [];
  const walk = (v: unknown): void => {
    if (typeof v === 'string') keys.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') {
      if ('message' in v) keys.push((v as { message: string }).message);
      else Object.values(v).forEach(walk);
    }
  };
  walk(REACTIONS);
  return keys;
};

describe('the stage reads the script', () => {
  it('finds every step the scene addresses by name, once', () => {
    expect(ROLE_PROBLEMS).toEqual([]);
  });

  it('meets every \\expect the script writes', () => {
    expect(EXPECT_PROBLEMS).toEqual([]);
  });

  it('is a sound stage', () => {
    expect(validateSteps(PAIR_STEPS)).toEqual([]);
  });

  it('only says words that exist in the message file', () => {
    const keys = PAIR_STEPS.flatMap((s) => s.lines?.map((l) => l.message) ?? []);
    for (const key of [...keys, ...reactionKeys()]) expect(messages[key], key).toBeTypeOf('string');
  });

  it('speaks every line the script writes for the stage, somewhere', () => {
    const written = STORY.steps.flatMap((s) => [
      ...(s.key && s.who ? [s.key] : []),
      ...(s.variants?.keys ?? []),
      ...(s.together ?? []).flatMap((t) => t.variants?.keys ?? (t.key ? [t.key] : [])),
      ...(s.groups ?? []).flatMap((g) => g.bubbles.map((b) => b.key)),
      ...(s.reactions ?? []).flatMap((g) => g.bubbles.map((b) => b.key)),
      ...(s.beside ? [s.beside.key] : []),
      ...s.choices.map((c) => c.key),
    ]);
    const spoken = new Set([...PAIR_STEPS.flatMap((s) => s.lines?.map((l) => l.message) ?? []), ...reactionKeys()]);
    // the headline is typed by the teletype, the map's line also names the map
    const typed = new Set([STORY.steps[indexOf('title.type')].key]);
    expect(written.filter((k) => !spoken.has(k) && !typed.has(k))).toEqual([]);
  });

  it('knows every message key its code asks for by name', () => {
    const roots = ['src/lib', 'src/content', 'src/App.svelte'];
    const files: string[] = [];
    const visit = (p: string) => {
      if (statSync(p).isDirectory()) for (const f of readdirSync(p)) visit(join(p, f));
      else if (/\.(svelte|ts|svx)$/.test(p) && !p.includes('paraglide') && !p.endsWith('.test.ts')) files.push(p);
    };
    roots.forEach(visit);
    const asked = files.flatMap((f) => [...readFileSync(f, 'utf8').matchAll(/say\('([a-z0-9_]+)'/g)].map((m) => `${m[1]} (${f})`));
    expect(asked.filter((k) => !(k.split(' ')[0] in messages))).toEqual([]);
  });

  it('gives each side trip a beat for every caption the script writes', () => {
    for (const [trip, beats] of Object.entries(CAPTION_BEATS)) expect(sideTrip(trip).captions.length, trip).toBe(beats.length);
  });

  it('opens a side trip or a scene for every choice, and lands on real steps', () => {
    expect(labelStep('guess')).toBe(PAIR_STEPS[indexOf(labelStep('guess'))].id);
    for (const trip of ['cow', 'human']) for (const c of sideTrip(trip).choices) expect(c.target in STORY.branches || c.target in STORY.labels, c.target).toBe(true);
  });

  it('draws every card the script drops', () => {
    const dropped = new Set(PAIR_STEPS.flatMap((s) => s.pose.cards));
    for (const id of dropped) expect(CARDS[id], id).toBeDefined();
    for (const card of Object.values(CARDS)) expect(messages[card.title], card.title).toBeTypeOf('string');
  });
});

describe('the title’s reel', () => {
  it('runs slowly to the last word, stops on it, and comes back to the answer', () => {
    const spin = reelSpin();
    const last = REEL.length - 1;
    expect(last).toBeGreaterThan(REEL_ANSWER);
    const stop = spin.findIndex((x) => x.to === last);
    expect(stop).toBeGreaterThanOrEqual(0);
    expect(spin.at(-1)!.to).toBe(REEL_ANSWER);
    // eased in and out, about two words a second on average: slow enough to read the first and the last
    const run = spin.slice(0, stop + 1).filter((x) => x.ease !== 'none');
    expect(run.every((x) => x.ease.endsWith('inOut'))).toBe(true);
    expect(last / run.reduce((t, x) => t + x.seconds, 0)).toBeLessThanOrEqual(2.2);
    // a beat on the last word, then back over more than a second
    expect(spin[stop + 1]).toMatchObject({ to: last, ease: 'none' });
    expect(spin.at(-1)!.seconds).toBeGreaterThan(1);
  });
});

describe('what the scene promises, whatever the words', () => {
  it('holds only where the scene knows how to let go: meeting both, 8 and 8, a guess, a bet', () => {
    expect(PAIR_STEPS.filter((s) => s.wait.kind === 'action').map((s) => s.id)).toEqual(['meet', 'equal', 'guess.what', 'guess.stake']);
  });

  it('offers both calls at once, and has an introduction for each click', () => {
    expect(REACTIONS.callRed.length).toBeGreaterThan(0);
    expect(REACTIONS.callBlue.length).toBeGreaterThan(0);
    expect(REACTIONS.introRed.who).toBe('red');
    expect(REACTIONS.introBlue.who).toBe('blue');
  });

  it('never waits on a gesture before both have been met', () => {
    const met = indexOf('meet');
    expect(PAIR_STEPS.slice(0, met).filter((s) => s.wait.kind === 'reader')).toEqual([]);
  });

  it('lets the calls go as soon as the talk moves on', () => {
    expect(step('meet').brief).toBe(true);
  });

  it('logs every toss once it lands', () => {
    const tosses = PAIR_STEPS.filter((s) => s.action === 'toss');
    expect(tosses.map((s) => s.log)).toEqual(tosses.map(() => 'log_toss'));
    expect(messages.log_toss).toMatch(/\{winner\}.*\{blue\}.*\{red\}/);
  });

  it('opens a card only once it has been dropped', () => {
    for (const s of PAIR_STEPS) if (s.pose.cardOpen) expect(s.pose.cards, s.id).toContain(s.pose.cardOpen);
  });

  it('pins a picture only for a concept that has its card', () => {
    for (const s of PAIR_STEPS) for (const thumb of s.pose.thumbs) expect(s.pose.cards, `${s.id} ${thumb}`).toContain(thumb);
  });

  it('offers exactly the four outcomes and four bets the session knows, in its order', () => {
    expect(REACTIONS.guesses).toHaveLength(PREDICTIONS.length);
    expect(REACTIONS.bets).toHaveLength(BETS.length);
    expect(Object.keys(REACTIONS.betLines)).toEqual([...BETS]);
  });

  it('runs the room once, and every step after it shows how the run ended', () => {
    const run = indexOf('run');
    expect(step('run').action).toBe('run');
    expect(step('run').wait.kind).toBe('chat');
    for (const [i, s] of PAIR_STEPS.entries()) expect(s.pose.ran, s.id).toBe(i >= run);
    expect(actEnd('run')).toBeGreaterThan(run);
  });

  it('only arranges a room that is there', () => {
    for (const s of PAIR_STEPS) expect(s.pose.place === 'room' || s.pose.roomMode === 'free', s.id).toBe(true);
  });

  it('lets every step belong to a panel that starts with a clear', () => {
    for (let i = indexOf('meet'); i < PAIR_STEPS.length; i++) expect(PAIR_STEPS[panelStart(i)].panel, PAIR_STEPS[i].id).toBe(true);
  });

  it('keeps every coin in the levy lesson, and nets out the way Red says', () => {
    const [before, collected, returned] = ([0, 1, 2] as const).map(levyLesson);
    expect(before).toEqual({ coins: [16, 4, 8, 4], pool: 0 });
    expect(collected).toEqual({ coins: [12, 3, 6, 3], pool: 8 });
    expect(returned).toEqual({ coins: [14, 5, 8, 5], pool: 0 });
    for (const moment of [before, collected, returned]) expect(moment.coins.reduce((s, c) => s + c, moment.pool)).toBe(32);
    // below the average gains, the average breaks even, above it pays in
    expect(returned.coins.map((c, k) => Math.sign(c - before.coins[k]))).toEqual([-1, 1, 0, 1]);
  });
});

describe('every number the characters say is the number on screen', () => {
  it('conserves the sixteen coins at every step', () => {
    for (const s of PAIR_STEPS) {
      const { holdings: h, table: t } = s.pose;
      expect(h.blue + h.red + t.blue + t.red, s.id).toBe(UNITS);
    }
  });

  it('every stake is half of what the poorer one has', () => {
    const antes = PAIR_STEPS.filter((x) => x.action === 'ante');
    for (const s of antes) {
      const prior = PAIR_STEPS[PAIR_STEPS.indexOf(s) - 1].pose.holdings;
      expect(s.pose.table.blue, s.id).toBe(Math.min(prior.blue, prior.red) / 2);
    }
    // the rounds the script plays are the rounds game.ts records
    expect(antes.map((s) => s.pose.table.blue)).toEqual(ROUNDS.map((r) => r.stake));
  });

  it('"Eight and eight" — after the reader has made it so', () => {
    expect(step('equal').pose.holdings).toEqual({ blue: 8, red: 8 });
  });

  it('introduces each one only after the reader has clicked him', () => {
    expect(PAIR_STEPS[indexOf('meet') - 1].pose.named).toEqual({ blue: false, red: false });
    expect(step('meet').pose.named).toEqual({ blue: true, red: true });
  });
});
