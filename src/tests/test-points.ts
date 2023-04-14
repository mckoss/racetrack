import { assert } from 'chai';

import { linePoints, Point, scaleToBox, perpendicularLine, fixed, isEqual, Transform } from '../points.js';

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

    const transformTests = [
        {
            name: 'identity',
            trans: new Transform(),
            result: [3, 5],
        },
        {
            name: 'translate',
            trans: Transform.translate([1, 2]),
            result: [4, 7],
        },
        {
            name: 'scale',
            trans: Transform.scale([2, 3]),
            result: [6, 15],
        },
        {
            name: 'turn',
            trans: Transform.turn(0.25),
            result: [-5, 3],
        },
        {
            name: 'reflect',
            trans: Transform.reflect(),
            result: [5, 3],
        },
        {
            name: 'mirror',
            trans: Transform.mirror(),
            result: [-3, -5],
        },
        {
            name: 'compose',
            trans: Transform.translate([1, 2]).compose(Transform.scale([2, 3])),
            result: [7, 17],
        },
        {
            name: 'inverse',
            trans: Transform.translate([1, 2]).inverse(),
            result: [2, 3],
        },
        {
            // The reason for this result is as follows (from GPT-4):
            // 1. First, we translate the point (3, 5) by (-10, -10), resulting
            //    in the point (-7, -5).
            // 2. Then, we rotate the point (-7, -5) by 90 degrees (0.25 turns)
            //    around the origin (0, 0). The rotated point is (5, -7).
            // 3. Finally, we translate the rotated point (5, -7) by (10, 10),
            //    resulting in the point (15, 3).
            //
            // So, the composed transform first moves the point to a new
            // coordinate system, then rotates it, and finally moves it back to
            // the original coordinate system, yielding the final point (15, 3).

            name: 'rotate-around-a-point',
            trans: Transform.translate([10, 10])
                .compose(Transform.turn(0.25))
                .compose(Transform.translate([-10, -10])),
            result: [15, 3],
        },
        {
            name: 'complex-compose',
            trans: Transform.translate([2, 3])
                   .compose(Transform.scale([0.5, 2]))
                   .compose(Transform.turn(0.25)),
            result: [-0.5, 9],
        },
        {
            name: 'large-scale-factors',
            trans: Transform.scale([1e-10, 1e10]),
            result: [3e-10, 5e10],
        },
        {
            name: 'near-singular',
            trans: new Transform([1, 1e-10, 0, 1e-10, 1, 0]),
            result: [3, 5],
        },
        {
            name: 'zero',
            trans: Transform.scale([0, 0]),
            result: [0, 0],
            inverseError: true
        },
    ];

    for (const t of transformTests) {
        test(`Transform - ${t.name}`, () => {
            const point = [3, 5] as Point;
            const computed = t.trans.apply(point);
            assert.approximately(computed[0], t.result[0], 0.0001);
            assert.approximately(computed[1], t.result[1], 0.0001);
        });

        test(`Transform - ${t.name} - inverse${t.inverseError ? ' (throws)' : ''}`, () => {
            const point = [3, 5] as Point;
            const f = () => {
                return t.trans.compose(t.trans.inverse()).apply(point);
            };
            if (t.inverseError) {
                assert.throws(f);
                return;
            }
            const computed = f();
            assert.approximately(computed[0], point[0], 0.0001);
            assert.approximately(computed[1], point[1], 0.0001);
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
