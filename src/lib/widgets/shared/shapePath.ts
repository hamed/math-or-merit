import type { AgentShape } from './agentStyle';

/**
 * Equal-area SVG path for an agent shape centered at (0,0); area = π·r², so
 * any two shapes with the same `r` read as the same wealth (the essay's
 * honest encoding). Used by the trade scene and the winner portrait.
 */
export function svgShapePath(shape: AgentShape | string, r: number): string {
  const area = Math.PI * r * r;
  if (shape === 'triangle') {
    const side = Math.sqrt((4 * area) / Math.sqrt(3));
    const h = (side * Math.sqrt(3)) / 2;
    return `M 0 ${-(2 / 3) * h} L ${side / 2} ${h / 3} L ${-side / 2} ${h / 3} Z`;
  }
  if (shape === 'square') {
    const half = Math.sqrt(area) / 2;
    return `M ${-half} ${-half} H ${half} V ${half} H ${-half} Z`;
  }
  if (shape === 'pentagon' || shape === 'hexagon') {
    const sides = shape === 'pentagon' ? 5 : 6;
    const factor = shape === 'pentagon' ? 2.378 : 2.598;
    const rr = Math.sqrt(area / factor);
    const offset = shape === 'pentagon' ? -Math.PI / 2 : -Math.PI / 6;
    let d = '';
    for (let k = 0; k < sides; k++) {
      const a = ((Math.PI * 2) / sides) * k + offset;
      d += `${k === 0 ? 'M' : 'L'} ${(rr * Math.cos(a)).toFixed(2)} ${(rr * Math.sin(a)).toFixed(2)} `;
    }
    return d + 'Z';
  }
  // circle
  return `M 0 ${-r} A ${r} ${r} 0 1 1 0 ${r} A ${r} ${r} 0 1 1 0 ${-r} Z`;
}
