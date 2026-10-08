import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { compileScript } from './script-compile';
import { scriptPlugin } from './vite-script';

describe('the build and the script', () => {
  // a copy of the script with one line the grammar does not allow
  const dir = mkdtempSync(join(tmpdir(), 'script-'));
  cpSync('script', join(dir, 'script'), { recursive: true, filter: (src) => !src.includes(join('script', 'out')) });
  const tex = join(dir, 'script', 'script.tex');
  writeFileSync(tex, `${readFileSync(tex, 'utf8')}\nRed: The \\underline{wrong} word.\n`);
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  const broken = () => compileScript(join(dir, 'script'), dir);
  const config = (command: 'build' | 'serve') => {
    const hook = scriptPlugin(broken).config as (config: object, env: { command: string; mode: string }) => void;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    return () => hook({}, { command, mode: command === 'build' ? 'production' : 'development' });
  };

  it('stops a production build at a script that does not compile, rather than ship the last good words', () => {
    expect(broken().errors.join('\n')).toMatch(/underline/);
    expect(config('build')).toThrow(/does not compile[\s\S]*underline/);
  });

  it('lets the dev server start on the last good words, and say what is wrong', () => {
    expect(config('serve')).not.toThrow();
    expect(console.error).toHaveBeenCalledWith(expect.stringMatching(/underline/));
  });
});
