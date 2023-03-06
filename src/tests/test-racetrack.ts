import { assert } from 'chai';

import { Racetrack, U_TRACK } from '../racetrack.js';
import { linePoints } from '../points.js';

suite('Racetrack', () => {
    if (typeof document === 'undefined') {
        console.log(`Racetrack tests can only be run in a browser environment`)
        return;
    }

    const canvas = document.createElement('canvas');
    const rt = new Racetrack(canvas, U_TRACK);

    test('constructor', () => {
        assert.equal(rt.canvas, canvas);
        assert.equal(rt.track, U_TRACK);
    });

    test('finish line points', () => {
        const expected = Array.from(range(15, 20)).map(x => [1, x]);
        const points = Array.from(linePoints(...U_TRACK.finishLine, U_TRACK.grid));
        assert.equal(points.length, expected.length);
        assert.deepEqual(points, expected);
    });
});

function *range(start: number, end: number): Generator<number> {
    for (let i = start; i < end; i++) {
        yield i;
    }
}
