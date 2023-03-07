import { Point, linePoints, add, scale } from './points.js';
export { Racetrack, U_TRACK };

interface CarState {
    position: Point;
    velocity: Point;
}

type CarUpdate = (state: CarState) => Point;

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

const CAR_COLORS = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'black', 'white'];

// UI for Playing Racetrack game
class Racetrack {
    canvas: HTMLCanvasElement;
    track: Track;
    ctx: CanvasRenderingContext2D;
    path: Path2D = new Path2D();
    polePositions: Generator<Point>;

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
        this.ctx.lineWidth = this.track.trackWidth;
        const [x, y] = point;
        return this.ctx.isPointInStroke(this.path, x, y);
    }

    dot(x: number, y: number, color: string) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, 4, 4, 0, 0, 2 * Math.PI);
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

    race(update: CarUpdate) {
        this.updates.push(update);
        const start = this.polePositions.next().value;
        this.cars.push({
            position: start,
            velocity: [0, 0],
        });
        this.histories.push([start]);
    }

    // Step through all cars and update positions
    step() {
        for (let i = 0; i < this.cars.length; i++) {
            const car = this.cars[i];
            const update = this.updates[i];
            const delta = update(car);
            car.velocity = add(car.velocity, delta);
            const v = scale(this.track.grid, car.velocity);
            const startPosition = car.position;
            car.position = add(startPosition, v);
            this.histories[i].push(car.position);
            console.log(`Car ${i} moved from ${startPosition} to ${car.position} with velocity ${car.velocity}`);
            console.log(this.histories);
            this.drawTracks();
        }
    }

    drawTracks() {
        for (let i = 0; i < this.cars.length; i++) {
            const history = this.histories[i];

            this.ctx.strokeStyle = CAR_COLORS[i];
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(...history[0]);
            for (let i = 1; i < history.length; i++) {
                this.ctx.lineTo(...history[i]);
            }
            this.ctx.stroke();

            for (let p of history) {
                this.dot(...p, CAR_COLORS[i]);
            }
        }
    }
}
