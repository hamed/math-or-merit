import { describe, expect, it } from 'vitest';
import { judgeGame } from './judge';

describe('judgeGame', () => {
  it('fires only after effective participation stays below the line for the sustain window', () => {
    const open = new Array(300).fill(30);
    expect(judgeGame(open, 20, 180)).toBe(false);

    const closed = new Array(300).fill(15);
    expect(judgeGame(closed, 20, 180)).toBe(true);

    // A single recovery inside the window keeps the field open.
    const recovery = new Array(300).fill(15);
    recovery[250] = 25;
    expect(judgeGame(recovery, 20, 180)).toBe(false);

    // too little history: never a loss
    expect(judgeGame(new Array(100).fill(1), 20, 180)).toBe(false);
  });
});
