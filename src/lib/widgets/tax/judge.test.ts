import { describe, expect, it } from 'vitest';
import { judgeGame } from './judge';

describe('judgeGame', () => {
  it('fires only after the top share stays over the line for the sustain window', () => {
    const under = new Array(300).fill(0.3);
    expect(judgeGame(under, 0.35, 180)).toBe(false);

    const over = new Array(300).fill(0.4);
    expect(judgeGame(over, 0.35, 180)).toBe(true);

    // a single dip inside the window resets the loss
    const dip = new Array(300).fill(0.4);
    dip[250] = 0.2;
    expect(judgeGame(dip, 0.35, 180)).toBe(false);

    // too little history: never a loss
    expect(judgeGame(new Array(100).fill(0.9), 0.35, 180)).toBe(false);
  });
});
