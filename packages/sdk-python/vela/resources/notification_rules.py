from __future__ import annotations

from typing import TYPE_CHECKING, Any

from .._types import (
    CreateNotificationRuleInput,
    NotificationRuleResponse,
    UpdateNotificationRuleInput,
)

if TYPE_CHECKING:
    from ..management import VelaManagementClient, AsyncVelaManagementClient


def _rule_input_to_api(d: dict) -> dict:
    """Convert snake_case rule input keys to camelCase for the API."""
    result: dict[str, Any] = {}
    if "name" in d:
        result["name"] = d["name"]
    if "event_name" in d:
        result["eventName"] = d["event_name"]
    if "conditions" in d:
        result["conditions"] = [_condition_to_api(c) for c in d["conditions"]]
    if "actions" in d:
        result["actions"] = [_action_to_api(a) for a in d["actions"]]
    if "enabled" in d:
        result["enabled"] = d["enabled"]
    return result


def _condition_to_api(c: dict) -> dict:
    return {"id": c["id"], "field": c["field"], "operator": c["operator"], "value": c["value"]}


def _action_to_api(a: dict) -> dict:
    out: dict[str, Any] = {
        "id": a["id"],
        "destinationId": a["destination_id"],
        "channel": a["channel"],
        "enabled": a["enabled"],
    }
    if "target" in a:
        out["target"] = a["target"]
    return out


class NotificationRulesResource:
    def __init__(self, client: "VelaManagementClient", app_id: str) -> None:
        self._client = client
        self._app_id = app_id

    def list(self) -> list[NotificationRuleResponse]:
        data = self._client._request("GET", f"/v1/apps/{self._app_id}/notification-rules")
        return [NotificationRuleResponse.from_dict(r) for r in data]

    def create(self, input: CreateNotificationRuleInput) -> NotificationRuleResponse:
        body = _rule_input_to_api(dict(input))
        data = self._client._request(
            "POST", f"/v1/apps/{self._app_id}/notification-rules", json=body
        )
        return NotificationRuleResponse.from_dict(data)

    def update(self, rule_id: str, input: UpdateNotificationRuleInput) -> NotificationRuleResponse:
        body = _rule_input_to_api(dict(input))
        data = self._client._request(
            "PATCH", f"/v1/apps/{self._app_id}/notification-rules/{rule_id}", json=body
        )
        return NotificationRuleResponse.from_dict(data)


class AsyncNotificationRulesResource:
    def __init__(self, client: "AsyncVelaManagementClient", app_id: str) -> None:
        self._client = client
        self._app_id = app_id

    async def list(self) -> list[NotificationRuleResponse]:
        data = await self._client._request("GET", f"/v1/apps/{self._app_id}/notification-rules")
        return [NotificationRuleResponse.from_dict(r) for r in data]

    async def create(self, input: CreateNotificationRuleInput) -> NotificationRuleResponse:
        body = _rule_input_to_api(dict(input))
        data = await self._client._request(
            "POST", f"/v1/apps/{self._app_id}/notification-rules", json=body
        )
        return NotificationRuleResponse.from_dict(data)

    async def update(
        self, rule_id: str, input: UpdateNotificationRuleInput
    ) -> NotificationRuleResponse:
        body = _rule_input_to_api(dict(input))
        data = await self._client._request(
            "PATCH", f"/v1/apps/{self._app_id}/notification-rules/{rule_id}", json=body
        )
        return NotificationRuleResponse.from_dict(data)
