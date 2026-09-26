import { describe, expect, it } from 'vitest';
import { measureWealth } from '$lib/research';
import { DEFAULT_RUN, extend, frameAt, record, recorder, richest } from './recording';

describe('a recorded run', () => {
  const run = record(DEFAULT_RUN, 42);

  it('is the same every time for the same seed and settings', () => {
    const again = record(DEFAULT_RUN, 42);
    expect(again.trades).toEqual(run.trades);
    expect(Array.from(again.frames[again.frames.length - 1])).toEqual(Array.from(run.frames[run.frames.length - 1]));
  });

  it('starts equal and keeps every coin: the room always holds exactly what it started with', () => {
    expect(Array.from(run.frames[0]).every((w) => w === 0.01)).toBe(true);
    for (const frame of run.frames) expect(frame.reduce((s, w) => s + w, 0)).toBeCloseTo(1, 12);
  });

  it('stops as soon as the richest reaches the share asked for, and not before', () => {
    const last = run.frames[run.frames.length - 1];
    expect(richest(last).share).toBeGreaterThanOrEqual(0.4);
    expect(richest(run.frames[run.frames.length - 2]).share).toBeLessThan(0.4);
  });

  it('keeps one frame per round, a hundred trades each, until the last', () => {
    for (let k = 1; k < run.trades.length - 1; k++) expect(run.trades[k] - run.trades[k - 1]).toBe(100);
    expect(run.turnover).toHaveLength(run.frames.length);
  });

  it('counts the money that changed hands: busy early, quieter as the room concentrates', () => {
    const rounds = run.turnover.slice(1);
    const early = rounds.slice(0, 5).reduce((s, x) => s + x, 0) / 5;
    const late = rounds.slice(-5).reduce((s, x) => s + x, 0) / 5;
    expect(early).toBeGreaterThan(0);
    expect(late).toBeLessThan(early);
  });

  it('finds the frame on screen for any number of trades', () => {
    expect(frameAt(run, 0)).toBe(0);
    expect(frameAt(run, 150)).toBe(1);
    expect(frameAt(run, 1e9)).toBe(run.frames.length - 1);
  });

  it('can stop on trades, or on how many still hold something, instead', () => {
    const byTrades = record({ ...DEFAULT_RUN, stop: { kind: 'trades', trades: 5000 } }, 7);
    expect(byTrades.trades[byTrades.trades.length - 1]).toBe(5000);
    const bySurvivors = record({ ...DEFAULT_RUN, stop: { kind: 'survivors', count: 20, floor: 0.00001 } }, 7);
    const last = bySurvivors.frames[bySurvivors.frames.length - 1];
    expect(Array.from(last).filter((w) => w >= 0.00001).length).toBeLessThanOrEqual(20);
  });

  it('leaves a few in between by default — not one giant and dust', () => {
    const last = run.frames[run.frames.length - 1];
    const m = measureWealth(last);
    expect(m.effectiveParticipants).toBeGreaterThan(2);
    expect(Array.from(last).filter((w) => w * 10_000 >= 0.1).length).toBeGreaterThan(8);
  });
});

describe('the shared rule and the longer run', () => {
  const plain = { ...DEFAULT_RUN, stop: { kind: 'trades' as const, trades: 20_000 } };

  it('keeps every coin with the levy too: collected, pooled, returned in full', () => {
    const levied = record({ ...plain, levy: 0.03 }, 9);
    for (const frame of levied.frames) expect(frame.reduce((s, w) => s + w, 0)).toBeCloseTo(1, 12);
  });

  it('holds luck still between matched rooms: without a levy, the same seed is the same room', () => {
    const a = record(plain, 9);
    const b = record({ ...plain, levy: 0 }, 9);
    expect(Array.from(b.frames[b.frames.length - 1])).toEqual(Array.from(a.frames[a.frames.length - 1]));
  });

  it('keeps the room far more open with a 3% levy than without, on the same luck', () => {
    let open = 0;
    for (let seed = 1; seed <= 8; seed++) {
      const a = measureWealth(record(plain, seed).frames.at(-1)!).effectiveParticipants;
      const b = measureWealth(record({ ...plain, levy: 0.03 }, seed).frames.at(-1)!).effectiveParticipants;
      if (b > a * 3) open++;
    }
    expect(open).toBeGreaterThanOrEqual(7);
  });

  it('plays a room on without touching what already happened', () => {
    const first = record(DEFAULT_RUN, 3);
    const longer = extend(first, { ...DEFAULT_RUN, stop: { kind: 'trades', trades: 30_000 } }, 4);
    expect(longer.frames.slice(0, first.frames.length)).toEqual(first.frames);
    expect(longer.trades.at(-1)).toBe(first.trades.at(-1)! + 30_000);
    expect(richest(longer.frames.at(-1)!).share).toBeGreaterThan(richest(first.frames.at(-1)!).share);
  });

  it('records a room played live, a few trades at a time, exactly as one played at once', () => {
    const live = recorder(DEFAULT_RUN, 42);
    while (!live.done) live.play(7);
    const once = record(DEFAULT_RUN, 42);
    expect(live.recording().trades).toEqual(once.trades);
    expect(Array.from(live.recording().frames.at(-1)!)).toEqual(Array.from(once.frames.at(-1)!));
  });

  it('lets a tap take a quarter of one fortune into a pool shared by everyone, keeping every coin', () => {
    const live = recorder({ ...DEFAULT_RUN, stop: { kind: 'trades', trades: 5_000 } }, 5);
    live.play(3_000);
    const top = richest(live.wealth).index;
    const before = live.wealth[top];
    const taken = live.take(top, 0.25);
    expect(taken).toBeCloseTo(before * 0.25, 12);
    expect(live.wealth[top]).toBeCloseTo(before * 0.75 + taken / 100, 12);
    expect(live.wealth.reduce((s, w) => s + w, 0)).toBeCloseTo(1, 12);
    live.play(10_000);
    expect(live.done).toBe(true);
    expect(live.recording().trades.at(-1)).toBe(5_000);
  });
});
