from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from ._client import _BaseClientSync, _BaseClientAsync, DEFAULT_BASE_URL, DEFAULT_TIMEOUT
from ._errors import VelaAuthError
from .resources.apps import AppsResource, AsyncAppsResource
from .resources.schemas import SchemasResource, AsyncSchemasResource
from .resources.notification_rules import NotificationRulesResource, AsyncNotificationRulesResource
from .resources.events import EventsResource, AsyncEventsResource


@dataclass
class AppScopedResources:
    schemas: SchemasResource
    notification_rules: NotificationRulesResource
    events: EventsResource


@dataclass
class AsyncAppScopedResources:
    schemas: AsyncSchemasResource
    notification_rules: AsyncNotificationRulesResource
    events: AsyncEventsResource


class VelaManagementClient(_BaseClientSync):
    """
    Management client authenticated with a client secret (vela_cs_…).
    Obtain your client secret from the Vela dashboard.
    """

    def __init__(
        self,
        client_secret: str,
        *,
        base_url: str = DEFAULT_BASE_URL,
        timeout: float = DEFAULT_TIMEOUT,
    ) -> None:
        super().__init__(base_url=base_url, timeout=timeout)
        self._token: str = client_secret
        self.apps = AppsResource(self)

    def _get_auth_headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self._token}"}

    def for_app(self, app_id: str) -> AppScopedResources:
        return AppScopedResources(
            schemas=SchemasResource(self, app_id),
            notification_rules=NotificationRulesResource(self, app_id),
            events=EventsResource(self, app_id),
        )


class AsyncVelaManagementClient(_BaseClientAsync):
    """
    Async management client authenticated with a client secret (vela_cs_…).
    Obtain your client secret from the Vela dashboard.
    """

    def __init__(
        self,
        client_secret: str,
        *,
        base_url: str = DEFAULT_BASE_URL,
        timeout: float = DEFAULT_TIMEOUT,
    ) -> None:
        super().__init__(base_url=base_url, timeout=timeout)
        self._token: str = client_secret
        self.apps = AsyncAppsResource(self)

    def _get_auth_headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self._token}"}

    def for_app(self, app_id: str) -> AsyncAppScopedResources:
        return AsyncAppScopedResources(
            schemas=AsyncSchemasResource(self, app_id),
            notification_rules=AsyncNotificationRulesResource(self, app_id),
            events=AsyncEventsResource(self, app_id),
        )
