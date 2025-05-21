import { Injectable } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { Endpoint, FlowStep } from 'src/common/types';
import * as http from 'http';
import * as https from 'https';

@Injectable()
export class RunnerService {
    private readonly httpAgent: http.Agent;
    private readonly httpsAgent: https.Agent;
    constructor() {
        this.httpAgent = new http.Agent({ keepAlive: true });
        this.httpsAgent = new https.Agent({ keepAlive: true });
    }

    async runFlow(steps: FlowStep[], data: Record<string, any> = {}): Promise<Record<string, any>> {
        for (const step of steps) {
            const endpoint = step.endpoints as Endpoint;
            if (!endpoint) continue;

            const request = this.interpolate(endpoint, data);

            try {
                const response = await axios({
                    method: request.method,
                    url: request.url,
                    headers: {
                        ...request.headers,
                        'Content-Type': 'application/json',
                    },
                    params: request.parameters,
                    data: request.body || {},
                    httpAgent: this.httpAgent,
                    httpsAgent: this.httpsAgent,
                    validateStatus: (status) => status >= 200 && status < 300,
                });

                const postProcessors = step.flow_steps?.postProcessor;
                if (postProcessors?.extract) {
                    for (const [key, path] of Object.entries(postProcessors.extract)) {
                        const value = this.resolvePath(response?.data, path);
                        if (value !== undefined) {
                            data[key] = value;
                        }
                    }
                }
            } catch (error) {
                const err = error as AxiosError;
                const endpointName = endpoint.name || 'Unknown endpoint';

                const errorDetails = [
                    `Error in step "${endpointName}": ${err.message}`,
                    err.response ? `Status: ${err.response.status}` : '',
                    err.response?.data ? `Response: ${JSON.stringify(err.response.data)}` : '',
                    `Request: ${JSON.stringify({
                        method: request.method,
                        url: request.url,
                        headers: request.headers,
                        params: request.parameters,
                        data: request.body,
                    }, null, 2)}`
                ].filter(Boolean).join('\n');

                throw new Error(errorDetails);
            }
        }

        return data;
    }

    private resolvePath(obj: any, path: string): any {
        const keys = path.split('.');
        return keys.reduce((acc, key) => (acc != null ? acc[key] : undefined), obj);
    }

    private interpolate(template: Endpoint, data: Record<string, any>): Endpoint {
        const interpolateString = (str: string): string => {
            return str.replace(/\{\{(.*?)\}\}/g, (_, key) => {
                const keys = key.trim().split('.');
                const val = keys.reduce((acc: any, k: string) => acc?.[k], data);
                return val !== undefined ? String(val) : '';
            });
        };

        return {
            ...template,
            url: interpolateString(this.interpolateUrl(template.url, data)),
            headers: template.headers
                ? Object.fromEntries(
                    Object.entries(template.headers).map(([k, v]) => [k, interpolateString(v)])
                )
                : undefined,
            parameters: template.parameters
                ? Object.fromEntries(
                    Object.entries(template.parameters).map(([k, v]) => [
                        k,
                        typeof v === 'string' ? interpolateString(v) : v,
                    ])
                )
                : undefined,
            body: template.body
                ? Object.fromEntries(
                    Object.entries(template.body).map(([k, v]) => [
                        k,
                        typeof v === 'string' ? interpolateString(v) : v,
                    ])
                )
                : undefined,
        };
    }

    private interpolateUrl(url: string, data: Record<string, any>): string {
        return url.replace(/:([a-zA-Z0-9_]+)/g, (_, key) => {
            const val = data[key];
            if (val === undefined) {
                throw new Error(`Missing value for URL parameter: ${key}`);
            }
            return encodeURIComponent(String(val));
        });
    }
}
