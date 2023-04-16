// Analyze racer strategies.

import { Point, Transform, sub, length } from "./points";
import { CarState, CarUpdate, MoveOption } from "./racetrack";
// import { gradientOf } from "./racers/racer-helper";
import { sgnOrder, round } from "./util";

export { normalize, cmpNormalize, Collector };

type Reducer<T> = (state: CarState, moves: MoveOption[]) => [T, Transform];

// We develop several reducer functions that convert the data into classes
// that can be more easily compared (e.g., are not sensitive to the
// current position or orientation of the car).

// This one preserves the most information.  But, does not aggregrate
// many of the responses into a single class.

// We convert the current velocity so that it is in the 1st octant
// (x and y, positive, and x >= y).  We also convert the crash position
// to a distance.
// Distance to finish is normalized to be relative to the smallest
// distance in the current position or any move.
// Note that in this case distanceToFinish of zero is NOT the finish line.
interface RacerData {
    velocity: Point;
    crash: number;
    moves: {
        move: Point;
        dist: number;
    }[];
}

function normalize(state: CarState, moves: MoveOption[]): [RacerData, Transform] {
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
    const coastDist = moves.reduce((a, b) =>
        b.distanceToFinish !== undefined ? Math.min(a, b.distanceToFinish) : a,
        Infinity);
    const crash = state.crashPosition !== undefined ?
        round(length(sub(state.crashPosition, state.position)), 1):
        Infinity;
    const result = {
        velocity: t.apply(state.velocity),
        crash,
        moves: moves.map(m => ({
            move: t.apply(m.move),
            dist: m.distanceToFinish ? m.distanceToFinish - coastDist : Infinity,
        })),
    };
    return [result, t];
}

function cmpNormalize(a: RacerData, b: RacerData): number {
    return sgnOrder(
        a.velocity[0]- b.velocity[0],
        a.velocity[1]- b.velocity[1],
        a.crash - b.crash);
}

class Collector<T> {
    racer: CarUpdate;
    wrappedRacer: CarUpdate;
    cmp?: (a: T, b: T) => number;
    hist = new Map<string, Point[]>();

    constructor(racer: CarUpdate, reducer: Reducer<T>, cmp?: (a: T, b: T) => number) {
        const self = this;

        this.racer = racer;
        this.cmp = cmp;

        this.wrappedRacer = (state, moves, rt) => {
            const move = racer(state, moves, rt);
            const [data, t] = reducer(state, moves);
            const key = JSON.stringify(data);
            if (!self.hist.has(key)) {
                self.hist.set(key, []);
            }
            self.hist.get(key)!.push(t.apply(move));
            return move;
        };
    }

    report(): string {
        const entries = Array.from(this.hist.entries());
        if (this.cmp) {
            const cmp = this.cmp;
            entries.sort((a, b) => {
                const [aT, bT] = [a, b].map(x => JSON.parse(x[0]));
                return cmp!(aT, bT);
            });
        }
        const samples = entries.reduce((a, b) => a + b[1].length, 0);
        console.log(`entries: ${entries.length} keys - with ${samples} samples`);
        const lines = entries.map(([key, choices]) => `${key}: ${JSON.stringify(choices)}`);
        return lines.join('\n\n');
    }
}
