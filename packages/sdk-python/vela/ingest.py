from __future__ import annotations

from typing import Any, Union

from ._client import _BaseClientSync, _BaseClientAsync, DEFAULT_BASE_URL, DEFAULT_TIMEOUT
from ._types import IngestEventInput, IngestResponse


class VelaIngestClient(_BaseClientSync):
    def __init__(
        self,
        api_key: str,
        *,
        base_url: str = DEFAULT_BASE_URL,
        timeout: float = DEFAULT_TIMEOUT,
    ) -> None:
        super().__init__(base_url=base_url, timeout=timeout)
        self._api_key = api_key

    def _get_auth_headers(self) -> dict[str, str]:
        return {"x-api-key": self._api_key}

    def ingest(
        self, event_or_events: Union[IngestEventInput, list[IngestEventInput]]
    ) -> IngestResponse:
        if isinstance(event_or_events, list):
            body: Any = {"events": [dict(e) for e in event_or_events]}
        else:
            body = dict(event_or_events)
        data = self._request("POST", "/v1/ingest", json=body)
        return IngestResponse.from_dict(data)


class AsyncVelaIngestClient(_BaseClientAsync):
    def __init__(
        self,
        api_key: str,
        *,
        base_url: str = DEFAULT_BASE_URL,
        timeout: float = DEFAULT_TIMEOUT,
    ) -> None:
        super().__init__(base_url=base_url, timeout=timeout)
        self._api_key = api_key

    def _get_auth_headers(self) -> dict[str, str]:
        return {"x-api-key": self._api_key}

    async def ingest(
        self, event_or_events: Union[IngestEventInput, list[IngestEventInput]]
    ) -> IngestResponse:
        if isinstance(event_or_events, list):
            body: Any = {"events": [dict(e) for e in event_or_events]}
        else:
            body = dict(event_or_events)
        data = await self._request("POST", "/v1/ingest", json=body)
        return IngestResponse.from_dict(data)
