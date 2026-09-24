import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Project-page deploys live under /<repo>/; local dev and any root-domain host
// use '/'. BASE_PATH is set by the Pages workflow, so nothing here needs editing
// if the site later moves to its own domain.
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [
    // Every reader-facing word of the dialogue is a message (ADR-017, A2).
    // `notes/prose.md` stays the owner's surface; `scripts/prose-to-messages.ts`
    // carries it into messages/en.json. The locale is only ever chosen on
    // purpose (localStorage), never from the browser: a Farsi browser must not
    // land in an untranslated right-to-left page.
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/paraglide',
      strategy: ['localStorage', 'baseLocale'],
    }),
    svelte(),
  ],
  resolve: {
    alias: {
      $lib: resolve(__dirname, 'src/lib'),
    },
  },
  test: {
    environment: 'node',
    // archive/ holds superseded code kept only for reference; its tests must not
    // gate the build. Vitest's `exclude` replaces the defaults rather than
    // extending them, so the usual entries are repeated here.
    exclude: ['**/node_modules/**', '**/dist/**', 'archive/**', 'tests/browser/**'],
  },
});
