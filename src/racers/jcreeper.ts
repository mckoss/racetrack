import { CarState, MoveOption } from '../racetrack.js';
import { Point, add, isZero } from '../points.js';

export { update };

const dangerThreshold = 5;
const lowSpeed = 4;

function update(state: CarState, options: MoveOption[]): Point {
    if (state.step === 1) {
        state.name = "J-Creeper";
        state.author = "jacoxnet";
    }
    return bestOption(state, options).move;
}

// Pick the best option out of all those where the speed is
// controlled by dangerRatio
function bestOption(state: CarState, options: MoveOption[]): MoveOption {
    function eDistance(position1: Point, position2: Point = [0, 0]) {
        return Math.sqrt((position1[0] - position2[0]) ** 2 + (position1[1] - position2[1]) ** 2);
    }

    const currentSpeed = eDistance(state.velocity);
    let speedLimit: number = 100;
    const dangerRatio = (state.crashPosition === undefined)?
                            100 :
                            eDistance(state.position, state.crashPosition!) / currentSpeed;
    if (dangerRatio < dangerThreshold) {
        speedLimit = (currentSpeed >= lowSpeed + 1)? currentSpeed - 1 : lowSpeed;
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
        if (eDistance([dx, dy]) > speedLimit) continue;

        if (best === undefined) best = option;
        // select option if it's closer to finish. If options are same distance to finish, pick
        // one that is closer to current point position
        else if ((best.distanceToFinish === undefined || option.distanceToFinish < best.distanceToFinish!) ||
                 (option.distanceToFinish === best.distanceToFinish! &&
                  eDistance(state.position, option.position) < eDistance(state.position, best.position))) {
            best = option;
        }
    }

    // console.log(`options ${JSON.stringify(options)}`);
    // console.log(`position ${state.position}`);
    // console.log(`dangerRatio ${dangerRatio}`);
    // console.log(`speedLimit ${speedLimit}`);

    if (best == undefined)
        throw new Error("no options selected");
    else {
        // console.log(`best ${JSON.stringify(best)}`);
        return best;
    }
}
