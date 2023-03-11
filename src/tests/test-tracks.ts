import { assert } from 'chai';

import { Racetrack, U_TRACK, OVAL, BIG_OVAL } from '../racetrack.js';

import { update } from '../racers/creeper.js';


suite('Tracks', function () {
    if (typeof document === 'undefined') {
        console.log(`Track tests can only be run in a browser environment`)
        return;
    }

    // Append the racetrack canvases to the page in case we want to look at them.
    const title = document.createElement('h2');
    const tracksDiv = document.createElement('div');
    title.textContent = `Racetracks:`;
    document.body.appendChild(title);
    document.body.appendChild(tracksDiv);

    for (const track of [U_TRACK, OVAL, BIG_OVAL]) {
        test(track.name, () => {
            const canvas = document.createElement('canvas');
            const rt = new Racetrack(canvas, track);
            rt.race(update);
            rt.run();
            tracksDiv.appendChild(canvas);
            assert.equal(rt.cars[0].status, 'finished');
        });
    }
});
