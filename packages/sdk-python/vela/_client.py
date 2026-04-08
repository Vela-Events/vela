from __future__ import annotations

from typing import Any, Optional
import httpx

from ._errors import raise_for_response

DEFAULT_BASE_URL = "https://api.velahq.xyz"
DEFAULT_TIMEOUT = 30.0


class _BaseClientSync:
    def __init__(self, base_url: str = DEFAULT_BASE_URL, timeout: float = DEFAULT_TIMEOUT) -> None:
        self._http = httpx.Client(base_url=base_url.rstrip("/"), timeout=timeout)

    def _get_auth_headers(self) -> dict[str, str]:
        raise NotImplementedError

    def _request(
        self,
        method: str,
        path: str,
        *,
        json: Any = None,
        params: Optional[dict[str, Any]] = None,
    ) -> Any:
        filtered_params = (
            {k: v for k, v in params.items() if v is not None} if params else None
        )
        headers = {"Content-Type": "application/json", **self._get_auth_headers()}
        response = self._http.request(
            method, path, json=json, params=filtered_params, headers=headers
        )
        if not response.is_success:
            try:
                body = response.json()
            except Exception:
                body = {}
            raise_for_response(response.status_code, body)
        if response.status_code == 204:
            return None
        return response.json()

    def close(self) -> None:
        self._http.close()

    def __enter__(self) -> "_BaseClientSync":
        return self

    def __exit__(self, *args: Any) -> None:
        self.close()


class _BaseClientAsync:
    def __init__(self, base_url: str = DEFAULT_BASE_URL, timeout: float = DEFAULT_TIMEOUT) -> None:
        self._http = httpx.AsyncClient(base_url=base_url.rstrip("/"), timeout=timeout)

    def _get_auth_headers(self) -> dict[str, str]:
        raise NotImplementedError

    async def _request(
        self,
        method: str,
        path: str,
        *,
        json: Any = None,
        params: Optional[dict[str, Any]] = None,
    ) -> Any:
        filtered_params = (
            {k: v for k, v in params.items() if v is not None} if params else None
        )
        headers = {"Content-Type": "application/json", **self._get_auth_headers()}
        response = await self._http.request(
            method, path, json=json, params=filtered_params, headers=headers
        )
        if not response.is_success:
            try:
                body = response.json()
            except Exception:
                body = {}
            raise_for_response(response.status_code, body)
        if response.status_code == 204:
            return None
        return response.json()

    async def aclose(self) -> None:
        await self._http.aclose()

    async def __aenter__(self) -> "_BaseClientAsync":
        return self

    async def __aexit__(self, *args: Any) -> None:
        await self.aclose()
