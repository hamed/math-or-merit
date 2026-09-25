import { describe, expect, it } from 'vitest';
import { HOLD, READER, StepMachine, auto, claim, validateSteps, type StepSpec } from './steps';

const STEPS: readonly StepSpec[] = [
  { id: 'title', wait: auto(1200) },
  { id: 'hello', wait: READER },
  { id: 'click-both', wait: HOLD },
  { id: 'intro', wait: READER },
  { id: 'equal', wait: HOLD },
  { id: 'done', wait: READER },
];

describe('validating a stage', () => {
  it('accepts a sound stage', () => {
    expect(validateSteps(STEPS)).toEqual([]);
  });

  it('catches duplicate ids, empty stages and timers that never fire', () => {
    expect(validateSteps([])).not.toEqual([]);
    expect(validateSteps([{ id: 'a', wait: READER }, { id: 'a', wait: READER }])).not.toEqual([]);
    expect(validateSteps([{ id: 'a', wait: auto(0) }])).not.toEqual([]);
  });

  it('refuses to build a machine from an unsound stage', () => {
    expect(() => new StepMachine([])).toThrow(RangeError);
  });
});

describe('moving through a stage', () => {
  it('advances on reader input', () => {
    const machine = new StepMachine(STEPS);
    expect(machine.next()).toBe('moved');
    expect(machine.step.id).toBe('hello');
  });

  it('stops at a hold until it is released', () => {
    const machine = new StepMachine(STEPS);
    machine.seek(2);
    expect(machine.holding).toBe(true);
    expect(machine.next()).toBe('held');
    expect(machine.index).toBe(2);
  });

  it('moves on by itself when the reader does what the hold asked', () => {
    const machine = new StepMachine(STEPS);
    machine.seek(2);
    expect(machine.release('click-both')).toBe('moved');
    expect(machine.step.id).toBe('intro');
  });

  it('never asks twice: a released hold stays released after stepping back', () => {
    const machine = new StepMachine(STEPS);
    machine.seek(2);
    machine.release('click-both');
    machine.back();
    expect(machine.holding).toBe(false);
    expect(machine.next()).toBe('moved');
  });

  it('can always go back, even from a hold that is still waiting', () => {
    const machine = new StepMachine(STEPS);
    machine.seek(4);
    expect(machine.holding).toBe(true);
    expect(machine.back()).toBe('moved');
  });

  it('hands the gesture to the page past either end', () => {
    const machine = new StepMachine(STEPS);
    expect(machine.back()).toBe('start');
    machine.seek(STEPS.length - 1);
    expect(machine.next()).toBe('end');
  });

  it('notes a hold released early without moving the reader', () => {
    const machine = new StepMachine(STEPS);
    expect(machine.release('equal')).toBe('noted');
    expect(machine.index).toBe(0);
    machine.seek(4);
    expect(machine.holding).toBe(false);
  });
});

describe('remembering a place across a reload', () => {
  it('round-trips through a snapshot', () => {
    const machine = new StepMachine(STEPS);
    machine.seek(2);
    machine.release('click-both');
    const copy = new StepMachine(STEPS);
    expect(copy.restore(JSON.parse(JSON.stringify(machine.snapshot())))).toBe(true);
    expect(copy.index).toBe(3);
    expect(copy.isReleased('click-both')).toBe(true);
  });

  it('never restores past a hold the reader has not done', () => {
    const copy = new StepMachine(STEPS);
    copy.restore({ index: 5, released: [] });
    expect(copy.step.id).toBe('click-both');
  });

  it('shrugs off a stale or broken entry instead of stranding the reader', () => {
    const copy = new StepMachine(STEPS);
    expect(copy.restore('nonsense')).toBe(false);
    expect(copy.restore({ index: Number.NaN })).toBe(false);
    copy.restore({ index: 999, released: ['click-both', 'equal', 'a-step-from-an-older-build'] });
    expect(copy.atLast).toBe(true);
    expect(copy.isReleased('a-step-from-an-older-build')).toBe(false);
  });
});

describe('who owns a gesture', () => {
  const VIEW = 800;
  const mid = { atFirst: false, atLast: false, holding: false };
  const last = { atFirst: false, atLast: true, holding: false };
  const first = { atFirst: true, atLast: false, holding: false };
  const at = (top: number, inside = true, busy = false) => ({ top, viewport: VIEW, inside, busy });

  it('steps while the stage fills the viewport, and hands the page each end', () => {
    expect(claim(at(0), 1, mid)).toBe('step');
    expect(claim(at(0), -1, mid)).toBe('step');
    expect(claim(at(0), 1, last)).toBe('pass');
    expect(claim(at(0), -1, first)).toBe('pass');
    expect(claim(at(0), 1, { ...last, holding: true })).toBe('step');
  });

  it('eats the inertial tail of a gesture that already acted, even at an end', () => {
    expect(claim(at(0, true, true), 1, mid)).toBe('swallow');
    expect(claim(at(0, true, true), 1, last)).toBe('swallow');
  });

  // Owner's recording, 2026-09-25: a trackpad's sub-2px tail slid the page 5px,
  // after which every flick scrolled straight past the stage and a tap or an
  // upward flick jumped the dialogue to its last line.
  it('puts a stage that slid a few pixels back, without treating it as an arrival', () => {
    expect(claim(at(-5), 1, mid)).toBe('align');
    expect(claim(at(-5), -1, mid)).toBe('align');
    expect(claim(at(6), 1, mid)).toBe('align');
  });

  it('lets a stage that is leaving on purpose go, past a slip', () => {
    // "Not now" scrolls on; a flick down during that scroll must not pull back
    expect(claim(at(-200), 1, last)).toBe('pass');
    expect(claim(at(-200), -1, last)).toBe('arrive');
  });

  it('brings the stage in when the reader comes toward it from outside', () => {
    expect(claim(at(300, false), 1, first)).toBe('arrive');
    expect(claim(at(-300, false), -1, last)).toBe('arrive');
  });

  it('lets the page go on once the reader has left past an end', () => {
    expect(claim(at(-5, false), 1, last)).toBe('pass');
    expect(claim(at(5, false), -1, first)).toBe('pass');
  });

  it('leaves a stage far off screen alone', () => {
    expect(claim(at(-VIEW), 1, mid)).toBe('pass');
    expect(claim(at(VIEW * 0.6), 1, mid)).toBe('pass');
  });
});
