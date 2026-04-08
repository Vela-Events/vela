from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal, Optional

# ─── Primitives ───────────────────────────────────────────────────────────────

EventLevel = Literal["info", "warning", "error", "success"]
Plan = Literal["free", "pro", "enterprise"]
IntegrationProvider = Literal["slack", "discord", "email"]
SchemaFieldType = Literal["string", "number", "boolean", "date", "enum", "object"]
ConditionOperator = Literal[
    "equals", "not_equals", "greater_than", "less_than", "contains", "starts_with"
]

# ─── Inputs (TypedDict — callers can pass plain dicts) ────────────────────────

try:
    from typing import Required, NotRequired, TypedDict
except ImportError:
    from typing_extensions import Required, NotRequired, TypedDict  # type: ignore


class RequestTokenInput(TypedDict, total=False):
    email: Required[str]
    name: NotRequired[str]


class CreateAppInput(TypedDict, total=False):
    name: Required[str]
    slug: NotRequired[str]


class UpdateAppInput(TypedDict, total=False):
    name: NotRequired[str]
    slug: NotRequired[str]


class IngestEventInput(TypedDict, total=False):
    event: Required[str]
    data: Required[dict[str, Any]]
    level: Required[EventLevel]
    customer_id: NotRequired[str]
    metadata: NotRequired[dict[str, Any]]
    timestamp: NotRequired[str]


class SchemaFieldValidation(TypedDict, total=False):
    min: NotRequired[float]
    max: NotRequired[float]
    pattern: NotRequired[str]


class SchemaField(TypedDict, total=False):
    id: Required[str]
    name: Required[str]
    type: Required[SchemaFieldType]
    required: Required[bool]
    default_value: NotRequired[Any]
    description: NotRequired[str]
    enum_values: NotRequired[list[str]]
    validation: NotRequired[SchemaFieldValidation]


class SchemaMetadataField(TypedDict, total=False):
    id: Required[str]
    name: Required[str]
    type: Required[SchemaFieldType]
    description: NotRequired[str]


class CreateEventSchemaInput(TypedDict, total=False):
    event_name: Required[str]
    description: NotRequired[str]
    fields: Required[list[SchemaField]]
    metadata_fields: NotRequired[list[SchemaMetadataField]]


class UpdateEventSchemaInput(TypedDict, total=False):
    event_name: NotRequired[str]
    description: NotRequired[str]
    fields: NotRequired[list[SchemaField]]
    metadata_fields: NotRequired[list[SchemaMetadataField]]


class NotificationCondition(TypedDict):
    id: str
    field: str
    operator: ConditionOperator
    value: Any


class NotificationAction(TypedDict, total=False):
    id: Required[str]
    destination_id: Required[str]
    channel: Required[IntegrationProvider]
    target: NotRequired[str]
    enabled: Required[bool]


class CreateNotificationRuleInput(TypedDict, total=False):
    name: Required[str]
    event_name: Required[str]
    conditions: Required[list[NotificationCondition]]
    actions: Required[list[NotificationAction]]
    enabled: NotRequired[bool]


class UpdateNotificationRuleInput(TypedDict, total=False):
    name: NotRequired[str]
    event_name: NotRequired[str]
    conditions: NotRequired[list[NotificationCondition]]
    actions: NotRequired[list[NotificationAction]]
    enabled: NotRequired[bool]


# ─── Responses (dataclass — attribute access + repr) ─────────────────────────


@dataclass
class AccountResponse:
    id: str
    email: str
    name: str
    plan: str
    apps_limit: int
    created_at: str
    updated_at: str

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "AccountResponse":
        return cls(
            id=d["id"],
            email=d["email"],
            name=d["name"],
            plan=d["plan"],
            apps_limit=d["appsLimit"],
            created_at=d["createdAt"],
            updated_at=d["updatedAt"],
        )


@dataclass
class AuthTokenResponse:
    access_token: str
    account: AccountResponse

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "AuthTokenResponse":
        return cls(
            access_token=d["accessToken"],
            account=AccountResponse.from_dict(d["account"]),
        )


@dataclass
class AppResponse:
    id: str
    account_id: str
    name: str
    slug: str
    api_key_prefix: str
    created_at: str
    updated_at: str

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "AppResponse":
        return cls(
            id=d["id"],
            account_id=d["accountId"],
            name=d["name"],
            slug=d["slug"],
            api_key_prefix=d["apiKeyPrefix"],
            created_at=d["createdAt"],
            updated_at=d["updatedAt"],
        )


@dataclass
class AppWithKeyResponse:
    app: AppResponse
    api_key: str

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "AppWithKeyResponse":
        return cls(app=AppResponse.from_dict(d["app"]), api_key=d["apiKey"])


@dataclass
class EventResponse:
    id: str
    app_id: str
    event: str
    customer_id: Optional[str]
    data: dict[str, Any]
    level: str
    metadata: dict[str, Any]
    timestamp: str
    ingested_at: str

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "EventResponse":
        return cls(
            id=d["id"],
            app_id=d["appId"],
            event=d["event"],
            customer_id=d.get("customer_id"),
            data=d["data"],
            level=d["level"],
            metadata=d.get("metadata", {}),
            timestamp=d["timestamp"],
            ingested_at=d["ingestedAt"],
        )


@dataclass
class IngestResponse:
    accepted: int
    events: list[EventResponse]

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "IngestResponse":
        return cls(
            accepted=d["accepted"],
            events=[EventResponse.from_dict(e) for e in d.get("events", [])],
        )


@dataclass
class EventListResponse:
    items: list[EventResponse]
    next_cursor: Optional[str]

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "EventListResponse":
        return cls(
            items=[EventResponse.from_dict(e) for e in d.get("items", [])],
            next_cursor=d.get("nextCursor"),
        )


@dataclass
class EventSchemaFieldResponse:
    id: str
    name: str
    type: str
    required: bool
    default_value: Any
    description: Optional[str]
    enum_values: Optional[list[str]]
    validation: Optional[dict[str, Any]]

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "EventSchemaFieldResponse":
        return cls(
            id=d["id"],
            name=d["name"],
            type=d["type"],
            required=d.get("required", False),
            default_value=d.get("defaultValue"),
            description=d.get("description"),
            enum_values=d.get("enumValues"),
            validation=d.get("validation"),
        )


@dataclass
class EventSchemaResponse:
    id: str
    app_id: str
    event_name: str
    description: Optional[str]
    fields: list[EventSchemaFieldResponse]
    metadata_fields: list[EventSchemaFieldResponse]
    created_at: str
    updated_at: str

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "EventSchemaResponse":
        return cls(
            id=d["id"],
            app_id=d["appId"],
            event_name=d["eventName"],
            description=d.get("description"),
            fields=[EventSchemaFieldResponse.from_dict(f) for f in d.get("fields", [])],
            metadata_fields=[
                EventSchemaFieldResponse.from_dict(f) for f in d.get("metadataFields", [])
            ],
            created_at=d["createdAt"],
            updated_at=d["updatedAt"],
        )


@dataclass
class NotificationConditionResponse:
    id: str
    field: str
    operator: str
    value: Any

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "NotificationConditionResponse":
        return cls(id=d["id"], field=d["field"], operator=d["operator"], value=d["value"])


@dataclass
class NotificationActionResponse:
    id: str
    destination_id: str
    channel: str
    target: Optional[str]
    enabled: bool

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "NotificationActionResponse":
        return cls(
            id=d["id"],
            destination_id=d["destinationId"],
            channel=d["channel"],
            target=d.get("target"),
            enabled=d["enabled"],
        )


@dataclass
class NotificationRuleResponse:
    id: str
    app_id: str
    name: str
    event_name: str
    conditions: list[NotificationConditionResponse]
    actions: list[NotificationActionResponse]
    enabled: bool
    last_triggered_at: Optional[str]
    trigger_count: int
    created_at: str

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "NotificationRuleResponse":
        return cls(
            id=d["id"],
            app_id=d["appId"],
            name=d["name"],
            event_name=d["eventName"],
            conditions=[NotificationConditionResponse.from_dict(c) for c in d.get("conditions", [])],
            actions=[NotificationActionResponse.from_dict(a) for a in d.get("actions", [])],
            enabled=d["enabled"],
            last_triggered_at=d.get("lastTriggeredAt"),
            trigger_count=d.get("triggerCount", 0),
            created_at=d["createdAt"],
        )
