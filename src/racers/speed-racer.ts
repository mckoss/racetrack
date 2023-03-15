import { CarState, MoveOption } from '../racetrack.js';
import { Point, add, sub, isZero } from '../points.js';

import { isSafe } from './racer-helper.js';

export { update };

const DEBUG = true;

function update(state: CarState, options: MoveOption[]): Point {
    // Prefer to coast unless another move is better.
    let best: MoveOption | undefined;
    let dist: Point | undefined;

    debug(`State: ${JSON.stringify(state)}`);

    if (state.crashPosition !== undefined) {
        dist = sub(state.crashPosition, state.position);
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

        if (dist !== undefined && !isSafe(v, dist)) {
            debug(`Rejecting ${JSON.stringify(option)} because it could crash at ${JSON.stringify(state.crashPosition)}`);
            continue;
        }

        if (best === undefined || best.distanceToFinish === undefined || option.distanceToFinish < best.distanceToFinish) {
            // console.info(`New best: ${JSON.stringify(option)}`);
            best = option;
        }
    }

    debug(`Move: ${JSON.stringify(best)}`);

    return best?.move || [0, 0];
}

function debug(...args: any[]): void {
    if (DEBUG) {
        console.info(...args);
    }
}
