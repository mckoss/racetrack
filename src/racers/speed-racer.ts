import { CarState, MoveOption } from '../racetrack.js';
import { Point, add, sub, isZero, scale, sign, isEqual } from '../points.js';
import { testBool, testValue } from '../util.js';

import { isSafe } from './racer-helper.js';

export { update };

function update(state: CarState, options: MoveOption[]): Point {
    if (state.step === 1) {
        state.name = "Speed Racer";
        state.author = "mckoss";
    }

    // Prefer to coast unless another move is better.
    let best: MoveOption | undefined;

    // If moving to finish, just accelerate in the same direction.
    if (!isZero(state.velocity) && state.crashPosition === undefined) {
        return sign(state.velocity);
    }

    let dist: Point | undefined;
    if (state.crashPosition !== undefined) {
        dist = sub(state.crashPosition, state.position);
    }

    for (const option of options) {
        // Crashes immediately - not a valid option.
        if (option.distanceToFinish === undefined) {
            continue;
        }

        const v = add(state.velocity, option.move);

        // Never stop moving.
        // TODO: I think there could be some cases (dead-end traps) where a zero
        // velocity would be required.  The distance gradient would have to be
        // positive when entering the trap even though it would be going
        // backwards after entry.
        if (isZero(v)) {
            continue;
        }

        if (dist !== undefined) {
            if (!isSafe(v, dist)) {
                continue;
            }
        }

        if (cmpOption(option, best) < 0) {
            best = option;
        }
    }

    if (best === undefined) {
        console.warn(`No good moves for ${state.position} - max breaking.`);
    }
    return best?.move || scale(-1, sign(state.velocity));

    function cmpOption(a: MoveOption, b?: MoveOption): number {
        if (b === undefined) {
            return -1;
        }

        let t: number;

        // Prefer move toward the finish.
        t = testValue(a, b, (x) => x.distanceToFinish!);
        if (t !== 0) {
            return t;
        }

        // Prefer move in same direction as last move.
        t = testBool(a, b, (x) => {
            const v = add(state.velocity, x.move);
            return isEqual(sign(state.velocity), sign(v));
        });
        if (t !== 0) {
            return t;
        }

        // Prefer move along x,y axes (not diagonals).
        t = testBool(a, b, (x) => {
            return x.move[0] === 0 || x.move[1] === 0;
        })
        if (t !== 0) {
            return t;
        }

        return 0.5 - Math.random();
    }
}
