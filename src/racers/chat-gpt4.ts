import { CarState, MoveOption } from '../racetrack.js';

export { racer, racer2 };

function racer(state: CarState, options: MoveOption[]) {
    if (state.step === 1) {
        state.name = "AI-Racer";
        state.author = "GPT-4";
    }
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

  // This version was created by GPT-4 after much prompting to improve on
  // previous solutions, many of which were crashing or falling into infinite
  // loops.
  //
  // I provided the LLM with the console.log output of previous failing versions.
  // I made edit to it's version, changing the speedLimit constant from 2 to 2.5
  // to make it a little faster (3 crashes frequently).
  function racer2(state: CarState, options: MoveOption[]) {
    if (state.author === undefined) {
      state.name = "AI-Racer 2.0";
      state.author = "GPT-4"
    }

    console.log(`Position: ${state.position} velocity: ${state.velocity} crashPosition: ${state.crashPosition}`);

    const safeMoves = options.filter(option => option.status !== 'crashed');

    if (safeMoves.length === 0) {
      return options[Math.floor(Math.random() * options.length)].move;
    }

    const speedLimit = 2.5;

    const moveScores = safeMoves.map(move => {
      const newVelocity = [state.velocity[0] + move.move[0], state.velocity[1] + move.move[1]];
      const speed = Math.sqrt(newVelocity[0] * newVelocity[0] + newVelocity[1] * newVelocity[1]);
      const distanceToFinish = move.distanceToFinish;

      let score = 0;

      if (speed <= speedLimit) {
        score += 10;
      }

      if (speed > 0) {
        score += 5;
      }

      // I added this test that Chat-GPT did not have, to fix a compiler error.
      if (distanceToFinish !== undefined) {
        score += 30 / (distanceToFinish + 1);
      }

      return score;
    });

    const maxScore = Math.max(...moveScores);
    const bestMoves = safeMoves.filter((_, index) => moveScores[index] === maxScore);

    const bestMove = bestMoves[Math.floor(Math.random() * bestMoves.length)].move;

    console.log(`Best move: ${bestMove}`);
    return bestMove;
  }
