import { assert } from 'chai';

import { stoppingDistance, speedLimit, isSafe } from '../racers/racer-helper.js';

suite('Racer Helper', () => {
    test('stoppingDistance', () => {
        const tests: { v: number, expected: number }[] = [
            { v: 0, expected: 0 },
            { v: 1, expected: 1 },
            { v: 2, expected: 3 },
            { v: 3, expected: 6 },
            { v: 4, expected: 10 },
            { v: 5, expected: 15 },
        ];

        for (let t of tests) {
            assert.equal(stoppingDistance(t.v), t.expected);
            assert.equal(stoppingDistance(-t.v), t.expected);
        }
    });

    test('speedLimit', () => {
        const tests: { dist: number, expected: number }[] = [
            { dist: 0, expected: 0 },
            { dist: 1, expected: 1 },
            { dist: 2, expected: 1 },
            { dist: 3, expected: 1 },
            { dist: 4, expected: 2 },
            { dist: 5, expected: 2 },
            { dist: 6, expected: 2 },
            { dist: 7, expected: 3 },
            { dist: 8, expected: 3 },
            { dist: 9, expected: 3 },
            { dist: 10, expected: 3 },
            { dist: 11, expected: 4 },
        ];

        let i = 0;
        for (let t of tests) {
            assert.equal(speedLimit(t.dist), t.expected, `Test #+${i+1}`);
            assert.equal(speedLimit(-t.dist), t.expected, `Test #-${i+1}`);
            i += 1;
        }
    });

    test('isSafe', () => {
        const tests: { v: Point, dist: Point, expected: boolean }[] = [
            { v: [0, 0], dist: [0, 0], expected: true },
            { v: [0, 0], dist: [1, 0], expected: true },
            { v: [0, 0], dist: [0, 1], expected: true },
            { v: [1, 1], dist: [3, 10], expected: true },
            { v: [3, 1], dist: [3, 10], expected: false },
            { v: [4, 1], dist: [3, 10], expected: false },
            { v: [2, -2], dist: [3, -3], expected: false },
            { v: [0, 1], dist: [-1, 3], expected: true },
            { v: [-1, 2], dist: [-1, 3], expected: false },
        ];

        let i = 0;
        for (let t of tests) {
            assert.equal(isSafe(t.v, t.dist), t.expected, `Test #${i+1}`);
            i += 1;
        }
    });
});
