/** @type {import('vite').UserConfig} */
export default {
    base: './',
    build: {
        sourcemap: true,
        minify: false,
        modulePreload: {
            polyfill: false
        }
    }
};
