import { assert } from 'chai';

import { Racetrack, CarUpdate } from '../racetrack.js';
import { OVAL } from '../tracks.js';

import { update } from '../racers/creeper.js';
import { MJLRacer1 } from "../racers/mjl-racer1.js";
import { findOptimalPath, racerFromPath } from '../optimal-path-finder.js';

suite('Racers', function () {
    let canvas: HTMLCanvasElement;
    let rt: Racetrack;

    // Arrow functions hide the `this` context, so we need to use a regular
    // function here.
    setup(function () {
        canvas = document.createElement('canvas');
        rt = new Racetrack(canvas, OVAL);
        const title = document.createElement('h2');

        // Append the racetrack canvas to the page in case we want to look at it.
        title.textContent = `${this.currentTest!.title}:`;
        document.body.appendChild(title);
        document.body.appendChild(canvas);
    });

    test('Creeper', async () => {
        rt.race(update);
        await rt.run();
        assert.equal(rt.cars[0].status, 'finished');
    }).timeout(10000);

    test('MJL #1', async () => {
        const mjl1 = new MJLRacer1(rt);
        rt.race(mjl1.update.bind(mjl1));
        await rt.run();
        assert.equal(rt.cars[0].status, 'finished');
    });

    test('Optimal Racer', async () => {
        let optimal: CarUpdate | undefined;

        rt.race((state, options, rt) => {
            if (state.step === 1) {
                const path = findOptimalPath(state.position, rt!);
                optimal = racerFromPath(path);
            }
            return optimal!(state, options);
        });
        await rt.run();
        assert.equal(rt.cars[0].status, 'finished');
        assert.equal(rt.cars[0].finishTime, 25);
    });
});
