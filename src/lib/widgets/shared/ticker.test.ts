import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFixedStepClock, createFixedTicker, type Ticker } from './ticker';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function ticksFor(refreshHz: number, seconds = 1): number {
  const clock = createFixedStepClock();
  let ticks = 0;
  for (let frame = 0; frame < refreshHz * seconds; frame++) {
    ticks += clock.advance(1000 / refreshHz);
  }
  return ticks;
}

describe('fixed-step clock', () => {
  it('does the same logical work at common display refresh rates', () => {
    expect(ticksFor(30)).toBe(60);
    expect(ticksFor(60)).toBe(60);
    expect(ticksFor(120)).toBe(60);
  });

  it('retains fractional time between render frames', () => {
    const clock = createFixedStepClock(10, 100);
    expect(clock.advance(6)).toBe(0);
    expect(clock.advance(6)).toBe(1);
    expect(clock.advance(8)).toBe(1);
  });

  it('bounds work after a long suspended interval', () => {
    const clock = createFixedStepClock(1000 / 60, 100);
    expect(clock.advance(30_000)).toBe(6);
  });

  it('drops partial time when reset', () => {
    const clock = createFixedStepClock(10, 100);
    expect(clock.advance(9)).toBe(0);
    clock.reset();
    expect(clock.advance(1)).toBe(0);
  });
});

describe('fixed ticker', () => {
  it('drops remaining catch-up steps when a tick stops it', () => {
    let frameCallback: FrameRequestCallback | undefined;
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      frameCallback = callback;
      return 1;
    }));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.spyOn(performance, 'now').mockReturnValue(100);

    let ticks = 0;
    let ticker!: Ticker;
    ticker = createFixedTicker(() => {
      ticks++;
      ticker.stop();
    }, 10, 100);

    ticker.start();
    expect(frameCallback).toBeDefined();
    frameCallback!(150);

    expect(ticks).toBe(1);
    expect(ticker.running).toBe(false);
  });
});
