import { Injectable } from '@nestjs/common';
import axios, { AxiosError, AxiosInstance } from 'axios';
import { Endpoint, ActionNode } from 'src/common/types';
import * as http from 'http';
import * as https from 'https';

@Injectable()
export class RunnerService {
  private readonly axiosInstance: AxiosInstance;

  constructor() {
    const httpAgent = new http.Agent({
      keepAlive: true,
      maxSockets: Infinity,
      maxFreeSockets: Infinity,
      timeout: 30000,
      scheduling: 'fifo'
    });

    const httpsAgent = new https.Agent({
      keepAlive: true,
      maxSockets: Infinity,
      maxFreeSockets: Infinity,
      timeout: 30000,
      scheduling: 'fifo'
    });

    this.axiosInstance = axios.create({
      timeout: 30000,
      httpAgent,
      httpsAgent,
      headers: {
        'Connection': 'keep-alive',
        'User-Agent': 'FlowTest/1.0'
      },
      validateStatus: (status) => status >= 200 && status < 300,
      maxRedirects: 5,
    });
  }

  async run(node: ActionNode, data: Record<string, any> = {}, abortSignal?: AbortSignal): Promise<{ data: Record<string, any>, response: any }> {
    if (!node) {
      throw new Error('Endpoint is not defined');
    }

    const request = this.interpolate(node, data);

    try {
      const response = await this.axiosInstance({
        method: request.method,
        url: request.url,
        headers: {
          ...request.headers,
          'Content-Type': 'application/json',
        },
        params: request.parameters,
        data: request.body || {},
        signal: abortSignal,
      });

      const postProcessors = node.postProcessor;
      if (postProcessors?.extract) {
        for (const [key, path] of Object.entries(postProcessors.extract)) {
          const value = this.resolvePath(response?.data, path);
          if (value !== undefined) {
            data[key] = value;
          }
        }
      }

      console.log(data);

      return { data, response };
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw new Error('Request aborted due to timeout');
      }

      const err = error as AxiosError;
      const endpointName = node.name || 'Unknown endpoint';

      const errorDetails = [
        `Error in step "${endpointName}": ${err.message}`,
        `Code: ${err.code}`,
        err.response ? `Status: ${err.response.status}` : '',
        err.response?.data ? `Response: ${JSON.stringify(err.response.data)}` : '',
        `Timeout: ${err.code === 'ECONNABORTED' ? 'YES' : 'NO'}`,
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

  getConnectionStats() {
    return {
      httpAgent: {
        // @ts-ignore - accessing private properties for debugging
        sockets: Object.keys(this.axiosInstance.defaults.httpAgent.sockets || {}).length,
        freeSockets: Object.keys(this.axiosInstance.defaults.httpAgent.freeSockets || {}).length,
      },
      httpsAgent: {
        // @ts-ignore
        sockets: Object.keys(this.axiosInstance.defaults.httpsAgent.sockets || {}).length,
        freeSockets: Object.keys(this.axiosInstance.defaults.httpsAgent.freeSockets || {}).length,
      }
    };
  }

  private resolvePath(obj: any, path: string): any {
    const parts = path
      .replace(/\[(\w+)\]/g, '.$1')
      .split('.');

    return parts.reduce((acc, key) => (acc != null ? acc[key] : undefined), obj);
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