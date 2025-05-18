import { Endpoint } from "src/common/types";

export interface ApiSpecParser {
    parse: (spec: string) => Endpoint[];
}

export interface PostmanSpec {
    info: {
        name: string;
        description: string;
    };
    item: Array<{
        name: string;
        description: string;
        item: Array<{
            name: string;
            description: string;
            event: Array<any>;
            auth: Object;
            request: {
                auth: Object;
                method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD";
                header: Array<{
                    key: string;
                    value: string;
                    description: string;
                    type: string;
                }>;
                body: {
                    mode: string;
                    raw: string;
                    urlencoded: Array<{
                        key: string;
                        value: string;
                        description: string;
                    }>;
                };
                url: {
                    raw: string;
                    host: Array<string>;
                    query: Array<{
                        key: string;
                        value: string;
                        description: string;
                        type: string;
                    }>;
                    variable: Array<{
                        key: string;
                        value: string;
                        description: string;
                        type: string;
                    }>;
                };
            };
            response: Array<{
                name: string;
                description: string;
                status: string;
                code: number;
                header: Array<{
                    key: string;
                    value: string;
                    description: string;
                    type: string;
                }>;
                body: string;
            }>;
            protocolProfileBehavior: {
                strictSSL: boolean;
                followRedirects: boolean;
            };
        }>
    }>;
}


