#!/usr/bin/env bash
# Send one event to POST /v1/ingest (API key auth).
#
# Your JSON is an *event schema* (defines eventName + fields). The ingest API
# expects: `event` (= schema.eventName), `data` (keys = field names from the schema),
# optional `metadata`, `customer_id`, `level`, `timestamp`.
#
# For the sample shape eventName "string" with one required string field named "string":
#   event: "string", data: {"string": "any text"}
#
# Usage:
#   export VELA_API_KEY='vela_...'
#   export VELA_BASE_URL='http://localhost:7750'   # optional
#   ./scripts/report-event.sh

set -euo pipefail

BASE_URL="${VELA_BASE_URL:-http://localhost:7750}"
API_KEY="${VELA_API_KEY:?Set VELA_API_KEY to your app API key}"

# Must match schema.eventName for app f10d19f2-... (change if yours differs).
EVENT_NAME="${VELA_EVENT_NAME:-string}"

PAYLOAD="$(cat <<EOF
{
  "event": "${EVENT_NAME}",
  "data": {
    "string": "sample value from report-event.sh"
  },
  "metadata": {},
  "level": "info"
}
EOF
)"

curl -sS -X POST "${BASE_URL%/}/v1/ingest" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d "${PAYLOAD}"

echo
