import { assert } from 'chai';

import { Racetrack, OVAL } from '../racetrack.js';

import { update } from '../racers/creeper.js';
import { MJLRacer1 } from "../racers/mjl-racer1.js";

suite('Racers', function () {
    if (typeof document === 'undefined') {
        console.log(`Racers tests can only be run in a browser environment`)
        return;
    }

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
    });

    test('MJL #1', async () => {
        const mjl1 = new MJLRacer1(rt);
        rt.race(mjl1.update.bind(mjl1));
        await rt.run();
        assert.equal(rt.cars[0].status, 'finished');
    });
});
