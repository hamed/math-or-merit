import { describe, expect, it } from 'vitest';
import { PAPER, VISIONS, deltaE2000, over, parseColor, seenDelta } from './cvd';
import {
  CLASSIC_AGENT_FILL,
  CLASSIC_AGENT_STROKE,
  COLOR_NAMES,
  FILLS,
  PROTAGONISTS,
  RESERVED_CIRCLE_PAIRS,
  STROKES,
  assignStyles,
  randomStyles,
  type AgentStyle,
} from './agentStyle';

/** The palette's own documented worst pair; nothing a reader must tell apart may be closer. */
const FLOOR = 10;
/** Styled agents are filled at 0.75 over the paper (roomRenderer's fillAlpha). */
const FILL_ALPHA = 0.75;

function costumeDelta(a: { fill: string; stroke: string }, b: { fill: string; stroke: string }, vision: (typeof VISIONS)[number], bAlpha = FILL_ALPHA) {
  return Math.max(
    seenDelta(over(a.fill, undefined, FILL_ALPHA), over(b.fill, undefined, bAlpha), vision),
    seenDelta(over(a.stroke), over(b.stroke), vision),
  );
}

describe('CIEDE2000', () => {
  it('matches the published reference pairs (Sharma, Wu & Dalal 2005)', () => {
    expect(deltaE2000({ L: 50, a: 2.6772, b: -79.7751 }, { L: 50, a: 0, b: -82.7485 })).toBeCloseTo(2.0425, 4);
    expect(deltaE2000({ L: 50, a: 2.5, b: 0 }, { L: 73, a: 25, b: -18 })).toBeCloseTo(27.1492, 4);
    expect(deltaE2000({ L: 60.2574, a: -34.0099, b: 36.2677 }, { L: 60.4626, a: -34.1751, b: 39.4387 })).toBeCloseTo(1.2644, 4);
  });
});

describe('the protagonists stay findable (A5, brief 4.2)', () => {
  const pair = Object.values(PROTAGONISTS);

  for (const vision of VISIONS) {
    it(`stand out from the neutral wash they wear before the introductions — ${vision}`, () => {
      const classic = { fill: CLASSIC_AGENT_FILL, stroke: CLASSIC_AGENT_STROKE };
      for (const p of pair) expect(costumeDelta(p, classic, vision, 1)).toBeGreaterThanOrEqual(FLOOR);
    });

    it(`never look like each other — ${vision}`, () => {
      expect(costumeDelta(PROTAGONISTS.blue, PROTAGONISTS.red, vision)).toBeGreaterThanOrEqual(FLOOR);
    });
  }

  it('reserve exactly the colour pairs a reader could mistake for one of them', () => {
    const measured = new Set<string>();
    for (const f of COLOR_NAMES) {
      for (const s of COLOR_NAMES) {
        if (f === s) continue;
        const costume = { fill: FILLS[f], stroke: STROKES[s] };
        const confusable = pair.some((p) => VISIONS.some((v) => costumeDelta(costume, p, v) < FLOOR));
        if (confusable) measured.add(`${f}/${s}`);
      }
    }
    expect([...measured].sort()).toEqual([...RESERVED_CIRCLE_PAIRS].sort());
  });

  const wearsReserved = (style: AgentStyle) =>
    style.shape === 'circle' && RESERVED_CIRCLE_PAIRS.has(`${style.fillName}/${style.strokeName}`);

  it('keep every circle in a costumed room out of the reserved pairs', () => {
    expect(assignStyles(1000).filter(wearsReserved)).toEqual([]);
  });

  it('keep every circle in a random sandbox room out of them too', () => {
    let seed = 42;
    const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
    expect(randomStyles(5000, rand).filter(wearsReserved)).toEqual([]);
  });

  it('move only the agents that collided — no other index changes', () => {
    const styles = assignStyles(60);
    const moved = styles
      .map((style, i) => ({ style, i }))
      .filter(({ style, i }) => {
        const naturalStroke = COLOR_NAMES[(i % 6 + 1 + (i % 5)) % 6];
        return style.strokeName !== naturalStroke;
      })
      .map(({ i }) => i);
    expect(moved).toEqual([0, 5, 20, 30, 35, 50]);
  });
});

describe('speaker-coloured text is readable (A6)', () => {
  const luminance = (css: string) => {
    const lin = parseColor(css).rgb.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  };
  const contrast = (a: string, b: string) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };

  it('sets Blue and Red in their stroke tokens, both past WCAG AA on the paper', () => {
    expect(contrast(STROKES.blue, PAPER)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(STROKES.red, PAPER)).toBeGreaterThanOrEqual(4.5);
  });

  it('never sets text in a pastel fill — those are nowhere near readable', () => {
    for (const name of COLOR_NAMES) expect(contrast(FILLS[name], PAPER)).toBeLessThan(2);
  });
});
