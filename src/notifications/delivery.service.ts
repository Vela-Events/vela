import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEntity } from '../events/entities/event.entity';
import { NotificationDestinationKind } from '../common/enums/domain.enums';
import type { EventLevel } from '../common/enums/domain.enums';
import { IntegrationsService } from '../integrations/integrations.service';
import { NotificationDeliveryAttemptEntity } from './entities/notification-delivery-attempt.entity';
import { NotificationRuleEntity } from './entities/notification-rule.entity';

interface NotificationDeliveryPayload {
  appId: string;
  eventId: string;
  ruleId: string;
  destinationId: string;
  channel: unknown;
  attemptNumber?: number;
}

interface FormattedNotification {
  subject: string;
  text: string;
  slackPayload: Record<string, unknown>;
  discordPayload: Record<string, unknown>;
}

interface DeliveryResult {
  responseCode: number;
  responseBody: string | null;
}

class DeliveryHttpError extends Error {
  constructor(
    message: string,
    readonly responseCode: number,
    readonly responseBody: string | null,
  ) {
    super(message);
  }
}

@Injectable()
export class NotificationDeliveryService {
  constructor(
    @InjectRepository(EventEntity)
    private readonly eventsRepository: Repository<EventEntity>,
    @InjectRepository(NotificationRuleEntity)
    private readonly rulesRepository: Repository<NotificationRuleEntity>,
    @InjectRepository(NotificationDeliveryAttemptEntity)
    private readonly deliveryAttemptsRepository: Repository<NotificationDeliveryAttemptEntity>,
    @Inject(forwardRef(() => IntegrationsService))
    private readonly integrationsService: IntegrationsService,
  ) {}

  /**
   * Sends a real test message to the destination (webhook or email).
   * Used by the integrations "test destination" API; does not record delivery attempts.
   */
  async sendDestinationTest(
    appId: string,
    destinationId: string,
  ): Promise<void> {
    const destination =
      await this.integrationsService.getDestinationForDelivery(
        appId,
        destinationId,
      );
    const formatted = this.buildTestFormattedNotification(
      destination.label,
      new Date().toISOString(),
    );

    switch (destination.kind) {
      case NotificationDestinationKind.SLACK_WEBHOOK:
        await this.sendSlackWebhook(destination.webhookUrl, formatted);
        return;
      case NotificationDestinationKind.DISCORD_WEBHOOK:
        await this.sendDiscordWebhook(destination.webhookUrl, formatted);
        return;
      case NotificationDestinationKind.EMAIL:
        await this.sendEmail(
          destination.emailAddress,
          formatted.subject,
          formatted.text,
          destination.emailConfig,
        );
        return;
      default:
        throw new BadRequestException('Unsupported destination kind');
    }
  }

  async deliver(payload: NotificationDeliveryPayload): Promise<void> {
    const event = await this.eventsRepository.findOne({
      where: { id: payload.eventId, appId: payload.appId },
    });
    const rule = await this.rulesRepository.findOne({
      where: { id: payload.ruleId, appId: payload.appId },
    });

    if (!event) {
      throw new NotFoundException(
        `Event ${payload.eventId} was not found for delivery`,
      );
    }

    if (!rule) {
      throw new NotFoundException(
        `Rule ${payload.ruleId} was not found for delivery`,
      );
    }

    const destination =
      await this.integrationsService.getDestinationForDelivery(
        payload.appId,
        payload.destinationId,
      );

    const formatted = this.formatMessage(event, rule.name);
    const attemptNumber = payload.attemptNumber ?? 1;
    const attempt = await this.deliveryAttemptsRepository.save(
      this.deliveryAttemptsRepository.create({
        appId: payload.appId,
        eventId: payload.eventId,
        ruleId: payload.ruleId,
        destinationId: payload.destinationId,
        channel: this.normalizeChannel(payload.channel, destination.kind),
        attemptNumber,
        status: 'pending',
      }),
    );

    try {
      let deliveryResult: DeliveryResult;

      switch (destination.kind) {
        case NotificationDestinationKind.SLACK_WEBHOOK:
          deliveryResult = await this.sendSlackWebhook(
            destination.webhookUrl,
            formatted,
          );
          break;
        case NotificationDestinationKind.DISCORD_WEBHOOK:
          deliveryResult = await this.sendDiscordWebhook(
            destination.webhookUrl,
            formatted,
          );
          break;
        case NotificationDestinationKind.EMAIL:
          deliveryResult = await this.sendEmail(
            destination.emailAddress,
            formatted.subject,
            formatted.text,
            destination.emailConfig,
          );
          break;
        default:
          throw new BadRequestException('Unsupported destination kind');
      }

      attempt.status = 'delivered';
      attempt.responseCode = deliveryResult.responseCode;
      attempt.responseBody = this.truncateText(deliveryResult.responseBody);
      attempt.errorMessage = null;
      attempt.deliveredAt = new Date();
      await this.deliveryAttemptsRepository.save(attempt);
    } catch (error) {
      attempt.status = 'failed';
      attempt.deliveredAt = null;
      attempt.errorMessage =
        error instanceof Error
          ? this.truncateText(error.message)
          : String(error);
      attempt.responseCode =
        error instanceof DeliveryHttpError ? error.responseCode : null;
      attempt.responseBody =
        error instanceof DeliveryHttpError
          ? this.truncateText(error.responseBody)
          : null;
      await this.deliveryAttemptsRepository.save(attempt);
      throw error;
    }
  }

  private buildTestFormattedNotification(
    label: string,
    occurredAtIso: string,
  ): FormattedNotification {
    const subject = `[Vela] Test notification — ${label}`;
    const text = [
      'This is a connection test from Vela.',
      '',
      `Destination: ${label}`,
      'If you received this message, your notification destination is configured correctly.',
      '',
      `Sent at: ${occurredAtIso}`,
    ].join('\n');

    return {
      subject,
      text,
      slackPayload: {
        text: subject,
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: subject },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `This is a *connection test* from Vela. If you see this, your Slack webhook for *${label}* is working.\n_Sent at ${occurredAtIso}_`,
            },
          },
        ],
      },
      discordPayload: {
        content: subject,
        embeds: [
          {
            title: 'Connection test',
            description: `This is a connection test from Vela. If you see this, your Discord webhook for **${label}** is working.`,
            color: 0x1c7ed6,
            timestamp: occurredAtIso,
          },
        ],
      },
    };
  }

  private formatMessage(
    event: EventEntity,
    ruleName: string,
  ): FormattedNotification {
    const prettyPayload = this.serializeSnippet(event.payload, 1200);
    const prettyMetadata = this.serializeSnippet(event.metadata, 900);
    const subject = `[Vela] ${event.eventName} triggered ${ruleName}`;
    const text = [
      `Rule: ${ruleName}`,
      `Event: ${event.eventName}`,
      `Level: ${event.level}`,
      `Customer: ${event.customerId ?? 'n/a'}`,
      `Occurred At: ${event.occurredAt.toISOString()}`,
      '',
      'Payload:',
      prettyPayload,
      '',
      'Metadata:',
      prettyMetadata,
    ].join('\n');

    const eventSummary = [
      `Event: ${event.eventName}`,
      `Rule: ${ruleName}`,
      `Level: ${event.level}`,
      `Customer: ${event.customerId ?? 'n/a'}`,
      `Occurred: ${event.occurredAt.toISOString()}`,
    ].join('\n');

    return {
      subject,
      text,
      slackPayload: {
        text: subject,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: subject,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${event.eventName}* matched *${ruleName}*`,
            },
            fields: [
              {
                type: 'mrkdwn',
                text: `*Level*\n${event.level}`,
              },
              {
                type: 'mrkdwn',
                text: `*Customer*\n${event.customerId ?? 'n/a'}`,
              },
              {
                type: 'mrkdwn',
                text: `*Occurred*\n${event.occurredAt.toISOString()}`,
              },
              {
                type: 'mrkdwn',
                text: `*Source*\n${this.readMetadataValue(event.metadata, 'source') ?? 'n/a'}`,
              },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Payload*\n\`\`\`${prettyPayload}\`\`\``,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Metadata*\n\`\`\`${prettyMetadata}\`\`\``,
            },
          },
        ],
      },
      discordPayload: {
        content: subject,
        embeds: [
          {
            title: subject,
            description: eventSummary,
            color: this.resolveDiscordColor(event.level),
            timestamp: event.occurredAt.toISOString(),
            fields: [
              {
                name: 'Payload',
                value: `\`\`\`json\n${this.serializeSnippet(event.payload, 900)}\n\`\`\``,
              },
              {
                name: 'Metadata',
                value: `\`\`\`json\n${this.serializeSnippet(event.metadata, 700)}\n\`\`\``,
              },
            ],
          },
        ],
      },
    };
  }

  private async sendSlackWebhook(
    webhookUrl: string | null,
    formatted: FormattedNotification,
  ): Promise<DeliveryResult> {
    if (!webhookUrl) {
      throw new BadRequestException(
        'Slack destination is missing a webhook URL',
      );
    }

    return this.postJson(webhookUrl, formatted.slackPayload);
  }

  private async sendDiscordWebhook(
    webhookUrl: string | null,
    formatted: FormattedNotification,
  ): Promise<DeliveryResult> {
    if (!webhookUrl) {
      throw new BadRequestException(
        'Discord destination is missing a webhook URL',
      );
    }

    return this.postJson(webhookUrl, formatted.discordPayload);
  }

  private async sendEmail(
    emailAddress: string | null,
    subject: string,
    text: string,
    emailConfig?: { from?: string; resendApiKey?: string } | null,
  ): Promise<DeliveryResult> {
    if (!emailAddress) {
      throw new BadRequestException(
        'Email destination is missing an email address',
      );
    }

    const resendApiKey =
      emailConfig?.resendApiKey ?? process.env.RESEND_API_KEY ?? null;
    const from = emailConfig?.from ?? process.env.EMAIL_FROM ?? null;

    if (!resendApiKey || !from) {
      throw new InternalServerErrorException(
        'Email delivery requires RESEND_API_KEY and EMAIL_FROM',
      );
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [emailAddress],
        subject,
        text,
      }),
    });

    const body = await response.text();

    if (!response.ok) {
      throw new DeliveryHttpError(
        `Resend email delivery failed with ${response.status}: ${body}`,
        response.status,
        body,
      );
    }

    return {
      responseCode: response.status,
      responseBody: body,
    };
  }

  private async postJson(
    url: string,
    body: Record<string, unknown>,
  ): Promise<DeliveryResult> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const responseBody = await response.text();

    if (!response.ok) {
      throw new DeliveryHttpError(
        `Webhook delivery failed with ${response.status}: ${responseBody}`,
        response.status,
        responseBody,
      );
    }

    return {
      responseCode: response.status,
      responseBody,
    };
  }

  private serializeSnippet(
    value: Record<string, unknown>,
    maxLength: number,
  ): string {
    return this.truncateText(JSON.stringify(value, null, 2), maxLength);
  }

  private truncateText(
    value: string | null | undefined,
    maxLength = 4_000,
  ): string {
    if (!value) {
      return '';
    }

    return value.length <= maxLength
      ? value
      : `${value.slice(0, maxLength - 3)}...`;
  }

  private readMetadataValue(
    metadata: Record<string, unknown>,
    key: string,
  ): string | null {
    const value = metadata[key];
    return typeof value === 'string' ? value : null;
  }

  private resolveDiscordColor(level: EventLevel): number {
    switch (level) {
      case 'error':
        return 0xe5484d;
      case 'warning':
        return 0xf08c00;
      case 'success':
        return 0x2b8a3e;
      case 'info':
      default:
        return 0x1c7ed6;
    }
  }

  private normalizeChannel(
    channel: unknown,
    fallback: NotificationDestinationKind,
  ): string {
    return typeof channel === 'string' && channel.trim().length > 0
      ? channel
      : fallback;
  }
}
