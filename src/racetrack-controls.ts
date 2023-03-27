import { ButtonBar, Element } from "./button-bar";

import { Racetrack, CarUpdate } from "./racetrack";
import type { Track } from "./tracks";

export { RacetrackControls };

class RacetrackControls {
    canvas: HTMLCanvasElement;
    rt?: Racetrack;
    tracks: Track[];
    racers: CarUpdate[];
    uiElements: Element[];

    constructor(parent: HTMLElement, canvas: HTMLCanvasElement, tracks: Track[], racers: CarUpdate[]) {
        this.canvas = canvas;
        this.tracks = tracks;
        this.racers = racers;
        this.attachTrack(tracks[0]);

        this.uiElements = [
            { type: 'choice',
              label: "Racetrack",
              value: tracks[0].name,
              choices: tracks.map(t => t.name),
              action: (name) => {
                this.attachTrack(tracks.find(t => t.name === name)!);
              }
            },
            { label: "Reset", action: () => this.rt!.reset() },
            {
                label: "Step", action: () => {
                    this.rt!.isRunning = false;
                    this.rt!.step();
                }
            },
            { label: "Run", action: () => this.rt!.run(100) },
            { type: "checkbox",
              label: "Show Grid",
              value: false,
              action: (checked) => {
                this.rt!.setOptions({ showGrid: checked});
                this.rt!.refresh();
              }
             },
        ];

        const buttonBar = new ButtonBar(this.uiElements);
        parent.appendChild(buttonBar.getElement());
    }

    attachTrack(track: Track) {
        // Stop race in progress.
        if (this.rt) {
            this.rt.reset();
        }
        this.rt = new Racetrack(this.canvas, track, { showGrid: false });
        for (const racer of this.racers) {
            this.rt.race(racer);
        }
    }
}
