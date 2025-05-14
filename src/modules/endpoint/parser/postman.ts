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
                    endpoints.push({
                        name: item.name,
                        description: item.description,
                        method: request.method,
                        url: request.url.raw,
                        headers: request.header.reduce((acc: { [x: string]: any; }, header: { key: string; value: string; }) => {
                            acc[header.key] = header.value;
                            return acc;
                        }, {} as Record<string, string>) || {},
                        body: request.body?.mode === 'raw'
                            ? this.safeJsonParse(request.body.raw)
                            : {},
                        parameters: request.url.query?.reduce((acc: { [x: string]: any; }, param: { key: string; value: string | number; }) => {
                            acc[param.key] = param.value;
                            return acc;
                        }, {} as Record<string, any>) || {},
                    });
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
}
