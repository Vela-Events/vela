# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] - 2026-04-01

### Added

- Multi-tenant account and app model
- Event ingestion API with schema validation
- Event schema CRUD with field-level validation rules
- Notification rules engine with condition evaluation
- Notification delivery to Slack, Discord, Email (Resend), and custom webhooks
- RabbitMQ message bus with in-memory fallback
- Delivery retries with exponential backoff and dead-letter queue
- Delivery attempts query API with DLQ inspection and replay
- Real-time event streaming via Socket.IO
- JWT authentication with Google and GitHub OAuth
- Client secrets for server-to-server API access
- API key authentication for event ingestion
- Analytics endpoints with dashboard stat cards and time-series charts
- Delivery metrics API
- Health and readiness check endpoints
- TypeScript SDK (`@vela-event/sdk`) with dual ESM/CJS builds
- Python SDK (`vela-sdk`) with async support
- CLI tool (`@vela-event/cli`) for schema-as-code workflows
- OpenAPI/Swagger documentation
- Docker Compose setup for local infrastructure
