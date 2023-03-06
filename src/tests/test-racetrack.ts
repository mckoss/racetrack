import { assert } from 'chai';

import { Racetrack, U_TRACK } from '../racetrack.js';

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
        const expected = Array.from(range(15, 20)).map(x => [20, x * 20]);
        const points = Array.from(rt.linePoints(...U_TRACK.finishLine));
        assert.equal(points.length, expected.length);
        assert.deepEqual(points, expected);
    });
});

function *range(start: number, end: number): Generator<number> {
    for (let i = start; i < end; i++) {
        yield i;
    }
}
