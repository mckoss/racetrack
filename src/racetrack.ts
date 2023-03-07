import { Point, linePoints, add, scale, id } from './points.js';
export { Racetrack, U_TRACK };

interface CarState {
    status: 'running' | 'crashed' | 'finished' | 'error';
    step: number;
    position: Point;
    velocity: Point;
}

type CarUpdate = (state: CarState) => Point;

interface DriveResult {
    status: 'ok' | 'crashed' | 'finished';
    position: Point;
}

// Definition of a specific track
interface Track {
    dim: Point,
    grid: number;
    startLine: [Point, Point];
    finishLine: [Point, Point];

    trackWidth: number;
    path: Point[];
}

const U_TRACK:Track = {
    dim: [400, 400],
    grid: 20,
    startLine: [[20, 10], [20, 110]],
    finishLine: [[20, 290], [20, 390]],
    trackWidth: 100,
    path: [[20, 60], [340, 60], [340, 340], [20, 340]],
}

const CAR_COLORS = ['red', 'blue', 'green', 'orange', 'purple', 'pink', 'brown', 'black', 'white'];

// UI for Playing Racetrack game
class Racetrack {
    canvas: HTMLCanvasElement;
    track: Track;
    ctx: CanvasRenderingContext2D;
    path: Path2D = new Path2D();
    polePositions: Generator<Point>;
    finishPositions: Set<string>;
    trackPositions: Set<string> = new Set();
    stepNumber = 0;

    updates: CarUpdate[] = [];
    cars: CarState[] = [];
    histories: Point[][] = [];

    constructor(canvas: HTMLCanvasElement, track: Track) {
        this.canvas = canvas;
        this.track = track;
        this.ctx = canvas.getContext('2d')!;

        this.canvas.width = this.track.dim[0];
        this.canvas.height = this.track.dim[1];

        this.calculateTrackPath();

        this.polePositions = this.linePoints(...this.track.startLine);
        this.finishPositions = new Set(Array.from(this.linePoints(...this.track.finishLine)).map(id));

        this.clearStage();
        this.drawTrackPath();
        this.drawDots();
        this.drawStartFinish();
    }

    clearStage() {
        this.ctx.fillStyle = "darkgreen";
        this.ctx.fillRect(0, 0, this.track.dim[0], this.track.dim[1]);
    }

    calculateTrackPath() {
        this.path.moveTo(this.track.path[0][0], this.track.path[0][1]);
        for (let i = 1; i < this.track.path.length; i++) {
            this.path.lineTo(this.track.path[i][0], this.track.path[i][1]);
        }

        // Cache the track positions
        this.ctx.lineWidth = this.track.trackWidth;
        for (let point of this.gridPoints()) {
            const [x, y] = point;
            if (this.ctx.isPointInStroke(this.path, x, y)) {
                this.trackPositions.add(id(point));
            }
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
        this.ctx.moveTo(this.track.startLine[0][0], this.track.startLine[0][1]);
        this.ctx.lineTo(this.track.startLine[1][0], this.track.startLine[1][1]);
        this.ctx.stroke();

        this.ctx.strokeStyle = 'red';
        this.ctx.beginPath();
        this.ctx.moveTo(this.track.finishLine[0][0], this.track.finishLine[0][1]);
        this.ctx.lineTo(this.track.finishLine[1][0], this.track.finishLine[1][1]);
        this.ctx.stroke();

        for (let point of this.linePoints(...this.track.startLine)) {
            this.dot(point[0], point[1], 'green');
        }

        for (let point of this.linePoints(...this.track.finishLine)) {
            this.dot(point[0], point[1], 'darkred');
        }
    }

    drawDots() {
        for (let point of this.gridPoints()) {
            const [x, y] = point;
            this.dot(x, y, this.isPointInTrack(point) ? 'white' : 'red');
        }
    }

    *gridPoints(): Generator<Point> {
        for (let y = this.track.grid; y < this.track.dim[1]; y += this.track.grid) {
            for (let x = this.track.grid; x < this.track.dim[0]; x += this.track.grid) {
                yield [x, y];
            }
        }
    }

    isPointInTrack(point: Point): boolean {
        return this.trackPositions.has(id(point));
    }

    dot(x: number, y: number, color: string) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, 5, 5, 0, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    // Return grid points that are inside the track
    *linePoints(start: Point, end: Point): Generator<Point> {
        const points = linePoints(start, end, this.track.grid);
        for (let point of points) {
            if (this.isPointInTrack(point)) {
                yield point;
            }
        }
    }

    driveLine(start: Point, end: Point): DriveResult {
        const points = linePoints(start, end, this.track.grid);
        for (let point of points) {
            if (this.idFinishPoint(point)) {
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

    idFinishPoint(point: Point): boolean {
        return this.finishPositions.has(id(point));
    }

    race(update: CarUpdate) {
        this.updates.push(update);
        const start = this.polePositions.next().value;
        if (!start) {
            console.error("Ran out of starting positions.");
            this.cars.push({
                status: 'error',
                step: 0,
                position: [0, 0],
                velocity: [0, 0],
            });
            this.histories.push([]);
            return;
        }

        this.cars.push({
            status: 'running',
            step: 0,
            position: start,
            velocity: [0, 0],
        });
        this.histories.push([start]);
    }

    // Step through all cars and update positions
    step() {
        this.stepNumber += 1;
        for (let i = 0; i < this.cars.length; i++) {
            const car = this.cars[i];
            if (car.status !== 'running') {
                continue;
            }
            car.step = this.stepNumber;
            const update = this.updates[i];
            let delta = update(car);
            if (!delta) {
                console.warn(`Car ${i} is not responding.`);
                delta = [0, 0];
            } else if (!valid(delta[0]) || !valid(delta[1])) {
                console.error(`Invalid acceleration from car ${i}: ${delta}`);
                car.status = 'error';
                continue;
            }
            car.velocity = add(car.velocity, delta);
            const v = scale(this.track.grid, car.velocity);
            const startPosition = car.position;
            const endPosition = add(startPosition, v);
            const result = this.driveLine(startPosition, endPosition);
            car.position = result.position;
            this.histories[i].push(car.position);
            if (result.status !== 'ok') {
                car.status = result.status;
            }
        }

        this.drawTracks();

        function valid(d: number): boolean {
            return [-1, 0, 1].includes(d);
        }
    }

    run() {
        while (!this.isDone()) {
            this.step();
        }
        console.log(`Race finished in ${this.stepNumber} steps.`);
    }

    isDone(): boolean {
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
            const history = this.histories[i];

            this.ctx.strokeStyle = CAR_COLORS[i];
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(...history[0]);
            for (let i = 1; i < history.length; i++) {
                this.ctx.lineTo(...history[i]);
            }
            this.ctx.stroke();

            for (let p of history) {
                this.dot(...p, CAR_COLORS[i]);
            }

            if (car.status === 'crashed') {
                this.dot(...car.position, 'yellow');
            }

            if (car.status === 'error') {
                this.dot(...car.position, 'red');
            }
        }
    }
}
