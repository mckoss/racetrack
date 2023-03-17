import { Point } from '../points.js';

export { stoppingDistance, speedLimit, isSafe };

// A velocity is considered safe if we can stop before hitting the
// relative crash position in either the x or y direction.
function isSafe(v: Point, dist: Point): boolean {
    return isCoordSafe(v[0], dist[0]) && isCoordSafe(v[1], dist[1]);

    function isCoordSafe(v: number, dist: number): boolean {
        // Heading in the direction opposite to the crash position
        // always deemed safe.
        if (Math.sign(v * dist) === -1) {
            return true;
        }

        const absV = Math.abs(v);

        if (absV <= 1) {
            return true;
        }

        return absV <= speedLimit(dist);
    }
}

function stoppingDistance(v: number): number {
    v = Math.abs(v);
    return v * (v + 1) / 2;
}

// Return the largest number of steps such that
// steps * (steps + 1) / 2 < dist (strictly less)
// This is the floor of the solution to the quadratic equation
// steps^2 + steps - 2 * dist = 0.
function speedLimit(dist: number) : number {
    dist = Math.abs(dist);

    let result = (Math.sqrt(1 + 8 * dist) - 1) / 2;

    // If exact solution is not an integer, round down.
    if (result % 1 === 0) {
        result--;
    } else {
        result = Math.floor(result);
    }

    if (result < 1) {
        return 1;
    }

    return result;
}
