export interface RandomSource {
  next(): number;
  reset(): void;
}

class MathRandomSource implements RandomSource {
  next(): number {
    return Math.random();
  }

  reset(): void {
    // Math.random has no portable state to rewind.
  }
}

/** A small, reproducible uint32 generator suitable for simulation replay. */
class Mulberry32 implements RandomSource {
  private state: number;

  constructor(private readonly seed: number) {
    this.state = seed;
  }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let value = this.state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 0x1_0000_0000;
  }

  reset(): void {
    this.state = this.seed;
  }
}

export function createRandomSource(seed?: number): RandomSource {
  if (seed !== undefined && (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffff_ffff)) {
    throw new RangeError('seed must be an unsigned 32-bit integer');
  }
  return seed === undefined ? new MathRandomSource() : new Mulberry32(seed);
}
