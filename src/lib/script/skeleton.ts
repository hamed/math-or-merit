/**
 * The skeleton: what every language must share (GRAMMAR.md §7). Structure
 * labels, actions with their arguments, choice targets and pool labels — never
 * the words, so a translation may use more or fewer bubbles between them.
 */
import { actionsOf, walk, type Script } from './parse.ts';

export interface Bone {
  readonly label: string;
  /** Where it is, for the report. */
  readonly at: string;
}

export function skeleton(script: Script): Bone[] {
  const out: Bone[] = [];
  for (const { file, item } of walk(script)) {
    const at = `${file}:${item.line}`;
    if (item.kind === 'structure' && item.label) out.push({ label: `${item.level} ${item.label}`, at });
    for (const a of actionsOf(item)) {
      const args = a.name === 'choice' ? [a.args[1] ?? ''] : a.args;
      out.push({ label: `\\${a.name}${a.opt !== undefined ? `[${a.opt}]` : ''}${args.map((x) => `{${x.trim()}}`).join('')}`, at });
    }
  }
  return out;
}

/** The skeleton, cut into the stretch under each section or scene label. */
function byLabel(bones: readonly Bone[]): Map<string, Bone[]> {
  const out = new Map<string, Bone[]>();
  let current: Bone[] = [];
  for (const b of bones) {
    const m = /^(?:section|subsection) (.+)$/.exec(b.label);
    if (m) {
      current = [];
      out.set(m[1], current);
    } else current.push(b);
  }
  return out;
}

export interface SkeletonDiff {
  /** Labels the translation has that the source hasn't. */
  readonly extra: string[];
  /** Labels the translation hasn't reached yet — untranslated, not wrong. */
  readonly missing: string[];
  /** Where a translated stretch disagrees with the source. */
  readonly mismatches: { label: string; source: string; translation: string; at: string }[];
}

/**
 * Compare a translation's skeleton with the source's, stretch by stretch. A
 * stretch present in both must match exactly.
 */
export function diffSkeleton(source: Script, translation: Script): SkeletonDiff {
  const a = byLabel(skeleton(source));
  const b = byLabel(skeleton(translation));
  const mismatches: SkeletonDiff['mismatches'] = [];
  for (const [label, bones] of b) {
    const want = a.get(label);
    if (!want) continue;
    const n = Math.max(want.length, bones.length);
    for (let k = 0; k < n; k++) {
      if (want[k]?.label !== bones[k]?.label) {
        mismatches.push({
          label,
          source: want[k]?.label ?? '(nothing)',
          translation: bones[k]?.label ?? '(nothing)',
          at: bones[k]?.at ?? want[k]?.at ?? '',
        });
        break;
      }
    }
  }
  return {
    extra: [...b.keys()].filter((l) => !a.has(l)),
    missing: [...a.keys()].filter((l) => !b.has(l)),
    mismatches,
  };
}
