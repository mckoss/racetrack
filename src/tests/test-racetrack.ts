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

    test('isPointInTrack', () => {
        assert.isFalse(rt.isPointInTrack([0, 0]));
        assert.isTrue(rt.isPointInTrack([20, 20]));
        assert.isTrue(rt.isPointInTrack([40, 40]));
        assert.isFalse(rt.isPointInTrack([380, 20]));
    });

    test('finish line points', () => {
        const expected = Array.from(range(15, 20)).map(x => [20, x * 20]);
        const points = Array.from(rt.linePoints(...U_TRACK.finishLine));
        assert.equal(points.length, expected.length);
        assert.deepEqual(points, expected);
    });

    test('finishing race', () => {
        rt.race((state) => {
            if (state.step < 5) {
                return [1, 0];
            }
            if (state.step < 9) {
                return [-1, 1];
            }
            return [-1, -1];
        });
        assert.equal(rt.cars.length, 1);
        rt.run();
        assert.equal(rt.stepNumber, 14);
        assert.equal(rt.cars[0].status, 'finished');
    });
});

function *range(start: number, end: number): Generator<number> {
    for (let i = start; i < end; i++) {
        yield i;
    }
}
