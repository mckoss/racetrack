import { CarState, MoveOption } from '../racetrack.js';
import { Point, add, sub, isZero, scale, sign } from '../points.js';

import { isSafe } from './racer-helper.js';

export { update };

function update(state: CarState, options: MoveOption[]): Point {
    // Prefer to coast unless another move is better.
    let best: MoveOption | undefined;

    // If moving to finish, just accelerate in the same direction.
    if (!isZero(state.velocity) && state.crashPosition === undefined) {
        return sign(state.velocity);
    }

    for (const option of options) {
        // Not a valid option.
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

        if (state.crashPosition !== undefined) {
            const dist = sub(state.crashPosition, state.position);
            if (!isSafe(v, dist)) {
                continue;
            }
        }

        if (best === undefined || best.distanceToFinish === undefined ||
            option.distanceToFinish < best.distanceToFinish) {
            best = option;
        }
    }

    return best?.move || scale(-1, sign(state.velocity));
}

