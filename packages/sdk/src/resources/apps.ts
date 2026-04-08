import { BaseClient } from '../client/base-client.js';
import {
  AppResponse,
  AppWithKeyResponse,
  CreateAppInput,
  UpdateAppInput,
} from '../types/index.js';

export class AppsResource {
  constructor(private readonly client: BaseClient) {}

  list(): Promise<AppResponse[]> {
    return this.client.request<AppResponse[]>('GET', '/v1/apps');
  }

  create(input: CreateAppInput): Promise<AppWithKeyResponse> {
    return this.client.request<AppWithKeyResponse>('POST', '/v1/apps', {
      body: input,
    });
  }

  get(appId: string): Promise<AppResponse> {
    return this.client.request<AppResponse>('GET', `/v1/apps/${appId}`);
  }

  update(appId: string, input: UpdateAppInput): Promise<AppResponse> {
    return this.client.request<AppResponse>('PATCH', `/v1/apps/${appId}`, {
      body: input,
    });
  }

  rotateKey(appId: string): Promise<AppWithKeyResponse> {
    return this.client.request<AppWithKeyResponse>(
      'POST',
      `/v1/apps/${appId}/keys/rotate`,
    );
  }
}
