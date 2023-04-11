import { ButtonBar, Element } from "./button-bar";
import { Racetrack, CarUpdate, CarState } from "./racetrack";
import type { Track } from "./tracks";
import { RacerStats } from "./racer-stats";

export { RacetrackControls };

interface RacerInfo {
    name: string;
    author: string;
}

class RacetrackControls {
    canvas: HTMLCanvasElement;
    rt?: Racetrack;
    tracks: Track[];
    racers: CarUpdate[];
    inRace: boolean[];
    uiElements: Element[];

    stats: RacerStats;

    constructor(parent: HTMLElement, canvas: HTMLCanvasElement, tracks: Track[], racers: CarUpdate[]) {
        this.canvas = canvas;
        this.tracks = tracks;
        this.racers = racers;
        this.inRace = racers.map(() => true);

        const racerNames = this.getRacerInfo();

        this.uiElements = [
            { type: 'choice',
              label: "Racetrack",
              value: tracks[0].name,
              choices: tracks.map(t => t.name),
              action: (name) => {
                this.attachTrack(tracks.find(t => t.name === name)!);
              }
            },
            {
              label: "Reset",
              action: () => {
                // Don't use default reset function as we could have different
                // racers selected.
                this.attachTrack(this.rt!.track);
              }
            },
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


        const racerCheckboxes: Element[] = racerNames.map((r, i) => {
            return {
                type: 'checkbox',
                label: r.name!,
                value: this.inRace[i],
                action: (checked) => {
                    this.inRace[i] = checked;
                }
            };
        });

        const racerBar = new ButtonBar(racerCheckboxes);
        racerBar.getElement().style.fontSize = '1em';
        parent.appendChild(racerBar.getElement());

        this.stats = new RacerStats(parent);
        this.attachTrack(tracks[0]);
    }

    attachTrack(track: Track) {
        // Stop race in progress.
        if (this.rt) {
            this.rt.reset();
        }

        this.rt = new Racetrack(this.canvas, track, { showGrid: false });

        for (let i = 0; i < this.racers.length; i++) {
            const racer = this.racers[i];
            if (this.inRace[i]) {
                this.rt.race(racer);
            }
        }

        this.rt.subscribeStats((stats) => {
            this.stats.update(stats.cars);
        });

        this.rt.step();

        if (this.stats) {
            this.stats.update(this.rt.cars);
        }
    }

    getRacerInfo() : RacerInfo[] {
        // Just need a dummy race.
        const rt = new Racetrack(this.canvas, this.tracks[0], { showGrid: false });
        for (const racer of this.racers) {
            rt.race(racer);
        }
        rt.step();
        return rt.cars.map((car: CarState) => {
            return {
                name: car.name!,
                author: car.author!
            };
        });
    }
}
