// ─── Primitives ──────────────────────────────────────────────────────────────

export type EventLevel = 'info' | 'warning' | 'error' | 'success';
export type Plan = 'free' | 'pro' | 'enterprise';
export type IntegrationProvider = 'slack' | 'discord' | 'email';
export type SchemaFieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'enum'
  | 'object';
export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'contains'
  | 'starts_with';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface RequestTokenInput {
  email: string;
  name?: string;
}

export interface AccountResponse {
  id: string;
  email: string;
  name: string;
  plan: Plan;
  appsLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  account: AccountResponse;
}

// ─── Apps ─────────────────────────────────────────────────────────────────────

export interface AppResponse {
  id: string;
  accountId: string;
  name: string;
  slug: string;
  apiKeyPrefix: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppWithKeyResponse {
  app: AppResponse;
  apiKey: string;
}

export interface CreateAppInput {
  name: string;
  slug?: string;
}

export interface UpdateAppInput {
  name?: string;
  slug?: string;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export interface IngestEventInput {
  event: string;
  customer_id?: string;
  data: Record<string, unknown>;
  level: EventLevel;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

export interface EventResponse {
  id: string;
  appId: string;
  event: string;
  customer_id: string | null;
  data: Record<string, unknown>;
  level: EventLevel;
  metadata: Record<string, unknown>;
  timestamp: string;
  ingestedAt: string;
}

export interface IngestResponse {
  accepted: number;
  events: EventResponse[];
}

export interface EventListParams {
  level?: EventLevel;
  type?: string;
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
}

export interface EventListResponse {
  items: EventResponse[];
  nextCursor: string | null;
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

export interface SchemaFieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
}

export interface SchemaField {
  id: string;
  name: string;
  type: SchemaFieldType;
  required: boolean;
  defaultValue?: unknown;
  description?: string;
  enumValues?: string[];
  validation?: SchemaFieldValidation;
}

export interface SchemaMetadataField {
  id: string;
  name: string;
  type: SchemaFieldType;
  description?: string;
}

export interface EventSchemaResponse {
  id: string;
  appId: string;
  eventName: string;
  description: string | null;
  fields: SchemaField[];
  metadataFields: SchemaMetadataField[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventSchemaInput {
  eventName: string;
  description?: string;
  fields: SchemaField[];
  metadataFields?: SchemaMetadataField[];
}

export interface UpdateEventSchemaInput {
  eventName?: string;
  description?: string;
  fields?: SchemaField[];
  metadataFields?: SchemaMetadataField[];
}

// ─── Notification Rules ───────────────────────────────────────────────────────

export interface NotificationCondition {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: unknown;
}

export interface NotificationAction {
  id: string;
  destinationId: string;
  channel: IntegrationProvider;
  target?: string;
  enabled: boolean;
}

export interface NotificationRuleResponse {
  id: string;
  appId: string;
  name: string;
  eventName: string;
  conditions: NotificationCondition[];
  actions: NotificationAction[];
  enabled: boolean;
  lastTriggeredAt: string | null;
  triggerCount: number;
  createdAt: string;
}

export interface CreateNotificationRuleInput {
  name: string;
  eventName: string;
  conditions: NotificationCondition[];
  actions: NotificationAction[];
  enabled?: boolean;
}

export interface UpdateNotificationRuleInput {
  name?: string;
  eventName?: string;
  conditions?: NotificationCondition[];
  actions?: NotificationAction[];
  enabled?: boolean;
}
