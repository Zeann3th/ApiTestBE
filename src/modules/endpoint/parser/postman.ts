import { ApiSpecParser, Endpoint, PostmanSpec } from "./types";

export class PostmanParser implements ApiSpecParser {
    parse(spec: string): Endpoint[] {
        const raw = JSON.parse(spec) as PostmanSpec;
        const endpoints: Endpoint[] = [];

        const DFS = (items: any[]) => {
            for (const item of items) {
                if ('item' in item) {
                    DFS(item.item);
                } else if ('request' in item) {
                    const request = item.request;

                    const headers = request.header?.reduce((acc: Record<string, string>, header: { key: string; value: string; }) => {
                        acc[header.key] = header.value;
                        return acc;
                    }, {}) || {};

                    const parameters = request.url.query?.reduce((acc: Record<string, any>, param: { key: string; value: string | number; }) => {
                        acc[param.key] = param.value;
                        return acc;
                    }, {}) || {};

                    const body = request.body?.mode === 'raw'
                        ? this.safeJsonParse(request.body.raw)
                        : {};

                    const url = request.url.raw;

                    const templateVars = this.extractVariables([
                        url,
                        JSON.stringify(headers),
                        JSON.stringify(parameters),
                        JSON.stringify(body),
                    ]);

                    const pathParams = this.extractPathParameters(url);

                    const allVars = Array.from(new Set([...templateVars, ...pathParams]));

                    const preProcessors: Record<string, string[]> = allVars.length > 0
                        ? { include: allVars }
                        : {};

                    const endpoint: Endpoint = {
                        name: item.name,
                        description: item.description,
                        method: request.method,
                        url,
                        preProcessors,
                    };

                    if (Object.keys(headers).length > 0) {
                        endpoint.headers = headers;
                    }
                    if (Object.keys(body).length > 0) {
                        endpoint.body = body;
                    }
                    if (Object.keys(parameters).length > 0) {
                        endpoint.parameters = parameters;
                    }

                    endpoints.push(endpoint);
                }
            }
        };

        DFS(raw.item);
        return endpoints;
    }

    private safeJsonParse(input: string | undefined): Record<string, any> {
        try {
            return input ? JSON.parse(input) : {};
        } catch {
            return {};
        }
    }

    private extractVariables(strings: string[]): string[] {
        const varSet = new Set<string>();
        const regex = /{{\s*([^{}]+?)\s*}}/g;
        for (const str of strings) {
            let match;
            while ((match = regex.exec(str)) !== null) {
                varSet.add(match[1]);
            }
        }
        return Array.from(varSet);
    }

    private extractPathParameters(url: string): string[] {
        const regex = /:(\w+)/g;
        const params = new Set<string>();
        let match;
        while ((match = regex.exec(url)) !== null) {
            params.add(match[1]);
        }
        return Array.from(params);
    }
}
