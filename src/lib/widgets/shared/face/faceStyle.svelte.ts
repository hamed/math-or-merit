/**
 * The reader's choice of face, for every agent on the page (owner,
 * 2026-10-07: "use manga … face selection in sandbox"). Remembered in this
 * browser; without storage it lasts the visit.
 */
import { LOOKS, type FaceLook } from './face';

const KEY = 'merit-or-math:face';

export type FaceChoice = FaceLook | 'none';
export const FACE_CHOICES: readonly FaceChoice[] = [...LOOKS, 'none'];

export const faceStyle = $state<{ look: FaceChoice }>({ look: 'manga' });

/** This browser's choice, if it made one. */
export function loadFaceStyle(): void {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && (FACE_CHOICES as readonly string[]).includes(saved)) faceStyle.look = saved as FaceChoice;
  } catch {
    // no storage: manga
  }
}

export function chooseFace(look: FaceChoice): void {
  faceStyle.look = look;
  try {
    localStorage.setItem(KEY, look);
  } catch {
    // no storage: the choice lasts this visit
  }
}
