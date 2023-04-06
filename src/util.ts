export { testBool, testValue, shuffle, range, first, pyramidal, partialPyramidal };

// These functions are used as helpers for sorting arrays.  Inside of a
// comparison function, they return a negative number if a is less than b, a
// positive number if a is greater than b, and 0 if a and b are equal.
//
// Usage:
// cmp(a, b) {
//   let t = testBool(a, b, x => x.isFoo);
//   if (t !== 0) {
//       return t;
//   }
//   ... next in-order test ...
// }

type CMP<T> = (a: T, b: T) => number;

// Return negative if only a has boolean attribute, positive if only b has boolean
// attribute, 0 if they both have the same boolean attribute.
// Treat undefined as false.
function testBool<T>(a: T, b: T, f: (x: T) => boolean | undefined): number {
    const aBool = f(a) || false;
    const bBool = f(b) || false;
    return aBool === bBool ? 0 : aBool ? -1 : 1;
}

// Treat undefined as largest value (coming latest in sort order).
function testValue<T>(a: T, b: T, f: (x: T) => number | undefined): number {
    const aVal = f(a);
    const bVal = f(b);
    if (bVal === undefined) {
        return aVal === undefined ? 0 : -1;
    }
    if (aVal === undefined) {
        return 1;
    }
    return aVal - bVal;
}

function shuffle<T>(array: T[]): T[] {
    const result = array.slice();
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

// Written by GPT-4 to mimic Python's range function.
function* range(start: number, stop?: number, step: number = 1): Generator<number> {
    if (stop === undefined) {
        stop = start;
        start = 0;
    }

    if (step === 0) {
        throw new Error("Step cannot be zero.");
    }

    if (step > 0) {
        for (let i = start; i < stop; i += step) {
            yield i;
        }
    } else {
        for (let i = start; i > stop; i += step) {
            yield i;
        }
    }
}

// Without sorting the whole array, find the element with the smallest value
// according to the given comparison function.
function first<T>(array: T[], cmp: CMP<T>): T | undefined {
    if (array.length === 0) {
        return undefined;
    }

    let smallest = array[0];
    for (let i = 1; i < array.length; i++) {
        if (cmp(array[i], smallest) < 0) {
            smallest = array[i];
        }
    }

    return smallest;
}

// Return a "pyramidal sequence" of minimum sum d starting at s.
//
// A pyramidal sequence is a (minimal) sequence of numbers that starts at 1 and
// increases by no more than 1, then decreases by no more than 1 and ends at 1.
// The sum of the values in the sequence is d. Note that if d is a square, the
// sequence will be a "perfect pyramid" with a single peak value.
//
// E.g pyramidal(25) => [1, 2, 3, 4, 5, 4, 3, 2, 1]
function pyramidal(d: number): number[] {
    const peak = Math.floor(Math.sqrt(d));

    // Minimal sequence is 1, 2, ...., peak, peak - 1, ..., 2, 1
    // At worst this sum needs to be augmented by (peak + 1)^2 - peak^2 - 1.
    // i.e. 2 * peak.
    // Since peak is the largest term we can use without exceeding d, we can
    // add at most 2 additional terms to the sequence to equal d.

    const result = Array.from(range(1, peak)).concat(Array.from(range(peak, 0, -1)));

    let deficit = d - peak * peak;

    while (deficit > 0) {
        // Term is always non-ascending in value in this loop.
        const term = Math.min(deficit, peak);
        result.splice(term - 1, 0, term);
        deficit -= term;
    }

    return result
}

// A partial pyramidal sequence is a (minimal) sequence of numbers that starts at s
// (+-1) and increases by no more than 1, then decreases by no more than 1 and
// ends at 1. The sum of the values in the sequence is d.
//
// Two cases.  We can be on the descending side of the pyramid, or the ascending
// side.  Note that the max value of a descending sequence is 2 * s + s * (s + 1) / 2.
// = 1/2 * s * (s + 5).
// E.g., is s == 3, the max value is 12 [3, 3, 3, 2, 1].  Note that an ascending
// sequence starting at 3 has a min value of 13 [3, 4, 3, 2, 1].
function partialPyramidal(d: number, s: number): number[] {
    const maxDescending = s * (s + 5) / 2;

    if (d <= maxDescending) {
        const results = Array.from(range(s - 1, 0, -1));
        let deficit = d - s * (s - 1) / 2;
        if (deficit < 0) {
            throw new Error("Impossible partialPyramid(${d}, ${s}).");
        }

        while (deficit > 0) {
            // At most s, s, and then the remainder <= s.
            const term = Math.min(deficit, s);
            results.splice(results.length - (term - 1), 0, term);
            deficit -= term;
        }

        return results;
    }

    // Find the peak term based on the minimal sum of an ascending
    // sequence starting at s + 1.
    const peak = Math.floor(Math.sqrt(d + s * (s + 1) / 2));

    const results = Array.from(range(s + 1, peak)).concat(Array.from(range(peak, 0, -1)));

    let deficit = d - (peak * peak - s * (s + 1) / 2);

    while (deficit > 0) {
        // Term is always non-ascending in value in this loop.
        // At most s, s, and then the remainder < s.
        const term = Math.min(deficit, peak);
        // Prefer to put extra values in the rising part of the sequence.
        if (term >= s) {
            results.splice(term - s, 0, term);
        } else {
            // But some small values may have to go at the end - which could
            // screw up our attempts go through a small gate on the track.
            results.splice(results.length - (term - 1), 0, term);
        }
        deficit -= term;
    }

    return results;
}
