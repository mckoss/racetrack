# Martin Gardner Racetrack Game

The code here allows you to simulate a game of
[Racetrack](https://en.wikipedia.org/wiki/Racetrack_(game)) with one or more
automated players.

# Rules

The game presents you with a racetrack (path) overlaid on a grid of points. The
race cars begin on the starting line, and attempt to reach the finish line
(first).

As a driver, the only control you have is to adjust your current acceleration in
the *x* and *y* directions.  In this implementation, you can choose any
combination of -1, 0, and +1 acceleration for each of *x* and *y*.

At each step, the simulator will calculate your new position and
velocity on the grid, and ask you to choose your next move.  Eventually, you
will either crash (leave the track) or finish (cross the finish line).

*If you want to play a similar simulator online manually, check out [Vector
Racer](http://www.harmmade.com/vectorracer/) - not affiliated with this
project.*

# CodePen Simulation

The easiest way to use this repo is to fork a copy of [this
CodePen](https://codepen.io/mckoss/pen/RwYVmGO).

![Sample Track](docs/sample-track.png)

Here you can see a number of different strategies racing against each other
(only one of which is succeeding).

# How to Program a Racer

If you use CodePen, there is only minimal boilerplate required to program a race.

```
// Import the racetrack library (and sample track) into CodePen
import { Racetrack, U_TRACK } from 'https://mckoss.com/racetrack/scripts/racetrack.js';

// Attach the a new Racetrack simulation to a <canvas> element
const rt = new Racetrack(document.getElementById('stage'), U_TRACK);

// This is where you register your racer.  The callback function
// will be called once for each step of the race.
rt.race((state, options) => {
  // Return a move as an [x, y] array.
  // This strategy just keeps on accelerating in the x direction.
  return [1, 0];
});

// Start the race
rt.run();
```

You are provided with two pieces of information at each step:

The car state:

```
{
    status: 'running' | 'crashed' | 'finished' | 'error';
    step: number;
    position: Point;
    velocity: Point;
    crashPosition?: Point;
}
```
A ```Point``` is just a two-element array with an ```[x, y]``` coordinate.

```status``` is a string with one of 4 values.

```step``` starts and 1 and increments by one for each step of the race.

```position``` is your car's current ```[x, y]``` coordinate on the racetrack.
Units here are in grid coordinates (not pixels).

```velocity``` is is your car's current volocity.  Note that the units are
relative to the grid points, not to pixels.

```crashPosition``` is the point your car will go off the track if you
just coast at your current speed.  If undefined, you car is either not
moving, or is coasting toward the finish line.

The second paramater of the racer callback function:

```options``` is an array of the 9 distinct moves you could make and information
about the outcomes.

```
[
    {
        move: Point;
        position: Point;
        distanceToFinish: number | undefined;
        status: 'ok' | 'crashed' | 'finished';
    },
    ...
]
```

For each ```option``` you see what the ```move``` needed to get there (one of
[0, 0], [-1, -1], [-1, 0], ... etc.)).

The ```position``` you will end up.

The ```distanceToFinish``` (the total number of grid points to the finish line,
taking the shortest path).  These are the number displayed in the grid, above.

And a ```status``` about whether that move will make you crash or cross the
finish line.

# Designing your own Tracks

Tracks are implemented as a single path around a grid.

```
interface Track {
    name: string,
    dim: Point,
    grid: number;
    startLine: [Point, Point];
    finishLine: [Point, Point];

    trackWidth: number;
    path: Point[];
}
```

```dim``` Dimensions of the canvas element (in pixels).

```grid``` The spacing of the grid (number of pixels between grid points).

```startline``` The pixel coordinates of a line segment defining the starting
line.

```finishLine``` Same for the finishing line.

```trackWidth``` How wide the track path is in pixels.

```path``` A sequence of points defining the centerline of the track (typically
drawns from the starting line to the finishing line).

The example ```U_TRACK``` is defined as:

```
const U_TRACK:Track = {
    dim: [400, 400],
    grid: 20,
    startLine: [[20, 10], [20, 110]],
    finishLine: [[20, 290], [20, 390]],
    trackWidth: 100,
    path: [[20, 60], [340, 60], [340, 340], [20, 340]],
}
```

# Hosted Deployment

The currently deployed version of the project is at:

- https://mckoss.com/racetrack - Home page
- https://mckoss.com/racetrack/test/ - Unit test runner
- https://mckoss.com/racetrack/scripts/racetrack.js - ES6 Module for library

# Using this Repo

Tools used:

- **npm** - Dependency management
- **Typescript** - Source code type checking
- **[mocha](https://mochajs.org/) and chai** - Testing framework
- **[vite](https://vitejs.dev/)** - Code bundling and development mode.
- **[puppeteer](https://pptr.dev/)** - Headless browser for testing.

To use this repo, you should just be able to start with a relatively recent
version of
[npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) on
your machine.

```
$ npm install      # Install all dependencies.
$ npm run dev      # Run a local development server
$ npm run build    # Build the production and testing version of the code
$ npm test         # Run all the unit tests.
```

The (vite) development server will start a local web server, and assemble the
code supporting live reloading whenever and code is modified; giving you a very
quick turn-around time for edit-debug loop.

Command line tests require that you build the production code first (at present).

```
$ npm run build && npm test
```

You can also run all the tests on a browser interactively via the web interface
at ```http://localhost:5173/test/``` in dev mode.

The repo also runs a full build and test on github for every PR and deployment.

## Repro Organization

The files in the repo are organized into the following files and folders:

- ```/index.html``` - The home page rendering Racetrack.
- ```/tools``` - Location of bash scripts using for building and testing.
- ```/src``` - Source code files (in Typescript).
- ```/src/tests``` - All unit tests files.
- ```/test``` - Static version of mocha-based browser test.
- ```/docs``` - Markdown and images to document this repo.
- ```/dist``` - (Build product) Production version of code goes here.
- ```/public/scripts``` - (Build product) Raw Javascript library (ES6) modules from
  ```tsc``` command.
