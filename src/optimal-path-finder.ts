// We find the optimal path from a particular starting point to the finish. This
// is done via exhaustive search.  To do so, we cache the shortest path to any
// given point/speed combination.  We use an breadth-first search to find the
// fastest path to the finish.

import { Racetrack, MoveOption, CarState, CarUpdate } from './racetrack';
import { Point, isZero, add, neighbors, sub, length } from './points';
import { first, sgnOrder, cmpDefined } from './util';

export { findOptimalPath, getOptimalRacer };

interface Finish {
    newPos: Point,
    nextVelocity: Point,
    fraction: number,
    pathLength: number,
    pos: Point,
    velocity: Point,
};

function findOptimalPath(start: Point, rt: Racetrack) : Point[] {
    // Map from a reached point/velocity to the previous point/velocity
    // along some path.  We only store the first such found path from a
    // given point/velocity (since we are doing breadth-first search it will
    // be the fastest way of reaching that point/velocity).
    const priors = new Map<string, string>();
    let frontier: [Point, Point][] = [[start, [0, 0]]];
    let nextFrontier: [Point, Point][];

    let bestFinish: Finish | undefined;

    let pathLength = 1;

    while (frontier.length > 0) {
        nextFrontier = [];
        for (const [pos, velocity] of frontier) {
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
                if (rt.distanceToFinish(newPos) > currentDistanceToFinish) {
                    continue;
                }

                const result = rt.driveLine(pos, newPos);

                // Went off track in the transition.
                if (result.status === 'crashed') {
                    continue;
                }

                // The best finish is the one that crosses the finish line
                // soonest.

                if (result.status === 'finished') {
                    const fraction = length(sub(result.position, pos)) / length(nextVelocity);
                    console.log(`Found a finish: ${pathLength}.${fraction} @ ${length(nextVelocity).toFixed(1)}`);

                    bestFinish = first([bestFinish,
                        { newPos, nextVelocity, fraction, pos, velocity, pathLength }],
                        cmpFinish);
                }

                // TODO: Prune sure-to-crash points due to their high velocity.
                // as an optimization - no need to explore those.
                priors.set(idPV(newPos, nextVelocity), idPV(pos, velocity));
                nextFrontier.push([newPos, nextVelocity]);
            }
        }

        // Subsequent frontiers don't matter if we've already found a finish.
        if (bestFinish !== undefined) {
            break;
        }

        pathLength += 1;
        console.log(`Frontier size: ${nextFrontier.length} @ ${pathLength}`);
        frontier = nextFrontier;
    }

    if (bestFinish === undefined) {
        throw(new Error('No path found'));
    }

    const path = buildPath(idPV(bestFinish.newPos, bestFinish.nextVelocity), priors);
    return path;
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

function getOptimalRacer(): CarUpdate {
    let path: Point[] = [];

    return (state: CarState, _options: MoveOption[], rt?: Racetrack) => {
        if (state.step === 1) {
            state.name = 'Optimus-Prime';
            state.author = 'God';
            path = findOptimalPath(state.position, rt!);
            return sub(path[1], path[0])
        }

        const vCurrent = sub(path[state.step], path[state.step - 1]);
        const vPrev = sub(path[state.step - 1], path[state.step - 2]);
        return sub(vCurrent, vPrev);
    }
}

function idPV(p: Point, v: Point): string {
    return JSON.stringify([p, v]);
}

function pvFromId(id: string): [Point, Point] {
    return JSON.parse(id);
}

function cmpFinish(a: Finish | undefined, b: Finish | undefined): number {
    let sgn = cmpDefined(a, b);
    if (sgn !== 0) {
        return sgn;
    }

    return sgnOrder(
        a!.pathLength - b!.pathLength,
        a!.fraction - b!.fraction,
        length(b!.nextVelocity) - length(a!.nextVelocity));
};
