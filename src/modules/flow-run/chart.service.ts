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

    async createRPSChart(data: { [second: string]: number }): Promise<Buffer> {
        try {
            const keys = Object.keys(data);

            const configuration = {
                type: 'line' as const,
                data: {
                    labels: keys,
                    datasets: [{
                        label: 'Requests per Second',
                        data: keys.map(k => data[k]),
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
                                text: 'Time (HH:MM:SS)',
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
                            text: 'Requests per Second',
                            font: { size: 16 }
                        }
                    }
                }
            };

            return await this.chartCanvas.renderToBuffer(configuration);
        } catch (error) {
            console.error('Error creating chart:', error);
            throw error;
        }
    }

    async createResponseTimeChart(data: { [time: string]: number }): Promise<Buffer> {
        try {
            const keys = Object.keys(data);

            const configuration = {
                type: 'line' as const,
                data: {
                    labels: keys,
                    datasets: [{
                        label: 'Average Response Time (ms)',
                        data: keys.map(k => data[k]),
                        borderColor: 'rgba(255,99,132,1)',
                        backgroundColor: 'rgba(255,99,132,0.2)',
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
                                text: 'Time (HH:MM:SS)',
                                font: { size: 12 }
                            }
                        },
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Response Time (ms)',
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
                            text: 'Average Response Time Over Time',
                            font: { size: 16 }
                        }
                    }
                }
            };

            return await this.chartCanvas.renderToBuffer(configuration);
        } catch (error) {
            console.error('Error creating response time chart:', error);
            throw error;
        }
    }
}