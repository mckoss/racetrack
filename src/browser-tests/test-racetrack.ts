import { assert } from 'chai';

import { Racetrack, U_TRACK } from '../racetrack.js';
import { Point } from '../points.js';

suite('Racetrack', function () {
    let canvas: HTMLCanvasElement;
    let rt: Racetrack;

    // Arrow functions hide the `this` context, so we need to use a regular
    // function here.
    setup(function () {
        canvas = document.createElement('canvas');
        rt = new Racetrack(canvas, U_TRACK);

        // Append the racetrack canvas to the page in case we want to look at it.
        const title = document.createElement('h2');
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

    test('running race', async () => {
        rt.race((state, options) => {
            console.log(`step ${state.step}: ${JSON.stringify(state)}`);
            assert.isAtLeast(state.step, 1);
            assert.equal(options.length, 9);
            if (state.step == 1) {
                // Randomized pole position...cheat here and force it to
                // be [1, 1] just for TESTING repeatability.
                state.position= [1, 1];
                rt.histories[0][0] = [1, 1];

                assert.deepEqual(state.velocity, [0, 0]);
                assert.include(state, {
                    status: 'running',
                    step: 1,
                    topSpeed: 0,
                    distanceTraveled: 0,
                    racePosition: 1,
                });
                return [1, 0];
            }
            if (state.step == 2) {
                assert.equal(state.position[0], 2);
                assert.deepEqual(state.velocity, [1, 0]);
                assert.equal(state.position[1], state.crashPosition![1]);
                assert.isTrue(state.crashPosition![0] >= 19 && state.crashPosition![0] <= 20);
                assert.deepEqual(state.crashPosition, [19, 1]);
                assert.include(state, {
                    status: 'running',
                    step: 2,
                    topSpeed: 1,
                    distanceTraveled: 1,
                });
                return [1, 0];
            }
            if (state.step < 5) {
                assert.deepEqual(options[5].move, [1, 0]);
                assert.isAtLeast(options[5].distanceToFinish!, 27);
                assert.equal(options[5].status, 'ok');
                assert.deepEqual(state.crashPosition, [19, 1]);
                return [1, 0];
            }
            if (state.step === 6) {
                assert.deepEqual(state.crashPosition, [20, 4]);
            }
            if (state.step < 9) {
                assert.deepEqual(options[6].move, [-1, 1]);
                assert.isAtLeast(options[6].distanceToFinish!, 17);
                assert.equal(options[6].status, 'ok');
                return [-1, 1];
            }
            if (state.step === 13) {
                assert.isUndefined(state.crashPosition);
            }
            assert.deepEqual(options[1].move, [-1, -1]);
            assert.isAtLeast(options[1].distanceToFinish!, 0);
            assert.equal(options[1].status, state.step < 14 ? 'ok' : 'finished');
            return [-1, -1];
        });
        assert.equal(rt.cars.length, 1);
        await rt.run();
        console.log(rt);
        assert.equal(rt.stepNumber, 14);
        assert.equal(rt.cars[0].status, 'finished');
    });

    test('stats', async () => {
        rt.race((state) => {
            // Force consistent start position.
            if (state.step === 1) {
                state.position = [1, 1];
                rt.histories[0][0] = [1, 1];
            }
            if (state.step < 5) {
                return [1, 0];
            }
            if (state.step < 9) {
                return [-1, 1];
            }
            return [-1, -1];
        });
        rt.race((state) => {
            if (state.step < 5) {
                return [1, 0];
            }
            if (state.step < 10) {
                return [-1, 1];
            }
            return [-1, -1];
        });
        let nextStep = 0;
        rt.subscribeStats((stats) => {
            assert.equal(stats.step, nextStep);
            assert.equal(stats.cars.length, 2);
            nextStep += 1;
        });

        await rt.run();

        const stats = rt.getStats();
        assert.equal(stats.step, 14);
        assert.equal(stats.status, 'finished');
        const [winner, loser] = stats.cars;
        assert.equal(winner.status, 'finished');
        assert.equal(loser.status, 'crashed');
        assert.equal(winner.racePosition, 1);
        assert.equal(loser.racePosition, 2);
        assert.approximately(winner.distanceTraveled, 42.4, 0.01);
        assert.approximately(loser.distanceTraveled, 30, 20);
        assert.isUndefined(loser.finishTime);
        assert.approximately(winner.finishTime!, 13.1, 0.1);
    });
});

function* range(start: number, end: number): Generator<number> {
    for (let i = start; i < end; i++) {
        yield i;
    }
}
