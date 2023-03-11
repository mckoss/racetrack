import { CarState, MoveOption } from '../racetrack';
import { Point, add } from '../points';

export { update };

function update(state: CarState, options: MoveOption[]): Point {
    const best = bestOption(state.velocity, options);
    if (!best) {
        return [0, 0];
    }
    return best.move;
}

// Pick the best option out of all those where the velocity is exaclty 1
// in one direction.
function bestOption(v: Point, options: MoveOption[]): MoveOption | undefined {
    let best:MoveOption | undefined;
    for (const option of options) {
        if (option.distanceToFinish === undefined) {
            continue;
        }
        const [dx, dy] = add(v, option.move);
        if (Math.abs(dx) + Math.abs(dy) !== 1) {
            continue;
        }

        if (best === undefined || option.distanceToFinish < best.distanceToFinish!) {
            best = option;
        }
    }
    return best;
}
