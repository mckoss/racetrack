export { Racetrack };

const TRACK = [
    20, 50,
    350, 50,
    350, 350,
    20, 350
];

class Racetrack {
    canvas: HTMLCanvasElement;
    width: number;
    height: number;
    ctx: CanvasRenderingContext2D;
    path: Path2D;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.ctx.fillStyle = "darkgreen";
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.lineWidth = 75;
        this.ctx.strokeStyle = 'lightgray';
        this.ctx.lineCap = 'butt';
        this.ctx.lineJoin = 'round';

        this.path = new Path2D();

        this.path.moveTo(TRACK[0], TRACK[1]);
        for (let i = 2; i < TRACK.length; i += 2) {
            this.path.lineTo(TRACK[i], TRACK[i + 1]);
        }

        this.ctx.stroke(this.path);
        this.drawDots();
    }

    drawDots() {
        for (let y = 15; y < this.height; y += 20) {
            for (let x = 15; x < this.width; x += 20) {
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
