export { linePoints };
export type { Point };

// x, y coordinates
type Point = [number, number];

// Generator for a sequence of points along a line. The line is defined by two
// points, p1 and p2. The points are only those that are on the grid with
// spacing grid.  We use a modified Bresenham algorithm to generate the points.
// The results are returned in grid-space coordinates (points scaled by 1/grid).
function* linePoints(p1: Point, p2: Point, grid: number): Generator<Point> {
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
        yield swapped ? [iy, ix] : [ix, iy];
        if (ix === ix2) {
            break;
        }
        ix += sx;
        if (2 * sx * (dy * ix - dx * iy) > dx) {
            iy += sy;
        }
    }
}
