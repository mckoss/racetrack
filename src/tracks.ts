import { Point } from "./points";

export type { Track };

export { U_TRACK, OVAL, BIG_OVAL };

// Definition of a specific track
interface Track {
    name: string;
    dim: Point,
    grid: number;

    trackWidth: number;
    path: Point[];
}

const U_TRACK:Track = {
    name: "U-Track",
    dim: [400, 400],
    grid: 20,
    trackWidth: 100,
    path: [[20, 60], [340, 60], [340, 340], [20, 340]],
}

const OVAL:Track = {
    name: "Oval",
    dim: [800, 400],
    grid: 20,
    trackWidth: 100,
    path: [[400, 60], [740, 60], [740, 340], [60, 340], [60, 60], [360, 60]],
}

const BIG_OVAL:Track = {
    name: "Big Oval",
    dim: [800, 400],
    grid: 10,
    trackWidth: 70,
    path: [[400, 40], [760, 40], [760, 360], [40, 360], [40, 40], [380, 40]],
}
