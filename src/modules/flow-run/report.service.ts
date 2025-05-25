import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import { ReportDto } from './dto/report.dto';

@Injectable()
export class ReportService {
    async generateReport(data: ReportDto): Promise<Buffer> {
        const doc = new PDFDocument();
        const chunks: Buffer[] = [];

        const stream = new PassThrough();
        doc.pipe(stream);

        stream.on('data', chunk => chunks.push(chunk));

        stream.on('error', err => {
            throw err;
        });

        doc.fontSize(18).text('Flow Report', { align: 'center', });
        doc.image(data.imageBuffer, {
            fit: [500, 400],
            align: 'center',
            valign: 'center',
        });
        doc.moveDown();
        // CCU
        doc.fontSize(14).text(`Concurrent Users: ${data.ccu}`, { align: 'left' });
        doc.moveDown();
        // Threads
        doc.fontSize(14).text(`Threads: ${data.threads}`, { align: 'left' });
        doc.moveDown();
        // Duration
        doc.fontSize(14).text(`Duration: ${data.duration} seconds`, { align: 'left' });
        doc.moveDown();
        // Response Time
        doc.fontSize(14).text(`Average Response Time: ${data.responseTime} ms`, { align: 'left' });
        doc.moveDown();
        // Error Rate
        doc.fontSize(14).text(`Error Rate: ${data.errorRate.toFixed(2)}%`, { align: 'left' });
        doc.moveDown();

        doc.fontSize(14).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'left' });
        doc.moveDown();

        doc.end();

        return new Promise<Buffer>((resolve, reject) => {
            stream.on('end', () => {
                resolve(Buffer.concat(chunks));
            });
            stream.on('error', reject);
        });
    }
}
