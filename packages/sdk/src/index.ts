export { VelaIngestClient } from './client/ingest-client.js';
export { VelaManagementClient } from './client/management-client.js';
export type { AppScopedResources } from './client/management-client.js';
export type { VelaClientOptions } from './client/base-client.js';

export {
  VelaError,
  VelaAuthError,
  VelaForbiddenError,
  VelaNotFoundError,
  VelaValidationError,
  VelaRateLimitError,
} from './errors.js';

export type {
  EventLevel,
  Plan,
  IntegrationProvider,
  SchemaFieldType,
  ConditionOperator,
  AppResponse,
  AppWithKeyResponse,
  CreateAppInput,
  UpdateAppInput,
  IngestEventInput,
  EventResponse,
  IngestResponse,
  EventListParams,
  EventListResponse,
  SchemaField,
  SchemaFieldValidation,
  SchemaMetadataField,
  EventSchemaResponse,
  CreateEventSchemaInput,
  UpdateEventSchemaInput,
  NotificationCondition,
  NotificationAction,
  NotificationRuleResponse,
  CreateNotificationRuleInput,
  UpdateNotificationRuleInput,
} from './types/index.js';
