import { Point } from "./points";

export type { Track };

export { U_TRACK, OVAL, BIG_OVAL, snakeTrack };

// Definition of a specific track
interface Track {
    name: string;
    dim: Point,
    grid: number;

    trackWidth: number;
    path: Point[];
}

const U_TRACK:Track = {
    name: "U-Track",
    dim: [400, 400],
    grid: 20,
    trackWidth: 100,
    path: [[20, 60], [340, 60], [340, 340], [20, 340]],
}

const OVAL:Track = {
    name: "Oval",
    dim: [800, 400],
    grid: 20,
    trackWidth: 100,
    path: [[400, 60], [740, 60], [740, 340], [60, 340], [60, 60], [360, 60]],
}

const BIG_OVAL:Track = {
    name: "Big Oval",
    dim: [800, 400],
    grid: 10,
    trackWidth: 70,
    path: [[400, 40], [760, 40], [760, 360], [40, 360], [40, 40], [380, 40]],
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
        path,
    };
}
