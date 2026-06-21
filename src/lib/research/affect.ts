export interface AffectState {
  readonly valence: number;
  readonly arousal: number;
}

export interface AffectImpulse {
  readonly valence: number;
  readonly arousal: number;
}

function clamp(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

/** Maps an economic delta to an abstract display impulse, not a claim about emotion. */
export function economicImpulse(deltaWealth: number, referenceAmount: number): AffectImpulse {
  if (!Number.isFinite(deltaWealth)) throw new RangeError('deltaWealth must be finite');
  if (!Number.isFinite(referenceAmount) || referenceAmount <= 0) throw new RangeError('referenceAmount must be positive');
  const magnitude = Math.min(1, Math.abs(deltaWealth) / referenceAmount);
  return { valence: Math.sign(deltaWealth) * magnitude, arousal: magnitude };
}

export function advanceAffect(
  state: AffectState,
  elapsedMs: number,
  decayMs: number,
  impulse: AffectImpulse = { valence: 0, arousal: 0 },
): AffectState {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) throw new RangeError('elapsedMs must be non-negative');
  if (!Number.isFinite(decayMs) || decayMs <= 0) throw new RangeError('decayMs must be positive');
  const decay = Math.exp(-elapsedMs / decayMs);
  return {
    valence: clamp((state.valence + impulse.valence) * decay),
    arousal: clamp((state.arousal + impulse.arousal) * decay),
  };
}
