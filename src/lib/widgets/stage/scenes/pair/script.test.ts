import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { validateSteps } from '../../steps';
import { ROUNDS, UNITS } from './game';
import { PAIR_STEPS, REACTIONS, indexOf, valuesFor } from './script';
import { parseProse } from '../../../../content/prose';

const messages: Record<string, string> = JSON.parse(readFileSync('messages/en.json', 'utf8'));
const step = (id: string) => PAIR_STEPS[indexOf(id)];
const before = (id: string) => PAIR_STEPS[indexOf(id) - 1];
const fill = (key: string, values: Record<string, number>) =>
  messages[key].replace(/\{(\w+)\}/g, (_, name) => String(values[name]));

describe('the pair stage as data', () => {
  it('is a sound stage', () => {
    expect(validateSteps(PAIR_STEPS)).toEqual([]);
  });

  it('only says words that exist in the message file', () => {
    const keys = PAIR_STEPS.flatMap((s) => s.lines?.map((l) => l.message) ?? []);
    const reactions = Object.values(REACTIONS).flat();
    for (const key of [...keys, ...reactions]) expect(messages[key], key).toBeTypeOf('string');
  });

  it('speaks every scripted line of Scenes 3–14 somewhere, in script order', () => {
    // what a character SAYS in these scenes — not the buttons and labels
    const scripted = parseProse(readFileSync('notes/prose.md', 'utf8'))
      .filter((line) => line.speaker !== null && /^(intro|ctl|merit|invite|equal|r1|r2|r3|dare|more)\./.test(line.tag))
      .map((line) => line.key);
    const spoken = new Set([
      ...PAIR_STEPS.flatMap((s) => s.lines?.map((l) => l.message) ?? []),
      ...Object.values(REACTIONS).flat(),
    ]);
    expect(scripted.filter((k) => !spoken.has(k))).toEqual([]);
    const order = PAIR_STEPS.flatMap((s) => s.lines?.map((l) => l.message) ?? []);
    const inFile = scripted.filter((k) => order.includes(k));
    expect(order.filter((k) => inFile.includes(k))).toEqual(inFile);
  });

  it('holds twice — both circles clicked, then 8 and 8 — and nowhere else', () => {
    expect(PAIR_STEPS.filter((s) => s.wait.kind === 'action').map((s) => s.id)).toEqual(['call', 'equal']);
  });

  it('never waits on a gesture before Scene 5 has taught it', () => {
    const taught = indexOf('ctl.4');
    const early = PAIR_STEPS.slice(0, taught).filter((s) => s.wait.kind === 'reader');
    expect(early).toEqual([]);
    expect(step('ctl.4').wait.kind).toBe('reader');
  });
});

describe('every number the characters say is the number on screen', () => {
  it('conserves the sixteen coins at every step', () => {
    for (const s of PAIR_STEPS) {
      const { holdings: h, table: t } = s.pose;
      expect(h.blue + h.red + t.blue + t.red, s.id).toBe(UNITS);
    }
  });

  it('invitation: "I have 15 coins. You have 1." — with the coins showing', () => {
    const s = step('invite.4');
    expect(s.pose.coins).toBe(true);
    expect(fill('invite_4', valuesFor(s))).toContain('I have 15 coins. You have 1.');
  });

  it('round one: "Half of eight. Four each."', () => {
    expect(before('r1.half').pose.holdings).toEqual({ blue: 8, red: 8 });
    expect(step('r1.half').pose.table).toEqual({ blue: 4, red: 4 });
    expect(messages.r1_half).toBe('Half of eight. Four each.');
  });

  it('round one ends with red landing: Blue 4, Red 12', () => {
    expect(step('r1.toss').pose.flip).toBe('red');
    expect(step('r1.toss').pose.holdings).toEqual({ blue: 4, red: 12 });
  });

  it('round two: "I only have four" — and then "Two each."', () => {
    expect(step('r2.wait').pose.holdings.blue).toBe(4);
    expect(step('r2.rule').pose.table).toEqual({ blue: 2, red: 2 });
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

  it('"A hundred" — a hundred people in the room', () => {
    expect(step('more.hundred').pose.room).toBe(100);
  });

  it('introduces them only after both have been clicked', () => {
    expect(step('intro.blue').pose.named).toEqual({ blue: true, red: true });
    expect(before('call').pose.named).toEqual({ blue: false, red: false });
  });
});
