export { Racetrack, U_TRACK };

// x, y coordinates
type Point = [number, number];

// Definition of a specific track
interface Track {
    dim: Point,
    startLine: [Point, Point];
    finishLine: [Point, Point];

    trackWidth: number;
    path: Point[];
}

const U_TRACK:Track = {
    dim: [400, 400],
    startLine: [[20, 10], [10, 85]],
    finishLine: [[10, 300], [10, 390]],
    trackWidth: 75,
    path: [[20, 50], [350, 50], [350, 350], [20, 350]],
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

        this.canvas.width = this.track.dim[0];
        this.canvas.height = this.track.dim[1];

        this.ctx = canvas.getContext('2d')!;
        this.ctx.fillStyle = "darkgreen";
        this.ctx.fillRect(0, 0, this.track.dim[0], this.track.dim[1]);

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
        this.drawDots();
    }

    drawDots() {
        for (let y = 15; y < this.track.dim[1]; y += 20) {
            for (let x = 15; x < this.track.dim[0]; x += 20) {
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
