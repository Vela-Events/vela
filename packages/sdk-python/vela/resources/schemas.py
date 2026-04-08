from __future__ import annotations

from typing import TYPE_CHECKING, Any
from urllib.parse import quote

from .._types import (
    CreateEventSchemaInput,
    EventSchemaResponse,
    UpdateEventSchemaInput,
)

if TYPE_CHECKING:
    from ..management import VelaManagementClient, AsyncVelaManagementClient


def _schema_input_to_api(d: dict) -> dict:
    """Convert snake_case schema input keys to camelCase for the API."""
    result: dict[str, Any] = {}
    if "event_name" in d:
        result["eventName"] = d["event_name"]
    if "description" in d:
        result["description"] = d["description"]
    if "fields" in d:
        result["fields"] = [_field_to_api(f) for f in d["fields"]]
    if "metadata_fields" in d:
        result["metadataFields"] = [_field_to_api(f) for f in d["metadata_fields"]]
    return result


def _field_to_api(f: dict) -> dict:
    out: dict[str, Any] = {
        "id": f["id"],
        "name": f["name"],
        "type": f["type"],
        "required": f.get("required", False),
    }
    if "description" in f:
        out["description"] = f["description"]
    if "default_value" in f:
        out["defaultValue"] = f["default_value"]
    if "enum_values" in f:
        out["enumValues"] = f["enum_values"]
    if "validation" in f:
        out["validation"] = f["validation"]
    return out


class SchemasResource:
    def __init__(self, client: "VelaManagementClient", app_id: str) -> None:
        self._client = client
        self._app_id = app_id

    def list(self) -> list[EventSchemaResponse]:
        data = self._client._request("GET", f"/v1/apps/{self._app_id}/schemas")
        return [EventSchemaResponse.from_dict(s) for s in data]

    def create(self, input: CreateEventSchemaInput) -> EventSchemaResponse:
        body = _schema_input_to_api(dict(input))
        data = self._client._request("POST", f"/v1/apps/{self._app_id}/schemas", json=body)
        return EventSchemaResponse.from_dict(data)

    def update(self, schema_id: str, input: UpdateEventSchemaInput) -> EventSchemaResponse:
        body = _schema_input_to_api(dict(input))
        data = self._client._request(
            "PATCH", f"/v1/apps/{self._app_id}/schemas/{schema_id}", json=body
        )
        return EventSchemaResponse.from_dict(data)

    def get_by_event_name(self, event_name: str) -> EventSchemaResponse:
        data = self._client._request(
            "GET",
            f"/v1/apps/{self._app_id}/schemas/by-event-name/{quote(event_name, safe='')}",
        )
        return EventSchemaResponse.from_dict(data)


class AsyncSchemasResource:
    def __init__(self, client: "AsyncVelaManagementClient", app_id: str) -> None:
        self._client = client
        self._app_id = app_id

    async def list(self) -> list[EventSchemaResponse]:
        data = await self._client._request("GET", f"/v1/apps/{self._app_id}/schemas")
        return [EventSchemaResponse.from_dict(s) for s in data]

    async def create(self, input: CreateEventSchemaInput) -> EventSchemaResponse:
        body = _schema_input_to_api(dict(input))
        data = await self._client._request("POST", f"/v1/apps/{self._app_id}/schemas", json=body)
        return EventSchemaResponse.from_dict(data)

    async def update(self, schema_id: str, input: UpdateEventSchemaInput) -> EventSchemaResponse:
        body = _schema_input_to_api(dict(input))
        data = await self._client._request(
            "PATCH", f"/v1/apps/{self._app_id}/schemas/{schema_id}", json=body
        )
        return EventSchemaResponse.from_dict(data)

    async def get_by_event_name(self, event_name: str) -> EventSchemaResponse:
        data = await self._client._request(
            "GET",
            f"/v1/apps/{self._app_id}/schemas/by-event-name/{quote(event_name, safe='')}",
        )
        return EventSchemaResponse.from_dict(data)
