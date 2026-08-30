import { describe, expect, it } from 'vitest';
import { guidedRunAction } from './guidance';

describe('guidedRunAction', () => {
  it('groups start, completion, and release into separate forward actions', () => {
    expect(guidedRunAction('idle', 1)).toBe('start');
    expect(guidedRunAction('running', 1)).toBe('finish');
    expect(guidedRunAction('finished', 1)).toBe('pass');
  });

  it('reverses an active or completed run and releases before the start', () => {
    expect(guidedRunAction('finished', -1)).toBe('undo');
    expect(guidedRunAction('running', -1)).toBe('undo');
    expect(guidedRunAction('idle', -1)).toBe('pass');
  });
});
