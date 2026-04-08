export enum Plan {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export const EVENT_LEVELS = ['info', 'warning', 'error', 'success'] as const;

export type EventLevel = (typeof EVENT_LEVELS)[number];

export enum IntegrationProvider {
  SLACK = 'slack',
  DISCORD = 'discord',
  EMAIL = 'email',
}

export enum IntegrationStatus {
  ACTIVE = 'active',
  PENDING_OAUTH = 'pending_oauth',
  ERROR = 'error',
}

export enum NotificationDestinationKind {
  SLACK_WEBHOOK = 'slack_webhook',
  DISCORD_WEBHOOK = 'discord_webhook',
  EMAIL = 'email',
}
