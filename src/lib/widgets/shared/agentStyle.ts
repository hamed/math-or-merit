/**
 * Display styles for agents: pastel fill + independent stroke + simple shape.
 *
 * GUARD (same discipline as traits.ts): styles are assigned by index BEFORE any
 * run and exist only in the display layer. They must never enter pair
 * selection, the stake, or the coin — the simulation core cannot see this
 * module. The whole point of the essay's ending is that these traits are
 * causally inert.
 *
 * Colors are validated against the warm-paper surface (#f4efe4) with the
 * dataviz six checks: strokes carry identity (all ≥ 3:1 contrast; worst
 * all-pairs CVD ΔE 10.3, floor band — legal because shape + fill/stroke
 * pairing are strong secondary encodings). Fills are light washes of the same
 * hue families. `src/app.css` mirrors these values as --agent-* custom
 * properties; keep both lists in sync.
 */

export const AGENT_SHAPES = ['circle', 'triangle', 'square', 'pentagon', 'hexagon'] as const;

export type AgentShape = (typeof AGENT_SHAPES)[number];

export const COLOR_NAMES = ['red', 'blue', 'green', 'violet', 'teal', 'pink'] as const;

export type ColorName = (typeof COLOR_NAMES)[number];

export const STROKES: Record<ColorName, string> = {
  red: '#9d3533',
  blue: '#284e99',
  green: '#59985b',
  violet: '#865eb1',
  teal: '#1d9999',
  pink: '#a7547e',
};

export const FILLS: Record<ColorName, string> = {
  red: '#f6beb8',
  blue: '#b7cff9',
  green: '#b4dab4',
  violet: '#d7c4f1',
  teal: '#9bdcdb',
  pink: '#f0bdd4',
};

/** Golden-yellow money — reserved: no agent hue may impersonate the coin. */
export const COIN_FILL = '#e9c96a';
export const COIN_STROKE = '#8a6a2a';

export interface AgentStyle {
  readonly fill: string;
  readonly stroke: string;
  readonly fillName: ColorName;
  readonly strokeName: ColorName;
  readonly shape: AgentShape;
}

/**
 * Deterministic style table: fill cycles the 6 hues; the stroke sits 1–5 hue
 * slots away (never the fill's own hue); shapes cycle the 5 kinds. The cycle
 * lengths are coprime, so 30 consecutive agents show 30 distinct fill/stroke
 * pairs — a "unique mix" without randomness.
 */
export function assignStyles(n: number): AgentStyle[] {
  const styles: AgentStyle[] = [];
  for (let i = 0; i < n; i++) {
    const fillIdx = i % COLOR_NAMES.length;
    const strokeIdx = (fillIdx + 1 + (i % (COLOR_NAMES.length - 1))) % COLOR_NAMES.length;
    const fillName = COLOR_NAMES[fillIdx];
    const strokeName = COLOR_NAMES[strokeIdx];
    styles.push({
      fill: FILLS[fillName],
      stroke: STROKES[strokeName],
      fillName,
      strokeName,
      shape: AGENT_SHAPES[i % AGENT_SHAPES.length],
    });
  }
  return styles;
}

/** "a red pentagon with a blue edge" — for the manufactured-headline gag. */
export function styleNoun(style: AgentStyle): string {
  return `a ${style.fillName} ${style.shape} with a ${style.strokeName} edge`;
}

export interface WinnerHeadline {
  readonly text: string;
  readonly source: string;
}

/**
 * Confident machine-written success stories for the winner's inert traits.
 * $FILL / $STROKE / $SHAPE interpolate the winner's style so every rerun gets
 * a fresh, equally-sure headline about a trait that never touched the game.
 */
const HEADLINE_TEMPLATES: Record<AgentShape, readonly WinnerHeadline[]> = {
  circle: [
    { text: 'The $FILL circle that out-rolled the room', source: 'No corners, no friction, no mercy — the roundness advantage, explained' },
    { text: 'Riches come full circle', source: 'A perfectly $FILL story of rolling with it, edged in $STROKE' },
    { text: 'Well-rounded and worth it', source: 'Why $FILL-with-$STROKE is the palette of quiet winners' },
  ],
  triangle: [
    { text: 'Born pointing up', source: 'Three corners, no doubts: anatomy of a $FILL triangle that never looked down' },
    { text: 'Acute business sense', source: 'Every angle covered: the $FILL triangle with the $STROKE edge' },
    { text: 'The triangle method', source: 'The sharpest angle in the room always finds the top' },
  ],
  square: [
    { text: 'Squares: the shape of success', source: 'How one $FILL square with a $STROKE edge out-played the room' },
    { text: 'Winning, fair and square', source: 'Four equal sides. One very unequal fortune' },
    { text: 'Think inside the box', source: 'The square strategy every circle refuses to learn' },
  ],
  pentagon: [
    { text: 'Five sides of vision', source: 'The $FILL pentagon that saw what the room could not' },
    { text: 'High five', source: 'The $FILL pentagon counts its corners — and its winnings' },
    { text: 'The pentagon principle', source: 'One side more than a square — and it shows in the numbers' },
  ],
  hexagon: [
    { text: 'Six sides of genius', source: 'The most efficient shape in nature does it again — in $FILL, edged $STROKE' },
    { text: 'Hex appeal', source: 'Bees knew it. Markets just learned it. Six sides never fold' },
    { text: 'The hexagon habit', source: 'Six small edges, one enormous advantage' },
  ],
};

/** A headline for the winner's style; `run` cycles the variants. */
export function headlineForStyle(style: AgentStyle, run = 0): WinnerHeadline {
  const variants = HEADLINE_TEMPLATES[style.shape];
  const pick = variants[Math.abs(run) % variants.length];
  const fill = (s: string) =>
    s.replaceAll('$FILL', style.fillName).replaceAll('$STROKE', style.strokeName).replaceAll('$SHAPE', style.shape);
  return { text: fill(pick.text), source: fill(pick.source) };
}
