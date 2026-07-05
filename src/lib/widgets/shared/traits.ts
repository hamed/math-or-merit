/**
 * Causally inert display traits for the merit-illusion beat.
 *
 * GUARD (outline beat 13, research.md C12): traits are assigned round-robin
 * BEFORE any run and exist only in the display layer. They must never enter
 * pair selection, the stake, or the coin — the simulation core cannot even
 * see this module.
 */
export const TRAIT_SHAPES = ['square', 'triangle', 'diamond', 'star', 'hexagon', 'heart'] as const;

export type TraitShape = (typeof TRAIT_SHAPES)[number];

/** Round-robin shape table: agent i gets TRAIT_SHAPES[i % 6], fixed pre-run. */
export function assignShapes(n: number): TraitShape[] {
  const shapes: TraitShape[] = [];
  for (let i = 0; i < n; i++) shapes.push(TRAIT_SHAPES[i % TRAIT_SHAPES.length]);
  return shapes;
}

export interface WinnerHeadline {
  readonly text: string;
  readonly source: string;
}

const HEADLINES: Record<TraitShape, readonly WinnerHeadline[]> = {
  square: [
    { text: 'Squares: the shape of success', source: 'How one sharp-cornered trader out-played the room' },
    { text: 'Think inside the box', source: 'The square strategy every circle refuses to learn' },
  ],
  triangle: [
    { text: 'Born pointing up', source: 'Three corners, no doubts — anatomy of a triangle that never looked down' },
    { text: 'The triangle method', source: 'Why the sharpest angle in the room always finds the top' },
  ],
  diamond: [
    { text: 'Diamond hands', source: 'The hardest shape in the room simply never cracked' },
    { text: 'Pressure makes diamonds', source: 'What the rest of the room could learn from four perfect facets' },
  ],
  star: [
    { text: 'A star is born rich', source: 'Five points, one fortune: the talent was visible all along' },
    { text: 'Written in the stars', source: 'Insiders say they saw this shape rising years ago' },
  ],
  hexagon: [
    { text: 'Six sides of genius', source: 'The most efficient shape in nature does it again' },
    { text: 'The hexagon habit', source: 'Six small edges, one enormous advantage' },
  ],
  heart: [
    { text: 'Fortune favors the warm-hearted', source: 'Loved by the market: how kindness compounded' },
    { text: 'All heart, all the way up', source: 'The feel-good fortune the room needed' },
  ],
};

/** A confident, machine-written success story for the winner's inert trait. */
export function headlineFor(shape: TraitShape, run = 0): WinnerHeadline {
  const variants = HEADLINES[shape];
  return variants[Math.abs(run) % variants.length];
}

/** "a square", "a hexagon"… for prose interpolation. */
export function shapeNoun(shape: TraitShape): string {
  return `a ${shape}`;
}
