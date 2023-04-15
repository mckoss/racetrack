export { linePoints, add, sub, scale, ceil, round, isZero, isEqual, sign,
    length, unit, turn, dot, repr, perpendicularLine, fixed, scaleToBox, id,
    pointFromId, neighbors, isOrthogonal, Transform };
export type { Point };

// x, y coordinates
type Point = [number, number];

// Generator for a sequence of points along a line. The line is defined by two
// points, p1 and p2. The points are only those that are on the grid with
// spacing grid.
function* linePoints(p1: Point, p2: Point, grid = 1): Generator<Point> {
    let [x1, y1] = p1;
    let [x2, y2] = p2;
    let dx = Math.abs(x2 - x1);
    let dy = Math.abs(y2 - y1);
    let sx = x1 < x2 ? 1 : -1;
    let sy = y1 < y2 ? 1 : -1;

    // Ensure dx >= dy so we can proceed stepwise in the x direction.
    let swapped = false;
    if (dx < dy) {
        [dx, dy] = [dy, dx];
        [sx, sy] = [sy, sx];
        [x1, y1] = [y1, x1];
        [x2, y2] = [y2, x2];
        swapped = true;
    }

    let ix = Math.round(x1 / grid);
    let iy = Math.round(y1 / grid);
    let ix2 = Math.round(x2 / grid);

    while (true) {
        yield swapped ? [iy * grid, ix * grid] : [ix * grid, iy * grid];
        if (ix === ix2) {
            break;
        }
        ix += sx;
        iy = f(ix);
    }

    function f(ix: number): number {
        const x = ix * grid;
        const y = (x - x1) * dy / dx * sx * sy + y1;
        return Math.round(y / grid);
    }
}

function add(a: Point, b: Point): Point {
    return [a[0] + b[0], a[1] + b[1]];
}

function sub(a: Point, b: Point): Point {
    return [a[0] - b[0], a[1] - b[1]];
}

function length([x, y]: Point): number {
    return Math.sqrt(x * x + y * y);
}

function unit(v: Point): Point {
    // Don't return [NaN, NaN] if v is [0, 0].
    if (isZero(v)) {
        return [0, 0];
    }
    return scale(1/length(v), v);
}

function scale(factor: number, [x, y]: Point): Point {
    return [x * factor, y * factor];
}

function round([x, y]: Point): Point {
    return [Math.round(x), Math.round(y)];
}

function ceil([x, y]: Point): Point {
    return [Math.ceil(x), Math.ceil(y)];
}

function id(p: Point): string {
    return JSON.stringify(p);
}

function repr(p: Point): string {
    p = fixed(p);
    return `[${p[0]}, ${p[1]}]`;
}

function pointFromId(id: string): Point {
    return JSON.parse(id);
}

function isZero([x, y]: Point): boolean {
    return x === 0 && y === 0;
}

function isEqual(a: Point, b: Point): boolean {
    return a[0] === b[0] && a[1] === b[1];
}

function isOrthogonal(a: Point): boolean {
    return a[0] === 0 || a[1] === 0;
}

function sign([x, y]: Point): Point {
    return [Math.sign(x), Math.sign(y)];
}

function turn([x, y]: Point, turns: number): Point {
    const rad = turns * 2 * Math.PI;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return [x * cos - y * sin, x * sin + y * cos];
}

function fixed([x, y]: Point, digits = 3): Point {
    return [r(x), r(y)];

    function r(n: number): number {
        const scale = Math.pow(10, digits);
        return Math.round(n * scale) / scale;
    }
}

function dot(a: Point, b: Point): number {
    return a[0] * b[0] + a[1] * b[1];
}

// Scale point so that maximum dimension equals one of the dimensions of a
// bounding box.
// Find the minimum scale factor such that
// scale * abs(x) == bx or scale * abs(y) == by
function scaleToBox([x, y]: Point, [bx, by]: Point): Point {
    let factor: number;

    if (x === 0 && y === 0) {
        return [0, 0];
    }

    if (x === 0) {
        factor = by / Math.abs(y);
    } else if (y === 0) {
        factor = bx / Math.abs(x);
    } else {
        factor = Math.min(bx / Math.abs(x), by / Math.abs(y));
    }

    return scale(factor, [x, y]);
}

function* neighbors(p: Point, grid = 1, includeSelf = false): Generator<Point> {
    for (let dy of [-grid, 0, grid]) {
        for (let dx of [-grid, 0, grid]) {
            if (!includeSelf && dx === 0 && dy === 0) {
                continue;
            }
            yield add(p, [dx, dy]);
        }
    }
}

// Calculate a start or finish line from the starting (ending) point
// and it's adjacent point.
function perpendicularLine(p1:Point, p2:Point, width:number): [Point, Point] {
    const v = scale(width / 2, turn(unit(sub(p2, p1)), -0.25));
    return [add(p1, v), sub(p1, v)];
}

// A transform is a 3x3 matrix that can be used to transform points.
// mxx, mxy, xOffset, myx, myy, yOffset
type TParams = [number, number, number, number, number, number];

class Transform {
    params: TParams;

    // Construct the identity transform if no arguments are given.
    constructor(params?: TParams) {
        if (params) {
            this.params = params;
        } else {
            this.params = [1, 0, 0, 0, 1, 0];
        }
    }

    copy(): Transform {
        return new Transform(this.params.slice() as TParams);
    }

    static translate([x, y]: Point): Transform {
        return new Transform([1, 0, x, 0, 1, y]);
    }

    static scale([x, y]: Point): Transform {
        return new Transform([x, 0, 0, 0, y, 0]);
    }

    static turn(turns: number): Transform {
        const rad = turns * 2 * Math.PI;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        return new Transform([cos, -sin, 0, sin, cos, 0]);
    }

    // Reflection across the x-y axis
    static swapXY(): Transform {
        return new Transform([0, 1, 0, 1, 0, 0]);
    }

    static negateX(): Transform {
        return new Transform([-1, 0, 0, 0, 1, 0]);
    }

    static negateY(): Transform {
        return new Transform([1, 0, 0, 0, -1, 0]);
    }

    apply([x, y]: Point): Point {
        return [this.params[0] * x + this.params[1] * y + this.params[2],
                this.params[3] * x + this.params[4] * y + this.params[5]];
    }

    compose(t: Transform): Transform {
        return new Transform([
            this.params[0] * t.params[0] + this.params[1] * t.params[3],
            this.params[0] * t.params[1] + this.params[1] * t.params[4],
            this.params[0] * t.params[2] + this.params[1] * t.params[5] + this.params[2],
            this.params[3] * t.params[0] + this.params[4] * t.params[3],
            this.params[3] * t.params[1] + this.params[4] * t.params[4],
            this.params[3] * t.params[2] + this.params[4] * t.params[5] + this.params[5],
        ]);
    }

    inverse(): Transform {
        const [mxx, mxy, xOffset, myx, myy, yOffset] = this.params;
        const det = mxx * myy - mxy * myx;

        if (det === 0) {
            throw new Error("Cannot invert transform");
        }

        return new Transform([
            myy / det, -mxy / det, -((myy * xOffset - mxy * yOffset) / det),
            -myx / det, mxx / det, -((mxx * yOffset - myx * xOffset) / det),
        ]);
    }
}
