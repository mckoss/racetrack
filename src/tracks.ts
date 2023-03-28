import { Point, add, scale, turn } from "./points";

export type { Track };

export { U_TRACK, OVAL, BIG_OVAL, X_TRACK, snakeTrack, spiralTrack, SAMPLE_TRACKS };

// Definition of a specific track
interface Track {
    name: string;
    dim: Point,
    grid: number;

    trackWidth: number;
    // Allow for multiple paths.  Starting line is at the first point of
    // the first path, and the finish line is at the last point of the
    // last path.
    path: Point[][];
}

const U_TRACK:Track = {
    name: "U-Track",
    dim: [400, 400],
    grid: 20,
    trackWidth: 100,
    path: [[[20, 60], [340, 60], [340, 340], [20, 340]]],
}

const OVAL:Track = {
    name: "Oval",
    dim: [800, 400],
    grid: 20,
    trackWidth: 100,
    path: [[[400, 60], [740, 60], [740, 340], [60, 340], [60, 60], [360, 60]]],
}

const BIG_OVAL:Track = {
    name: "Big Oval",
    dim: [800, 400],
    grid: 10,
    trackWidth: 70,
    path: [[[400, 40], [760, 40], [760, 360], [40, 360], [40, 40], [380, 40]]],
}

const X_TRACK:Track = {
    name: "X-Track",
    dim: [800, 800],
    grid: 20,
    trackWidth: 100,
    path: [
        [[20, 400], [780, 400]],
        [[400, 20], [400, 780]],
    ],
}

// Build a track that snakes back and forth from top to bottom
// and finishes at the bottom.  Adjust grid to be small enough to
// capture 5 starting/finishing positions.
//
// Note that plys * (trackWidth + 2 * grid) must be <= height.
// And trackWidth >= 5 * grid
function snakeTrack(width: number, height: number, plys: number): Track {
    const grid = Math.floor(height / (7 * plys));
    const trackWidth = 5 * grid;
    const plyDelta = 7 * grid;

    let plyY = grid / 2 + trackWidth / 2;
    const start = [grid, plyY] as Point;
    const left = grid / 2 + trackWidth / 2;
    const right = width - left;

    const path: Point[] = [start];
    for (let i = 0; i < plys; i++) {
        // Even plys go left to right
        let side = i % 2 === 0 ? right : left;

        // Go further if this is the finish ply
        if (i === plys - 1) {
            side = i % 2 === 0 ? width - grid : grid;
        }

        path.push([side, plyY]);
        if (i < plys - 1) {
            plyY += plyDelta;
            path.push([side, plyY]);
        }
    }

    return {
        name: `Snake-${plys}`,
        dim: [width, height],
        grid,
        trackWidth,
        path: [path],
    };
}

const SAMPLE_TRACKS = [
    U_TRACK,
    OVAL,
    BIG_OVAL,
    X_TRACK,
    snakeTrack(800, 800, 3),
    snakeTrack(800, 800, 6),
    spiralTrack(800, 1),
    spiralTrack(800, 3),
];

// Make a track that spirals into the center of a square canvas.
function spiralTrack(dim: number, turns: number): Track {
    const grid = Math.floor(dim / ((turns + 1) * 2 * 7));
    const trackWidth = 5 * grid;
    const dTurn = 7 * grid;

    let radius = dim / 2 - grid / 2 - trackWidth / 2;
    const center = [dim / 2, dim / 2] as Point;
    const SIDES = 20;
    const points = turns * SIDES + 1;

    let v = [0, -1] as Point;

    const path: Point[] = [];
    path.push([grid, grid / 2 + trackWidth / 2]);

    for (let i = 0; i < points; i++) {
        path.push(add(center, scale(radius, v)));
        v = turn(v, 1 / SIDES);
        if (i > SIDES / 2) {
            radius -= dTurn / SIDES;
            if (i < SIDES) {
                radius -= dTurn / SIDES;
            }
        }
    }

    return {
        name: `Spiral-${turns}`,
        dim: [dim, dim],
        grid,
        trackWidth,
        path: [path],
    };
}
