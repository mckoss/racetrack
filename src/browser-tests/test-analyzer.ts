import { assert } from 'chai';

import { Racetrack } from '../racetrack.js';
import { SAMPLE_TRACKS } from '../tracks.js';
import { Collector, scalarReducer, cmpScalar } from '../analyzer.js';

import { getOptimalRacer } from '../optimal-path-finder.js';

import { Chart, ScatterController, LinearScale, PointElement, LogarithmicScale, Legend } from 'chart.js';

Chart.register(ScatterController, LinearScale, LogarithmicScale, PointElement, Legend);

suite('Analyzer', function () {
    let canvas: HTMLCanvasElement;

    // Arrow functions hide the `this` context, so we need to use a regular
    // function here.
    setup(function () {
        canvas = document.createElement('canvas');
        const title = document.createElement('h2');

        // Append the racetrack canvas to the page in case we want to look at it.
        title.textContent = `${this.currentTest!.title}:`;
        document.body.appendChild(title);
        document.body.appendChild(canvas);
    });

    // test('Normal Data Collector', async () => {
    //     const racer = getOptimalRacer();
    //     const c = new Collector(racer, normalize, cmpNormalize);
    //     for (const track of SAMPLE_TRACKS) {
    //         const rt = new Racetrack(canvas, track);
    //         rt.race(c.wrappedRacer);
    //         await rt.run();
    //     }
    //     console.log(c.report());
    //     assert.isTrue(c.report().length > 0);
    // }).timeout(10000);

    test('Scalar Data Collector', async () => {
        const racer = getOptimalRacer();
        const c = new Collector(racer, scalarReducer, cmpScalar);
        for (const track of SAMPLE_TRACKS) {
            const rt = new Racetrack(canvas, track);
            rt.race(c.wrappedRacer);
            await rt.run();
        }

        const data = c.getReportData();
        assert.isTrue(data.length > 0);

        // Use the canvas to visualize the data.
        const ctx = canvas.getContext('2d')!;
        canvas.width = 800;
        canvas.height = 800;

        const accelerationGroups: {x: number, y: number}[][] = [[], [], []];

        for (const [d, points] of data) {
            for (const p of points) {
                const x = d.speed;
                const y = d.crash !== null ? d.crash : 60;
                accelerationGroups[p[0] + 1].push({x, y});
            }
        }

        new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'Decelerating',
                        data: accelerationGroups[0],
                        pointBackgroundColor:'rgba(255, 0, 0, 0.75)',
                    },
                    {
                        label: 'Coasting',
                        data: accelerationGroups[1],
                        pointBackgroundColor: 'rgba(255, 255, 255, 0.75)',
                    },
                    {
                        label: 'Accelerating',
                        data: accelerationGroups[2],
                        pointBackgroundColor: 'rgba(0, 255, 0, 0.75)',
                    },
                ]
            },
            options: {
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'Speed', // X-axis label
                            font: {
                                size: 14 // Optional: set the font size
                            }
                        }
                    },
                    y: {
                        type: 'logarithmic',
                        title: {
                            display: true,
                            text: 'Crash Distance', // Y-axis label
                            font: {
                                size: 14 // Optional: set the font size
                            }
                        }
                    },
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'right',
                        labels: {
                            boxWidth: 20,
                            boxHeight: 20,
                        }
                    }
                },
            },

        });
    }).timeout(10000);
});
