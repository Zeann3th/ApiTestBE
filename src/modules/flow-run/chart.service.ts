import { Injectable } from '@nestjs/common';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

@Injectable()
export class ChartService {
    private chartCanvas: ChartJSNodeCanvas;

    constructor() {
        this.chartCanvas = new ChartJSNodeCanvas({
            width: 800,
            height: 600,
            backgroundColour: 'white',
        });
    }

    async createLineChart(data: { [second: string]: number }): Promise<Buffer> {
        try {
            const sortedKeys = Object.keys(data).sort((a, b) => parseInt(a) - parseInt(b));
            const values = sortedKeys.map(key => data[key]);

            const labels = sortedKeys.map(timestamp => {
                const date = new Date(parseInt(timestamp) * 1000);
                return date.toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
            });

            if (labels.length === 0) {
                const configuration = {
                    type: 'line' as const,
                    data: {
                        labels: ['0'],
                        datasets: [{
                            label: 'No data available',
                            data: [0],
                            borderColor: 'rgba(75,192,192,1)',
                            backgroundColor: 'rgba(75,192,192,0.2)',
                        }]
                    },
                    options: {
                        responsive: false,
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
                            legend: { display: true },
                            title: {
                                display: true,
                                text: 'Requests per Second Over Time'
                            }
                        }
                    }
                };
                return await this.chartCanvas.renderToBuffer(configuration);
            }

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
                        pointRadius: 3,
                        pointHoverRadius: 5,
                    }]
                },
                options: {
                    responsive: false,
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Time (seconds)',
                                font: { size: 12 }
                            }
                        },
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Requests per Second',
                                font: { size: 12 }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top' as const
                        },
                        title: {
                            display: true,
                            text: 'Requests per Second Over Time',
                            font: { size: 16 }
                        }
                    }
                }
            };

            const buffer = await this.chartCanvas.renderToBuffer(configuration);
            return buffer;

        } catch (error) {
            console.error('Error creating chart:', error);
            throw error;
        }
    }
}