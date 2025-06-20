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

    const processors = node.processor;
    const preProcessor = processors?.pre;
    const postProcessor = processors?.post;

    if (preProcessor) {
      if (preProcessor.inject) {
        data = { ...data, ...preProcessor.inject };
      }

      if (preProcessor.alias) {
        for (const [key, alias] of Object.entries(preProcessor.alias)) {
          if (data[alias] !== undefined) {
            data[key] = data[alias];
          }
        }
      }
    }

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

    if (postProcessor) {

      if (postProcessor.extract) {
        for (const [key, path] of Object.entries(postProcessor.extract)) {
          const value = this.resolvePath(response?.data, path);
          if (value !== undefined) {
            data[key] = value;
          }
        }
      }

      if (postProcessor.delay) {
        const { min, max } = postProcessor.delay;
        const randomMs = min + Math.floor(Math.random() * (max - min + 1));
        await new Promise(resolve => setTimeout(resolve, randomMs));
      }

      if (postProcessor.alias) {
        for (const [key, alias] of Object.entries(postProcessor.alias)) {
          if (data[key] !== undefined) {
            data[key] = data[alias];
          }
        }
      }
    }

    const { status, headers, data: body } = response;
    return { data, response: { status, headers, body, latency: response['latency'] } };
  }

  private resolvePath(obj: any, path: string): any {
    const parts = path.replace(/\[(\w+|\*)\]/g, '.$1').split('.');

    let current = obj;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      if (part === '*') {
        if (Array.isArray(current)) {
          const randomIndex = Math.floor(Math.random() * current.length);
          current = current[randomIndex];
        } else {
          return undefined;
        }
      } else {
        current = current?.[part];
      }

      if (current === undefined) break;
    }

    return current;
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
