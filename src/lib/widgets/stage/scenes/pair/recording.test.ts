import { describe, expect, it } from 'vitest';
import { measureWealth } from '$lib/research';
import { DEFAULT_RUN, frameAt, record, richest } from './recording';

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
