import { BaseClient, VelaClientOptions } from './base-client.js';
import { IngestEventInput, IngestResponse } from '../types/index.js';

export class VelaIngestClient extends BaseClient {
  private readonly apiKey: string;

  constructor(apiKey: string, options?: VelaClientOptions) {
    super(options);
    this.apiKey = apiKey;
  }

  protected getAuthHeaders(): Record<string, string> {
    return { 'x-api-key': this.apiKey };
  }

  async ingest(event: IngestEventInput): Promise<IngestResponse>;
  async ingest(events: IngestEventInput[]): Promise<IngestResponse>;
  async ingest(
    payload: IngestEventInput | IngestEventInput[],
  ): Promise<IngestResponse> {
    const body = Array.isArray(payload) ? { events: payload } : payload;
    return this.request<IngestResponse>('POST', '/v1/ingest', { body });
  }
}
