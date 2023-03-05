export { Racetrack, U_TRACK };

// x, y coordinates
type Point = [number, number];

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

// UI for Playing Racetrack game
class Racetrack {
    canvas: HTMLCanvasElement;
    track: Track;
    ctx: CanvasRenderingContext2D;
    path: Path2D;

    constructor(canvas: HTMLCanvasElement, track: Track) {
        this.canvas = canvas;
        this.track = track;
        this.ctx = canvas.getContext('2d')!;

        this.canvas.width = this.track.dim[0];
        this.canvas.height = this.track.dim[1];

        this.clearStage();
        this.drawTrackPath();
        this.drawStartFinish();
        this.drawDots();
    }

    clearStage() {
        this.ctx.fillStyle = "darkgreen";
        this.ctx.fillRect(0, 0, this.track.dim[0], this.track.dim[1]);
    }

    drawTrackPath() {
        this.ctx.lineWidth = this.track.trackWidth;
        this.ctx.strokeStyle = 'lightgray';
        this.ctx.lineCap = 'butt';
        this.ctx.lineJoin = 'round';

        this.path = new Path2D();

        this.path.moveTo(this.track.path[0][0], this.track.path[0][1]);
        for (let i = 1; i < this.track.path.length; i++) {
            this.path.lineTo(this.track.path[i][0], this.track.path[i][1]);
        }

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
    }

    drawDots() {
        for (let y = this.track.grid; y < this.track.dim[1]; y += this.track.grid) {
            for (let x = this.track.grid; x < this.track.dim[0]; x += this.track.grid) {
                const inPath = this.ctx.isPointInStroke(this.path, x, y);
                this.dot(x, y, inPath ? 'white' : 'red');
            }
        }
    }

    dot(x: number, y: number, color: string) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, 4, 4, 0, 0, 2 * Math.PI);
        this.ctx.fill();
    }
}
