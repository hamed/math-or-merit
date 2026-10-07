import { describe, expect, it } from 'vitest';
import { BIG, CROWD, RAINED, SMALL, START } from './crowd';
import { momentOf, type FaceCue } from './feelings';
import { PAIR_STEPS } from './script';

const calm: FaceCue = { air: false, caught: new Array(CROWD).fill(0), rainOver: true };
const tosses = PAIR_STEPS.map((s, i) => i).filter((i) => PAIR_STEPS[i].action === 'toss');

describe('the pair’s faces', () => {
  it('react to every toss: Blue proud or scornful, Red happy or sad', () => {
    expect(tosses.length).toBeGreaterThan(0);
    for (const i of tosses) {
      const pose = PAIR_STEPS[i].pose;
      const blueWon = pose.flip === 'blue';
      expect(momentOf(BIG, 'blue', pose, calm)).toBe(blueWon ? 'proud' : 'contempt');
      expect(momentOf(SMALL, 'red', pose, calm)).toBe(blueWon ? 'sad' : 'happy');
    }
  });

  it('watch the coin while it is in the air', () => {
    const pose = PAIR_STEPS[tosses[0]].pose;
    expect(momentOf(BIG, 'blue', pose, { ...calm, air: true })).toBe('startled');
    expect(momentOf(SMALL, 'red', pose, { ...calm, air: true })).toBe('startled');
  });

  it('let a reaction go once the next stakes are on the table or the coin is put away', () => {
    for (const i of tosses) {
      const next = PAIR_STEPS.findIndex((s, j) => j > i && (s.pose.flip === 'hidden' || s.pose.table.blue + s.pose.table.red > 0));
      if (next < 0) continue;
      expect(momentOf(BIG, 'blue', PAIR_STEPS[next].pose, calm)).toBe('neutral');
      expect(momentOf(SMALL, 'red', PAIR_STEPS[next].pose, calm)).toBe('neutral');
    }
  });
});

describe('the crowd’s faces in the rain', () => {
  const paid = PAIR_STEPS.find((s) => s.pose.crowd === 'paid')!.pose;
  const caught = RAINED.map((n, i) => n - START[i]);

  it('light up with a coin and fall when the rain ends without one', () => {
    for (let i = 0; i < CROWD; i++) {
      expect(momentOf(i, null, paid, { air: false, caught, rainOver: true })).toBe(caught[i] > 0 ? 'happy' : 'sad');
    }
    // Red is the one the rain passed by
    expect(caught[SMALL]).toBe(0);
  });

  it('wait, neither glad nor sad, while coins are still falling', () => {
    const none = new Array(CROWD).fill(0);
    for (let i = 0; i < CROWD; i++) expect(momentOf(i, null, paid, { air: false, caught: none, rainOver: false })).toBe('neutral');
  });
});
