import { assert } from 'chai';

import { Racetrack } from '../racetrack.js';
import { U_TRACK, OVAL, BIG_OVAL } from '../tracks.js';
import { update } from '../racers/creeper.js';


suite('Tracks', function () {
    // Append the racetrack canvases to the page in case we want to look at them.
    const title = document.createElement('h2');
    const tracksDiv = document.createElement('div');
    title.textContent = `Racetracks:`;
    document.body.appendChild(title);
    document.body.appendChild(tracksDiv);

    for (const track of [U_TRACK, OVAL, BIG_OVAL]) {
        test(track.name, async () => {
            const canvas = document.createElement('canvas');
            const rt = new Racetrack(canvas, track);
            rt.race(update);
            await rt.run();
            tracksDiv.appendChild(canvas);
            assert.equal(rt.cars[0].status, 'finished');
        }).timeout(10000);
    }
});
