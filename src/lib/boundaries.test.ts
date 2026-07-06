/**
 * Boundary guard (AGENTS.md, ADR-002, ADR-013): the simulation core and the
 * research layer stay headless. GSAP is quarantined to the presentation layer
 * (`widgets/stage/gsap.ts` is the only allowed gsap import in the repo).
 * Encoded as a test so the boundary is a check, not a memory.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(path));
    else if (/\.(ts|js|svelte)$/.test(entry.name)) out.push(path);
  }
  return out;
}

const FORBIDDEN = /from\s+['"](gsap|svelte)['"/]/;

describe('headless layers never import presentation libraries', () => {
  for (const layer of ['sim', 'research']) {
    it(`src/lib/${layer} is free of gsap and svelte imports`, () => {
      const dir = join(__dirname, layer);
      const offenders = sourceFiles(dir).filter((file) => FORBIDDEN.test(readFileSync(file, 'utf8')));
      expect(offenders).toEqual([]);
    });
  }
});

describe('gsap enters through the quarantine module only', () => {
  it('src/lib/widgets has exactly one file importing gsap: stage/gsap.ts', () => {
    const dir = join(__dirname, 'widgets');
    const offenders = sourceFiles(dir).filter((file) => {
      if (file.endsWith(join('stage', 'gsap.ts'))) return false;
      return /from\s+['"]gsap['"/]/.test(readFileSync(file, 'utf8'));
    });
    expect(offenders).toEqual([]);
  });
});
