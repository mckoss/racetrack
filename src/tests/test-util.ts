import { assert } from 'chai';
import { range, pyramidal, partialPyramidal } from '../util';

suite('range', () => {
  test('single argument', () => {
    assert.deepEqual(Array.from(range(5)), [0, 1, 2, 3, 4]);
  });

  test('two arguments', () => {
    assert.deepEqual(Array.from(range(2, 7)), [2, 3, 4, 5, 6]);
  });

  test('three arguments with positive step', () => {
    assert.deepEqual(Array.from(range(1, 10, 2)), [1, 3, 5, 7, 9]);
  });

  test('three arguments with negative step', () => {
    assert.deepEqual(Array.from(range(10, 1, -1)), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  });

  test('empty range with start equal to stop', () => {
    assert.deepEqual(Array.from(range(5, 5)), []);
  });

  test('throws error when step is zero', () => {
    assert.throws(() => Array.from(range(0, 5, 0)), Error, "Step cannot be zero.");
  });
});

suite('pyramidal', () => {
    const tests: [number, number[]][] = [
        [0, []],
        [1, [1]],
        [2, [1, 1]],
        [3, [1, 1, 1]],
        [4, [1, 2, 1]],
        [5, [1, 1, 2, 1]],
        [6, [1, 2, 2, 1]],
        [7, [1, 1, 2, 2, 1]],
        [8, [1, 2, 2, 2, 1]],
        [9, [1, 2, 3, 2, 1]],
        [50, [1,1,2,3,4,5,6,7,6,5,4,3,2,1]],
    ];

    for (const [d, expected] of tests) {
        test(`${d} => ${expected}`, () => {
            assert.deepEqual(pyramidal(d), expected);
        });


    }

    for (const [d, expected] of tests) {
        const peak = Math.floor(Math.sqrt(d));
        for (let s = 0; s <= peak; s++) {
            const sum = s * (s + 1) / 2;
            const pp = partialPyramidal(d-sum, s);
            test(`partial(${d-sum}, ${s}) => ${pp}`, () => {
                if (s === 0) {
                    assert.deepEqual(pp, expected);
                } else {
                    assert.equal(sumAll(pp), d-sum);
                }
            });
        }
    }

    // For giggles, confirm that length of minimal pyramidal sequence is
    // FLOOR(SQRT(4n-1)).
    for (let i = 1; i < 50; i++) {
        const p = pyramidal(i);
        test(`p(${i}).length = ${p.length}`, () => {
            const len = Math.floor(Math.sqrt(4 * i - 1));
            assert.equal(p.length, len);
        });
    }
});

function sumAll(seq: number[]): number {
    return seq.reduce((a, b) => a + b, 0);
}
