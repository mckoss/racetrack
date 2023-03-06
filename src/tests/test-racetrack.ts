import { assert } from 'chai';

import { Racetrack, U_TRACK } from '../racetrack.js';

suite('Racetrack', () => {
    if (typeof document === 'undefined') {
        console.log(`Racetrack tests can only be run in a browser environment`)
        return;
    }
    console.log("running Racetrack tests");

    test('constructor', () => {
        const canvas = document.createElement('canvas');
        const rt = new Racetrack(canvas, U_TRACK);
        assert.equal(rt.canvas, canvas);
        assert.equal(rt.track, U_TRACK);
    });
});
