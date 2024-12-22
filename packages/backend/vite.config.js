import {join} from 'path';
import {builtinModules} from 'module';
import wasm from "vite-plugin-wasm";

const PACKAGE_ROOT = __dirname;
const CRATES_ROOT = join(__dirname, '..', '..', 'crates');

/**
 * @type {import('vite').UserConfig}
 * @see https://vitejs.dev/config/
 */
const config = {
  mode: process.env.MODE,
  root: PACKAGE_ROOT,
  envDir: process.cwd(),
  plugins: [wasm()],
  resolve: {
    alias: {
      '/@/': join(PACKAGE_ROOT, 'src') + '/',
      '/@gen/': join(PACKAGE_ROOT, 'src-generated') + '/',
      '/@shared/': join(PACKAGE_ROOT, '../shared') + '/',
      '/@demo/': join(CRATES_ROOT, 'demo', 'pkg') + '/',
    },
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
  },
  build: {
    sourcemap: 'inline',
    target: 'esnext',
    outDir: 'dist',
    assetsDir: '.',
    minify: process.env.MODE === 'production' ? 'esbuild' : false,
    lib: {
      entry: 'src/extension.ts',
      formats: ['cjs'],
    },
    rollupOptions: {
      external: [
        '@podman-desktop/api',
        ...builtinModules.flatMap(p => [p, `node:${p}`]),
      ],
      output: {
        entryFileNames: '[name].cjs',
      },
    },
    emptyOutDir: true,
    reportCompressedSize: false,
  },
};

export default config;
