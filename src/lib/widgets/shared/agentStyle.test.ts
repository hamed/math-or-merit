import { describe, expect, it } from 'vitest';
import { AGENT_SHAPES, COIN_FILL, COLOR_NAMES, FILLS, STROKES, assignStyles, styleNoun } from './agentStyle';

describe('assignStyles', () => {
  it('is deterministic and stable across calls', () => {
    expect(assignStyles(100)).toEqual(assignStyles(100));
  });

  it('never gives an agent the same hue for fill and stroke', () => {
    for (const style of assignStyles(1000)) {
      expect(style.fillName).not.toBe(style.strokeName);
    }
  });

  it('cycles through every shape and every hue within 30 agents', () => {
    const styles = assignStyles(30);
    expect(new Set(styles.map((s) => s.shape))).toEqual(new Set(AGENT_SHAPES));
    expect(new Set(styles.map((s) => s.fillName))).toEqual(new Set(COLOR_NAMES));
    expect(new Set(styles.map((s) => s.strokeName))).toEqual(new Set(COLOR_NAMES));
  });

  it('gives 30 consecutive agents 30 distinct fill/stroke pairs', () => {
    const pairs = new Set(assignStyles(30).map((s) => `${s.fillName}/${s.strokeName}`));
    expect(pairs.size).toBe(30);
  });

  it('resolves names to the documented palette hexes', () => {
    const [first] = assignStyles(1);
    expect(first.fill).toBe(FILLS[first.fillName]);
    expect(first.stroke).toBe(STROKES[first.strokeName]);
  });

  it('reserves the golden coin color: no agent hue matches it', () => {
    const all = [...Object.values(FILLS), ...Object.values(STROKES)];
    expect(all).not.toContain(COIN_FILL);
  });
});

describe('styleNoun', () => {
  it('reads as a headline-ready trait phrase', () => {
    const [first] = assignStyles(1);
    expect(styleNoun(first)).toBe(`a ${first.fillName} ${first.shape} with a ${first.strokeName} edge`);
  });
});
