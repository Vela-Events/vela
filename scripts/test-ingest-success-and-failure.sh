#!/usr/bin/env bash
# Test POST /v1/ingest: one request that should succeed, two that should fail
# (after schema from scripts/example-event-schema.json exists for this app).
#
# Usage:
#   export VELA_API_KEY='your-key'
#   export VELA_BASE_URL='http://localhost:7750'   # optional
#   ./scripts/test-ingest-success-and-failure.sh
#
# Expects:
#   - Success: HTTP 201, body contains "accepted"
#   - Failure cases: HTTP 400 (schema validation) from missing field / bad enum

set -euo pipefail

BASE_URL="${VELA_BASE_URL:-http://localhost:7750}"
API_KEY="${VELA_API_KEY:?Set VELA_API_KEY}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENDPOINT="${BASE_URL%/}/v1/ingest"

pass=0
fail=0

run_case() {
  local name="$1"
  local file="$2"
  local want="$3"

  local code body
  body="$(curl -sS -X POST "$ENDPOINT" \
    -H "Content-Type: application/json" \
    -H "x-api-key: ${API_KEY}" \
    -d @"$file" \
    -w "\n%{http_code}")" || true

  code="$(echo "$body" | tail -n1)"
  body="$(echo "$body" | sed '$d')"

  if [[ "$code" == "$want" ]]; then
    echo "PASS  [$name]  HTTP $code"
    pass=$((pass + 1))
  else
    echo "FAIL  [$name]  expected HTTP $want, got $code"
    echo "       body: $body"
    fail=$((fail + 1))
  fi
}

echo "Endpoint: $ENDPOINT"
echo ""

run_case "valid payload (order.placed)" \
  "$ROOT/scripts/example-ingest-order-placed.json" "201"

run_case "invalid: missing required orderId" \
  "$ROOT/scripts/example-ingest-order-placed.invalid-missing-field.json" "400"

run_case "invalid: currency not in enum" \
  "$ROOT/scripts/example-ingest-order-placed.invalid-bad-enum.json" "400"

echo ""
if [[ "$fail" -eq 0 ]]; then
  echo "All $pass checks passed."
  exit 0
else
  echo "$fail check(s) failed, $pass passed."
  echo "If \"valid\" failed with 400, register the schema first:"
  echo "  POST .../apps/<appId>/schemas  @scripts/example-event-schema.json"
  exit 1
fi
