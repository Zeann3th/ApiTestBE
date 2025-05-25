export interface ReportDto {
    ccu: number;
    threads: number;
    responseTime: number;
    errorRate: number;
    imageBuffer: Buffer;
    duration: number;
    rps: number;
}