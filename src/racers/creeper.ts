import { CarState, MoveOption } from '../racetrack.js';
import { Point, add, length, isZero } from '../points.js';

export { update };

const MAX_SPEED = 2;

function update(state: CarState, options: MoveOption[]): Point {
    if (state.step === 1) {
        state.name = "Creeper";
        state.author = "mckoss";
    }
    return bestOption(state.velocity, options).move;
}

// Pick the best option out of all those where the velocity is limited
// to +-1 in both x and y directions.
function bestOption(v: Point, options: MoveOption[]): MoveOption {
    // Prefer to coast unless another move is better.
    let best = options[0];

    for (const option of options) {
        // Ignore crashed moves.
        if (option.distanceToFinish === undefined) {
            continue;
        }

        // Most always be moving, but not TOO fast.
        const vMove = add(v, option.move);
        const speed = length(vMove);
        if (isZero(vMove) || speed > MAX_SPEED) {
            continue;
        }

        if (best.distanceToFinish === undefined || option.distanceToFinish < best.distanceToFinish!) {
            // console.info(`New best: ${JSON.stringify(option)}`);
            best = option;
        }
    }
    return best;
}
