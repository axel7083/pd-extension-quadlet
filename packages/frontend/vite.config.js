/* eslint-env node */
import { join } from 'path';
import * as path from 'path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';

let filename = fileURLToPath(import.meta.url);
const PACKAGE_ROOT = path.dirname(filename);

function manualChunks(id) {
  if (id.includes('monaco-editor')) {
    return 'monaco-editor';
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  mode: process.env.MODE,
  root: PACKAGE_ROOT,
  resolve: {
    alias: {
      '/@/': join(PACKAGE_ROOT, 'src') + '/',
      '/@store/': join(PACKAGE_ROOT, 'src', 'stores') + '/',
      '/@shared/': join(PACKAGE_ROOT, '../shared') + '/',
    },
  },
  plugins: [svelte({ hot: !process.env.VITEST }), svelteTesting()],
  optimizeDeps: {
    exclude: [],
  },
  test: {
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    globals: true,
    environment: 'jsdom',
    alias: [
      { find: '@testing-library/svelte', replacement: '@testing-library/svelte/svelte5' },
      {
        find: /^monaco-editor$/,
        replacement: `${PACKAGE_ROOT}/../../node_modules/monaco-editor/esm/vs/editor/editor.api`,
      },
    ],
    deps: {
      inline: [

      ],
    },
  },
  base: '',
  server: {
    fs: {
      strict: true,
    },
  },
  build: {
    sourcemap: true,
    outDir: '../backend/media',
    assetsDir: '.',
    modulePreload: false,
    emptyOutDir: true,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks: manualChunks,
        inlineDynamicImports: false,
      }
    }
  },
});
