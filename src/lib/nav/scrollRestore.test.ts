import { describe, expect, it } from 'vitest';
import {
  hasSettled,
  parsePlace,
  placeFor,
  movedBeforeMount,
  READER_MOVE_PX,
  shouldRestore,
  STABLE_FRAMES,
  targetFor,
} from './scrollRestore';

const anchors = [
  { id: 'question', top: 1200 },
  { id: 'cow', top: 4000 },
  { id: 'spherical-human', top: 9945 },
  { id: 'guess', top: 19500 },
];

describe('remembering the reader’s place', () => {
  it('names the chapter the reader is inside, and how far into it', () => {
    expect(placeFor(anchors, 16500)).toEqual({ id: 'spherical-human', offset: 6555, hash: '' });
    expect(placeFor(anchors, 4000)).toEqual({ id: 'cow', offset: 0, hash: '' });
    expect(placeFor(anchors, 19600, '#gini')).toEqual({ id: 'guess', offset: 100, hash: '#gini' });
  });

  it('has nothing to remember above the first chapter', () => {
    expect(placeFor(anchors, 100)).toBeNull();
    expect(placeFor([], 5000)).toBeNull();
  });

  it('accepts only a place it could act on', () => {
    expect(parsePlace('{"id":"cow","offset":40,"hash":"#gini"}')).toEqual({ id: 'cow', offset: 40, hash: '#gini' });
    // A place written before the hash was recorded still restores.
    expect(parsePlace('{"id":"cow","offset":40}')).toEqual({ id: 'cow', offset: 40, hash: '' });
    expect(parsePlace(null)).toBeNull();
    expect(parsePlace('not json')).toBeNull();
    expect(parsePlace('{"id":"","offset":40}')).toBeNull();
    expect(parsePlace('{"id":"cow"}')).toBeNull();
    expect(parsePlace('{"id":"cow","offset":-8}')).toBeNull();
  });

  it('defers to a fragment the reader has just asked for', () => {
    const place = { id: 'cow', offset: 40, hash: '' };
    expect(shouldRestore('', place)).toBe(true);
    expect(shouldRestore('#', place)).toBe(true);
    expect(shouldRestore('#sandbox', place)).toBe(false);
    expect(shouldRestore('', null)).toBe(false);
  });

  it('is not fooled by a fragment left in the address bar', () => {
    // Opened at /#gini, read on to the verdict: ChapterIndex leaves #gini behind.
    const place = { id: 'verdict', offset: 73, hash: '#gini' };
    expect(shouldRestore('#gini', place, 'reload')).toBe(true);
    expect(shouldRestore('#gini', place, 'back_forward')).toBe(true);
    // Same stale fragment, but as a fresh entry rather than a return.
    expect(shouldRestore('#gini', place, 'navigate')).toBe(true);
    // A fragment the reader has genuinely just navigated to still wins.
    expect(shouldRestore('#sandbox', place, 'navigate')).toBe(false);
    expect(shouldRestore('#sandbox', place, 'reload')).toBe(true);
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

  it('treats a page that already moved as the reader having taken over', () => {
    // Manual restoration means a reload starts at the top.
    expect(movedBeforeMount(0)).toBe(false);
    // Sub-pixel rounding and the browser's own nudges stay inside the margin.
    expect(movedBeforeMount(READER_MOVE_PX)).toBe(false);
    // A wheel or a scrollbar drag that landed before this script mounted.
    expect(movedBeforeMount(READER_MOVE_PX + 1)).toBe(true);
    expect(movedBeforeMount(4000)).toBe(true);
  });
});
