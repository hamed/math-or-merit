import { beforeEach, describe, expect, it } from 'vitest';
import type { ExperimentProtocol, OutcomeMeasurement } from '$lib/research';
import {
  addOutcome,
  clearPhaseData,
  curveVs,
  curveVsMetric,
  decodeLegacyPhaseCells,
  decodeOutcomeStore,
  exportCsv,
  importCsv,
  migrateLegacyPhaseCells,
  metricPointsFor,
  outcomeProtocolFor,
  phaseData,
  pointsFor,
  protocolKey,
} from './phaseGrid.svelte';

const outcome = (gini: number): OutcomeMeasurement => ({
  gini,
  topShare: gini / 2,
  effectiveParticipants: 100 * (1 - gini),
  wealthTurnover: 0.3 * (1 - gini),
  levyFlow: 0.02,
});

beforeEach(() => clearPhaseData());

describe('versioned outcome record', () => {
  it('counts one independent outcome once and averages repeated fresh rooms', () => {
    const protocol = outcomeProtocolFor(128);
    addOutcome(protocol, 0.2, 0.1, outcome(0.3));
    expect(pointsFor(128)).toEqual([
      { stake: 0.2, tax: 0.1, n: 128, gini: 0.3, count: 1, protocolVersion: 2 },
    ]);
    addOutcome(protocol, 0.2, 0.1, outcome(0.5));
    expect(pointsFor(128)[0].count).toBe(2);
    expect(pointsFor(128)[0].gini).toBeCloseTo(0.4, 12);
  });

  it('keeps population, cadence, and horizon protocols isolated', () => {
    const base = outcomeProtocolFor(128);
    const slowerLevy: ExperimentProtocol = { ...base, levyEveryRounds: 2 };
    const longer: ExperimentProtocol = { ...base, trades: base.trades * 2, burnIn: base.burnIn * 2 };
    addOutcome(base, 0.2, 0.1, outcome(0.3));
    addOutcome(slowerLevy, 0.2, 0.1, outcome(0.6));
    addOutcome(longer, 0.2, 0.1, outcome(0.9));
    addOutcome(outcomeProtocolFor(256), 0.2, 0.1, outcome(0.8));

    expect(Object.keys(phaseData.cells)).toHaveLength(4);
    expect(pointsFor(128, base)[0].gini).toBeCloseTo(0.3, 12);
    expect(pointsFor(128, slowerLevy)[0].gini).toBeCloseTo(0.6, 12);
    expect(pointsFor(128, longer)[0].gini).toBeCloseTo(0.9, 12);
    expect(pointsFor(256)[0].gini).toBeCloseTo(0.8, 12);
  });

  it('cuts a cross-section only through the requested protocol', () => {
    const protocol = outcomeProtocolFor(128);
    addOutcome(protocol, 0.2, 0, outcome(0.95));
    addOutcome(protocol, 0.2, 0.1, outcome(0.3));
    addOutcome(protocol, 0.2, 0.5, outcome(0.12));
    addOutcome(protocol, 0.5, 0.1, outcome(0.5));
    const cut = curveVs('tax', 0.21, 128, protocol);
    expect(cut.fixedUsed).toBe(0.2);
    expect(cut.points.map((point) => point.v)).toEqual([0, 0.1, 0.5]);
    expect(curveVs('tax', 0.9, 128, protocol).fixedUsed).toBeNull();
  });

  it('reads effective participation from the same independent outcome cells', () => {
    const protocol = outcomeProtocolFor(128);
    addOutcome(protocol, 0.2, 0, outcome(0.8));
    addOutcome(protocol, 0.2, 0.1, outcome(0.4));
    addOutcome(protocol, 0.2, 0.5, outcome(0.1));

    const points = metricPointsFor(128, 'effectiveParticipants');
    expect(points).toHaveLength(3);
    expect(points[0].value).toBeCloseTo(20, 12);
    expect(points[1].value).toBeCloseTo(60, 12);
    expect(points[2].value).toBeCloseTo(90, 12);
    const cut = curveVsMetric('tax', 0.2, 128, 'effectiveParticipants');
    expect(cut.metric).toBe('effectiveParticipants');
    expect(cut.points[0].value).toBeCloseTo(20, 12);
    expect(cut.points[1].value).toBeCloseTo(60, 12);
    expect(cut.points[2].value).toBeCloseTo(90, 12);
  });

  it('round-trips every metric through versioned CSV with weighted counts', () => {
    const protocol = outcomeProtocolFor(128);
    addOutcome(protocol, 0.2, 0.1, outcome(0.4));
    const csv = exportCsv();
    clearPhaseData();
    addOutcome(protocol, 0.2, 0.1, outcome(0.2));
    expect(importCsv(csv)).toBe(5);
    const point = pointsFor(128)[0];
    expect(point.count).toBe(2);
    expect(point.gini).toBeCloseTo(0.3, 12);
    const cell = Object.values(phaseData.cells)[0];
    expect(cell.metrics.effectiveParticipants?.count).toBe(2);
    expect(cell.metrics.wealthTurnover?.count).toBe(2);
  });

  it('preserves arbitrary finite expert settings while rejecting malformed rows', () => {
    const protocol = outcomeProtocolFor(64);
    expect(addOutcome(protocol, -2, -0.5, outcome(-0.5))).toBe(true);
    expect(pointsFor(64)).toEqual([
      { stake: -2, tax: -0.5, n: 64, gini: -0.5, count: 1, protocolVersion: 2 },
    ]);
    expect(importCsv('schema,broken\nnot,a,row')).toBe(0);
  });
});

describe('legacy evidence migration', () => {
  it('migrates valid Gini without fabricating other metrics', () => {
    const decoded = decodeLegacyPhaseCells(JSON.stringify({
      '-2|0|64': { sum: -1, count: 2 },
      '0.2|0.1|1': { sum: 0.5, count: 1 },
      '0.2|0.1|64': { sum: 'bad', count: 1 },
      broken: null,
    }));
    const migrated = migrateLegacyPhaseCells(decoded);
    const cell = Object.values(migrated)[0];
    expect(cell.protocol.version).toBe(1);
    expect(cell.metrics).toEqual({ gini: { sum: -1, count: 2 } });
    phaseData.cells = migrated;
    expect(pointsFor(64)[0]).toMatchObject({ gini: -0.5, count: 2, protocolVersion: 1 });
    expect(metricPointsFor(64, 'effectiveParticipants')).toEqual([]);
  });

  it('imports the old CSV as protocol-v1 Gini-only evidence', () => {
    const csv = 'stake,tax,n,gini,count\n0.2,0.1,64,0.4,3';
    expect(importCsv(csv)).toBe(1);
    expect(pointsFor(64)[0]).toMatchObject({ count: 3, protocolVersion: 1 });
    expect(pointsFor(64)[0].gini).toBeCloseTo(0.4, 12);
    const cell = Object.values(phaseData.cells)[0];
    expect(cell.metrics.effectiveParticipants).toBeUndefined();
  });

  it('decodes only structurally valid v2 cells and canonicalizes their keys', () => {
    const protocol = outcomeProtocolFor(32);
    const valid = {
      protocol,
      stake: 0.2,
      tax: 0.1,
      metrics: { gini: { sum: 0.4, count: 1 } },
    };
    const decoded = decodeOutcomeStore(JSON.stringify({
      schemaVersion: 2,
      cells: {
        arbitrary: valid,
        brokenMetric: { ...valid, metrics: { gini: { sum: 'x', count: 1 } } },
        brokenProtocol: { ...valid, protocol: { ...protocol, trades: protocol.trades - 1 } },
      },
    }));
    expect(Object.keys(decoded)).toEqual([`${protocolKey(protocol)}|0.2|0.1`]);
  });
});
