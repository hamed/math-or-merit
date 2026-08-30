import { describe, expect, it, beforeEach } from 'vitest';
import {
  addMeasurement,
  clearPhaseData,
  curveVs,
  decodePhaseCells,
  exportCsv,
  importCsv,
  pointsFor,
} from './phaseGrid.svelte';

beforeEach(() => clearPhaseData());

describe('phase record', () => {
  it('averages repeated measurements of the same setting', () => {
    addMeasurement(0.2, 0.1, 128, 0.3);
    addMeasurement(0.2, 0.1, 128, 0.5);
    const pts = pointsFor(128);
    expect(pts).toHaveLength(1);
    expect(pts[0].gini).toBeCloseTo(0.4, 9);
    expect(pts[0].count).toBe(2);
  });

  it('never mixes room sizes — the settled Gini is a finite-size quantity', () => {
    addMeasurement(0.2, 0.1, 128, 0.3);
    addMeasurement(0.2, 0.1, 256, 0.9);
    expect(pointsFor(128)).toHaveLength(1);
    expect(pointsFor(256)).toHaveLength(1);
    expect(pointsFor(64)).toHaveLength(0);
  });

  it('cuts a cross-section at the nearest measured value of the other dial', () => {
    addMeasurement(0.2, 0, 128, 0.95);
    addMeasurement(0.2, 0.1, 128, 0.3);
    addMeasurement(0.2, 0.5, 128, 0.12);
    addMeasurement(0.5, 0.1, 128, 0.5);
    const cut = curveVs('tax', 0.21, 128); // nearest measured stake group: 0.2
    expect(cut.fixedUsed).toBe(0.2);
    expect(cut.points.map((p) => p.v)).toEqual([0, 0.1, 0.5]);
    expect(curveVs('tax', 0.9, 128).fixedUsed).toBeNull(); // nothing near 90%
  });

  it('round-trips through CSV, merging weighted averages', () => {
    addMeasurement(0.2, 0.1, 128, 0.4);
    const csv = exportCsv();
    clearPhaseData();
    addMeasurement(0.2, 0.1, 128, 0.2); // local point first…
    expect(importCsv(csv)).toBe(1); // …then merge the exported one back in
    const pts = pointsFor(128);
    expect(pts[0].count).toBe(2);
    expect(pts[0].gini).toBeCloseTo(0.3, 9);
  });

  it('rejects malformed CSV rows without dying', () => {
    expect(importCsv('stake,tax,n,gini,count\nnot,a,row,at,all\n0.1,0.1,64,abc,2')).toBe(0);
  });

  it('keeps arbitrary finite economic values while enforcing CSV structure', () => {
    const csv = [
      'stake,tax,n,gini,count',
      '-2,0,64,-0.5,2',
      '0,0,1,0.2,1',
      '0,0,64,0.2,1.5',
    ].join('\n');
    expect(importCsv(csv)).toBe(1);
    expect(pointsFor(64)).toEqual([{ stake: -2, tax: 0, n: 64, gini: -0.5, count: 2 }]);
  });

  it('filters malformed persisted cells without discarding valid ones', () => {
    const cells = decodePhaseCells(JSON.stringify({
      '-2|0|64': { sum: -1, count: 2 },
      '0.2|0.1|1': { sum: 0.5, count: 1 },
      '0.2|0.1|64': { sum: 'bad', count: 1 },
      broken: null,
    }));
    expect(cells).toEqual({ '-2|0|64': { sum: -1, count: 2 } });
  });
});
