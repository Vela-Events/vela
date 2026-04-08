from __future__ import annotations

from typing import Any


class VelaError(Exception):
    def __init__(
        self,
        message: str,
        status_code: int,
        error: str = "",
        path: str = "",
        timestamp: str = "",
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.error = error
        self.path = path
        self.timestamp = timestamp

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(status_code={self.status_code}, message={str(self)!r})"


class VelaValidationError(VelaError):
    """Raised on HTTP 400 Bad Request."""


class VelaAuthError(VelaError):
    """Raised on HTTP 401 Unauthorized."""


class VelaForbiddenError(VelaError):
    """Raised on HTTP 403 Forbidden."""


class VelaNotFoundError(VelaError):
    """Raised on HTTP 404 Not Found."""


class VelaRateLimitError(VelaError):
    """Raised on HTTP 429 Too Many Requests."""


_STATUS_MAP: dict[int, type[VelaError]] = {
    400: VelaValidationError,
    401: VelaAuthError,
    403: VelaForbiddenError,
    404: VelaNotFoundError,
    429: VelaRateLimitError,
}


def raise_for_response(status_code: int, body: dict[str, Any]) -> None:
    cls = _STATUS_MAP.get(status_code, VelaError)
    raise cls(
        message=str(body.get("message", "Unknown error")),
        status_code=status_code,
        error=str(body.get("error", "")),
        path=str(body.get("path", "")),
        timestamp=str(body.get("timestamp", "")),
    )
