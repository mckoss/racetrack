import { CarState, MoveOption } from '../racetrack.js';
import { Point, add, sub, unit, dot, length, isZero, repr } from '../points.js';
import { speedLimit } from './racer-helper.js';
import { first } from '../util.js';

export { update };

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

    const grad = gradientOf(options, state.velocity);

    console.log(`\nv: ${repr(state.velocity)} grad: ${repr(grad)}`);

    // Hopeless - no non-crash move.
    if (isZero(grad)) {
        console.warn("No non-crashing moves!");
        return [0, 0];
    }

    // First step has zero velocity - and therefore no crash position.
    // Just choose the move most aligned with the gradient.
    if (state.step === 1) {
        return first(options, (a, b) => {
            return dot(b.move, grad) - dot(a.move, grad);
        })!.move;
    }

    // Our current trajectory - is toward the finish line.
    if (state.crashPosition === undefined) {
        const finishMoves = options.filter(o => o.status === 'finished');
        // If we have finishing moves, take the fastest one.
        if (finishMoves.length > 0) {
            console.log('finishMoves', finishMoves);
            return first(finishMoves, (a, b) => {
                return length(b.move) - length(a.move);
            })!.move;
        }

        // Otherwise, take the moving fastest along the gradient.
        return first(options, (a, b) => {
            const aV = add(state.velocity, a.move);
            const bV = add(state.velocity, b.move);
            return dot(bV, grad) - dot(aV, grad);
        })!.move;
    }

    const dCrash = sub(state.crashPosition, state.position);
    const dist = length(dCrash);
    const vCrash = unit(dCrash);

    console.log(`dcrash: ${repr(dCrash)} dist: ${fmt(dist)} speedLimit:${speedLimit(dist)}`);

    // Find the move that has the largest component in the direction of the
    // gradient, and prefer moves that have least amount of off-axis
    // component.
    let best: MoveOption | undefined;
    let bestSpeed: number | undefined;
    let bestComponent: number | undefined;
    for (let option of options) {
        // Don't crash and keep moving.
        const v = add(state.velocity, option.move);
        if (option.status === "crashed" || isZero(v)) {
            continue;
        }

        const speed = length(v);
        const compGrad = dot(v, grad);

        console.log(`move: ${repr(option.move)} speed: ${fmt(speed)} compGrad: ${fmt(compGrad)}`);

        // if (dot(v, crashUnit!) > speedLimit(dist)) {
        //     console.log(`too fast: ${repr(option.move)} v: ${repr(v)} compSpeed: ${dot(v, crashUnit!)} > ${speedLimit(dist)} crash in ${dist}`);
        //     continue;
        // }

        const compCrash = dot(v, vCrash);
        // Maybe not accurate for dist < 2 - rely on 'crashed' status in option.
        if (dist >= 2 && compCrash > speedLimit(dist)) {
            console.log(`too fast: ${repr(option.move)} v: ${repr(v)} vCrash: ${repr(vCrash)} ` +
                `compCrash: ${fmt(compCrash)} > ${speedLimit(dist)} crash in ${fmt(dist)}`);
            continue;
        }

        if (bestComponent === undefined || compGrad > bestComponent ||
            compGrad === bestComponent && speed < bestSpeed!) {
            best = option;
            bestSpeed = speed;
            bestComponent = compGrad;
            console.log(`better: ${repr(best.move)} speed: ${fmt(speed)} ` +
                `gradSpeed: ${fmt(compGrad)} crashSpeed: ${fmt(dot(v, vCrash))}`);
        }
    }

    if (best === undefined) {
        console.warn("No non-crashing moves!");
        return [0, 0];
    }

    return best.move;
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
            console.log(add(v, option.move));
            const speed = length(add(v, option.move));
            if (speed > bestSpeed) {
                bestSpeed = speed;
                best = option.move;
            }
        }
        console.log(`best: ${repr(best)} speed: ${fmt(bestSpeed)}`);
        return unit(best);
    }

    return unit(sum);
}

function fmt(x: number): string {
    return x.toFixed(1);
}