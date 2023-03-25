export { testBool, testValue };

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
    return aVal - bVal;
}
