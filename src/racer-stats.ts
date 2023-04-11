import { CarState } from './racetrack';
import { Point, length } from './points';

export { RacerStats };

// Assume grid cells are 32' apart, which matches an acceleration capability
// of 32'/s^2.
const FEET_PER_GRID = 32;
const FEET_PER_MILE = 5280;
const SECS_PER_HOUR = 3600;
const MPH_PER_SPEED = FEET_PER_GRID * SECS_PER_HOUR / FEET_PER_MILE;

interface ColumnBase {
    type: 'string' | 'number' | 'integer' | 'vector' | 'html' | 'text';
    displayName: string;
}

interface ComputedColumn extends ColumnBase {
    type: 'html' | 'text';
    value: (racer: CarState) => string;
}

interface PropColumn extends ColumnBase {
    type: 'string' | 'number' | 'integer' | 'vector';
    propName: keyof CarState;
}

type Column = ComputedColumn | PropColumn;

const COLUMNS: Column[] = [
    {
        type: 'text', displayName: 'Position',
        value: (r) => ordinal(r.racePosition)
    },
    {
        type: 'html', displayName: 'Racer',
        value: (r) => {
            let result = `<span style="color: ${r.color}">⬤</span>&nbsp;${r.name}`;
            if (r.author) {
                result += `<br><span class="by">by&nbsp;${r.author}</span>`;
            }
            return result;
        }
    },
    { type: 'string', displayName: 'Status', propName: 'status' },
    {
        type: 'html', displayName: 'Speed',
        value: (r) => {
            const speed = length(r.velocity);
            return `${mph(speed)}<br>[${speed.toFixed(1)} / s]`;
        }
    },
    // { type: 'vector', displayName: 'Velocity', propName: 'velocity' },
    { type: 'integer', displayName: 'Step', propName: 'step' },
    {
        type: 'html', displayName: 'Distance',
        value: (r) => `${thousands(r.distanceTraveled * FEET_PER_GRID)}'` +
            `<br>[${r.distanceTraveled.toFixed(1)}]`
    },
    {
        type: 'html', displayName: 'Top&nbsp;Speed',
        value: (r) => {
            return `${mph(r.topSpeed)}<br>[${r.topSpeed.toFixed(1)} / s]`;
        }
    },
    {
        type: 'html', displayName: 'Time',
        value: (r) => {
            if (r.status === 'crashed') {
                const avgSpeed = r.distanceTraveled / r.step * MPH_PER_SPEED;
                return `DNF<br>(${avgSpeed.toFixed(1)} mph)`;
            }
            if (r.finishTime !== undefined) {
                const avgSpeed = r.distanceTraveled / r.finishTime * MPH_PER_SPEED;
                return `${r.finishTime.toFixed(2)} s<br>(${avgSpeed.toFixed(1)} mph)`;
            }
            return '';
        }
    },
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
        racers = racers.slice().sort((a, b) => a.racePosition - b.racePosition);

        this.grid.innerHTML = '';
        for (const column of COLUMNS) {
            const header = document.createElement('div');
            header.classList.add('header');
            header.innerHTML = column.displayName;
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

                        case 'integer':
                            cell.textContent = (value as number).toFixed(0);
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

function ordinal(num: number): string {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const remainder = num % 100;

    if (remainder >= 11 && remainder <= 13) {
        return num + 'th';
    } else {
        const lastDigit = num % 10;
        return num + (suffixes[lastDigit] || suffixes[0]);
    }
}

function mph(speed: number): string {
    return `${(speed * MPH_PER_SPEED).toFixed(0)} mph`;
}

function thousands(n: number): string {
    return Math.round(n).toLocaleString();
}
