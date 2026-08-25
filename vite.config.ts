import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Project-page deploys live under /<repo>/; local dev and any root-domain host
// use '/'. BASE_PATH is set by the Pages workflow, so nothing here needs editing
// if the site later moves to its own domain.
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [svelte()],
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
    exclude: ['**/node_modules/**', '**/dist/**', 'archive/**'],
  },
});
