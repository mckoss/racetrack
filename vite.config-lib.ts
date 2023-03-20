import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'esnext',
    sourcemap: true,
    minify: false,
    outDir: 'dist/scripts',
    lib: {
      entry: [
        resolve(__dirname, 'src/racetrack.ts'),
        resolve(__dirname, 'src/images/car-sheet.png'),
        resolve(__dirname, 'src/points.ts'),
        resolve(__dirname, 'src/button-bar.ts'),
        resolve(__dirname, 'src/tracks.ts'),
      ],
      formats: ['es'],
    },
    rollupOptions: {
      // These options are not needed when using multiple entry points
      // in the lib configuration.  Where possible, dependent modules will
      // include a reference to the exported module instead of bundling it
      // into the module itself.

      // output: {
      //   preserveModules: true,
      //   entryFileNames: '[name].js',
      // },
      external: [
        '/scripts/browser-tests/test-racetrack.js',
        '/test/mocha.js',
      ]
    },
  }
});
