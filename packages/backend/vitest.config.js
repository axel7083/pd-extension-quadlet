import path from 'node:path';
import { join } from 'path';
import wasm from "vite-plugin-wasm";

const PACKAGE_ROOT = __dirname;

const config = {
  plugins: [wasm()],
  test: {
    include: ['**/*.{test,spec}.?(c|m)[jt]s?(x)', '../shared/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    coverage: {
      provider: 'v8',
      reporter: ['lcov', 'text'],
    },
},
resolve: {
    alias: {
      '@podman-desktop/api': path.resolve(__dirname, '__mocks__/@podman-desktop/api.js'),
      '/@/': join(PACKAGE_ROOT, 'src') + '/',
      '/@gen/': join(PACKAGE_ROOT, 'src-generated') + '/',
      '/@shared/': join(PACKAGE_ROOT, '../shared') + '/',
    },
  },
};

export default config;
