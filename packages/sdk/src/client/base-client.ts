import { buildVelaError } from '../errors.js';

export interface VelaClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  timeout?: number;
}

const DEFAULT_BASE_URL = 'https://api.velahq.xyz';
const DEFAULT_TIMEOUT = 30_000;

export abstract class BaseClient {
  protected readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeout: number;

  constructor(options: VelaClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT;
  }

  protected abstract getAuthHeaders(): Record<string, string>;

  async request<T>(
    method: string,
    path: string,
    opts: {
      body?: unknown;
      params?: Record<string, string | number | boolean | undefined>;
    } = {},
  ): Promise<T> {
    const url = new URL(this.baseUrl + path);

    if (opts.params) {
      for (const [key, value] of Object.entries(opts.params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    let response: Response;
    try {
      response = await this.fetchImpl(url.toString(), {
        method,
        headers,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      let errorBody: Record<string, unknown> = {};
      try {
        errorBody = await response.json();
      } catch {
        // ignore parse errors — use empty body
      }
      throw buildVelaError(response.status, errorBody);
    }

    if (response.status === 204) {
      return undefined as unknown as T;
    }

    return response.json() as Promise<T>;
  }
}
