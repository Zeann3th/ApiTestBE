import { ApiSpecParser } from "./types";
import { PostmanParser } from "./postman";

export class ApiSpecParserFactory {
    static createParser(type: string): ApiSpecParser {
        switch (type) {
            case 'application/json':
                return new PostmanParser();
            default:
                throw new Error(`Unsupported parser type: ${type}`);
        }
    }
}