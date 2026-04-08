# @vela-event/sdk

TypeScript/JavaScript SDK for the [Vela](https://docs.vela.xyz) event intelligence platform.

## Installation

```bash
npm install @vela-event/sdk
# or
pnpm add @vela-event/sdk
# or
yarn add @vela-event/sdk
```

> **Requirements:** Node.js 18+ (uses native `fetch`). Works in all modern browsers.

---

## Credentials

You need two types of credentials, both generated in the **Vela dashboard**:

| Credential | Format | Used for |
|------------|--------|----------|
| Client secret | `vela_cs_…` | Managing apps, schemas, notification rules |
| App API key | `vela_live_…` | Ingesting events |

Neither credential is generated or managed through the SDK — get them from your dashboard and store them as environment variables.

---

## Quick Start

```typescript
import { VelaIngestClient, VelaManagementClient } from '@vela-event/sdk';

// Management — authenticated with client secret from your dashboard
const client = new VelaManagementClient(process.env.VELA_CLIENT_SECRET);

const apps = await client.apps.list();
const appRes = client.forApp('my-app');
const schemas = await appRes.schemas.list();

// Ingest — authenticated with app API key from your dashboard
const ingest = new VelaIngestClient(process.env.VELA_API_KEY);
await ingest.ingest({
  event: 'order.placed',
  data: { orderId: 'ord_1', amountCents: 4999 },
  level: 'info',
});
```

---

## VelaIngestClient

Sends events to Vela. Requires your app's **API key** (`vela_live_…`).

### Constructor

```typescript
const client = new VelaIngestClient(apiKey: string, options?: VelaClientOptions);
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseUrl` | `string` | `https://api.velahq.xyz` | Override the API base URL |
| `timeout` | `number` | `30000` | Request timeout in milliseconds |
| `fetchImpl` | `typeof fetch` | `globalThis.fetch` | Custom fetch implementation |

### Single event

```typescript
const result = await client.ingest({
  event: 'order.placed',       // required — must match a registered schema
  data: {                       // required — event payload
    orderId: 'ord_abc123',
    amountCents: 4999,
    currency: 'USD',
  },
  level: 'info',                // required — 'info' | 'warning' | 'error' | 'success'
  customer_id: 'cust_42',       // optional
  metadata: { env: 'prod' },    // optional
  timestamp: '2024-06-01T12:00:00.000Z', // optional — defaults to now
});

console.log(result.accepted);     // 1
console.log(result.events[0].id); // UUID of the ingested event
```

### Batch (up to 100 events)

```typescript
const result = await client.ingest([
  { event: 'order.placed',   data: { orderId: 'ord_1' }, level: 'info' },
  { event: 'order.placed',   data: { orderId: 'ord_2' }, level: 'info' },
  { event: 'payment.failed', data: { orderId: 'ord_3', reason: 'card_declined' }, level: 'error' },
]);

console.log(result.accepted); // 3
```

### Event levels

| Level | When to use |
|-------|-------------|
| `info` | Normal business events — order placed, user signed up |
| `success` | Completed flows — payment captured, email delivered |
| `warning` | Degraded but non-critical — retry #2, slow response |
| `error` | Failures requiring attention — payment failed, webhook error |

---

## VelaManagementClient

Manages apps, schemas, and notification rules. Requires your **client secret** (`vela_cs_…`) from the Vela dashboard.

### Constructor

```typescript
const client = new VelaManagementClient(clientSecret: string, options?: VelaClientOptions);
```

```typescript
const client = new VelaManagementClient(process.env.VELA_CLIENT_SECRET);
```

---

## Apps

### List apps

```typescript
const apps = await client.apps.list();

apps.forEach(app => {
  console.log(app.id, app.name, app.slug, app.apiKeyPrefix);
});
```

### Create an app

```typescript
const { app, apiKey } = await client.apps.create({
  name: 'Order Service',
  slug: 'order-service', // optional — auto-generated from name if omitted
});

// ⚠️  apiKey is shown only once — store it immediately
console.log(apiKey); // vela_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Get an app

```typescript
// accepts either a UUID or a slug
const app = await client.apps.get('order-service');
const app = await client.apps.get('3f2a1b4c-...');
```

### Update an app

```typescript
const updated = await client.apps.update('order-service', {
  name: 'Orders v2',
  slug: 'orders-v2',
});
```

### Rotate API key

```typescript
const { app, apiKey } = await client.apps.rotateKey('order-service');
// ⚠️  Old key is immediately revoked — store the new one
```

---

## App-scoped resources

Schemas, notification rules, and events are all scoped to a specific app via `forApp()`.

```typescript
const appRes = client.forApp('order-service'); // UUID or slug

// appRes.schemas
// appRes.notificationRules
// appRes.events
```

---

## Schemas

Every event name you ingest must have a registered schema. The schema defines the expected fields and their types — events are validated against it at ingest time.

### List schemas

```typescript
const schemas = await appRes.schemas.list();
```

### Get by event name

```typescript
const schema = await appRes.schemas.getByEventName('order.placed');
```

### Create a schema

```typescript
const schema = await appRes.schemas.create({
  eventName: 'order.placed',
  description: 'Emitted when a checkout completes', // optional
  fields: [
    {
      id: 'fld-order-id',
      name: 'orderId',
      type: 'string',
      required: true,
      validation: { min: 1, max: 128 },
    },
    {
      id: 'fld-amount',
      name: 'amountCents',
      type: 'number',
      required: true,
    },
    {
      id: 'fld-currency',
      name: 'currency',
      type: 'enum',
      required: true,
      enumValues: ['USD', 'EUR', 'GBP'],
    },
    {
      id: 'fld-items',
      name: 'itemCount',
      type: 'number',
      required: false,
      defaultValue: 1,
    },
  ],
  metadataFields: [
    {
      id: 'meta-env',
      name: 'environment',
      type: 'string',
      description: 'e.g. production, staging',
    },
  ],
});
```

### Update a schema

```typescript
const updated = await appRes.schemas.update(schema.id, {
  description: 'Updated description',
  fields: [...],
});
```

### Field types

| Type | Description | Validation options |
|------|-------------|-------------------|
| `string` | Text value | `min`, `max` (length), `pattern` (regex) |
| `number` | Numeric value | `min`, `max` |
| `boolean` | `true` or `false` | — |
| `date` | ISO-8601 date string | — |
| `enum` | Fixed set of strings — provide `enumValues` | — |
| `object` | Nested JSON object | — |

---

## Notification Rules

Rules watch for events matching a name and optional conditions, then deliver alerts to configured destinations (Slack, Discord, or email). Destinations are configured in the dashboard.

### List rules

```typescript
const rules = await appRes.notificationRules.list();
```

### Create a rule

```typescript
const rule = await appRes.notificationRules.create({
  name: 'Alert on large payment failure',
  eventName: 'payment.failed',
  enabled: true, // optional, defaults to true
  conditions: [
    // Only trigger when amountCents > 10000
    {
      id: 'cond-1',
      field: 'amountCents',
      operator: 'greater_than',
      value: 10000,
    },
  ],
  actions: [
    {
      id: 'action-1',
      destinationId: 'dest-uuid-here', // from your dashboard
      channel: 'slack',
      enabled: true,
    },
  ],
});
```

> Pass an empty `conditions` array to trigger on every matching event regardless of payload.

### Update a rule

```typescript
// Pause a rule
await appRes.notificationRules.update(rule.id, { enabled: false });

// Update conditions
await appRes.notificationRules.update(rule.id, {
  conditions: [
    { id: 'cond-1', field: 'amountCents', operator: 'greater_than', value: 50000 },
  ],
});
```

### Condition operators

| Operator | Description |
|----------|-------------|
| `equals` | Field strictly equals value |
| `not_equals` | Field does not equal value |
| `greater_than` | Numeric field is greater than value |
| `less_than` | Numeric field is less than value |
| `contains` | String field contains value as substring |
| `starts_with` | String field starts with value |

---

## Events (read)

### List events

```typescript
const { items, nextCursor } = await appRes.events.list();
```

### With filters

```typescript
const { items, nextCursor } = await appRes.events.list({
  level: 'error',                          // filter by level
  type: 'payment.failed',                  // filter by event name
  from: '2024-06-01T00:00:00.000Z',        // start of time range (ISO-8601)
  to:   '2024-06-30T23:59:59.999Z',        // end of time range
  limit: 50,                               // per page, default 25, max 100
});
```

### Cursor pagination

```typescript
let cursor: string | null | undefined;

do {
  const page = await appRes.events.list({ limit: 100, cursor });
  processBatch(page.items);
  cursor = page.nextCursor;
} while (cursor);
```

---

## Error handling

All errors extend `VelaError` and include `statusCode`, `error`, `path`, and `timestamp`.

```typescript
import {
  VelaError,
  VelaAuthError,
  VelaForbiddenError,
  VelaNotFoundError,
  VelaValidationError,
  VelaRateLimitError,
} from '@vela-event/sdk';

try {
  await client.apps.get('nonexistent');
} catch (err) {
  if (err instanceof VelaNotFoundError) {
    console.error('App not found');
  } else if (err instanceof VelaAuthError) {
    console.error('Invalid or missing client secret');
  } else if (err instanceof VelaValidationError) {
    console.error('Validation error:', err.message);
  } else if (err instanceof VelaError) {
    console.error(`API error ${err.statusCode}:`, err.message);
  } else {
    throw err; // network error, timeout, etc.
  }
}
```

| Error class | HTTP status |
|-------------|-------------|
| `VelaValidationError` | 400 |
| `VelaAuthError` | 401 |
| `VelaForbiddenError` | 403 |
| `VelaNotFoundError` | 404 |
| `VelaRateLimitError` | 429 |
| `VelaError` (base) | any other 4xx / 5xx |

> Network errors (DNS failure, timeout, connection refused) propagate as native `TypeError` or `DOMException` rather than `VelaError`, so you can distinguish transport failures from API errors.

---

## Configuration

### Custom base URL

```typescript
// Self-hosted or local development
const client = new VelaManagementClient(process.env.VELA_CLIENT_SECRET, {
  baseUrl: 'http://localhost:3000',
});
```

### Custom timeout

```typescript
const client = new VelaIngestClient(process.env.VELA_API_KEY, {
  timeout: 5_000, // 5 seconds
});
```

### Custom fetch

```typescript
// Edge runtimes or testing
const client = new VelaIngestClient(process.env.VELA_API_KEY, {
  fetchImpl: myCustomFetch,
});
```

---

## TypeScript types

All types are exported directly from the package:

```typescript
import type {
  // Primitives
  EventLevel,
  Plan,
  IntegrationProvider,
  SchemaFieldType,
  ConditionOperator,

  // Apps
  AppResponse,
  AppWithKeyResponse,
  CreateAppInput,
  UpdateAppInput,

  // Ingest
  IngestEventInput,
  IngestResponse,
  EventResponse,
  EventListParams,
  EventListResponse,

  // Schemas
  SchemaField,
  SchemaFieldValidation,
  SchemaMetadataField,
  EventSchemaResponse,
  CreateEventSchemaInput,
  UpdateEventSchemaInput,

  // Notification rules
  NotificationCondition,
  NotificationAction,
  NotificationRuleResponse,
  CreateNotificationRuleInput,
  UpdateNotificationRuleInput,
} from '@vela-event/sdk';
```

---

## Complete example

```typescript
import { VelaIngestClient, VelaManagementClient } from '@vela-event/sdk';

async function main() {
  const client = new VelaManagementClient(process.env.VELA_CLIENT_SECRET);
  const ingest = new VelaIngestClient(process.env.VELA_API_KEY);

  // ── Apps ──────────────────────────────────────────────────────────────────
  const apps = await client.apps.list();
  const appRes = client.forApp(apps[0].slug);

  // ── Schemas ───────────────────────────────────────────────────────────────
  await appRes.schemas.create({
    eventName: 'order.placed',
    fields: [
      { id: 'f1', name: 'orderId',     type: 'string', required: true },
      { id: 'f2', name: 'amountCents', type: 'number', required: true },
    ],
  });

  // ── Notification rules ────────────────────────────────────────────────────
  await appRes.notificationRules.create({
    name: 'Alert on high-value failure',
    eventName: 'payment.failed',
    conditions: [
      { id: 'c1', field: 'amountCents', operator: 'greater_than', value: 50000 },
    ],
    actions: [
      { id: 'a1', destinationId: '<dest-id>', channel: 'slack', enabled: true },
    ],
  });

  // ── Ingest ────────────────────────────────────────────────────────────────
  await ingest.ingest([
    { event: 'order.placed', data: { orderId: 'ord_1', amountCents: 1999 }, level: 'info' },
    { event: 'order.placed', data: { orderId: 'ord_2', amountCents: 75000 }, level: 'info' },
  ]);

  // ── Read events ───────────────────────────────────────────────────────────
  const { items } = await appRes.events.list({ level: 'error', limit: 20 });
  console.log(`${items.length} error events found`);
}

main().catch(console.error);
```
