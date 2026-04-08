import pytest
import respx
import httpx

from vela import VelaManagementClient, AsyncVelaManagementClient
from vela._errors import VelaNotFoundError

BASE = "https://api.velahq.xyz"
SECRET = "vela_cs_testsecret123"

MOCK_APP = {
    "id": "app-1",
    "accountId": "acc-1",
    "name": "Test App",
    "slug": "test-app",
    "apiKeyPrefix": "vela_live_abc",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
}


class TestVelaManagementClientAuth:
    def test_sends_client_secret_as_bearer(self):
        client = VelaManagementClient(SECRET)
        assert client._get_auth_headers() == {"Authorization": f"Bearer {SECRET}"}


class TestAppsResource:
    @respx.mock
    def test_list_apps(self):
        respx.get(f"{BASE}/v1/apps").mock(return_value=httpx.Response(200, json=[MOCK_APP]))
        with VelaManagementClient(SECRET) as client:
            apps = client.apps.list()

        assert len(apps) == 1
        assert apps[0].slug == "test-app"
        assert apps[0].account_id == "acc-1"

    @respx.mock
    def test_create_app(self):
        respx.post(f"{BASE}/v1/apps").mock(
            return_value=httpx.Response(201, json={"app": MOCK_APP, "apiKey": "vela_live_xxx"})
        )
        with VelaManagementClient(SECRET) as client:
            result = client.apps.create({"name": "Test App"})

        assert result.api_key == "vela_live_xxx"
        assert result.app.name == "Test App"

    @respx.mock
    def test_get_app(self):
        respx.get(f"{BASE}/v1/apps/test-app").mock(return_value=httpx.Response(200, json=MOCK_APP))
        with VelaManagementClient(SECRET) as client:
            app = client.apps.get("test-app")
        assert app.id == "app-1"

    @respx.mock
    def test_rotate_key(self):
        respx.post(f"{BASE}/v1/apps/app-1/keys/rotate").mock(
            return_value=httpx.Response(200, json={"app": MOCK_APP, "apiKey": "vela_live_new"})
        )
        with VelaManagementClient(SECRET) as client:
            result = client.apps.rotate_key("app-1")
        assert result.api_key == "vela_live_new"

    @respx.mock
    def test_raises_not_found_on_404(self):
        respx.get(f"{BASE}/v1/apps/bad-id").mock(
            return_value=httpx.Response(404, json={
                "statusCode": 404, "message": "Not found", "error": "Not Found",
                "path": "/v1/apps/bad-id", "timestamp": "",
            })
        )
        with VelaManagementClient(SECRET) as client:
            with pytest.raises(VelaNotFoundError):
                client.apps.get("bad-id")


class TestForApp:
    def test_for_app_returns_scoped_resources(self):
        client = VelaManagementClient(SECRET)
        app_res = client.for_app("my-app")
        assert app_res.schemas is not None
        assert app_res.notification_rules is not None
        assert app_res.events is not None

    @respx.mock
    def test_schemas_list_uses_app_id(self):
        respx.get(f"{BASE}/v1/apps/my-app/schemas").mock(return_value=httpx.Response(200, json=[]))
        with VelaManagementClient(SECRET) as client:
            schemas = client.for_app("my-app").schemas.list()
        assert schemas == []

    @respx.mock
    def test_notification_rules_create(self):
        rule_response = {
            "id": "rule-1", "appId": "my-app", "name": "Alert", "eventName": "order.failed",
            "conditions": [], "actions": [], "enabled": True,
            "lastTriggeredAt": None, "triggerCount": 0,
            "createdAt": "2024-01-01T00:00:00.000Z",
        }
        respx.post(f"{BASE}/v1/apps/my-app/notification-rules").mock(
            return_value=httpx.Response(201, json=rule_response)
        )
        with VelaManagementClient(SECRET) as client:
            rule = client.for_app("my-app").notification_rules.create({
                "name": "Alert",
                "event_name": "order.failed",
                "conditions": [],
                "actions": [],
            })
        assert rule.id == "rule-1"
        assert rule.event_name == "order.failed"

    @respx.mock
    def test_events_list_passes_params(self):
        route = respx.get(f"{BASE}/v1/apps/my-app/events").mock(
            return_value=httpx.Response(200, json={"items": [], "nextCursor": None})
        )
        with VelaManagementClient(SECRET) as client:
            result = client.for_app("my-app").events.list(level="error", limit=10)

        assert result.next_cursor is None
        assert "level=error" in str(route.calls[0].request.url)
        assert "limit=10" in str(route.calls[0].request.url)


class TestAsyncManagementClient:
    @respx.mock
    async def test_list_apps_async(self):
        respx.get(f"{BASE}/v1/apps").mock(return_value=httpx.Response(200, json=[MOCK_APP]))
        async with AsyncVelaManagementClient(SECRET) as client:
            apps = await client.apps.list()
        assert len(apps) == 1
        assert apps[0].slug == "test-app"
