import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'esnext',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        test: resolve(__dirname, 'test/index.html'),
      },
      external: [
        '/scripts/browser-tests/test-racetrack.js',
        '/test/mocha.js',
      ]
    },
  }
});
