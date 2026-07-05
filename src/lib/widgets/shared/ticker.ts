export interface Ticker {
  start(): void;
  stop(): void;
  readonly running: boolean;
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
