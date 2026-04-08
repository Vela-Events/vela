import pytest
import respx
import httpx

from vela import VelaIngestClient, AsyncVelaIngestClient
from vela._errors import VelaAuthError, VelaValidationError, VelaNotFoundError

BASE = "https://api.velahq.xyz"

MOCK_EVENT = {
    "id": "evt-1",
    "appId": "app-1",
    "event": "order.placed",
    "customer_id": None,
    "data": {"orderId": "1"},
    "level": "info",
    "metadata": {},
    "timestamp": "2024-01-01T00:00:00.000Z",
    "ingestedAt": "2024-01-01T00:00:01.000Z",
}

MOCK_INGEST_RESPONSE = {"accepted": 1, "events": [MOCK_EVENT]}


class TestVelaIngestClientSync:
    @respx.mock
    def test_ingest_single_event(self):
        respx.post(f"{BASE}/v1/ingest").mock(
            return_value=httpx.Response(201, json=MOCK_INGEST_RESPONSE)
        )
        with VelaIngestClient("vela_live_test") as client:
            result = client.ingest({"event": "order.placed", "data": {"orderId": "1"}, "level": "info"})

        assert result.accepted == 1
        assert len(result.events) == 1
        assert result.events[0].event == "order.placed"
        assert result.events[0].app_id == "app-1"
        assert result.events[0].ingested_at == "2024-01-01T00:00:01.000Z"

    @respx.mock
    def test_ingest_batch(self):
        batch_response = {"accepted": 2, "events": []}
        respx.post(f"{BASE}/v1/ingest").mock(
            return_value=httpx.Response(201, json=batch_response)
        )
        with VelaIngestClient("vela_live_test") as client:
            result = client.ingest([
                {"event": "order.placed", "data": {}, "level": "info"},
                {"event": "order.paid", "data": {}, "level": "success"},
            ])

        assert result.accepted == 2

    @respx.mock
    def test_sends_api_key_header(self):
        route = respx.post(f"{BASE}/v1/ingest").mock(
            return_value=httpx.Response(201, json=MOCK_INGEST_RESPONSE)
        )
        with VelaIngestClient("my-test-key") as client:
            client.ingest({"event": "x", "data": {}, "level": "info"})

        assert route.called
        assert route.calls[0].request.headers["x-api-key"] == "my-test-key"

    @respx.mock
    def test_raises_validation_error_on_400(self):
        respx.post(f"{BASE}/v1/ingest").mock(
            return_value=httpx.Response(400, json={
                "statusCode": 400, "message": "Bad request", "error": "Bad Request",
                "path": "/v1/ingest", "timestamp": "",
            })
        )
        with VelaIngestClient("key") as client:
            with pytest.raises(VelaValidationError):
                client.ingest({"event": "x", "data": {}, "level": "info"})

    @respx.mock
    def test_raises_auth_error_on_401(self):
        respx.post(f"{BASE}/v1/ingest").mock(
            return_value=httpx.Response(401, json={
                "statusCode": 401, "message": "Unauthorized", "error": "Unauthorized",
                "path": "/v1/ingest", "timestamp": "",
            })
        )
        with VelaIngestClient("bad-key") as client:
            with pytest.raises(VelaAuthError):
                client.ingest({"event": "x", "data": {}, "level": "info"})

    @respx.mock
    def test_optional_fields_passed(self):
        route = respx.post(f"{BASE}/v1/ingest").mock(
            return_value=httpx.Response(201, json=MOCK_INGEST_RESPONSE)
        )
        with VelaIngestClient("key") as client:
            client.ingest({
                "event": "order.placed",
                "data": {},
                "level": "info",
                "customer_id": "cust-1",
                "metadata": {"env": "prod"},
                "timestamp": "2024-01-01T00:00:00.000Z",
            })

        import json
        body = json.loads(route.calls[0].request.content)
        assert body["customer_id"] == "cust-1"
        assert body["metadata"] == {"env": "prod"}
        assert body["timestamp"] == "2024-01-01T00:00:00.000Z"


class TestAsyncVelaIngestClient:
    @respx.mock
    async def test_ingest_single_event(self):
        respx.post(f"{BASE}/v1/ingest").mock(
            return_value=httpx.Response(201, json=MOCK_INGEST_RESPONSE)
        )
        async with AsyncVelaIngestClient("vela_live_test") as client:
            result = await client.ingest({"event": "order.placed", "data": {}, "level": "info"})

        assert result.accepted == 1

    @respx.mock
    async def test_ingest_batch(self):
        respx.post(f"{BASE}/v1/ingest").mock(
            return_value=httpx.Response(201, json={"accepted": 3, "events": []})
        )
        async with AsyncVelaIngestClient("key") as client:
            result = await client.ingest([
                {"event": "a", "data": {}, "level": "info"},
                {"event": "b", "data": {}, "level": "error"},
                {"event": "c", "data": {}, "level": "success"},
            ])
        assert result.accepted == 3
