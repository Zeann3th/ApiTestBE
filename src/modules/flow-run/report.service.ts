import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { ReportData } from 'src/common/types';

@Injectable()
export class ReportService {
    async generateReport(data: ReportData): Promise<Buffer> {
        return new Promise<Buffer>((resolve, reject) => {
            const doc = new PDFDocument({
                margin: 50,
                size: 'A4'
            });
            const chunks: Buffer[] = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', (error) => reject(error));

            try {
                const pageWidth = doc.page.width - 100;
                const columnWidth = (pageWidth - 20) / 2;
                const leftColumnX = 50;
                const rightColumnX = leftColumnX + columnWidth + 20;

                doc.fontSize(24)
                    .font('Helvetica-Bold')
                    .text(`Report`, { align: 'center' });

                doc.moveDown(1);

                doc.strokeColor('#cccccc')
                    .lineWidth(1)
                    .moveTo(50, doc.y)
                    .lineTo(doc.page.width - 50, doc.y)
                    .stroke();

                doc.moveDown(1.5);

                doc.fontSize(16)
                    .font('Helvetica-Bold')
                    .fillColor('#333333')
                    .text(`Run ID: ${data.flowRunId}`, { align: 'left' });

                doc.moveDown(2);

                if (data.charts && data.charts.length > 0) {
                    doc.fontSize(16)
                        .font('Helvetica-Bold')
                        .fillColor('#333333')
                        .text('Performance Charts', { align: 'left' });

                    doc.moveDown(1);

                    const chartWidth = data.charts.length > 1 ? columnWidth : pageWidth * 0.8;
                    const chartHeight = 200;

                    data.charts.forEach((chart, index) => {
                        const isEven = index % 2 === 0;
                        const xPosition = data.charts.length > 1 && !isEven ? rightColumnX : leftColumnX;

                        if (index > 0 && isEven && data.charts.length > 1) {
                            doc.moveDown(3);
                        }

                        const currentY = doc.y;

                        try {
                            doc.image(chart, xPosition, currentY, {
                                fit: [chartWidth, chartHeight],
                            });
                        } catch (imageError) {
                            console.warn('Failed to add chart:', imageError);
                            doc.fontSize(10)
                                .fillColor('#666666')
                                .text(`Chart ${index + 1}: Unable to load image`, xPosition, currentY);
                        }

                        if (data.charts.length === 1 || index === data.charts.length - 1) {
                            doc.y = currentY + chartHeight + 20;
                        }
                    });

                    doc.moveDown(2);
                }

                doc.fontSize(16)
                    .font('Helvetica-Bold')
                    .fillColor('#333333')
                    .text('Performance Metrics', { align: 'left' });

                doc.moveDown(1);

                const metricsStartY = doc.y;

                doc.fontSize(12)
                    .font('Helvetica')
                    .fillColor('#000000');

                const leftMetrics = [
                    { label: 'Concurrent Users', value: data.ccu ?? 'N/A', unit: '' },
                    { label: 'Threads', value: data.threads ?? 'N/A', unit: '' },
                    { label: 'Duration', value: data.duration?.toFixed(2) ?? 'N/A', unit: ' seconds' },
                    { label: 'Error Rate', value: data.errorRate?.toFixed(2) ?? 'N/A', unit: '%' },
                    { label: 'Generated', value: new Date().toLocaleString(), unit: '' },
                ];

                const rightMetrics = [
                    { label: 'Avg Response Time', value: data.responseTime.average?.toFixed(2) ?? 'N/A', unit: ' ms' },
                    { label: 'Max Response Time', value: data.responseTime.max?.toFixed(2) ?? 'N/A', unit: ' ms' },
                    { label: 'Min Response Time', value: data.responseTime.min?.toFixed(2) ?? 'N/A', unit: ' ms' },
                    { label: 'P90 Response Time', value: data.responseTime.p90?.toFixed(2) ?? 'N/A', unit: ' ms' },
                    { label: 'P99 Response Time', value: data.responseTime.p99?.toFixed(2) ?? 'N/A', unit: ' ms' },
                ];

                // Vẽ cột trái
                let currentY = metricsStartY;
                leftMetrics.forEach((metric) => {
                    doc.font('Helvetica-Bold')
                        .text(metric.label + ':', leftColumnX, currentY);

                    doc.font('Helvetica')
                        .fillColor('#0066cc')
                        .text(metric.value + metric.unit, leftColumnX + 120, currentY);

                    currentY += 25;
                    doc.fillColor('#000000');
                });

                // Vẽ cột phải
                currentY = metricsStartY;
                rightMetrics.forEach((metric) => {
                    doc.font('Helvetica-Bold')
                        .fillColor('#000000')
                        .text(metric.label + ':', rightColumnX, currentY);

                    doc.font('Helvetica')
                        .fillColor('#0066cc')
                        .text(metric.value + metric.unit, rightColumnX + 120, currentY);

                    currentY += 25;
                    doc.fillColor('#000000');
                });

                doc.y = Math.max(metricsStartY + (leftMetrics.length * 25), metricsStartY + (rightMetrics.length * 25));
                doc.moveDown(2);

                doc.end();
            } catch (error) {
                console.error('Error during PDF content creation:', error);
                reject(error);
            }
        });
    }
}