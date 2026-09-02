import { describe, expect, it } from 'vitest';
import { hasSettled, parsePlace, placeFor, shouldRestore, STABLE_FRAMES, targetFor } from './scrollRestore';

const anchors = [
  { id: 'question', top: 1200 },
  { id: 'cow', top: 4000 },
  { id: 'spherical-human', top: 9945 },
  { id: 'guess', top: 19500 },
];

describe('remembering the reader’s place', () => {
  it('names the chapter the reader is inside, and how far into it', () => {
    expect(placeFor(anchors, 16500)).toEqual({ id: 'spherical-human', offset: 6555 });
    expect(placeFor(anchors, 4000)).toEqual({ id: 'cow', offset: 0 });
    expect(placeFor(anchors, 19600)).toEqual({ id: 'guess', offset: 100 });
  });

  it('has nothing to remember above the first chapter', () => {
    expect(placeFor(anchors, 100)).toBeNull();
    expect(placeFor([], 5000)).toBeNull();
  });

  it('accepts only a place it could act on', () => {
    expect(parsePlace('{"id":"cow","offset":40}')).toEqual({ id: 'cow', offset: 40 });
    expect(parsePlace(null)).toBeNull();
    expect(parsePlace('not json')).toBeNull();
    expect(parsePlace('{"id":"","offset":40}')).toBeNull();
    expect(parsePlace('{"id":"cow"}')).toBeNull();
    expect(parsePlace('{"id":"cow","offset":-8}')).toBeNull();
  });

  it('defers to a hash, which names a destination the reader asked for', () => {
    const place = { id: 'cow', offset: 40 };
    expect(shouldRestore('', place)).toBe(true);
    expect(shouldRestore('#', place)).toBe(true);
    expect(shouldRestore('#sandbox', place)).toBe(false);
    expect(shouldRestore('', null)).toBe(false);
  });

  it('reaches only as far as the document currently allows', () => {
    // Mid-reload the deferred scenes have not mounted, so the page is short.
    expect(targetFor(9945, 6555, 8332, 527)).toBe(7805);
    // Once they have, the remembered place is reachable exactly.
    expect(targetFor(9945, 6555, 40000, 527)).toBe(16500);
    expect(targetFor(9945, 6555, 200, 527)).toBe(0);
  });

  it('waits for every deferred block before accepting the place', () => {
    // Anything still unmounted can grow the page and move the anchor again.
    expect(hasSettled(STABLE_FRAMES, 1)).toBe(false);
    expect(hasSettled(STABLE_FRAMES - 1, 0)).toBe(false);
    expect(hasSettled(STABLE_FRAMES, 0)).toBe(true);
  });
});
