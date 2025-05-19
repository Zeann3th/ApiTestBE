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

export interface FlowStep {
    endpoints: Endpoint;
    flow_steps?: {
        postProcessor?: PostProcessor;
    }
}

export interface WorkerData {
    ccu: number;
    id: number;
    duration: number;
    steps: FlowStep[];
    input: Record<string, any>;
}