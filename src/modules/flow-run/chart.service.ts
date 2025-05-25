import { Injectable } from '@nestjs/common';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

@Injectable()
export class ChartService {
    private chartCanvas: ChartJSNodeCanvas;

    constructor() {
        this.chartCanvas = new ChartJSNodeCanvas({
            width: 800,
            height: 600,
        });
    }

    async createLineChart(data: { [second: string]: number }): Promise<Buffer> {
        const labels = Object.keys(data).sort();
        const values = labels.map(label => data[label]);

        const configuration = {
            type: 'line' as const,
            data: {
                labels,
                datasets: [{
                    label: 'Requests per second',
                    data: values,
                    borderColor: 'rgba(75,192,192,1)',
                    backgroundColor: 'rgba(75,192,192,0.2)',
                    fill: true,
                    tension: 0.3,
                }]
            },
            options: {
                scales: {
                    x: {
                        title: { display: true, text: 'Time (s)' }
                    },
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Requests' }
                    }
                },
                plugins: {
                    legend: { display: true }
                }
            }
        };
        return this.chartCanvas.renderToBuffer(configuration);
    }
}
