/**
 * The pictures a bubble can carry (`\image{name}` in the script, owner
 * 2026-10-09: "images posted as attachments"): the owner's cow plates, which
 * Red now posts into the talk as he tells the joke. Content, by name: the
 * stage knows none of them, only that a name is a picture.
 */
import introduction from './00-introduction.webp';
import darwin from './01-darwin.webp';
import chemist from './02-chemist.webp';
import silence from './03-silence.webp';
import cowLooks from './04-cow-looks.webp';
import cowMoos from './05-cow-moos.webp';
import scratch from './06-scratch.webp';
import physicist from './07-physicist.webp';
import spherical from './08-spherical.webp';
import vacuum from './09-vacuum.webp';
import football from './10-football.webp';

export const PICTURES: Readonly<Record<string, string>> = {
  introduction,
  darwin,
  chemist,
  silence,
  'cow-looks': cowLooks,
  'cow-moos': cowMoos,
  scratch,
  physicist,
  spherical,
  vacuum,
  football,
};

/** Every plate's shape, width over height: a bubble keeps the room for it before it loads. */
export const PICTURE_ASPECT = 1755 / 952;
