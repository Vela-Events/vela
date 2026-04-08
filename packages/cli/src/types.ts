import type {
  SchemaField,
  SchemaMetadataField,
  EventSchemaResponse,
} from '@vela-event/sdk';

export interface CliConfig {
  clientSecret: string;
  app: string;
  schemasDir: string;
  baseUrl?: string;
}

export interface LocalSchema {
  eventName: string;
  description?: string;
  fields: SchemaField[];
  metadataFields?: SchemaMetadataField[];
}

export type ChangeType = 'create' | 'update' | 'no-change';

export interface ChangeEntry {
  eventName: string;
  type: ChangeType;
  local: LocalSchema;
  remote: EventSchemaResponse | null;
  details: string[];
}

export type ChangeSet = ChangeEntry[];
