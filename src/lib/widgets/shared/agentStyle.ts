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

/**
 * The wider pool for randomized rooms (sandbox): everything above plus the
 * upside-down triangle and polygons up to the octagon. `AGENT_SHAPES` stays five so the deterministic cycle — and
 * every earlier beat's look — is untouched.
 */
export const EXTENDED_SHAPES = [...AGENT_SHAPES, 'triangleDown', 'heptagon', 'octagon'] as const;

export type AgentShape = (typeof EXTENDED_SHAPES)[number];

/** Human noun per shape — 'triangleDown' must never leak into prose. */
export const SHAPE_NOUNS: Record<AgentShape, string> = {
  circle: 'circle',
  triangle: 'triangle',
  triangleDown: 'upside-down triangle',
  square: 'square',
  pentagon: 'pentagon',
  hexagon: 'hexagon',
  heptagon: 'heptagon',
  octagon: 'octagon',
};

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

/** Single-family fallback used when individual display styles are hidden. */
export const CLASSIC_AGENT_FILL = 'rgb(189 98 69 / 26%)';
export const CLASSIC_AGENT_STROKE = '#96543c';

export interface AgentStyle {
  readonly fill: string;
  readonly stroke: string;
  readonly fillName: ColorName;
  readonly strokeName: ColorName;
  readonly shape: AgentShape;
}

/**
 * The two people the whole essay follows (D19, brief 4.2). Existing tokens
 * only: Blue wears the blue fill with the RED stroke, Red the red fill with the
 * BLUE stroke — the crossed stroke is what separates Red's pastel from the
 * neutral rose-brown wash. Both are circles.
 */
export const PROTAGONISTS: Readonly<Record<'blue' | 'red', AgentStyle>> = Object.freeze({
  blue: { fill: FILLS.blue, stroke: STROKES.red, fillName: 'blue', strokeName: 'red', shape: 'circle' },
  red: { fill: FILLS.red, stroke: STROKES.blue, fillName: 'red', strokeName: 'blue', shape: 'circle' },
});

/**
 * How each speaker's bubble wears his colours (iteration-2 brief 3.1): text in
 * very dark ink leaning toward his name's colour, the outline a pastel of his
 * circle's stroke, the paper a faint wash of his fill. Never colour alone —
 * the tail and the hidden name say who speaks too. Contrast is a test.
 */
export interface SpeakerTone {
  readonly ink: string;
  readonly edge: string;
  readonly wash: string;
}

export const SPEAKER_TONES: Readonly<Record<'blue' | 'red' | 'none', SpeakerTone>> = Object.freeze({
  blue: { ink: '#1f2c4d', edge: 'rgb(157 53 51 / 62%)', wash: 'rgb(183 207 249 / 26%)' },
  red: { ink: '#4a221e', edge: 'rgb(40 78 153 / 62%)', wash: 'rgb(246 190 184 / 26%)' },
  none: { ink: '#28251f', edge: 'rgb(117 108 93 / 55%)', wash: 'rgb(255 250 240 / 0%)' },
});

/**
 * Colour pairs (fill/stroke) a CIRCLE in a crowd may not wear (A5).
 *
 * The brief reserves the protagonists' colours in crowds. Reserving only the
 * exact pairs is not enough for a reader with colour-vision deficiency: to a
 * protanope a violet circle with a red edge IS Blue (CIEDE2000 1.1), and to a
 * deuteranope a green circle with a blue edge IS Red (0.3). These are every pair
 * within ΔE 10 of a protagonist under normal, protan, deutan or tritan vision —
 * 10 being the palette's own documented worst pair — measured by `cvd.ts` and
 * pinned by a test that recomputes them. Only circles are held to it: shape is
 * the palette's secondary encoding, so a violet TRIANGLE with a red edge is
 * never mistaken for Blue.
 */
export const RESERVED_CIRCLE_PAIRS: ReadonlySet<string> = new Set([
  'red/blue',
  'red/violet',
  'blue/red',
  'green/red',
  'green/blue',
  'green/violet',
  'violet/red',
  'teal/red',
  'teal/blue',
  'teal/violet',
  'pink/red',
  'pink/blue',
]);

/**
 * Skip on collision: a circle that would wear a reserved pair moves to the next
 * stroke that is safe. Only that agent changes — no other index moves.
 */
function safeStroke(fillIdx: number, strokeIdx: number, shape: AgentShape): number {
  if (shape !== 'circle') return strokeIdx;
  const hues = COLOR_NAMES.length;
  for (let step = 0; step < hues; step++) {
    const candidate = (strokeIdx + step) % hues;
    if (candidate === fillIdx) continue;
    if (!RESERVED_CIRCLE_PAIRS.has(`${COLOR_NAMES[fillIdx]}/${COLOR_NAMES[candidate]}`)) return candidate;
  }
  return strokeIdx;
}

/**
 * Deterministic style table: fill cycles the 6 hues; the stroke sits 1–5 hue
 * slots away (never the fill's own hue); shapes cycle the 5 kinds. The cycle
 * lengths are coprime, so 30 consecutive agents wear 30 distinct costumes
 * (fill, stroke, shape) — a "unique mix" without randomness. Three of every
 * thirty (0, 5, 20) are circles that would have looked like a protagonist; they
 * take the next safe stroke instead (A5).
 */
export function assignStyles(n: number): AgentStyle[] {
  const styles: AgentStyle[] = [];
  for (let i = 0; i < n; i++) {
    const fillIdx = i % COLOR_NAMES.length;
    const shape = AGENT_SHAPES[i % AGENT_SHAPES.length];
    const strokeIdx = safeStroke(
      fillIdx,
      (fillIdx + 1 + (i % (COLOR_NAMES.length - 1))) % COLOR_NAMES.length,
      shape,
    );
    const fillName = COLOR_NAMES[fillIdx];
    const strokeName = COLOR_NAMES[strokeIdx];
    styles.push({
      fill: FILLS[fillName],
      stroke: STROKES[strokeName],
      fillName,
      strokeName,
      shape,
    });
  }
  return styles;
}

/**
 * Random style table for the sandbox: same palette and the same
 * stroke-never-matches-fill rule, but shuffled — the deterministic cycle
 * reads as one shape per column on a grid room.
 */
export function randomStyles(n: number, rand: () => number = Math.random): AgentStyle[] {
  const styles: AgentStyle[] = [];
  for (let i = 0; i < n; i++) {
    const fillIdx = Math.floor(rand() * COLOR_NAMES.length);
    const drawnStroke = (fillIdx + 1 + Math.floor(rand() * (COLOR_NAMES.length - 1))) % COLOR_NAMES.length;
    const shape = EXTENDED_SHAPES[Math.floor(rand() * EXTENDED_SHAPES.length)];
    const strokeIdx = safeStroke(fillIdx, drawnStroke, shape);
    const fillName = COLOR_NAMES[fillIdx];
    const strokeName = COLOR_NAMES[strokeIdx];
    styles.push({
      fill: FILLS[fillName],
      stroke: STROKES[strokeName],
      fillName,
      strokeName,
      shape,
    });
  }
  return styles;
}

/** "a red pentagon with a blue edge" — for the manufactured-headline gag. */
export function styleNoun(style: AgentStyle): string {
  return `a ${style.fillName} ${SHAPE_NOUNS[style.shape]} with a ${style.strokeName} edge`;
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
  triangleDown: [
    { text: 'Points down, profits up', source: 'The upside-down triangle that flipped the market on its head' },
    { text: 'Heavy at the top', source: 'Balancing on one corner, in $FILL with a $STROKE edge — and never tipping over' },
    { text: 'The contrarian angle', source: 'Everyone else pointed up. Look who was right' },
  ],
  heptagon: [
    { text: 'Seven sides of fortune', source: 'The lucky-number polygon cashes in, in $FILL edged $STROKE' },
    { text: 'One side past six', source: 'Seven corners, zero coincidences — ask anyone in the room' },
    { text: 'The heptagon hypothesis', source: 'The edge nobody bothered to count' },
  ],
  octagon: [
    { text: 'Eight sides, no stopping', source: 'The $FILL octagon that never had to yield' },
    { text: 'Stop signs are for other shapes', source: 'Eight edges of pure momentum, outlined in $STROKE' },
    { text: 'The octagon octave', source: 'Two more sides than a hexagon — and it compounds' },
  ],
};

/**
 * Headlines for the classic (uniform terracotta) look, where the only visible
 * "trait" is WHERE the winner stood. Just as inert,
 * just as confident.
 */
const LOCATION_HEADLINES: readonly WinnerHeadline[] = [
  { text: 'Location, location, location', source: 'Why the $ZONE keeps minting winners, according to everyone' },
  { text: 'The $ZONE advantage', source: 'Fortune favors those who stand at the $ZONE — experts confirm' },
  { text: 'Right place, right everything', source: 'A masterclass in positioning, straight from the $ZONE' },
];

/** A headline about the winner's position; `run` cycles the variants. */
export function headlineForZone(zone: string, run = 0): WinnerHeadline {
  const pick = LOCATION_HEADLINES[Math.abs(run) % LOCATION_HEADLINES.length];
  return { text: pick.text.replaceAll('$ZONE', zone), source: pick.source.replaceAll('$ZONE', zone) };
}

/** A headline for the winner's style; `run` cycles the variants. */
export function headlineForStyle(style: AgentStyle, run = 0): WinnerHeadline {
  const variants = HEADLINE_TEMPLATES[style.shape];
  const pick = variants[Math.abs(run) % variants.length];
  const fill = (s: string) =>
    s.replaceAll('$FILL', style.fillName).replaceAll('$STROKE', style.strokeName).replaceAll('$SHAPE', style.shape);
  return { text: fill(pick.text), source: fill(pick.source) };
}
