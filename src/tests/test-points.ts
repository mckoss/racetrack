import { assert } from 'chai';

import { linePoints, Point } from '../points.js';

suite('Points', () => {
    type lpTest = {
        name: string,
        p1: Point,
        p2: Point,
        grid: number,
        expected: Point[],
    };

    const tests: lpTest[] = [
        {
            name: 'one-point',
            p1: [0, 0],
            p2: [0, 0],
            grid: 1,
            expected: [[0, 0]],
        },
        {
            name: 'horizontal',
            p1: [0, 0],
            p2: [5, 0],
            grid: 1,
            expected: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]],
        },
        {
            name: 'vertical',
            p1: [0, 0],
            p2: [0, 5],
            grid: 1,
            expected: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5]],
        },
        {
            name: 'diagonal',
            p1: [0, 0],
            p2: [5, 5],
            grid: 1,
            expected: [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [5, 5]],
        },
        {
            name: 'scaled-grid',
            p1: [0, 0],
            p2: [6, 6],
            grid: 2,
            expected: [[0, 0], [1, 1], [2, 2], [3, 3]],
        },
        {
            name: 'scaled-grid-rounded',
            p1: [1, 1],
            p2: [5, 5],
            grid: 2,
            expected: [[1, 1], [2, 2], [3, 3]],
        },
        {
            name: 'low-angle',
            p1: [0, 0],
            p2: [10, 2],
            grid: 1,
            expected: [[0, 0], [1, 0], [2, 0], [3, 1], [4, 1],
                       [5, 1], [6, 1], [7, 1], [8, 2], [9, 2], [10, 2]],
        },
    ];

    for (const t of tests) {
        test(`linePoints: ${t.name}`, () => {
            const points = Array.from(linePoints(t.p1, t.p2, t.grid));
            assert.equal(JSON.stringify(points), JSON.stringify(t.expected));
        });
        test(`linePoints: ${t.name} (reversed)`, () => {
            const points = Array.from(linePoints(t.p2, t.p1, t.grid));
            assert.equal(JSON.stringify(points), JSON.stringify([...t.expected].reverse()));
        });
        test(`linePoints: ${t.name} (reflected)`, () => {
            const points = Array.from(linePoints(reflect(t.p1), reflect(t.p2), t.grid));
            assert.equal(JSON.stringify(points), JSON.stringify(t.expected.map(reflect)));
        });
        test(`linePoints: ${t.name} (mirror-origin)`, () => {
            let mapper = mirrorOrigin;
            if (t.name === 'scaled-grid-rounded') {
                mapper = (p: Point) => {
                    p = mirrorOrigin(p);
                    return [p[0] + 1, p[1] + 1];
                };
            }
            const points = Array.from(linePoints(mirrorOrigin(t.p1), mirrorOrigin(t.p2), t.grid));
            assert.equal(JSON.stringify(points), JSON.stringify(t.expected.map(mapper)));
        });
        test(`linePoints: ${t.name} (mirror-x)`, () => {
            let mapper = mirrorX;
            if (t.name === 'scaled-grid-rounded') {
                mapper = (p: Point) => {
                    p = mirrorX(p);
                    if (p[1] == -1) {
                        return [p[0], 0];
                    }
                    return p;
                };
            }
            const points = Array.from(linePoints(mirrorX(t.p1), mirrorX(t.p2), t.grid));
            assert.equal(JSON.stringify(points), JSON.stringify(t.expected.map(mapper)));
        });
    }
});

function reflect(p: Point): Point {
    return [p[1], p[0]];
}

function mirrorOrigin(p: Point): Point {
    return [-p[0], -p[1]];
}

function mirrorX(p: Point): Point {
    return [p[0], -p[1]];
}
