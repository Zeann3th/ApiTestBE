import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { ReportDto } from './dto/report.dto';

@Injectable()
export class ReportService {
    async generateReport(data: ReportDto): Promise<Buffer> {
        return new Promise<Buffer>((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            const chunks: Buffer[] = [];

            doc.on('data', (chunk) => {
                chunks.push(chunk);
            });

            doc.on('end', () => {
                const finalBuffer = Buffer.concat(chunks);
                resolve(finalBuffer);
            });

            doc.on('error', (error) => {
                reject(error);
            });

            try {
                doc.fontSize(20).text('Flow Run Report', { align: 'center' });
                doc.moveDown(2);

                doc.image(data.imageBuffer, 50, doc.y, {
                    fit: [500, 300],
                    align: 'center'
                });
                doc.moveDown(15);

                doc.fontSize(12);
                doc.text(`Concurrent Users: ${data.ccu || 'N/A'}`);
                doc.moveDown(0.5);

                doc.text(`Threads: ${data.threads || 'N/A'}`);
                doc.moveDown(0.5);

                doc.text(`Duration: ${data.duration?.toFixed(2) || 'N/A'} seconds`);
                doc.moveDown(0.5);

                doc.text(`Average Response Time: ${data.responseTime?.toFixed(2) || 'N/A'} ms`);
                doc.moveDown(0.5);

                doc.text(`Error Rate: ${data.errorRate?.toFixed(2) || 'N/A'}%`);
                doc.moveDown(0.5);

                doc.text(`Requests per Second: ${data.rps?.toFixed(2) || 'N/A'}`);
                doc.moveDown(2);

                doc.text(`Generated on: ${new Date().toLocaleString()}`);

                console.log('Content added, finalizing PDF...');

                doc.end();

            } catch (error) {
                console.error('Error during PDF content creation:', error);
                reject(error);
            }
        });
    }
}