import { CarState, MoveOption } from '../racetrack.js';
import { Point, add, sub, unit, dot, length, isZero, repr, turn } from '../points.js';
import { speedLimit } from './racer-helper.js';
import { first, testValue } from '../util.js';

export { update };

const DEBUG = false;

function debug(...args: any[]) {
    if (DEBUG) {
        console.log(...args);
    }
}

// Strategy:
// - Compute the gradient of the distance to the finish at the point
//   of coasting.
// - Choose the option that has the largest component in the direction
//   of the gradient, and prefer moves that have least amount of
//   off-axis component.
function update(state: CarState, options: MoveOption[]): Point {
    if (state.step === 1) {
        state.name = "Grad-D";
        state.author = "mckoss";
    }

    const vGrad = gradientOf(options, state.velocity);
    const vPerpGrad = turn(vGrad, 0.25);

    debug(`\nv: ${repr(state.velocity)} grad: ${repr(vGrad)}`);

    // Hopeless - no non-crash move.
    if (isZero(vGrad)) {
        console.warn("No non-crashing moves!");
        return [0, 0];
    }

    // First step has zero velocity - and therefore no crash position.
    // Just choose the move most aligned with the gradient.
    if (state.step === 1) {
        // Don't consider zero move.
        const best = first(options.slice(1), (a, b) => {
            return dot(unit(b.move), vGrad) - dot(unit(a.move), vGrad);
        })!.move;
        debug(`first step: ${repr(best)}`);
        return best;
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

    const dCrash = sub(state.crashPosition, state.position);
    const dist = length(dCrash);
    const vCrash = unit(dCrash);

    debug(`dcrash: ${repr(dCrash)} dist: ${fmt(dist)} speedLimit:${speedLimit(dist)}`);

    // Find the move that has the largest component in the direction of the
    // gradient, and prefer moves that have least amount of off-axis
    // component.

    const crashMoves: Point[] = [];

    // Only consider moves that don't crash and keep moving.
    options = options.filter(option => {
        if (option.status === 'crashed') {
            crashMoves.push(option.move);
            return false;
        }
        return !isZero(add(state.velocity, option.move));
    });

    // Compute criteria.
    const criteria = options.map(option => {
        const v = add(state.velocity, option.move);
        const crashSpeed = dot(v, vCrash);
        let wallDist = 3;
        for (const move of crashMoves) {
            const dist = length(sub(option.move, move));
            if (dist < wallDist) {
                wallDist = dist;
            }
        }
        return {
            ...option,
            v,
            wallDist,
            gradSpeed: dot(v, vGrad),
            perpGradSpeed: Math.abs(dot(v, vPerpGrad)),
            crashSpeed,
            excessSpeed: Math.max(0, crashSpeed - speedLimit(dist)),
        };
    });

    // Sort based on weighted criteria.
    criteria.sort((a, b) => {
        return testValue(b, a, o => {
            return (
                + o.gradSpeed
                - o.perpGradSpeed * 0.25
                - o.excessSpeed * 1.5
                + o.wallDist * 0.5
            );
        });
    });

    // Sorted list of options
    for (let option of criteria) {
        debug(`${repr(option.move)} => ${repr(option.v)} speed: ${fmt(length(option.v))} ` +
                    `gradSpeed: ${fmt(option.gradSpeed)} perpGradSpeed: ${fmt(option.perpGradSpeed)} ` +
                    `\ncrashSpeed: ${fmt(option.crashSpeed)} excessSpeed: ${fmt(option.excessSpeed)}` +
                    `\nwallDist: ${fmt(option.wallDist)}`);
    }

    return criteria[0].move;
}

// Estimate the gradient as the average the moves that have the
// minimum distance to the finish.
function gradientOf(options: MoveOption[], v: Point): Point {
    let minDistance: number | undefined;
    for (let option of options) {
        if (option.distanceToFinish === undefined) {
            continue;
        }
        if (minDistance === undefined || option.distanceToFinish < minDistance) {
            minDistance = option.distanceToFinish;
        }
    }

    // All moves illegal - no gradient.
    if (minDistance === undefined) {
        return [0, 0];
    }

    let sum: Point = [0, 0];
    for (let option of options) {
        if (option.distanceToFinish === minDistance) {
            sum = add(sum, option.move);
        }
    }

    // For multiple moves that cross finish, the gradient should be
    // the one with the highest velocity!  Just summing them sometimes
    // results in a zero vector (all finish).
    if (minDistance === 0) {
        let bestSpeed = 0;
        let best: Point = [0, 0];
        for (let i = 0; i < options.length; i++) {
            const option = options[i];
            if (option.distanceToFinish !== 0) {
                continue;
            }
            debug(add(v, option.move));
            const speed = length(add(v, option.move));
            if (speed > bestSpeed) {
                bestSpeed = speed;
                best = option.move;
            }
        }
        debug(`finish best: ${repr(best)} speed: ${fmt(bestSpeed)}`);
        return unit(best);
    }

    debug(`\n${options[1].distanceToFinish} ${options[2].distanceToFinish}` +
                ` ${options[3].distanceToFinish}` +
                `\n${options[4].distanceToFinish} ${options[0].distanceToFinish}` +
                ` ${options[5].distanceToFinish}` +
                `\n${options[6].distanceToFinish} ${options[7].distanceToFinish}` +
                ` ${options[8].distanceToFinish}`);

    return unit(sum);
}

function fmt(x: number): string {
    return x.toFixed(1);
}