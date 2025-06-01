import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { Endpoint, ActionNode } from 'src/common/types';
import { CookieJar } from 'tough-cookie';
import { HttpCookieAgent, HttpsCookieAgent } from 'http-cookie-agent/http';

@Injectable()
export class RunnerService {
  private readonly axiosInstance: AxiosInstance;
  private readonly REQUEST_TIMEOUT = 30000;

  constructor() {
    const cookieJar = new CookieJar();
    this.axiosInstance = axios.create({
      httpAgent: new HttpCookieAgent({ cookies: { jar: cookieJar } }),
      httpsAgent: new HttpsCookieAgent({ cookies: { jar: cookieJar } }),
      withCredentials: true,
      timeout: this.REQUEST_TIMEOUT,
      headers: {
        'Connection': 'keep-alive',
        'User-Agent': 'FlowTest/1.0',
        'Cache-Control': 'no-cache',
        'Accept-Encoding': 'gzip, deflate, br',
      },
      validateStatus: () => true,
      decompress: true,
    });

    this.axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      config.startTime = Date.now();
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      (response) => {
        const startTime = Number(response.config.startTime);
        response['latency'] = Date.now() - startTime;
        return response;
      }
    );
  }

  async run(node: ActionNode, data: Record<string, any> = {}, abortSignal?: AbortSignal): Promise<{ data: Record<string, any>, response: any }> {
    if (!node) throw new Error('Endpoint is not defined');

    const request = this.interpolate(node, data);

    const response = await this.axiosInstance({
      method: request.method,
      url: request.url,
      headers: {
        ...request.headers,
        'Content-Type': 'application/json',
      },
      params: request.parameters,
      data: request.body || {},
      signal: abortSignal ?? AbortSignal.timeout(this.REQUEST_TIMEOUT),
    });

    const postProcessors = node.postProcessor;

    if (postProcessors) {
      if (postProcessors?.extract) {
        for (const [key, path] of Object.entries(postProcessors.extract)) {
          const value = this.resolvePath(response?.data, path);
          if (value !== undefined) {
            data[key] = value;
          }
        }
      }

      if (postProcessors?.delay) {
        const { min, max } = postProcessors.delay;
        const randomMs = min + Math.floor(Math.random() * (max - min + 1));
        await new Promise(resolve => setTimeout(resolve, randomMs));
      }
    }

    const { status, headers, data: body } = response;
    return { data, response: { status, headers, body, latency: response['latency'] } };
  }

  private resolvePath(obj: any, path: string): any {
    const parts = path.replace(/\[(\w+)\]/g, '.$1').split('.');
    return parts.reduce((acc, key) => (acc != null ? acc[key] : undefined), obj);
  }

  private interpolate(template: Endpoint, data: Record<string, any>): Endpoint {
    const interpolateString = (str: string): string =>
      str.replace(/\{\{(.*?)\}\}/g, (_, key) => {
        const keys = key.trim().split('.');
        const val = keys.reduce((acc: any, k: string) => acc?.[k], data);
        return val !== undefined ? String(val) : '';
      });

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
