/**
 * A face on the page without a component: one SVG group the frame's tick
 * writes into directly — a handful of attributes, and only those whose
 * strings changed (owner, 2026-10-07: "drawing … in batches"). A hundred faces
 * in a running room are a few hundred cheap writes a frame, with no reactive
 * bookkeeping between the numbers and the page.
 */
import { GROUND, INK, WHITE, type FaceDrawing, type FaceMark } from './draw';

const SVG = 'http://www.w3.org/2000/svg';

export interface FaceColours {
  /** The body's stroke: the features are drawn in it (the ink look in ink). */
  readonly stroke: string;
  /** The body's fill, and how opaque it is drawn, for a peeker's lid. */
  readonly fill: string;
  readonly fillOpacity: number;
}

type Layer = 'white' | 'clipped' | 'ink' | 'lidGround' | 'lidFill' | 'rings' | 'glint' | 'lines' | 'thin' | 'heavy';
const LAYERS: readonly Layer[] = ['white', 'clipped', 'ink', 'lidGround', 'lidFill', 'rings', 'glint', 'lines', 'thin', 'heavy'];

export class FaceElement {
  private readonly face: SVGGElement;
  private readonly under: SVGGElement;
  private readonly over: SVGGElement;
  private readonly outer: SVGGElement;
  private readonly clip: SVGPathElement;
  private readonly paths = {} as Record<Layer, SVGPathElement>;
  private readonly last = new Map<Element, Map<string, string>>();
  private drawing: FaceDrawing | null = null;
  private colours: FaceColours | null = null;

  constructor(
    private readonly root: SVGGElement,
    uid: string,
  ) {
    root.replaceChildren();
    this.face = el('g', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    this.under = el('g');
    this.over = el('g');
    this.outer = el('g');
    const clipPath = el('clipPath', { id: uid });
    this.clip = el('path');
    clipPath.append(this.clip);
    this.face.append(this.under, clipPath);
    for (const layer of LAYERS) {
      const p = el('path');
      if (layer === 'clipped') p.setAttribute('clip-path', `url(#${uid})`);
      this.paths[layer] = p;
      this.face.append(p);
    }
    this.face.append(this.over);
    root.append(this.face, this.outer);
  }

  /** Draw `d` (or nothing) in these colours; writes only what changed since the last call. */
  render(d: FaceDrawing | null, colours: FaceColours): void {
    if (d === this.drawing && colours === this.colours) return;
    const sameColours = !!this.colours && colours.stroke === this.colours.stroke && colours.fill === this.colours.fill && colours.fillOpacity === this.colours.fillOpacity;
    if (d === this.drawing && sameColours) {
      this.colours = colours;
      return;
    }
    // marks drawn in the body's stroke must be redrawn when only the colours changed
    const previous = sameColours ? this.drawing : null;
    this.drawing = d;
    this.colours = colours;
    if (!d) {
      for (const layer of LAYERS) this.set(this.paths[layer], 'd', '');
      this.set(this.clip, 'd', '');
      this.marks(this.under, [], previous?.under, colours.stroke);
      this.marks(this.over, [], previous?.over, colours.stroke);
      this.marks(this.outer, [], previous?.outer, colours.stroke);
      return;
    }
    const pen = d.inked ? INK : colours.stroke;
    this.set(this.face, 'transform', d.transform);
    const p = this.paths;
    this.paint(p.white, d.white, { fill: WHITE });
    this.set(this.clip, 'd', d.clip);
    this.paint(p.clipped, d.clipped, { fill: pen });
    this.paint(p.ink, d.ink, { fill: pen });
    this.paint(p.lidGround, d.lid, { fill: GROUND });
    this.paint(p.lidFill, d.lid, { fill: colours.fill, 'fill-opacity': String(colours.fillOpacity) });
    this.paint(p.rings, d.rings, { fill: 'none', stroke: pen, 'stroke-width': String(d.lineWidth * 0.85) });
    this.paint(p.glint, d.glint, { fill: WHITE });
    this.paint(p.lines, d.lines, { fill: 'none', stroke: pen, 'stroke-width': String(d.lineWidth) });
    this.paint(p.thin, d.thin, { fill: 'none', stroke: pen, 'stroke-width': String(d.lineWidth * 0.7) });
    this.paint(p.heavy, d.heavy, { fill: 'none', stroke: pen, 'stroke-width': String(d.lineWidth * 1.3) });
    this.marks(this.under, d.under, previous?.under, colours.stroke);
    this.marks(this.over, d.over, previous?.over, colours.stroke);
    this.marks(this.outer, d.outer, previous?.outer, colours.stroke);
  }

  /** A layer's path, and its paint once it has one. */
  private paint(path: SVGPathElement, d: string, attrs: Record<string, string>): void {
    this.set(path, 'd', d);
    if (!d) return;
    for (const [name, value] of Object.entries(attrs)) this.set(path, name, value);
  }

  /** Marks, few and mostly absent: their paths are kept and rewritten in place, added or dropped only as the count changes. */
  private marks(group: SVGGElement, list: readonly FaceMark[], before: readonly FaceMark[] | undefined, stroke: string): void {
    if (list === before && group.childElementCount === list.length) return;
    while (group.childElementCount > list.length) {
      // a mark that goes takes what was remembered about it along: a long room shows and hides marks for hours
      const gone = group.lastElementChild!;
      this.last.delete(gone);
      gone.remove();
    }
    while (group.childElementCount < list.length) group.append(el('path'));
    list.forEach((m, k) => {
      const path = group.children[k];
      this.set(path, 'd', m.d);
      this.set(path, 'fill', m.fill || 'none');
      this.set(path, 'stroke', m.stroke === 'none' ? 'none' : m.stroke || stroke);
      this.set(path, 'stroke-width', String(m.width || 0));
      this.set(path, 'opacity', String(m.opacity));
    });
  }

  private set(node: Element, name: string, value: string): void {
    let seen = this.last.get(node);
    if (!seen) this.last.set(node, (seen = new Map()));
    if (seen.get(name) === value) return;
    seen.set(name, value);
    node.setAttribute(name, value);
  }
}

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string> = {}): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG, tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  return node;
}

/**
 * The page's face elements, by slot: a Svelte action puts a group in place
 * (`mount`), and the tick draws into whichever are on the page (`render`).
 * A group that arrives late is drawn at once from the last drawing kept.
 */
export class FaceBoard {
  private readonly els = new Map<number, FaceElement>();
  private readonly kept = new Map<number, { d: FaceDrawing | null; colours: FaceColours }>();

  /** Svelte action: `<g use:board.mount={slot}>`. */
  readonly mount = (node: SVGGElement, slot: number) => {
    let at = slot;
    let mine: FaceElement;
    const attach = (s: number) => {
      mine = new FaceElement(node, `face-${s}-${(this.next++).toString(36)}`);
      this.els.set(s, mine);
      const k = this.kept.get(s);
      if (k) mine.render(k.d, k.colours);
    };
    // only this group's own element leaves: another may have taken the slot since
    const detach = () => {
      if (this.els.get(at) === mine) this.els.delete(at);
    };
    attach(at);
    return {
      update: (next: number) => {
        if (next === at) return;
        detach();
        at = next;
        attach(at);
      },
      destroy: detach,
    };
  };
  private next = 0;

  render(slot: number, d: FaceDrawing | null, colours: FaceColours): void {
    this.kept.set(slot, { d, colours });
    this.els.get(slot)?.render(d, colours);
  }
}
