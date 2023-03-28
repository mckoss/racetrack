import { Point, sub } from "../points.js";
import { CarState, MoveOption } from "../racetrack.js";

// Follows the least distance path, but tries to control speed to avoid crashing.
export function update(state: CarState, options: MoveOption[]) {
  if (state.step === 1) {
      state.name = "MJL-2";
      state.author = "mikelehen";
  }

  function distTo(point?: Point) {
    return point ? magnitude(sub(point, state.position)) : Number.POSITIVE_INFINITY;
  }

  const crashDistance = distTo(state.crashPosition);

  let bestOption = undefined;
  for(const option of options) {
    // Don't consider options that have crashed.
    if (option.status !== "crashed") {
      // Don't consider options that are likely to crash.
      const speed = magnitude(sub(option.position, state.position));
      const stopDistance = (speed + 1) * (speed / 2);
      if (stopDistance < crashDistance) {
        // Prefer options that are closer to the finish or that are the same
        // distance to the finish but closer to current position (avoid
        // unnecessary weaving back/forth).
        const finishCmp = (option.distanceToFinish ?? Number.POSITIVE_INFINITY) - (bestOption?.distanceToFinish ?? Number.POSITIVE_INFINITY);
        if (finishCmp < 0 || (finishCmp === 0 && distTo(option.position) < distTo(bestOption?.position))) {
          bestOption = option;
        }
      }
    }
  }
  return (bestOption ?? options[0]).move;
}

function magnitude(vector: [number, number]): number {
  return Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
}