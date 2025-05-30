import 'axios';

declare module 'axios' {
    export interface InternalAxiosRequestConfig {
        startTime?: number;
    }
}