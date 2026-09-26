import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { validateSteps } from '../../steps';
import { ROUNDS, UNITS } from './game';
import { PAIR_STEPS, REACTIONS, indexOf, panelStart } from './script';
import { parseProse } from '../../../../content/prose';

const messages: Record<string, string> = JSON.parse(readFileSync('messages/en.json', 'utf8'));
const step = (id: string) => PAIR_STEPS[indexOf(id)];
const before = (id: string) => PAIR_STEPS[indexOf(id) - 1];

describe('the pair stage as data', () => {
  it('is a sound stage', () => {
    expect(validateSteps(PAIR_STEPS)).toEqual([]);
  });

  it('only says words that exist in the message file', () => {
    const keys = PAIR_STEPS.flatMap((s) => s.lines?.map((l) => l.message) ?? []);
    const reactions = Object.values(REACTIONS).flat();
    for (const key of [...keys, ...reactions]) expect(messages[key], key).toBeTypeOf('string');
  });

  it('speaks every scripted line of Scenes 3–11 somewhere, in script order', () => {
    // what a character SAYS in these scenes — not the buttons and labels
    const scripted = parseProse(readFileSync('notes/prose.md', 'utf8'))
      .filter((line) => line.speaker !== null && /^(meet|merit|invite|equal|r1|r2|r3|dare|more)\./.test(line.tag))
      .flatMap((line) => (line.parts ? line.parts.map((_, i) => `${line.key}_${i + 1}`) : [line.key]));
    const spoken = new Set([
      ...PAIR_STEPS.flatMap((s) => s.lines?.map((l) => l.message) ?? []),
      ...Object.values(REACTIONS).flat(),
    ]);
    expect(scripted.filter((k) => !spoken.has(k))).toEqual([]);
    const order = PAIR_STEPS.flatMap((s) => s.lines?.map((l) => l.message) ?? []);
    const inFile = scripted.filter((k) => order.includes(k));
    expect(order.filter((k) => inFile.includes(k))).toEqual(inFile);
  });

  it('holds three times — Red clicked, Blue clicked, then 8 and 8 — and nowhere else', () => {
    expect(PAIR_STEPS.filter((s) => s.wait.kind === 'action').map((s) => s.id)).toEqual([
      'call.red',
      'call.blue',
      'equal',
    ]);
  });

  it('never waits on a gesture before the tip has taught it, and the tip itself waits', () => {
    const taught = indexOf('meet.tip');
    const early = PAIR_STEPS.slice(0, taught).filter((s) => s.wait.kind === 'reader');
    expect(early).toEqual([]);
    expect(step('meet.tip').wait.kind).toBe('reader');
  });

  it('logs every toss once it lands, with the numbers the pose shows', () => {
    const tosses = PAIR_STEPS.filter((s) => s.action === 'toss');
    expect(tosses.map((s) => s.log)).toEqual(['log_toss', 'log_toss', 'log_toss']);
    expect(messages.log_toss).toMatch(/\{winner\}.*\{blue\}.*\{red\}/);
    expect(tosses.map((s) => [s.pose.flip, s.pose.holdings.blue, s.pose.holdings.red])).toEqual([
      ['red', 4, 12],
      ['blue', 6, 10],
      ['blue', 9, 7],
    ]);
  });

  it('lets the calls and the tip go as soon as the talk moves on', () => {
    for (const id of ['call.red', 'call.blue', 'meet.tip']) expect(step(id).brief, id).toBe(true);
    expect(step('meet.blue').brief).toBeUndefined();
  });

  it('lets every step belong to a panel that starts with a clear', () => {
    for (let i = indexOf('call.red'); i < PAIR_STEPS.length; i++) expect(PAIR_STEPS[panelStart(i)].panel, PAIR_STEPS[i].id).toBe(true);
  });

  it('keeps the debate and every rule a key line: they wait for the reader', () => {
    for (const id of ['merit.1b', 'merit.3r', 'r1.rules', 'r1.flip', 'r1.winner', 'r2.rule', 'r2.why', 'dare.math', 'more.random', 'more.rule']) {
      expect(step(id).wait.kind, id).toBe('reader');
    }
  });
});

describe('every number the characters say is the number on screen', () => {
  it('conserves the sixteen coins at every step', () => {
    for (const s of PAIR_STEPS) {
      const { holdings: h, table: t } = s.pose;
      expect(h.blue + h.red + t.blue + t.red, s.id).toBe(UNITS);
    }
  });

  it('invitation: the coins appear before anyone talks about giving them up', () => {
    expect(step('invite.1').pose.coins).toBe(true);
    expect(step('invite.4').pose.holdings).toEqual({ blue: 15, red: 1 });
  });

  it('round one: "Half of 8. / 4 each."', () => {
    expect(before('r1.half').pose.holdings).toEqual({ blue: 8, red: 8 });
    expect(step('r1.half').pose.table).toEqual({ blue: 4, red: 4 });
    expect(messages.r1_half).toBe('Half of 8. / 4 each.');
  });

  it('round one ends with red landing: Blue 4, Red 12', () => {
    expect(step('r1.toss').pose.flip).toBe('red');
    expect(step('r1.toss').pose.holdings).toEqual({ blue: 4, red: 12 });
  });

  it('round two: "I have 4." — "Only 2?" — and Red matches it', () => {
    expect(step('r2.wait').pose.holdings.blue).toBe(4);
    expect(messages.r2_wait).toContain('I have 4.');
    expect(messages.r2_two).toBe('Only 2?');
    expect(step('r2.match').pose.table).toEqual({ blue: 2, red: 2 });
  });

  it('round three: "3 each."', () => {
    expect(step('r3.each').pose.table).toEqual({ blue: 3, red: 3 });
    expect(messages.r3_each).toBe('3 each.');
  });

  it('every stake is half of what the poorer one has', () => {
    for (const s of PAIR_STEPS.filter((x) => x.action === 'ante')) {
      const prior = PAIR_STEPS[PAIR_STEPS.indexOf(s) - 1].pose.holdings;
      expect(s.pose.table.blue, s.id).toBe(Math.min(prior.blue, prior.red) / 2);
    }
    expect(ROUNDS.map((r) => r.stake)).toEqual([4, 2, 3]);
  });

  it('"Eight and eight. Perfect." — after the reader has made it so', () => {
    expect(step('equal').pose.holdings).toEqual({ blue: 8, red: 8 });
    expect(step('equal.done').pose.holdings).toEqual({ blue: 8, red: 8 });
  });

  it('"I\'m a bit ahead" — Blue ends the rounds 9 to 7', () => {
    expect(step('dare.ahead').pose.holdings).toEqual({ blue: 9, red: 7 });
  });

  it('fills the room as Red explains it', () => {
    expect(step('more.shapes').pose.room).toBe(100);
    expect(before('more.shapes').pose.place).toBe('seats');
  });

  it('introduces each one only after the reader has clicked him', () => {
    expect(before('call.red').pose.named).toEqual({ blue: false, red: false });
    expect(step('meet.red').pose.named).toEqual({ blue: false, red: true });
    expect(step('meet.blue').pose.named).toEqual({ blue: true, red: true });
  });
});
