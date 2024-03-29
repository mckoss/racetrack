import { Point, add, linePoints, sub } from "../points.js";
import { CarState, MoveOption, Racetrack } from "../racetrack.js";

// Arbitrary large distance that is hopefully bigger than any track straightaway.
const PROJECT_FORWARD_DISTANCE = 100000;

enum Result {
  Crashed = "crashed",
  Finished = "finished",
}

interface State {
  position: Point;
  velocity: Point;
  step: number;
  distToFinish?: number;
  distToCrash?: number;
  speed: number;
}

interface Move {
  move: Point;
  state: State;
}

// Returns < 0 if a is better, > 0 if b is better, and 0 if they're equal.
function compareMoves(a: Move, b: Move): number {
  if (a.state.distToFinish !== undefined) {
    if (b.state.distToFinish !== undefined) {
      // Pick whichever one gets to the finish faster.
      return (
        a.state.distToFinish / a.state.speed -
        b.state.distToFinish / b.state.speed
      );
    } else {
      return -1; // a finishes and b doesn't.
    }
  } else if (b.state.distToFinish !== undefined) {
    return 1; // b finishes and a doesn't.
  } else if (a.state.distToCrash !== undefined) {
    if (b.state.distToCrash !== undefined) {
      // Optimize for going fast in a direction that you won't crash.
      return -(
        a.state.distToCrash * a.state.speed -
        b.state.distToCrash * b.state.speed
      );
    } else {
      return 1; // a crashes and b doesn't.
    }
  } else if (b.state.distToCrash !== undefined) {
    return -1; // b crashes and a doesn't.
  } else {
    return 0;
  }
}

export class MJLRacer1 {
  constructor(private racetrack: Racetrack) {}

  private path: Move[] | undefined;
  private nextMoveIndex: number = 0;

  update(state: { step: number, position: Point }) {
    // Handle race reset
    if (state.step === 1) {
        this.path = undefined;
        this.nextMoveIndex = 0;
    }
    if (!this.path) {
      this.path = this.computePath(state.position);
    }
    return this.path[this.nextMoveIndex++].move;
  }

  private computePath(position: Point): Move[] {
    const curState: State = {
      position,
      velocity: [0, 0],
      step: 1,
      speed: 0,
    };

    const path = this.findBestPath([], curState);
    assert(path !== undefined, "Failed to compute a path!");
    return path;
  }

  private findBestPath(movesSoFar: Move[], state: State): Move[] | undefined {
    const nextMoves = this.computeMoves(state).sort(compareMoves);
    for (const move of nextMoves) {
      if (move.state.distToFinish === 0) {
        return [...movesSoFar, move];
      } else {
        const path = this.findBestPath([...movesSoFar, move], move.state);
        if (path) {
          return path;
        }
      }
    }
    // All moves must have crashed. No path possible.
    return undefined;
  }

  private computeMoves(state: State): Move[] {
    const moves: Move[] = [];
    for (const dx of [-1, 0, 1]) {
      for (const dy of [-1, 0, 1]) {
        const velocity = add(state.velocity, [dx, dy]);
        const speed = magnitude(velocity);

        // Project forward from current position and see how far we can go before finishing / crashing.
        let distToFinish, distToCrash;
        if (speed > 0) {
          const { dist, result } = this.projectForward(
            state.position,
            velocity
          );
          if (result === Result.Crashed) {
            distToCrash = Math.max(0, dist - speed);
          } else {
            distToFinish = Math.max(0, dist - speed);
          }
        }

        // Don't include moves that have crashed or are not moving.
        if (distToCrash !== 0 && speed > 0) {
          const position = add(state.position, velocity);
          moves.push({
            move: [dx, dy],
            state: {
              position,
              velocity,
              step: state.step + 1,
              distToFinish,
              distToCrash,
              speed,
            },
          });
        }
      }
    }
    return moves;
  }

  private projectForward(
    position: Point,
    velocity: Point
  ): { dist: number; result: Result } {
    const speed = magnitude(velocity);
    assert(speed > 0, "Can't project forward with zero speed");
    const destX = position[0] + velocity[0] * PROJECT_FORWARD_DISTANCE;
    const destY = position[1] + velocity[1] * PROJECT_FORWARD_DISTANCE;
    for (const point of linePoints(
      position,
      [destX, destY],
    )) {
      if (this.racetrack.isFinishPoint(point)) {
        return {
          dist: magnitude(sub(point, position)),
          result: Result.Finished,
        };
      } else if (!this.racetrack.isPointInTrack(point)) {
        return {
          dist: magnitude(sub(point, position)),
          result: Result.Crashed,
        };
      }
    }
    fail("We didn't crash or finish. What happened?");
  }
}

function magnitude(vector: [number, number]): number {
  return Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function fail(message: string): never {
  throw new Error(message);
}

// Convert class-based racer into a static function.  It will need to detect
// when a new race begins so if can construct the racer for the possibly new
// track.

let racerInstance: MJLRacer1;

export function racer(state: CarState, _options: MoveOption[], racetrack: Racetrack) {
    if (state.step === 1) {
        state.name = 'MJL-1';
        state.author = 'mikelehen';
        racerInstance = new MJLRacer1(racetrack);
    }

  return racerInstance.update(state);
}
