import { CarState } from './racetrack';
import { Point } from './points';

export { RacerStats };

interface ColumnBase {
    type: 'string' | 'number' | 'vector' | 'html' | 'text';
    displayName: string;
}

interface ComputedColumn extends ColumnBase {
    type: 'html' | 'text';
    value: (racer: CarState) => string;
}

interface PropColumn extends ColumnBase {
    type: 'string' | 'number' | 'vector';
    propName: keyof CarState;
}

type Column = ComputedColumn | PropColumn;

const COLUMNS: Column[] = [
    {
        type: 'html', displayName: 'Racer',
        value: (r) => {
            let result = `<span style="color: ${r.color}">●</span>&nbsp;${r.name}`;
            if (r.author) {
                result += `<br><span style="margin-left: 1.5em; font-size: 0.75em;">by&nbsp;${r.author}</span>`;
            }
            return result;
        }
    },
    // { type: 'number', displayName: 'Speed', propName: 'speed' },
    { type: 'vector', displayName: 'Velocity', propName: 'velocity' },
    { type: 'number', displayName: 'Step', propName: 'step' },
    { type: 'number', displayName: 'Distance', propName: 'distanceTraveled' },
    { type: 'number', displayName: 'Top Speed', propName: 'topSpeed' },
    { type: 'number', displayName: 'Position', propName: 'racePosition' },
    { type: 'number', displayName: 'Time', propName: 'finishTime' },
];

class RacerStats {
    grid: HTMLDivElement;

    constructor(parent: HTMLElement) {
        this.grid = document.createElement('div');
        this.grid.classList.add('race-stats');
        this.grid.style.gridTemplateColumns = `repeat(${COLUMNS.length}, 1fr)`;
        parent.appendChild(this.grid);
    }

    update(racers: CarState[]) {
        this.grid.innerHTML = '';
        for (const column of COLUMNS) {
            const header = document.createElement('div');
            header.classList.add('header');
            header.textContent = column.displayName;
            this.grid.appendChild(header);
        }

        for (const racer of racers) {
            for (const column of COLUMNS) {
                const cell = document.createElement('div');
                cell.classList.add('cell');

                let value: string | number | Point | undefined;
                if ('value' in column) {
                    value = column.value(racer);
                } else {
                    value = racer[column.propName!];
                }

                if (value !== undefined) {
                    switch (column.type) {
                        case 'string':
                        case 'text':
                            cell.textContent = value as string;
                            break;

                        case 'html':
                            cell.innerHTML = value as string;
                            break;

                        case 'number':
                            cell.textContent = (value as number).toFixed(2);
                            break;

                        case 'vector':
                            cell.textContent = (racer[column.propName!] as Point).toString();
                            break;
                    }
                }

                this.grid.appendChild(cell);
            }
        }
    }
}
