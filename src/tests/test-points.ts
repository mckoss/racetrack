import { assert } from 'chai';

import { linePoints, Point, scaleToBox, perpendicularLine, fixed, isEqual } from '../points.js';

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
            expected: [[0, 0], [2, 2], [4, 4], [6, 6]],
        },
        {
            name: 'scaled-grid-rounded',
            p1: [1, 1],
            p2: [5, 5],
            grid: 2,
            expected: [[2, 2], [4, 4], [6, 6]],
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
                    return [p[0] + 2, p[1] + 2];
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
                    if (p[1] == -2) {
                        return [p[0], 0];
                    }
                    return p;
                };
            }
            const points = Array.from(linePoints(mirrorX(t.p1), mirrorX(t.p2), t.grid));
            assert.equal(JSON.stringify(points), JSON.stringify(t.expected.map(mapper)));
        });
    }

    const scaleTests: {args: [Point, Point], expected: Point}[] = [
        {args: [[0, 0], [1, 1]], expected: [0, 0]},
        {args: [[1, 1], [2, 2]], expected: [2, 2]},
        {args: [[1, 2], [4, 4]], expected: [2, 4]},
        {args: [[1, 1], [4, 2]], expected: [2, 2]},
        {args: [[0, 1], [4, 2]], expected: [0, 2]},
        {args: [[1, 0], [4, 2]], expected: [4, 0]},
        {args: [[2, 0.5], [4, 2]], expected: [4, 1]},
    ];

    for (const t of scaleTests) {
        for (const a of [-1, 1]) {
            for (const b of [-1, 1]) {
                const p = [a * t.args[0][0], b * t.args[0][1]] as Point;
                const e = [a * t.expected[0], b * t.expected[1]] as Point;
                test(`scaleToBox(${JSON.stringify(p)}, ${JSON.stringify(t.args[1])}) => ${JSON.stringify(e)}`, () => {
                    const s = scaleToBox(p, t.args[1]);
                    assert.equal(JSON.stringify(s), JSON.stringify(e));
                });
            }
        }
    }

    test('perpendicularLine', () => {
        const U_TRACK = {
            name: "U-Track",
            dim: [400, 400],
            grid: 20,
            startLine: [[20, 10], [20, 110]],
            finishLine: [[20, 290], [20, 390]],
            trackWidth: 100,
            path: [[20, 60], [340, 60], [340, 340], [20, 340]],
        }

        const OVAL = {
            name: "Oval",
            dim: [800, 400],
            grid: 20,
            startLine: [[400, 10], [400, 110]],
            finishLine: [[360, 10], [360, 110]],
            trackWidth: 100,
            path: [[400, 60], [740, 60], [740, 340], [60, 340], [60, 60], [360, 60]],
        }

        const BIG_OVAL = {
            name: "Big Oval",
            dim: [800, 400],
            grid: 10,
            startLine: [[400, 5], [400, 75]],
            finishLine: [[380, 5], [380, 75]],
            trackWidth: 70,
            path: [[400, 40], [760, 40], [760, 360], [40, 360], [40, 40], [380, 40]],
        }

        let i = 1;
        for (const t of [ U_TRACK, OVAL, BIG_OVAL ]) {
            let path: Point[] = t.path.slice(0, 2) as Point[];
            let p = perpendicularLine(path[0], path[1], t.trackWidth);
            assert.isTrue(sameLine(p, t.startLine as Point[]), `${i} Start`);

            path = t.path.slice(-2) as Point[];
            p = perpendicularLine(path[1], path[0], t.trackWidth);
            assert.isTrue(sameLine(p, t.finishLine as Point[]), `${i} Finish`);
            i += 1;
        }

        function sameLine(l1: Point[], l2: Point[]): boolean {
            l1 = l1.map(fixed);
            return isEqual(l1[0], l2[0]) && isEqual(l1[1], l2[1]) ||
                isEqual(l1[0], l2[1]) && isEqual(l1[1], l2[0]);
        }
    });
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
