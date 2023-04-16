import { assert } from 'chai';

import { Racetrack } from '../racetrack.js';
import { SAMPLE_TRACKS } from '../tracks.js';
import { Collector, scalarNormalize, cmpScalar } from '../analyzer.js';

import { getOptimalRacer } from '../optimal-path-finder.js';

suite('Analyzer', function () {
    let canvas: HTMLCanvasElement;

    // Arrow functions hide the `this` context, so we need to use a regular
    // function here.
    setup(function () {
        canvas = document.createElement('canvas');
        const title = document.createElement('h2');

        // Append the racetrack canvas to the page in case we want to look at it.
        title.textContent = `${this.currentTest!.title}:`;
        document.body.appendChild(title);
        document.body.appendChild(canvas);
    });

    // test('Normal Data Collector', async () => {
    //     const racer = getOptimalRacer();
    //     const c = new Collector(racer, normalize, cmpNormalize);
    //     for (const track of SAMPLE_TRACKS) {
    //         const rt = new Racetrack(canvas, track);
    //         rt.race(c.wrappedRacer);
    //         await rt.run();
    //     }
    //     console.log(c.report());
    //     assert.isTrue(c.report().length > 0);
    // }).timeout(10000);

    test('Scalar Data Collector', async () => {
        const racer = getOptimalRacer();
        const c = new Collector(racer, scalarNormalize, cmpScalar);
        for (const track of SAMPLE_TRACKS) {
            const rt = new Racetrack(canvas, track);
            rt.race(c.wrappedRacer);
            await rt.run();
        }
        console.log(c.report());
        assert.isTrue(c.report().length > 0);
    }).timeout(10000);
});
