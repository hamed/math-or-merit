import { describe, expect, it } from 'vitest';
import { drawAgents, type PulseDirection } from './roomRenderer';

function pulseAppearance(direction: PulseDirection, progress: number): { radius: number; alpha: number } {
  let firstArc: number | undefined;
  let firstStrokeAlpha: number | undefined;
  const ctx = {
    globalAlpha: 1,
    beginPath() {},
    arc(_x: number, _y: number, radius: number) { firstArc ??= radius; },
    save() {},
    restore() {},
    stroke() { firstStrokeAlpha ??= ctx.globalAlpha; },
    fill() {},
  } as unknown as CanvasRenderingContext2D;
  drawAgents(ctx, {
    positions: [{ x: 20, y: 20 }],
    displayed: [0.25],
    order: [0],
    scale: 10,
    pulses: new Map([[0, [{ progress, direction }]]]),
  });
  return { radius: firstArc!, alpha: firstStrokeAlpha! };
}

describe('manual tax pulse', () => {
  it('travels farther, brightening with distance in both directions', () => {
    const outwardNear = pulseAppearance('out', 0.2);
    const outwardFar = pulseAppearance('out', 0.8);
    const inwardFar = pulseAppearance('in', 0.2);
    const inwardNear = pulseAppearance('in', 0.8);
    expect(outwardFar.radius - outwardNear.radius).toBeGreaterThan(20);
    expect(inwardFar.radius - inwardNear.radius).toBeGreaterThan(20);
    expect(outwardFar.alpha).toBeGreaterThan(outwardNear.alpha);
    expect(inwardFar.alpha).toBeGreaterThan(inwardNear.alpha);
  });

  it('draws overlapping incoming and outgoing pulses on the same person', () => {
    let strokes = 0;
    const ctx = {
      globalAlpha: 1,
      beginPath() {},
      arc() {},
      save() {},
      restore() {},
      stroke() { strokes++; },
      fill() {},
    } as unknown as CanvasRenderingContext2D;
    drawAgents(ctx, {
      positions: [{ x: 20, y: 20 }],
      displayed: [0.25],
      order: [0],
      scale: 10,
      pulses: new Map([[0, [
        { progress: 0.2, direction: 'out' },
        { progress: 0.6, direction: 'in' },
      ]]]),
    });
    expect(strokes).toBe(3); // two rings and the body outline
  });
});
