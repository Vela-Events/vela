import { BaseClient } from '../client/base-client.js';
import { EventListParams, EventListResponse } from '../types/index.js';

export class EventsResource {
  constructor(
    private readonly client: BaseClient,
    private readonly appId: string,
  ) {}

  list(params?: EventListParams): Promise<EventListResponse> {
    return this.client.request<EventListResponse>(
      'GET',
      `/v1/apps/${this.appId}/events`,
      {
        params: params as Record<string, string | number | boolean | undefined>,
      },
    );
  }
}
