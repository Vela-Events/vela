from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from .._types import EventLevel, EventListResponse

if TYPE_CHECKING:
    from ..management import VelaManagementClient, AsyncVelaManagementClient


class EventsResource:
    def __init__(self, client: "VelaManagementClient", app_id: str) -> None:
        self._client = client
        self._app_id = app_id

    def list(
        self,
        *,
        level: Optional[EventLevel] = None,
        type: Optional[str] = None,
        from_: Optional[str] = None,
        to: Optional[str] = None,
        cursor: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> EventListResponse:
        params = {
            "level": level,
            "type": type,
            "from": from_,
            "to": to,
            "cursor": cursor,
            "limit": limit,
        }
        data = self._client._request(
            "GET", f"/v1/apps/{self._app_id}/events", params=params
        )
        return EventListResponse.from_dict(data)


class AsyncEventsResource:
    def __init__(self, client: "AsyncVelaManagementClient", app_id: str) -> None:
        self._client = client
        self._app_id = app_id

    async def list(
        self,
        *,
        level: Optional[EventLevel] = None,
        type: Optional[str] = None,
        from_: Optional[str] = None,
        to: Optional[str] = None,
        cursor: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> EventListResponse:
        params = {
            "level": level,
            "type": type,
            "from": from_,
            "to": to,
            "cursor": cursor,
            "limit": limit,
        }
        data = await self._client._request(
            "GET", f"/v1/apps/{self._app_id}/events", params=params
        )
        return EventListResponse.from_dict(data)
