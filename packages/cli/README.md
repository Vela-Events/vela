# @vela-event/cli

CLI for the [Vela](https://docs.velahq.xyz) event intelligence platform. Define event schemas as local JSON files and sync them to the Vela API — like Prisma migrations for your event schemas.

## Installation

```bash
npm install -g @vela-event/cli
# or
npx @vela-event/cli <command>
```

> **Requirements:** Node.js 18+

---

## Quick Start

```bash
# 1. Create a config file
echo '{ "app": "my-app" }' > vela.config.json

# 2. Set your client secret
export VELA_CLIENT_SECRET="vela_cs_..."

# 3. Define a schema
mkdir -p vela/schemas
cat > vela/schemas/order.placed.json << 'EOF'
{
  "eventName": "order.placed",
  "description": "Emitted when a checkout completes",
  "fields": [
    { "id": "fld-order-id", "name": "orderId", "type": "string", "required": true },
    { "id": "fld-amount", "name": "amountCents", "type": "number", "required": true }
  ]
}
EOF

# 4. Preview changes
vela diff

# 5. Push to Vela
vela push
```

---

## Configuration

Create a `vela.config.json` in your project root:

```json
{
  "app": "my-app-slug",
  "schemasDir": "./vela/schemas"
}
```

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `app` | yes | — | App slug or UUID (passed to `forApp()`) |
| `schemasDir` | no | `./vela/schemas` | Directory containing schema JSON files |
| `clientSecret` | no | — | Client secret (`vela_cs_...`). Prefer the env var instead |

### Authentication

Set the `VELA_CLIENT_SECRET` environment variable. This takes precedence over the `clientSecret` field in the config file.

```bash
export VELA_CLIENT_SECRET="vela_cs_..."
```

> Do not commit secrets to `vela.config.json`. Use environment variables or your CI's secret store.

---

## Commands

### `vela push`

Reads local schema files, compares them against the remote API, and creates or updates schemas that have changed.

```bash
vela push
```

```
i Found 3 local schema(s) in ./vela/schemas
✓ Created order.cancelled
✓ Updated order.placed
  ~ description changed
  + field "currency" (enum, required)

i Created 1, Updated 1, Unchanged 1
```

### `vela pull`

Downloads all schemas from the remote API and writes them as local JSON files. Server-only fields (`id`, `appId`, `createdAt`, `updatedAt`) are stripped.

```bash
vela pull
```

```
✓ Pulled order.placed
✓ Pulled payment.failed

i Pulled 2 schema(s) to ./vela/schemas
```

### `vela diff`

Shows what would change without making any mutations. Exits with code 1 if there are pending changes (useful as a CI gate).

```bash
vela diff
```

```
i Found 3 local schema(s) in ./vela/schemas
! order.cancelled  → create
  + field "reason" (string, required)
  + field "refundCents" (number, optional)
! order.placed  → update
  ~ description changed
  + field "currency" (enum, required)
✓ user.signup  → no change

i 1 to create, 1 to update, 1 unchanged
```

Use in CI:

```bash
vela diff || echo "Schemas out of sync — run 'vela push'"
```

---

## CLI Options

All commands accept these flags, which override `vela.config.json`:

```
--app <slug>    App slug or UUID
--dir <path>    Path to schemas directory
--help          Show help
--version       Show version
```

Example:

```bash
vela push --app staging-app --dir ./schemas/staging
```

---

## Schema File Format

Each schema is a JSON file in your schemas directory, named `{eventName}.json`:

```
vela/schemas/
  order.placed.json
  order.cancelled.json
  payment.failed.json
```

### Schema structure

```json
{
  "eventName": "order.placed",
  "description": "Emitted when a checkout completes",
  "fields": [
    {
      "id": "fld-order-id",
      "name": "orderId",
      "type": "string",
      "required": true,
      "description": "Opaque order identifier",
      "validation": { "min": 1, "max": 128 }
    },
    {
      "id": "fld-amount",
      "name": "amountCents",
      "type": "number",
      "required": true
    },
    {
      "id": "fld-currency",
      "name": "currency",
      "type": "enum",
      "required": true,
      "enumValues": ["USD", "EUR", "GBP"]
    },
    {
      "id": "fld-items",
      "name": "itemCount",
      "type": "number",
      "required": false,
      "defaultValue": 1
    }
  ],
  "metadataFields": [
    {
      "id": "meta-env",
      "name": "environment",
      "type": "string",
      "description": "e.g. production, staging"
    }
  ]
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `eventName` | yes | Event name that must match when ingesting |
| `description` | no | Human-readable description |
| `fields` | yes | Array of field definitions (min 1) |
| `metadataFields` | no | Array of metadata field definitions |

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

## How Diffing Works

Schemas are matched between local and remote by `eventName`:

- **No remote match** — schema is created
- **Remote exists** — `description`, `fields`, and `metadataFields` are compared. If any differ, the schema is updated
- **Identical** — no action taken

Fields within a schema are compared by `name` (not `id`). When updating, the full `fields` array is sent to the API, replacing the existing fields entirely.

---

## Typical Workflow

```bash
# Start a new event type
cat > vela/schemas/user.signup.json << 'EOF'
{
  "eventName": "user.signup",
  "fields": [
    { "id": "fld-user-id", "name": "userId", "type": "string", "required": true },
    { "id": "fld-email", "name": "email", "type": "string", "required": true }
  ]
}
EOF

# Preview
vela diff

# Push
vela push

# Later, pull to sync with changes made in the dashboard
vela pull
```

---

## Error Handling

API errors are displayed inline per schema during `push`:

```
✗ Failed order.placed: Validation error: field "orderId" type mismatch
✓ Created payment.failed

i Created 1, Updated 0, Unchanged 0
```

Missing config or authentication errors exit immediately with a clear message:

```
✗ Missing client secret. Set VELA_CLIENT_SECRET or add "clientSecret" to vela.config.json
```
