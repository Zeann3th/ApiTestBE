import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Endpoint, FlowStep } from 'src/common/types';

@Injectable()
export class RunnerService {
    constructor() { }

    async runFlow(steps: FlowStep[], data: Record<string, any> = {}): Promise<Record<string, any>> {
        for (const step of steps) {
            const endpoint = step.endpoints as Endpoint;
            if (!endpoint) {
                continue;
            }
            const request = this.interpolate(endpoint, data);

            const start = performance.now();
            try {
                const response = await axios({
                    method: request.method,
                    url: request.url,
                    headers: {
                        ...request.headers,
                        'Content-Type': 'application/json',
                    },
                    params: request.parameters,
                    data: request.body,
                });


                data['latency'] = performance.now() - start;

                const postProcessors = step.flow_steps?.postProcessor;

                if (postProcessors?.extract) {
                    for (const [key, path] of Object.entries(postProcessors.extract)) {
                        const value = this.resolvePath(response, path);
                        data[key] = value;
                    }
                }
            } catch (error) {
                console.error(`Error in step ${step.endpoints.name}:`, error);
            }
        }
        return data;
    }

    private resolvePath(obj: any, path: string): any {
        const keys = path.split('.');
        return keys.reduce((acc, key) => (acc != null ? acc[key] : undefined), obj);
    }

    private interpolate(template: Endpoint, data: Record<string, any>): Endpoint {
        function interpolateString(str: string): string {
            const regex = /\{\{(.*?)\}\}/g;
            return str.replace(regex, (_, key) => {
                const keys = key.trim().split('.');
                const val = keys.reduce((acc: { [x: string]: any; }, k: string | number) => acc && acc[k], data);
                return val !== undefined ? val : '';
            });
        }

        const url = interpolateString(this.interpolateUrl(template.url, data));

        const headers = template.headers
            ? Object.fromEntries(
                Object.entries(template.headers).map(([k, v]) => [k, interpolateString(v)])
            )
            : undefined;

        const parameters = template.parameters
            ? Object.fromEntries(
                Object.entries(template.parameters).map(([k, v]) =>
                    [k, typeof v === 'string' ? interpolateString(v) : v]
                )
            )
            : undefined;

        const body = template.body
            ? Object.fromEntries(
                Object.entries(template.body).map(([k, v]) =>
                    [k, typeof v === 'string' ? interpolateString(v) : v]
                )
            )
            : undefined;

        return {
            ...template,
            url,
            headers,
            parameters,
            body,
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
