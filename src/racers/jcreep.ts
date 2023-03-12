import { CarState, MoveOption } from '../racetrack.js';
import { Point, add, isZero } from '../points.js';

export { update };

const dangerThreshold = 5;

function update(state: CarState, options: MoveOption[]): Point {
    return bestOption(state, options).move;
}

// Pick the best option out of all those where the speed is 
// controlled by dangerRatio
function bestOption(state: CarState, options: MoveOption[]): MoveOption {
    function manhattan(position1: Point, position2: Point = [0, 0]) {
        return Math.floor(Math.sqrt((position1[0] - position2[0]) ** 2 + (position1[1] - position2[1]) ** 2));
    }

    const currentSpeed = manhattan(state.velocity);
    let speedLimit: number = 100;
    const dangerRatio = (state.crashPosition === undefined)? 
                            100 : 
                            manhattan(state.position, state.crashPosition!) / currentSpeed;
    if (dangerRatio < dangerThreshold) {
        speedLimit = (currentSpeed >= 2)? currentSpeed - 1 : 1;
    }
    
    // Don't set a default option since something should be selected
    let best: MoveOption | undefined;

    for (const option of options) {
        if (option.distanceToFinish === undefined) {
            continue;
        }
        const [dx, dy] = add(state.velocity, option.move);
        if (isZero([dx, dy])) {
            continue;
        }
        if (manhattan([dx, dy]) > speedLimit) continue;

        if (best === undefined) best = option;
        else if (best.distanceToFinish === undefined || option.distanceToFinish < best.distanceToFinish!) {
            best = option;
        }
    }
    if (best == undefined) 
        throw new Error("no options selected");
    else return best;
}
