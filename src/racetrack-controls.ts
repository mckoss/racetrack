import { ButtonBar } from "./button-bar";

import type { Racetrack } from "./racetrack";

export { RacetrackControls };

class RacetrackControls {
    rt: Racetrack;

    constructor(parent: HTMLElement, rt: Racetrack) {
        this.rt = rt;
        const buttonBar = new ButtonBar([
            { label: "Reset", action: () => this.rt.reset() },
            {
                label: "Step", action: () => {
                    this.rt.isRunning = false;
                    this.rt.step();
                }
            },
            { label: "Run", action: () => this.rt.run(100) },
        ]);
        parent.appendChild(buttonBar.container);
    }

    attach(rt: Racetrack) {
        this.rt = rt;
    }
}
