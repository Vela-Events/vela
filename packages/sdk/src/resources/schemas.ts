import { BaseClient } from '../client/base-client.js';
import {
  CreateEventSchemaInput,
  EventSchemaResponse,
  UpdateEventSchemaInput,
} from '../types/index.js';

export class SchemasResource {
  constructor(
    private readonly client: BaseClient,
    private readonly appId: string,
  ) {}

  list(): Promise<EventSchemaResponse[]> {
    return this.client.request<EventSchemaResponse[]>(
      'GET',
      `/v1/apps/${this.appId}/schemas`,
    );
  }

  create(input: CreateEventSchemaInput): Promise<EventSchemaResponse> {
    return this.client.request<EventSchemaResponse>(
      'POST',
      `/v1/apps/${this.appId}/schemas`,
      { body: input },
    );
  }

  update(
    schemaId: string,
    input: UpdateEventSchemaInput,
  ): Promise<EventSchemaResponse> {
    return this.client.request<EventSchemaResponse>(
      'PATCH',
      `/v1/apps/${this.appId}/schemas/${schemaId}`,
      { body: input },
    );
  }

  getByEventName(eventName: string): Promise<EventSchemaResponse> {
    return this.client.request<EventSchemaResponse>(
      'GET',
      `/v1/apps/${this.appId}/schemas/by-event-name/${encodeURIComponent(eventName)}`,
    );
  }
}
