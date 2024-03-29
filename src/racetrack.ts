import { Point, linePoints, add, sub, scale, round, ceil, isZero, dot, scaleToBox,
         unit, length, id, pointFromId, neighbors, perpendicularLine } from './points.js';
import type { Track } from './tracks.js';
import { testBool, testValue, shuffle, range } from './util.js';

import carSpriteImage from './images/car-sheet.png';

export { Racetrack, movesFromPath };
export type { CarState, MoveOption, CarUpdate };

// Data used by racer, and provided to stats subscribers.
// We try not to included derived data here (like average speed)
// since it is just distanceTraveled / step (or finishTime when finihed).
interface CarState {
    name?: string;
    author?: string;
    color: string;
    status: 'running' | 'crashed' | 'finished' | 'error';
    step: number;
    position: Point;
    velocity: Point;
    crashPosition?: Point;
    topSpeed: number;
    distanceToFinish?: number;
    distanceTraveled: number;
    racePosition: number;
    // Only the needed fraction of the last step is included in the finishTime
    // to break ties between racers that finish in the same step interval.
    finishTime?: number;
    // For use by the racer to retain state across calls.
    extra?: any;
}

interface MoveOption {
    move: Point;
    position: Point;
    distanceToFinish: number | undefined;
    status: 'ok' | 'crashed' | 'finished';
}

interface Stats {
    step: number;
    status: 'running' | 'finished';
    cars: CarState[];
}

type CarUpdate = (state: CarState, options: MoveOption[], racetrack?: Racetrack) => Point;

interface DriveResult {
    status: 'ok' | 'crashed' | 'finished';
    position: Point;
}

interface Options {
    showGrid?: boolean;
}

const CAR_COLORS = [ 'orange', 'green', 'blue', 'red', 'purple' ];

// Car images stored in a sprite sheet
const CAR_SPRITE_WIDTH = 90;
const CAR_SPRITE_HEIGHT = 100;

const carSheet = new Image();
carSheet.src = carSpriteImage;

// This top level await was breaking Mocha tests.
// I think save to leave out as we are using a module import for the image
// (above).
// await carSheet.decode();

const MAX_RACE_DURATION = 500;

// UI for Playing Racetrack game
class Racetrack {
    canvas: HTMLCanvasElement;
    track: Track;
    dimGrid: Point;
    ctx: CanvasRenderingContext2D;
    path: Path2D = new Path2D();

    startLine: [Point, Point];
    finishLine: [Point, Point];

    // We dole out start positions at random for each race.
    polePositions: Point[];
    availableStarts: number[] = [];

    // Positions are all in grid units (not pixel coordinates)
    // String keys use the id() function of a Point
    finishPositions: Set<string>;
    trackPositions: Set<string> = new Set();
    // Store location and color of the car that was giving this crash position
    crashPositions: Map<string, string> = new Map();
    finishDistances: Map<string, number> = new Map();

    stepNumber = 0;
    updates: CarUpdate[] = [];
    cars: CarState[] = [];
    histories: Point[][] = [];

    statSubs: ((stats: Stats) => void)[] = [];

    // A race is in progress.
    isRunning = false;

    options: Options = {
        showGrid: true
    }

    constructor(canvas: HTMLCanvasElement, track: Track, options? : Options) {
        this.canvas = canvas;
        this.track = track;

        if (options) {
            this.setOptions(options);
        }

        this.ctx = canvas.getContext('2d')!;

        this.canvas.width = this.track.dim[0];
        this.canvas.height = this.track.dim[1];

        this.dimGrid = ceil(scale(1 / this.track.grid, this.track.dim));

        this.calculateTrackPath();

        const firstSegment = track.path[0].slice(0, 2) as [Point, Point];
        const lastSegment = track.path[track.path.length - 1].slice(-2).reverse() as [Point, Point];
        this.startLine = perpendicularLine(...firstSegment, track.trackWidth);
        this.finishLine = perpendicularLine(...lastSegment, track.trackWidth);

        const startGrid = this.pixelsToGrid(this.startLine) as [Point, Point]
        const finishGrid = this.pixelsToGrid(this.finishLine) as [Point, Point]
        this.polePositions = Array.from(this.linePoints(...startGrid));
        this.finishPositions = new Set(Array.from(this.linePoints(...finishGrid)).map(id));
        this.calculateFinishDistances();

        this.refresh();
    }

    setOptions(options: Options) {
        this.options = { ...this.options, ...options };
    }

    subscribeStats(sub: (stats: Stats) => void) {
        this.statSubs.push(sub);
    }

    getStats(): Stats {
        this.calculateRacePositions();
        return {
            step: this.stepNumber,
            status: this.isRunning ? 'running' : 'finished',
            cars: this.cars,
        };
    }

    // For tied positions, we give both cars the smaller position number
    // (for example we can have one car in 1st, and then the next 2 cars in 2nd).
    calculateRacePositions() {
        const cars = [...this.cars];

        cars.sort(cmpCars);

        // Modify CarState in place
        let bump = 0;
        for (let index = 0; index < cars.length; index++) {
            if (index > 0 && cmpCars(cars[index - 1], cars[index]) === 0) {
                bump++;
            } else {
                bump = 0;
            }
            cars[index].racePosition = index + 1 - bump;
        }

        function cmpCars(a: CarState, b: CarState): number {
            // Cars must be in the running
            let t = testBool(a, b,
                (c) => c.status === 'running' || c.status === 'finished');
            if (t !== 0) {
                return t;
            }

            t = testValue(a, b, (c) => c.distanceToFinish);
            if (t !== 0) {
                return t;
            }

            return testValue(a, b, (c) => c.finishTime);
        }
    }

    updateStatsSubs() {
        const stats = this.getStats();
        for (let sink of this.statSubs) {
            sink(stats);
        }
    }

    reset() {
        this.stepNumber = 0;
        this.isRunning = false;

        this.cars = [];
        this.histories = [];
        this.crashPositions = new Map();

        // Clear out past history and re-register all the racer's update functions.
        this.availableStarts = [];
        const updates = this.updates;
        this.updates = [];
        for (let update of updates) {
            this.race(update);
        }

        this.refresh();
        this.updateStatsSubs();
    }

    refresh() {
        this.clearStage();
        this.drawTrackPath();
        this.drawDots();
        this.drawStartFinish();
        this.drawTracks();
        this.drawCars();
    }

    drawCars() {
        let i = 0;
        for (let car of this.cars) {
            const [x, y] = scale(this.track.grid, car.position);
            this.drawCar(i, [x, y]);
            i++;
        }
    }

    drawCar(index: number, [x, y]: Point) {
        const mindex = index % CAR_COLORS.length;
        const [sx, sy] = [0, mindex * CAR_SPRITE_HEIGHT];
        const [vx, vy] = this.cars[index].velocity;
        this.ctx.save();
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.translate(x, y);
        this.ctx.rotate(-Math.PI / 2 + Math.atan2(vy, vx));
        this.ctx.drawImage(carSheet, sx, sy, CAR_SPRITE_WIDTH, CAR_SPRITE_HEIGHT,
                           -this.track.grid, -2 * this.track.grid, 2 * this.track.grid, 2 * this.track.grid);
        this.ctx.restore();
    }

    clearStage() {
        this.ctx.fillStyle = "darkgreen";
        this.ctx.fillRect(0, 0, this.track.dim[0], this.track.dim[1]);
    }

    calculateTrackPath() {
        // Loop through each possibly disjoint path.
        for (let part of this.track.path) {
            this.path.moveTo(...part[0]);
            for (let i = 1; i < part.length; i++) {
                this.path.lineTo(...part[i]);
            }
        }

        // Cache the track positions
        this.ctx.lineWidth = this.track.trackWidth;
        this.ctx.lineCap = 'butt';
        this.ctx.lineJoin = 'round';
        for (let point of this.gridPoints()) {
            const [x, y] = scale(this.track.grid, point);
            if (this.ctx.isPointInStroke(this.path, x, y)) {
                this.trackPositions.add(id(point));
            }
        }
    }

    calculateFinishDistances() {
        let distance = 0;
        let currentPositions = new Set(this.finishPositions);

        for (let pos of currentPositions) {
            this.finishDistances.set(pos, distance);
        }

        while (currentPositions.size > 0) {
            distance += 1;
            const nextPositions = new Set<string>();
            for (let pos of currentPositions) {
                const point = pointFromId(pos);
                for (let neighbor of neighbors(point)) {
                    const posN = id(neighbor);
                    if (this.trackPositions.has(posN) && !this.finishDistances.has(posN)) {
                        this.finishDistances.set(posN, distance);
                        nextPositions.add(posN);
                    }
                }
            }
            currentPositions = nextPositions;
        }
    }

    drawTrackPath() {
        this.ctx.lineWidth = this.track.trackWidth;
        this.ctx.strokeStyle = 'lightgray';
        this.ctx.lineCap = 'butt';
        this.ctx.lineJoin = 'round';
        this.ctx.stroke(this.path);
    }

    drawStartFinish() {
        this.ctx.lineWidth = 5;
        this.ctx.strokeStyle = '#00e000';
        this.ctx.beginPath();
        this.ctx.moveTo(...this.startLine[0]);
        this.ctx.lineTo(...this.startLine[1]);
        this.ctx.stroke();

        this.ctx.strokeStyle = 'red';
        this.ctx.beginPath();
        this.ctx.moveTo(...this.finishLine[0]);
        this.ctx.lineTo(...this.finishLine[1]);
        this.ctx.stroke();

        for (let point of this.linePoints(...this.startLine)) {
            this.dot(point[0], point[1], 'green');
        }

        for (let point of this.linePoints(...this.finishLine)) {
            this.dot(point[0], point[1], 'darkred');
        }
    }

    drawDots() {
        if (this.options.showGrid) {
            for (let point of this.gridPoints()) {
                if (this.isPointInTrack(point)) {
                    this.gridDot(point, 'white');
                }

                const dist = this.finishDistances.get(id(point));
                if (dist !== undefined && (this.track.grid >= 20 || dist % 5 === 0)) {
                    this.gridText(point, dist.toString());
                }
            }
        }

        for (let [pointId, color] of this.crashPositions.entries()) {
            this.gridText(pointFromId(pointId), 'X', color, '800 12pt sans-serif');
        }
    }

    *gridPoints(): Generator<Point> {
        for (let y = 1; y < this.dimGrid[1]; y++) {
            for (let x = 1; x < this.dimGrid[0]; x++) {
                yield [x, y];
            }
        }
    }

    isPointInTrack(point: Point): boolean {
        return this.trackPositions.has(id(point));
    }

    dot(x: number, y: number, color: string) {
        const radius = this.track.grid / 4 + 1;
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, radius, radius, 0, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    gridDot(point: Point, color: string) {
        const [x, y] = scale(this.track.grid, point);
        this.dot(x, y, color);
    }

    gridText(point: Point, text: string, color = 'black', font='8pt sans-serif') {
        this.ctx.fillStyle = color;
        this.ctx.font = font;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        const [x, y] = scale(this.track.grid, point);
        this.ctx.fillText(text, x, y + 1);
    }

    // Return grid points that are inside the track
    *linePoints(start: Point, end: Point): Generator<Point> {
        const points = linePoints(start, end);
        for (let point of points) {
            if (this.isPointInTrack(point)) {
                yield point;
            }
        }
    }

    pixelsToGrid(points: Point[]): Point[] {
        return points.map((p) => round(scale(1 / this.track.grid, p)));
    }

    gridToPixels(points: Point[]): Point[] {
        return points.map((p) => scale(this.track.grid, p));
    }

    driveLine(start: Point, end: Point): DriveResult {
        const points = linePoints(start, end);
        for (let point of points) {
            if (this.isFinishPoint(point)) {
                return {
                    status: 'finished',
                    position: point,
                };
            }
            if (!this.isPointInTrack(point)) {
                return {
                    status: 'crashed',
                    position: point,
                };
            }
        }
        return {
            status: 'ok',
            position: end,
        };
    }

    moveOptions(car: CarState): MoveOption[] {
        const options: MoveOption[] = [];
        const centerPoint = add(car.position, car.velocity);

        const self = this;
        pushOption([0, 0], centerPoint);

        for (let point of neighbors(centerPoint)) {
            const move = sub(point, centerPoint);
            pushOption(move, point);
        }

        return options;

        function pushOption(move: Point, endPoint: Point) {
            const result = self.driveLine(car.position, endPoint);
            const position = result.position;
            let distanceToFinish = self.distanceToFinish(position);
            options.push({
                move,
                status: result.status,
                position,
                distanceToFinish,
            });
        }
    }

    isFinishPoint(point: Point): boolean {
        return this.finishPositions.has(id(point));
    }

    distanceToFinish(point: Point): number {
        return this.finishDistances.get(id(point))!;
    }

    pickStartPosition(): Point {
        if (this.availableStarts.length === 0) {
            this.availableStarts = shuffle(Array.from(range(this.polePositions.length)));
        }
        const index = this.availableStarts.pop()!;
        return this.polePositions[index];
    }

    race(update: CarUpdate) {
        this.updates.push(update);
        const start = this.pickStartPosition();

        this.cars.push({
            name: `Car ${this.cars.length + 1}`,
            color: CAR_COLORS[this.cars.length % CAR_COLORS.length],
            status: 'running',
            step: 0,
            position: start,
            velocity: [0, 0],
            topSpeed: 0,
            distanceTraveled: 0,
            racePosition: 1,
            distanceToFinish: this.distanceToFinish(start),
        });
        this.histories.push([start]);
        this.refresh();
    }

    // Step through all cars and update positions
    step() {
        if (this.isRaceDone()) {
            return;
        }
        this.stepNumber += 1;
        for (let i = 0; i < this.cars.length; i++) {
            const car = this.cars[i];

            // Stop calling racer callback after crash, finish, or error
            if (car.status !== 'running') {
                continue;
            }

            car.step = this.stepNumber;
            const update = this.updates[i];
            let delta: Point;
            try {
                delta = update(car, this.moveOptions(car), this);
            } catch (e) {
                console.error(`Car ${car.name}: ${e}`);
                car.status = 'error';
                continue;
            }

            if (!delta) {
                console.warn(`Car ${car.name} is not responding.`);
                delta = [0, 0];
            } else if (!valid(delta[0]) || !valid(delta[1])) {
                console.error(`Car ${car.name}: Invalid move: ${delta} at ${car.position}`);
                car.status = 'error';
                continue;
            }

            car.crashPosition = undefined;
            car.velocity = add(car.velocity, delta);

            const speed = length(car.velocity);
            if (speed > car.topSpeed) {
                car.topSpeed = speed;
            }

            const endPosition = add(car.position, car.velocity);
            const result = this.driveLine(car.position, endPosition);
            const segmentLength = length(sub(result.position, car.position))
            car.distanceTraveled += segmentLength;
            car.position = result.position;
            car.distanceToFinish = this.finishDistances.get(id(car.position));

            this.histories[i].push(car.position);
            if (result.status !== 'ok') {
                car.status = result.status;
                if (result.status === 'finished') {
                    const fraction = segmentLength / length(car.velocity);
                    car.finishTime = (this.stepNumber - 1) + fraction;
                }
            } else if (!isZero(car.velocity)) {
                // Imagine the car coasts at it's current velocity until it
                // leaves the track.
                const v = scaleToBox(car.velocity, this.dimGrid);
                const moveToward = add(car.position, v);
                // With a big jump - we are guaranteed to run off the track.
                // But we might be crossing the finish line - so check that first.
                const result = this.driveLine(car.position, moveToward);
                if (result.status === 'crashed') {
                    car.crashPosition = result.position;
                    this.crashPositions.set(id(result.position), car.color);
                }
            }
        }

        this.refresh();
        if (this.isRaceDone()) {
            this.isRunning = false;
        }

        this.updateStatsSubs();

        function valid(d: number): boolean {
            return [-1, 0, 1].includes(d);
        }
    }

    run(delay = 0) : Promise<void> {
        const self = this;
        let resolver: () => void;

        this.isRunning = true;

        const whenDone =  new Promise<void>((resolve) => {
            resolver = resolve;
        });

        // Report on all the starting positions.
        self.updateStatsSubs();

        nextFrame();

        return whenDone;

        function nextFrame() {
            if (!self.isRunning) {
                resolver();
                return;
            }

            self.step();

            if (!self.isRunning) {
                resolver();
                return;
            }

            if (delay) {
                setTimeout(() => {
                    requestAnimationFrame(nextFrame);
                }, delay);
            } else {
                requestAnimationFrame(nextFrame);
            }
        }
    }

    isRaceDone(): boolean {
        if (this.stepNumber >= MAX_RACE_DURATION) {
            console.warn("Race timed out.");
            return true;
        }

        for (let car of this.cars) {
            if (car.status === 'running') {
                return false;
            }
        }
        return true;
    }

    drawTracks() {
        for (let i = 0; i < this.cars.length; i++) {
            const car = this.cars[i];
            this.drawGridTrail(this.histories[i], car.color);

            if (car.status === 'crashed') {
                this.gridDot(car.position, 'yellow');
            }

            if (car.status === 'error') {
                this.gridDot(car.position, 'red');
            }
        }
    }

    drawGridTrail(trail: Point[], color: string) {
        type Dash = number[];
        const SOLID: Dash = [];
        const WEAK_DASHED: Dash = [2, 6];
        const STRONG_DASHED: Dash = [6, 2];

        const moves = movesFromPath(trail);
        const pixels = this.gridToPixels(trail);

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;

        this.ctx.save();

        for (let i = 1; i < pixels.length; i++) {
            const v = sub(trail[i], trail[i - 1]);
            const deltaV = dot(moves[i - 1], unit(v));

            let dash = STRONG_DASHED;
            if (deltaV >= 0.5) {
                dash = SOLID;
            } else if (deltaV <= -0.5) {
                dash = WEAK_DASHED;
            }

            this.ctx.setLineDash(dash);
            this.ctx.beginPath();
            this.ctx.moveTo(...pixels[i - 1]);
            this.ctx.lineTo(...pixels[i]);
            this.ctx.stroke();
        }

        this.ctx.restore();

        for (let p of trail) {
            this.gridDot(p, color);
        }
    }
}

function movesFromPath(path: Point[]): Point[] {
    const result: Point[] = [];
    let vPrev: Point = [0, 0];

    for (let i = 1; i < path.length; i++) {
        const vCurrent = sub(path[i], path[i - 1]);
        result.push(sub(vCurrent, vPrev));
        vPrev = vCurrent;
    }

    return result;
}
