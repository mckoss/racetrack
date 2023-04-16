// Analyze racer strategies.

import { Point, Transform, scale, sub, length } from "./points";
import { CarState, CarUpdate, MoveOption } from "./racetrack";
import { sgnOrder } from "./util";

export { normalize, Collector };

// Normalize the data so it can be compared between analogous conditions.
// We convert the current velocity so that it is in the 1st octant
// (x and y, positive, and x >= y).  We also convert the crash position
// to be relative to the current position.
// Distance to finish is normalized to be relative to the smallest
// distance in the current position or any move.
// Note that in this case distanceToFinish of zero is NOT the finish line.
interface RacerData {
    velocity: Point;
    crashDist: number;
    moves: MoveOption[];
    distanceToFinish: number;
    selectedMove: Point;
}

function normalize(state: CarState, moves: MoveOption[], move: Point): RacerData {
    let t = new Transform();
    if (state.velocity[0] < 0) {
        t = t.compose(Transform.negateX());
    }
    if (state.velocity[1] < 0) {
        t = t.compose(Transform.negateY());
    }
    const [x, y] = t.apply(state.velocity);
    if (x < y) {
        t = Transform.swapXY().compose(t);
    }
    const tPos = t.compose(Transform.translate(scale(-1, state.position)));
    const coastDist = moves.reduce((a, b) =>
        b.distanceToFinish !== undefined
        ? Math.min(a, b.distanceToFinish)
        : a, Infinity);
    const crashDist = state.crashPosition !== undefined ?
        Math.round(length(sub(state.crashPosition, state.position)) * 10) / 10 :
        Infinity;
    const result = {
        velocity: t.apply(state.velocity),
        crashDist,
        moves: moves.map(m => ({
            ...m,
            move: t.apply(m.move),
            position: tPos.apply(m.position),
            distanceToFinish: m.distanceToFinish ? m.distanceToFinish - coastDist : Infinity,
        })),
        distanceToFinish: state.distanceToFinish,
        selectedMove: t.apply(move),
    };
    return result;
}

class Collector {
    racer: CarUpdate;
    wrappedRacer: CarUpdate;
    hist = new Map<string, Point[]>();

    constructor(racer: CarUpdate) {
        const self = this;

        this.racer = racer;
        this.wrappedRacer = (state, moves, rt) => {
            const move = racer(state, moves, rt);
            const data = normalize(state, moves, move);
            const keyJSON = {v: data.velocity, c: data.crashDist};
            const key = JSON.stringify(keyJSON);
            if (!self.hist.has(key)) {
                self.hist.set(key, []);
            }
            self.hist.get(key)!.push(data.selectedMove);
            return move;
        };
    }

    report(): string {
        const entries = Array.from(this.hist.entries());
        entries.sort((a, b) => {
            const aKey = JSON.parse(a[0]);
            const bKey = JSON.parse(b[0]);
            return sgnOrder(
                aKey.v[0] - bKey.v[0],
                aKey.v[1] - bKey.v[1],
                aKey.c - bKey.c
                );
        });
        const samples = entries.reduce((a, b) => a + b[1].length, 0);
        console.log(`entries: ${samples}`);
        const lines = entries.map(([key, choices]) => `${key}: ${JSON.stringify(choices)}`);
        return lines.join('\n');
    }
}
