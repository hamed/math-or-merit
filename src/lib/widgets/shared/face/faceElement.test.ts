import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { FacePainter, drawStill, type FaceDrawing, type FaceMark } from './draw';
import { FaceElement, type FaceColours } from './faceElement';
import { stillOf } from './moments';

/** As much of the DOM as a face element uses: elements with attributes, in a tree. */
class Node {
  readonly attrs = new Map<string, string>();
  children: Node[] = [];
  parent: Node | null = null;
  constructor(readonly tag: string) {}
  setAttribute(name: string, value: string): void {
    this.attrs.set(name, String(value));
  }
  getAttribute(name: string): string | null {
    return this.attrs.get(name) ?? null;
  }
  append(...nodes: Node[]): void {
    for (const n of nodes) {
      n.remove();
      n.parent = this;
      this.children.push(n);
    }
  }
  replaceChildren(): void {
    for (const c of this.children) c.parent = null;
    this.children = [];
  }
  remove(): void {
    if (!this.parent) return;
    this.parent.children.splice(this.parent.children.indexOf(this), 1);
    this.parent = null;
  }
  get childElementCount(): number {
    return this.children.length;
  }
  get lastElementChild(): Node | null {
    return this.children.at(-1) ?? null;
  }
}

const ink: FaceColours = { stroke: '#111', fill: '#eee', fillOpacity: 1 };
const red: FaceColours = { stroke: '#f00', fill: '#eee', fillOpacity: 1 };
/** A sparkle over the head, drawn in the body's stroke (its own stroke left empty). */
const sparkle: FaceMark = { d: 'M0 0L1 1', fill: '', stroke: '', width: 1, opacity: 1 };

describe('a face on the page', () => {
  const saved = globalThis.document;
  beforeAll(() => {
    (globalThis as { document: unknown }).document = { createElementNS: (_ns: string, tag: string) => new Node(tag) };
  });
  afterAll(() => {
    (globalThis as { document: unknown }).document = saved;
  });

  const face = drawStill('manga', 'circle', 30, 30, stillOf({ v: 0, a: 0, d: 0, n: 0 }))!;
  const shown: FaceDrawing = { ...face, outer: [sparkle] };
  const hidden: FaceDrawing = { ...face, outer: [] };
  const mount = () => {
    const root = new Node('g');
    const el = new FaceElement(root as unknown as SVGGElement, 'f');
    // the root holds the face, then the group of marks over the head
    return { el, outer: () => root.children[1], remembered: () => (el as unknown as { last: Map<unknown, unknown> }).last.size };
  };

  it('forgets a mark once it is gone: a long room shows and hides them for hours', () => {
    const { el, remembered } = mount();
    el.render(shown, ink);
    el.render(hidden, ink);
    const settled = remembered();
    for (let k = 0; k < 100; k++) {
      el.render(shown, ink);
      el.render(hidden, ink);
    }
    expect(remembered()).toBe(settled);
  });

  it('redraws its marks in the new stroke when only the colours change', () => {
    const { el, outer } = mount();
    el.render(shown, ink);
    expect(outer().children[0].getAttribute('stroke')).toBe('#111');
    el.render(shown, red);
    expect(outer().children[0].getAttribute('stroke')).toBe('#f00');
  });

  it('places the marks over the head of the body it is on now', () => {
    const still = stillOf({ v: 0.8, a: 0.6, d: 0, n: 0 });
    const marks = { ...still.marks, sparkles: 1 };
    const painter = new FacePainter();
    painter.paint('manga', 'circle', 20, 20, still.pose, marks, 1);
    const triangle = painter.paint('manga', 'triangle', 20, 20, still.pose, marks, 1)!;
    expect(triangle.outer).toEqual(new FacePainter().paint('manga', 'triangle', 20, 20, still.pose, marks, 1)!.outer);
  });
});
