import { Point } from "./points";

// Definition of a specific track
export interface Track {
    dim: Point,
    grid: number;
    startLine: [Point, Point];
    finishLine: [Point, Point];

    trackWidth: number;
    path: Point[];
}

export const U_TRACK:Track = {
    dim: [400, 400],
    grid: 20,
    startLine: [[20, 10], [20, 110]],
    finishLine: [[20, 290], [20, 390]],
    trackWidth: 100,
    path: [[20, 60], [340, 60], [340, 340], [20, 340]],
}

export const OVAL:Track = {
    dim: [800, 400],
    grid: 20,
    startLine: [[400, 10], [400, 110]],
    finishLine: [[360, 10], [360, 110]],
    trackWidth: 100,
    path: [[400, 60], [740, 60], [740, 340], [60, 340], [60, 60], [360, 60]],
}

export const BIG_OVAL:Track = {
    dim: [800, 400],
    grid: 10,
    startLine: [[400, 20], [400, 60]],
    finishLine: [[380, 20], [380, 60]],
    trackWidth: 40,
    path: [[400, 40], [760, 40], [760, 360], [40, 360], [40, 40], [380, 40]],
}