import { CarState, MoveOption } from '../racetrack.js';
import { Point, isZero, add, sub, repr, dot, unit, length, turn, round, isOrthogonal, scale } from '../points.js';
import { first, partialPyramidal } from '../util.js';
import { gradientOf } from './racer-helper.js';


export { update };

const DEBUG = true;

function debug(...args: any[]) {
    if (DEBUG) {
        console.log(...args);
    }
}

interface GateInfo {
    v: Point;
    speeds: number[];
}

// Strategy:
// 1. Start by driving toward the start line gradient.
// 2. Use the crash point determine the location of the next "gate" - a
//    point on the track we are aiming for, making a sharp turn very close
//    to that point.
// 3. Use the gradient to determine the direction to turn at the gate - making
//    a 90 degree turn.
// 4. Once we've passed the gate, set the next gate point and repeat.
//
// We use the pyramidal sequence generator to determine the optimal acceleration
// to reach the gate point at the right speed.
function update(state: CarState, options: MoveOption[]): Point {
    if (state.step === 1) {
        state.name = "Gate-Crasher";
        state.author = "mckoss";
    }

    const vGrad = gradientOf(options, state.velocity);

    debug(`\nv: ${repr(state.velocity)} grad: ${repr(vGrad)}`);

    // Hopeless - no non-crash move.
    if (state.extra === undefined && isZero(vGrad)) {
        console.warn("No non-crashing moves!");
        return [0, 0];
    }

    // First step has zero velocity - and therefore no crash position.
    // Just choose the move most aligned with the gradient.
    if (state.step === 1) {
        // Currently all the tracks start heading to the right.
        return [1, 0];
    }

    // Our current trajectory - is toward the finish line.
    if (state.crashPosition === undefined) {
        debug(`Pointing to finish!`);
        const v = unit(state.velocity);
        if (length(v) === 1) {
            debug(`Book it!`);
            return v;
        }

        const finishMoves = options.filter(o => o.status === 'finished');
        // If we have finishing moves, take the fastest one.
        if (finishMoves.length > 0) {
            debug('finishMoves', finishMoves);
            return first(finishMoves, (a, b) => {
                return length(b.move) - length(a.move);
            })!.move;
        }

        // Otherwise, take the moving fastest along the gradient.
        return first(options, (a, b) => {
            const aV = add(state.velocity, a.move);
            const bV = add(state.velocity, b.move);
            return dot(bV, vGrad) - dot(aV, vGrad);
        })!.move;
    }

    let gateInfo = state.extra as GateInfo | undefined;

    // Handle horizontal and vertical cases only.
    if (gateInfo === undefined && isOrthogonal(state.velocity)) {
        const v = unit(state.velocity);
        const speed = length(state.velocity);
        const dist = dot(sub(state.crashPosition, state.position), v) - 3;
        const speeds = partialPyramidal(dist, speed);
        speeds.push(0);
        gateInfo = { v, speeds };
        state.extra = gateInfo;
        debug(`Setting up gate ${repr(scale(dist, v))} away.`);
        debug(`Speeds: ${speeds}`);
    }

    if (gateInfo !== undefined) {
        const speed = dot(state.velocity, gateInfo.v);
        const nextSpeed = gateInfo.speeds.shift()!;
        const delta = nextSpeed - speed;
        let move = scale(delta, gateInfo.v);

        // Navigate a turn near the gate.
        if (gateInfo.speeds.length <= 1) {
            let t = round(turn(gateInfo.v, 0.25));
            if (dot(t, vGrad) < 0) {
                t = round(turn(t, 0.5));
            }
            move = add(move, t);
        }

        if (gateInfo.speeds.length === 0) {
            state.extra = undefined;
            debug(`Gate reached!`);
        }

        debug(`Gate move to reach ${nextSpeed}: ${repr(move)}`);
        debug(`Remaining Speeds: ${gateInfo.speeds}`);

        return move;
    }

    return [1, 0];
}
