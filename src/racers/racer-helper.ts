import { Point, unit, length, add } from '../points.js';
import { MoveOption } from '../racetrack.js';

export { stoppingDistance, speedLimit, isSafe, gradientOf };

// A velocity is considered safe if we can stop before hitting the
// relative crash position in either the x or y direction.
//
// This is a rather flawed metric and is usually way too conservative.
// Cars following this strategy often slow down unnecessarily until
// they creep past a collision point.
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

// Estimate the gradient as the average the moves that have the
// minimum distance to the finish.
function gradientOf(options: MoveOption[], v: Point): Point {
    let minDistance: number | undefined;
    for (let option of options) {
        if (option.distanceToFinish === undefined) {
            continue;
        }
        if (minDistance === undefined || option.distanceToFinish < minDistance) {
            minDistance = option.distanceToFinish;
        }
    }

    // All moves illegal - no gradient.
    if (minDistance === undefined) {
        return [0, 0];
    }

    let sum: Point = [0, 0];
    for (let option of options) {
        if (option.distanceToFinish === minDistance) {
            sum = add(sum, option.move);
        }
    }

    // For multiple moves that cross finish, the gradient should be
    // the one with the highest velocity!  Just summing them sometimes
    // results in a zero vector (all finish).
    if (minDistance === 0) {
        let bestSpeed = 0;
        let best: Point = [0, 0];
        for (let i = 0; i < options.length; i++) {
            const option = options[i];
            if (option.distanceToFinish !== 0) {
                continue;
            }
            const speed = length(add(v, option.move));
            if (speed > bestSpeed) {
                bestSpeed = speed;
                best = option.move;
            }
        }
        return unit(best);
    }

    return unit(sum);
}
