import { ApiSpecParser, Endpoint, PostmanSpec } from "./types";

export class PostmanParser implements ApiSpecParser {
    parse(spec: string): Endpoint[] {
        try {
            const rawSpec = JSON.parse(spec) as PostmanSpec;
            return this.extractEndpoints(rawSpec.item);
        } catch (error) {
            console.error("Failed to parse Postman spec:", error);
            return [];
        }
    }

    private extractEndpoints(items: any[]): Endpoint[] {
        const endpoints: Endpoint[] = [];

        for (const item of items) {
            if ('item' in item) {
                endpoints.push(...this.extractEndpoints(item.item));
            } else if ('request' in item) {
                endpoints.push(this.createEndpoint(item));
            }
        }

        return endpoints;
    }

    private createEndpoint(item: any): Endpoint {
        const { request } = item;

        const endpoint: Endpoint = {
            name: item.name,
            description: item.description,
            method: request.method,
            url: request.url.raw
        };

        const headers = this.extractKeyValuePairs(request.header);
        if (Object.keys(headers).length > 0) {
            endpoint.headers = headers;
        }

        const parameters = this.extractKeyValuePairs(request.url.query);
        if (Object.keys(parameters).length > 0) {
            endpoint.parameters = parameters;
        }

        if (request.body?.mode === 'raw') {
            const body = this.safeJsonParse(request.body.raw);
            if (Object.keys(body).length > 0) {
                endpoint.body = body;
            }
        }

        return endpoint;
    }

    private extractKeyValuePairs(items?: Array<{ key: string; value: string | number }>): Record<string, any> {
        if (!items) return {};

        return items.reduce((acc: Record<string, any>, item) => {
            acc[item.key] = item.value;
            return acc;
        }, {});
    }

    private safeJsonParse(input?: string): Record<string, any> {
        if (!input) return {};

        try {
            return JSON.parse(input);
        } catch {
            return {};
        }
    }
}