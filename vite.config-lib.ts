import { resolve } from 'path';
import { defineConfig } from 'vite';

// Helper function to resolve paths relative to the project root.
function src(path: string) {
  return resolve(__dirname, `src/${path}`);
}

export default defineConfig({
  base: './',
  publicDir: false,
  build: {
    target: 'esnext',
    sourcemap: true,
    minify: false,
    outDir: 'dist/scripts',
    lib: {
      entry: {
        'racetrack': src('racetrack.ts'),
        'car-sheet': src('images/car-sheet.png'),
        'points': src('points.ts'),
        'button-bar': src('button-bar.ts'),
        'tracks': src('tracks.ts'),
        'racers/racer-helper': src('racers/racer-helper.ts'),
        'racers/creeper': src('racers/creeper.ts'),

        // These scripts are used for node command line testing.
        'tests/test-points': src('tests/test-points.ts'),
        'tests/test-racer-helper': src('tests/test-racer-helper.ts'),
        'tests/test-in-browser': src('tests/test-in-browser.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'puppeteer',
        'chai',
        'mocha',
      ]
    },
  }
});
