/// <reference types="vitest" />
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'modules',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'AmnisMock',
      fileName: 'index',
    },
    rollupOptions: {
      output: {
        exports: 'named',
        globals: {
          '@amnis/state': 'AmnisState',
          '@amnis/state/schema': 'AmnisStateSchema',
          '@amnis/state/context': 'AmnisStateContext',
          '@reduxjs/toolkit': 'ReduxToolkit',
          msw: 'MSW',
        },
      },
      external: [
        '@amnis/state',
        '@amnis/state/schema',
        '@amnis/state/context',
        '@reduxjs/toolkit',
        'msw',
        'msw/node',
      ],
    },
  },
  test: {
    globals: true,
    testTimeout: 10000,
  },
});
