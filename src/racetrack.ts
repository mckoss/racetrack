import { Point, linePoints, add, sub, scale, round, ceil, id, pointFromId, neighbors } from './points.js';
import { Track, U_TRACK, OVAL, BIG_OVAL } from './tracks.js';
export { Racetrack, U_TRACK, OVAL, BIG_OVAL };

interface CarState {
    status: 'running' | 'crashed' | 'finished' | 'error';
    step: number;
    position: Point;
    velocity: Point;
}

interface MoveOption {
    move: Point;
    position: Point;
    distanceToFinish: number | undefined;
    status: 'ok' | 'crashed' | 'finished';
}

type CarUpdate = (state: CarState, options: MoveOption[]) => Point;

interface DriveResult {
    status: 'ok' | 'crashed' | 'finished';
    position: Point;
}

const CAR_COLORS = ['red', 'blue', 'green', 'orange', 'purple', 'pink', 'brown', 'black', 'white'];

// UI for Playing Racetrack game
class Racetrack {
    canvas: HTMLCanvasElement;
    track: Track;
    ctx: CanvasRenderingContext2D;
    path: Path2D = new Path2D();
    polePositions: Generator<Point>;

    // Positions are all in grid units (not pixel coordinates)
    // String keys use the id() function of a Point
    finishPositions: Set<string>;
    trackPositions: Set<string> = new Set();
    finishDistances: Map<string, number> = new Map();

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

        const startGrid = this.pixelsToGrid(this.track.startLine) as [Point, Point]
        const finishGrid = this.pixelsToGrid(this.track.finishLine) as [Point, Point]
        this.polePositions = this.linePoints(...startGrid);
        this.finishPositions = new Set(Array.from(this.linePoints(...finishGrid)).map(id));
        this.calculateFinishDistances();

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
            const [x, y] = scale(this.track.grid, point);
            this.dot(x, y, this.isPointInTrack(point) ? 'white' : 'red');
        }

        // Add distances to reach the finish line to the grid.
        if (this.track.grid >= 20) {
            this.ctx.fillStyle = 'black';
            this.ctx.font = '12px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            for (let point of this.gridPoints()) {
                const [x, y] = scale(this.track.grid, point);
                const pos = id(point);
                if (this.finishDistances.has(pos)) {
                    this.ctx.fillText(this.finishDistances.get(pos)!.toString(), x, y);
                }
            }
        }
    }

    *gridPoints(): Generator<Point> {
        let [xMax, yMax] = ceil(scale(1 / this.track.grid, this.track.dim));
        for (let y = 1; y < yMax; y++) {
            for (let x = 1; x < xMax; x++) {
                yield [x, y];
            }
        }
    }

    isPointInTrack(point: Point): boolean {
        return this.trackPositions.has(id(point));
    }

    dot(x: number, y: number, color: string) {
        const radius = this.track.grid / 4;
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, radius, radius, 0, 0, 2 * Math.PI);
        this.ctx.fill();
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
            let distanceToFinish = self.finishDistances.get(id(position))!;
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
            let delta = update(car, this.moveOptions(car));
            if (!delta) {
                console.warn(`Car ${i} is not responding.`);
                delta = [0, 0];
            } else if (!valid(delta[0]) || !valid(delta[1])) {
                console.error(`Invalid acceleration from car ${i}: ${delta}`);
                car.status = 'error';
                continue;
            }
            car.velocity = add(car.velocity, delta);
            const startPosition = car.position;
            const endPosition = add(startPosition, car.velocity);
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
            const history = this.gridToPixels(this.histories[i])

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

            const [x, y] = scale(this.track.grid, car.position);
            if (car.status === 'crashed') {
                this.dot(x, y, 'yellow');
            }

            if (car.status === 'error') {
                this.dot(x, y, 'red');
            }
        }
    }
}
