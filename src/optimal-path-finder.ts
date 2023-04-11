// We find the optimal path from a particular starting point to the finish. This
// is done via exhaustive search.  To do so, we cache the shortest path to any
// given point/speed combination.  We use an breadth-first search to find the
// fastest path to the finish.

import { Racetrack, CarUpdate } from './racetrack';
import { Point, isZero, add, neighbors, sub } from './points';

export { findOptimalPath, racerFromPath };

function findOptimalPath(start: Point, rt: Racetrack) : Point[] {
    // Map from a reached point/velocity to the previous point/velocity
    // along some path.  We only store the first such found path from a
    // given point/velocity (since we are doing breadth-first search it will
    // be the fastest way of reaching that point/velocity).
    const priors = new Map<string, string>();
    const frontier: [Point, Point][] = [[start, [0, 0]]];

    while (frontier.length > 0) {
        const [pos, velocity] = frontier.shift()!;
        // rt.gridDot(pos, 'black');

        const currentDistanceToFinish = rt.distanceToFinish(pos);

        for (const nextVelocity of neighbors(velocity, 1, true)) {
            // While there may be cases where we need to stop
            // and turn around, we will ignore those (for now).
            if (isZero(nextVelocity)) {
                continue;
            }

            const newPos = add(pos, nextVelocity);

            // We've already been here at the same velocity - skip.
            if (priors.has(idPV(newPos, nextVelocity))) {
                continue;
            }

            // Prune points that have left the track.
            if (!rt.isPointInTrack(newPos)) {
                continue;
            }

            // Prune points that are further from the finish than
            // the current point.  Note: this may not always be fastest
            // but it is a good heuristic and cuts down on the search space.
            if (rt.distanceToFinish(newPos) >= currentDistanceToFinish) {
                continue;
            }

            const result = rt.driveLine(pos, newPos);

            // Went off track in the transition.
            if (result.status === 'crashed') {
                continue;
            }

            if (result.status === 'finished') {
                priors.set(idPV(result.position, nextVelocity), idPV(pos, velocity));
                // TODO: Return whole path
                const path = buildPath(idPV(newPos, nextVelocity), priors);
                rt.drawGridTrail(path, 'black');
                return path;
            }

            // TODO: Prune sure-to-crash points due to their high velocity.
            // as an optimization - no need to explore those.
            priors.set(idPV(newPos, nextVelocity), idPV(pos, velocity));
            frontier.push([newPos, nextVelocity]);
            // rt.gridDot(newPos, 'red');
        }
    }

    throw(new Error('No path found'));
}

function buildPath(endPoint: string, priors: Map<string, string>): Point[] {
    const result: Point[] = [];

    let current: string | undefined = endPoint;
    while (current !== undefined) {
        const [pos, _] = pvFromId(current);
        result.push(pos);

        current = priors.get(current);
    }

    return result.reverse();
}

function racerFromPath(path: Point[]): CarUpdate {
    return (state) => {
        if (state.step === 1) {
            state.name = 'Optimus-Prime';
            state.author = 'God';
            return sub(path[1], path[0])
        }
        const vCurrent = sub(path[state.step], path[state.step - 1]);
        const vPrev = sub(path[state.step - 1], path[state.step - 2]);
        return sub(vCurrent, vPrev);
    };
}

function idPV(p: Point, v: Point): string {
    return JSON.stringify([p, v]);
}

function pvFromId(id: string): [Point, Point] {
    return JSON.parse(id);
}
