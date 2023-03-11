import { CarState, MoveOption } from '../racetrack.js';
import { Point, add, isZero } from '../points.js';

export { update };

function update(state: CarState, options: MoveOption[]): Point {
    return bestOption(state.velocity, options).move;
}

// Pick the best option out of all those where the velocity is limited
// to +-1 in both x and y directions.
function bestOption(v: Point, options: MoveOption[]): MoveOption {
    // Prefer to coast unless another move is better.
    let best = options[0];

    for (const option of options) {
        if (option.distanceToFinish === undefined) {
            continue;
        }
        const [dx, dy] = add(v, option.move);
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1 || isZero([dx, dy])) {
            continue;
        }

        if (best.distanceToFinish === undefined || option.distanceToFinish < best.distanceToFinish!) {
            // console.info(`New best: ${JSON.stringify(option)}`);
            best = option;
        }
    }
    return best;
}
