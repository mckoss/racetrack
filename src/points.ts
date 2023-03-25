export { linePoints, add, sub, scale, ceil, round, isZero, isEqual, sign,
    length, unit, turn, perpendicularLine, fixed, scaleToBox, id, pointFromId, neighbors };
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

function pointFromId(id: string): Point {
    return JSON.parse(id);
}

function isZero([x, y]: Point): boolean {
    return x === 0 && y === 0;
}

function isEqual(a: Point, b: Point): boolean {
    return a[0] === b[0] && a[1] === b[1];
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

function* neighbors(p: Point, grid = 1): Generator<Point> {
    for (let dy of [-grid, 0, grid]) {
        for (let dx of [-grid, 0, grid]) {
            if (dx === 0 && dy === 0) {
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
