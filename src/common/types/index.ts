export interface Endpoint {
    name: string;
    description: string;
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD";
    url: string;
    headers?: Record<string, string>;
    body?: Record<string, any>;
    parameters?: Record<string, any>;
}

export class PostProcessor {
    extract?: Record<string, string>;
    assert?: Record<string, string>;
}

export interface ActionNode extends Endpoint {
    id: string;
    postProcessor?: PostProcessor;
}

export interface WorkerData {
    ccu: number;
    workerId: number;
    runId: string;
    duration: number;
    rampUpTime: number;
    nodes: ActionNode[];
    input: Record<string, any>;
}

export type WorkerMessage =
    | {
        type: "log";
        payload: {
            runId: string;
            endpointId: string;
            statusCode: number;
            responseTime: number;
            error: string | null;
            createdAt: string;
        };
    }
    | {
        type: "done";
        payload: {
            message: string;
        }
    }
    | {
        type: "info";
        payload: {
            message: string;
        }
    }
    | {
        type: "error";
        payload: {
            message: string;
        };
    };

export interface ReportData {
    flowRunId: string;
    ccu: number;
    threads: number;
    responseTime: {
        average: number;
        max: number;
        min: number;
        p90: number;
        p95: number;
        p99: number;
    };
    errorRate: number;
    charts: Array<Buffer>;
    duration: number;
    rps: number;
}

export class RunnerError extends Error {
    constructor(
        message: string,
        public code?: string,
        public latency?: number,
        public status?: number
    ) {
        super(message);
    }
}

