# vela-sdk

Python SDK for the [Vela](https://vela.dev) event intelligence platform.

## Installation

```bash
pip install vela-sdk
```

> **Requirements:** Python 3.9+. Supports both sync and async usage via [httpx](https://www.python-httpx.org/).

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

```python
import os
from vela import VelaIngestClient, VelaManagementClient

# Management — authenticated with your client secret from the dashboard
with VelaManagementClient(os.environ["VELA_CLIENT_SECRET"]) as client:
    apps = client.apps.list()
    app_res = client.for_app(apps[0].slug)
    schemas = app_res.schemas.list()

# Ingest — authenticated with your app API key from the dashboard
with VelaIngestClient(os.environ["VELA_API_KEY"]) as ingest:
    ingest.ingest({
        "event": "order.placed",
        "data": {"orderId": "ord_1", "amountCents": 4999},
        "level": "info",
    })
```

---

## VelaIngestClient

Sends events to Vela. Requires your app's **API key** (`vela_live_…`).

### Sync

```python
from vela import VelaIngestClient

with VelaIngestClient("vela_live_xxx") as client:
    result = client.ingest({
        "event": "order.placed",
        "data": {"orderId": "ord_1", "amountCents": 4999},
        "level": "info",
    })
    print(result.accepted)  # 1
```

### Async

```python
from vela import AsyncVelaIngestClient

async with AsyncVelaIngestClient("vela_live_xxx") as client:
    result = await client.ingest({
        "event": "order.placed",
        "data": {"orderId": "ord_1", "amountCents": 4999},
        "level": "info",
    })
```

### Constructor

```python
VelaIngestClient(
    api_key: str,
    *,
    base_url: str = "https://api.velahq.xyz",
    timeout: float = 30.0,
)
```

### Single event

```python
result = client.ingest({
    "event": "order.placed",       # required — must match a registered schema
    "data": {                       # required — event payload
        "orderId": "ord_abc123",
        "amountCents": 4999,
        "currency": "USD",
    },
    "level": "info",                # required — 'info' | 'warning' | 'error' | 'success'
    "customer_id": "cust_42",       # optional
    "metadata": {"env": "prod"},    # optional
    "timestamp": "2024-06-01T12:00:00.000Z",  # optional — defaults to now
})

print(result.accepted)        # 1
print(result.events[0].id)    # UUID of the ingested event
```

### Batch (up to 100 events)

```python
result = client.ingest([
    {"event": "order.placed",   "data": {"orderId": "ord_1"}, "level": "info"},
    {"event": "order.placed",   "data": {"orderId": "ord_2"}, "level": "info"},
    {"event": "payment.failed", "data": {"orderId": "ord_3", "reason": "card_declined"}, "level": "error"},
])

print(result.accepted)  # 3
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

```python
VelaManagementClient(
    client_secret: str,
    *,
    base_url: str = "https://api.velahq.xyz",
    timeout: float = 30.0,
)
```

```python
import os
from vela import VelaManagementClient

client = VelaManagementClient(os.environ["VELA_CLIENT_SECRET"])
```

### Async variant

```python
from vela import AsyncVelaManagementClient

async with AsyncVelaManagementClient(os.environ["VELA_CLIENT_SECRET"]) as client:
    apps = await client.apps.list()
```

---

## Apps

### List apps

```python
apps = client.apps.list()

for app in apps:
    print(app.id, app.name, app.slug, app.api_key_prefix)
```

### Create an app

```python
result = client.apps.create({"name": "Order Service"})
# result.app     — AppResponse
# result.api_key — full API key (shown only once — store it immediately)

print(result.api_key)  # vela_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Optionally provide a slug:

```python
result = client.apps.create({"name": "Order Service", "slug": "order-service"})
```

### Get an app

```python
# accepts UUID or slug
app = client.apps.get("order-service")
```

### Update an app

```python
updated = client.apps.update("order-service", {"name": "Orders v2"})
```

### Rotate API key

```python
result = client.apps.rotate_key("order-service")
# ⚠️  Old key is immediately revoked — store the new one
print(result.api_key)
```

---

## App-scoped resources

Schemas, notification rules, and events are scoped to a specific app via `for_app()`.

```python
app_res = client.for_app("order-service")  # UUID or slug

# app_res.schemas
# app_res.notification_rules
# app_res.events
```

---

## Schemas

Every event name you ingest must have a registered schema. Fields are validated against it at ingest time.

### List schemas

```python
schemas = app_res.schemas.list()
```

### Get by event name

```python
schema = app_res.schemas.get_by_event_name("order.placed")
```

### Create a schema

```python
schema = app_res.schemas.create({
    "event_name": "order.placed",
    "description": "Emitted when a checkout completes",  # optional
    "fields": [
        {
            "id": "fld-order-id",
            "name": "orderId",
            "type": "string",
            "required": True,
            "validation": {"min": 1, "max": 128},
        },
        {
            "id": "fld-amount",
            "name": "amountCents",
            "type": "number",
            "required": True,
        },
        {
            "id": "fld-currency",
            "name": "currency",
            "type": "enum",
            "required": True,
            "enum_values": ["USD", "EUR", "GBP"],
        },
        {
            "id": "fld-items",
            "name": "itemCount",
            "type": "number",
            "required": False,
            "default_value": 1,
        },
    ],
    "metadata_fields": [
        {"id": "meta-env", "name": "environment", "type": "string"},
    ],
})
```

### Update a schema

```python
updated = app_res.schemas.update(schema.id, {"description": "Updated"})
```

### Field types

| Type | Description | Validation options |
|------|-------------|-------------------|
| `string` | Text value | `min`, `max` (length), `pattern` (regex) |
| `number` | Numeric value | `min`, `max` |
| `boolean` | `True` or `False` | — |
| `date` | ISO-8601 date string | — |
| `enum` | Fixed set of strings — provide `enum_values` | — |
| `object` | Nested dict | — |

---

## Notification Rules

Rules watch for events matching a name and optional conditions, then deliver alerts to configured destinations. Destinations are configured in the dashboard.

### List rules

```python
rules = app_res.notification_rules.list()
```

### Create a rule

```python
rule = app_res.notification_rules.create({
    "name": "Alert on large payment failure",
    "event_name": "payment.failed",
    "enabled": True,  # optional, defaults to True
    "conditions": [
        {
            "id": "cond-1",
            "field": "amountCents",
            "operator": "greater_than",
            "value": 10000,
        },
    ],
    "actions": [
        {
            "id": "action-1",
            "destination_id": "dest-uuid-here",  # from your dashboard
            "channel": "slack",
            "enabled": True,
        },
    ],
})
```

> Pass an empty `conditions` list to trigger on every matching event.

### Update a rule

```python
# Pause a rule
app_res.notification_rules.update(rule.id, {"enabled": False})
```

### Condition operators

| Operator | Description |
|----------|-------------|
| `equals` | Field strictly equals value |
| `not_equals` | Field does not equal value |
| `greater_than` | Numeric field is greater than value |
| `less_than` | Numeric field is less than value |
| `contains` | String field contains substring |
| `starts_with` | String field starts with value |

---

## Events (read)

### List events

```python
result = app_res.events.list()
# result.items       — list[EventResponse]
# result.next_cursor — str | None
```

### With filters

```python
result = app_res.events.list(
    level="error",
    type="payment.failed",
    from_="2024-06-01T00:00:00.000Z",   # note: from_ to avoid shadowing Python built-in
    to="2024-06-30T23:59:59.999Z",
    limit=50,
)
```

### Cursor pagination

```python
cursor = None

while True:
    page = app_res.events.list(limit=100, cursor=cursor)
    process_batch(page.items)
    if page.next_cursor is None:
        break
    cursor = page.next_cursor
```

---

## Error handling

```python
from vela import (
    VelaError,
    VelaAuthError,
    VelaForbiddenError,
    VelaNotFoundError,
    VelaValidationError,
    VelaRateLimitError,
)

try:
    client.apps.get("nonexistent")
except VelaNotFoundError:
    print("App not found")
except VelaAuthError:
    print("Invalid or missing client secret")
except VelaValidationError as e:
    print(f"Validation error: {e}")
except VelaError as e:
    print(f"API error {e.status_code}: {e}")
```

| Exception | HTTP status |
|-----------|-------------|
| `VelaValidationError` | 400 |
| `VelaAuthError` | 401 |
| `VelaForbiddenError` | 403 |
| `VelaNotFoundError` | 404 |
| `VelaRateLimitError` | 429 |
| `VelaError` (base) | any other 4xx / 5xx |

> Network errors (timeout, connection refused) propagate as `httpx.TimeoutException` or `httpx.ConnectError` — not wrapped in `VelaError`.

---

## Configuration

### Custom base URL

```python
# Self-hosted or local development
client = VelaManagementClient(
    os.environ["VELA_CLIENT_SECRET"],
    base_url="http://localhost:3000",
)
```

### Custom timeout

```python
client = VelaIngestClient(os.environ["VELA_API_KEY"], timeout=5.0)
```

---

## Complete example

```python
import os
from vela import VelaIngestClient, VelaManagementClient

def main():
    client = VelaManagementClient(os.environ["VELA_CLIENT_SECRET"])
    ingest = VelaIngestClient(os.environ["VELA_API_KEY"])

    # ── Apps ──────────────────────────────────────────────────────────────────
    apps = client.apps.list()
    app_res = client.for_app(apps[0].slug)

    # ── Schemas ───────────────────────────────────────────────────────────────
    app_res.schemas.create({
        "event_name": "order.placed",
        "fields": [
            {"id": "f1", "name": "orderId",     "type": "string", "required": True},
            {"id": "f2", "name": "amountCents", "type": "number", "required": True},
        ],
    })

    # ── Notification rules ────────────────────────────────────────────────────
    app_res.notification_rules.create({
        "name": "Alert on high-value failure",
        "event_name": "payment.failed",
        "conditions": [
            {"id": "c1", "field": "amountCents", "operator": "greater_than", "value": 50000},
        ],
        "actions": [
            {"id": "a1", "destination_id": "<dest-id>", "channel": "slack", "enabled": True},
        ],
    })

    # ── Ingest ────────────────────────────────────────────────────────────────
    ingest.ingest([
        {"event": "order.placed", "data": {"orderId": "ord_1", "amountCents": 1999}, "level": "info"},
        {"event": "order.placed", "data": {"orderId": "ord_2", "amountCents": 75000}, "level": "info"},
    ])

    # ── Read events ───────────────────────────────────────────────────────────
    result = app_res.events.list(level="error", limit=20)
    print(f"{len(result.items)} error events found")

    client.close()
    ingest.close()


if __name__ == "__main__":
    main()
```

### Async version

```python
import asyncio
import os
from vela import AsyncVelaIngestClient, AsyncVelaManagementClient


async def main():
    async with AsyncVelaManagementClient(os.environ["VELA_CLIENT_SECRET"]) as client:
        async with AsyncVelaIngestClient(os.environ["VELA_API_KEY"]) as ingest:
            apps = await client.apps.list()
            app_res = client.for_app(apps[0].slug)

            await ingest.ingest({
                "event": "order.placed",
                "data": {"orderId": "ord_1", "amountCents": 4999},
                "level": "info",
            })

            result = await app_res.events.list(level="info", limit=10)
            print(f"{len(result.items)} events")


asyncio.run(main())
```
