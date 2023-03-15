import { CarState, MoveOption } from '../racetrack.js';

export { racer };

function racer(state: CarState, options: MoveOption[]) {
    // Filter out options that lead to crashing
    const safeOptions = options.filter(option => option.status !== 'crashed');

    // If there are no safe options, return the first option (will crash, but no choice)
    if (safeOptions.length === 0) {
      return options[0].move;
    }

    // Sort safe options by distance to finish, in ascending order
    safeOptions.sort((a, b) => a.distanceToFinish! - b.distanceToFinish!);

    // Calculate the current speed of the car
    const speed = Math.sqrt(Math.pow(state.velocity[0], 2) + Math.pow(state.velocity[1], 2));

    // Select an option based on distance to finish and speed
    let bestOption;
    if (speed >= 2) {
      // If the car is moving fast, prioritize the option with the shortest distance to finish
      bestOption = safeOptions[0];
    } else {
      // If the car is moving slow, prioritize the option that increases the car's speed
      bestOption = safeOptions.reduce((best, option) => {
        const optionSpeed = Math.sqrt(Math.pow(option.move[0], 2) + Math.pow(option.move[1], 2));
        const bestSpeed = Math.sqrt(Math.pow(best.move[0], 2) + Math.pow(best.move[1], 2));
        return optionSpeed > bestSpeed ? option : best;
      });
    }

    return bestOption.move;
  }
