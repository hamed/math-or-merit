export interface Ticker {
  start(): void;
  stop(): void;
  readonly running: boolean;
}

export interface FixedStepClock {
  advance(elapsedMs: number): number;
  reset(): void;
}

/** Converts irregular render intervals into a bounded number of equal logical ticks. */
export function createFixedStepClock(stepMs = 1000 / 60, maxCatchUpMs = 100): FixedStepClock {
  let accumulated = 0;
  return {
    advance(elapsedMs) {
      accumulated = Math.min(maxCatchUpMs, accumulated + Math.max(0, elapsedMs));
      const steps = Math.floor((accumulated + Number.EPSILON * 16) / stepMs);
      accumulated -= steps * stepMs;
      return steps;
    },
    reset() {
      accumulated = 0;
    },
  };
}

/** requestAnimationFrame loop with delta time; safe to start/stop repeatedly. */
export function createTicker(tick: (dtMs: number) => void): Ticker {
  let frame: number | undefined;
  let last = 0;

  function loop(now: number): void {
    frame = requestAnimationFrame(loop);
    const dt = Math.min(100, now - last);
    last = now;
    tick(dt);
  }

  return {
    start() {
      if (frame !== undefined) return;
      last = performance.now();
      frame = requestAnimationFrame(loop);
    },
    stop() {
      if (frame === undefined) return;
      cancelAnimationFrame(frame);
      frame = undefined;
    },
    get running() {
      return frame !== undefined;
    },
  };
}

/** A requestAnimationFrame ticker whose work matches the intended 60 Hz clock on every display. */
export function createFixedTicker(
  tick: (dtMs: number) => void,
  stepMs = 1000 / 60,
  maxCatchUpMs = 100,
): Ticker {
  const clock = createFixedStepClock(stepMs, maxCatchUpMs);
  const ticker = createTicker((elapsedMs) => {
    const steps = clock.advance(elapsedMs);
    for (let i = 0; i < steps; i++) {
      if (!ticker.running) break;
      tick(stepMs);
    }
  });

  return {
    start() {
      if (ticker.running) return;
      clock.reset();
      ticker.start();
    },
    stop: () => ticker.stop(),
    get running() {
      return ticker.running;
    },
  };
}
