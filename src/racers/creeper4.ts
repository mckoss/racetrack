import { CarState, MoveOption } from '../racetrack.js';
import { Point, add, isZero } from '../points.js';

export { update };

function update(state: CarState, options: MoveOption[]): Point {
    return bestOption(state, options).move;
}

// Pick the best option out of all those where the velocity is limited
// to +-1 in both x and y directions.
function bestOption(state: CarState, options: MoveOption[]): MoveOption {

    const v = state.velocity;
    
    function eDistance(position1: Point, position2: Point = [0, 0]) {
        return Math.sqrt((position1[0] - position2[0]) ** 2 + (position1[1] - position2[1]) ** 2);
    }

    // Prefer to coast unless another move is better.
    let best = options[0];

    for (const option of options) {
        if (option.distanceToFinish === undefined) {
            continue;
        }
        const [dx, dy] = add(v, option.move);
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4 || isZero([dx, dy])) {
            continue;
        }

        // select option if it's closer to finish. If options are same distance to finish, pick
        // one that is closer to current point position
        if ((best.distanceToFinish === undefined || 
             option.distanceToFinish < best.distanceToFinish!) ||
                (option.distanceToFinish === best.distanceToFinish! &&
                 eDistance(state.position, option.position) < eDistance(state.position, best.position)))
            // console.info(`New best: ${JSON.stringify(option)}`);
            best = option;
    }
    return best;
}
