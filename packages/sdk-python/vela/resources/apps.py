from __future__ import annotations

from typing import TYPE_CHECKING

from .._types import AppResponse, AppWithKeyResponse, CreateAppInput, UpdateAppInput

if TYPE_CHECKING:
    from ..management import VelaManagementClient, AsyncVelaManagementClient


class AppsResource:
    def __init__(self, client: "VelaManagementClient") -> None:
        self._client = client

    def list(self) -> list[AppResponse]:
        data = self._client._request("GET", "/v1/apps")
        return [AppResponse.from_dict(a) for a in data]

    def create(self, input: CreateAppInput) -> AppWithKeyResponse:
        body = _snake_to_camel_app_input(dict(input))
        data = self._client._request("POST", "/v1/apps", json=body)
        return AppWithKeyResponse.from_dict(data)

    def get(self, app_id: str) -> AppResponse:
        data = self._client._request("GET", f"/v1/apps/{app_id}")
        return AppResponse.from_dict(data)

    def update(self, app_id: str, input: UpdateAppInput) -> AppResponse:
        body = _snake_to_camel_app_input(dict(input))
        data = self._client._request("PATCH", f"/v1/apps/{app_id}", json=body)
        return AppResponse.from_dict(data)

    def rotate_key(self, app_id: str) -> AppWithKeyResponse:
        data = self._client._request("POST", f"/v1/apps/{app_id}/keys/rotate")
        return AppWithKeyResponse.from_dict(data)


class AsyncAppsResource:
    def __init__(self, client: "AsyncVelaManagementClient") -> None:
        self._client = client

    async def list(self) -> list[AppResponse]:
        data = await self._client._request("GET", "/v1/apps")
        return [AppResponse.from_dict(a) for a in data]

    async def create(self, input: CreateAppInput) -> AppWithKeyResponse:
        body = _snake_to_camel_app_input(dict(input))
        data = await self._client._request("POST", "/v1/apps", json=body)
        return AppWithKeyResponse.from_dict(data)

    async def get(self, app_id: str) -> AppResponse:
        data = await self._client._request("GET", f"/v1/apps/{app_id}")
        return AppResponse.from_dict(data)

    async def update(self, app_id: str, input: UpdateAppInput) -> AppResponse:
        body = _snake_to_camel_app_input(dict(input))
        data = await self._client._request("PATCH", f"/v1/apps/{app_id}", json=body)
        return AppResponse.from_dict(data)

    async def rotate_key(self, app_id: str) -> AppWithKeyResponse:
        data = await self._client._request("POST", f"/v1/apps/{app_id}/keys/rotate")
        return AppWithKeyResponse.from_dict(data)


def _snake_to_camel_app_input(d: dict) -> dict:
    """Apps API expects camelCase — name and slug don't change, but be explicit."""
    return {k: v for k, v in d.items() if v is not None}
