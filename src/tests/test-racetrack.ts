import { assert } from 'chai';

import { Racetrack, U_TRACK } from '../racetrack.js';
import { Point } from '../points.js';

suite('Racetrack', function () {
    if (typeof document === 'undefined') {
        console.log(`Racetrack tests can only be run in a browser environment`)
        return;
    }

    let canvas: HTMLCanvasElement;
    let rt: Racetrack;

    // Arrow functions hide the `this` context, so we need to use a regular
    // function here.
    setup(function () {
        canvas = document.createElement('canvas');
        rt = new Racetrack(canvas, U_TRACK);
        const title = document.createElement('h2');

        // Append the racetrack canvas to the page in case we want to look at it.
        title.textContent = `${this.currentTest!.title}:`;
        document.body.appendChild(title);
        document.body.appendChild(canvas);
    });

    test('constructor', () => {
        assert.equal(rt.canvas, canvas);
        assert.equal(rt.track, U_TRACK);
    });

    test('isPointInTrack', () => {
        assert.isFalse(rt.isPointInTrack([0, 0]));
        assert.isTrue(rt.isPointInTrack([1, 1]));
        assert.isTrue(rt.isPointInTrack([2, 2]));
        assert.isFalse(rt.isPointInTrack([19, 1]));
    });

    test('finish line points', () => {
        const expected = Array.from(range(15, 20)).map(x => [1, x]);
        const gridPoints = rt.pixelsToGrid(U_TRACK.finishLine) as [Point, Point];
        const points = Array.from(rt.linePoints(...gridPoints));
        assert.equal(points.length, expected.length);
        assert.deepEqual(points, expected);
    });

    test('running race', () => {
        rt.race((state, options) => {
            console.log(`step ${state.step}: ${JSON.stringify(state)}`);
            assert.isAtLeast(state.step, 1);
            assert.equal(options.length, 9);
            if (state.step == 1) {
                assert.deepEqual(state, {
                    status: 'running',
                    step: 1,
                    position: [1, 1],
                    velocity: [0, 0],
                });
            }
            if (state.step == 2) {
                assert.deepEqual(state, {
                    status: 'running',
                    step: 2,
                    position: [2, 1],
                    velocity: [1, 0],
                });
            }
            if (state.step < 5) {
                assert.deepEqual(options[5].move, [1, 0]);
                assert.isAtLeast(options[5].distanceToFinish!, 27);
                assert.equal(options[5].status, 'ok');
                return [1, 0];
            }
            if (state.step < 9) {
                assert.deepEqual(options[6].move, [-1, 1]);
                assert.isAtLeast(options[6].distanceToFinish!, 17);
                assert.equal(options[6].status, 'ok');
                return [-1, 1];
            }
            assert.deepEqual(options[1].move, [-1, -1]);
            assert.isAtLeast(options[1].distanceToFinish!, 0);
            assert.equal(options[1].status, state.step < 14 ? 'ok' : 'finished');
            return [-1, -1];
        });
        assert.equal(rt.cars.length, 1);
        rt.run();
        assert.equal(rt.stepNumber, 14);
        assert.equal(rt.cars[0].status, 'finished');
    });
});

function* range(start: number, end: number): Generator<number> {
    for (let i = start; i < end; i++) {
        yield i;
    }
}
