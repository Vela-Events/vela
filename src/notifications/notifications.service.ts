import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEntity } from '../events/entities/event.entity';
import { Topics } from '../common/constants/topics';
import {
  DlqMessageSnapshot,
  MessageBusService,
} from '../messaging/message-bus.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { NotificationDeliveryService } from './delivery.service';
import { NotificationDestinationEntity } from '../integrations/entities/notification-destination.entity';
import { NotificationRuleEntity } from './entities/notification-rule.entity';
import { CreateNotificationRuleDto } from './dto/create-notification-rule.dto';
import { UpdateNotificationRuleDto } from './dto/update-notification-rule.dto';
import { ConditionEvaluatorService } from './condition-evaluator.service';
import { NotificationDeliveryAttemptEntity } from './entities/notification-delivery-attempt.entity';
import { DeliveryAttemptQueryDto } from './dto/delivery-attempt-query.dto';
import { DeliveryAttemptSummaryDto } from './dto/delivery-attempt-summary.dto';

interface EventIngestedPayload {
  eventId: string;
  appId: string;
}

interface NotificationDeliveryPayload {
  appId: string;
  eventId: string;
  ruleId: string;
  destinationId: string;
  channel: unknown;
  attemptNumber?: number;
}

interface DeliveryAttemptPage {
  items: NotificationDeliveryAttemptEntity[];
  nextCursor: string | null;
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(NotificationRuleEntity)
    private readonly rulesRepository: Repository<NotificationRuleEntity>,
    @InjectRepository(EventEntity)
    private readonly eventsRepository: Repository<EventEntity>,
    @InjectRepository(NotificationDeliveryAttemptEntity)
    private readonly deliveryAttemptsRepository: Repository<NotificationDeliveryAttemptEntity>,
    @InjectRepository(NotificationDestinationEntity)
    private readonly destinationsRepository: Repository<NotificationDestinationEntity>,
    private readonly integrationsService: IntegrationsService,
    private readonly deliveryService: NotificationDeliveryService,
    private readonly conditionEvaluator: ConditionEvaluatorService,
    private readonly messageBus: MessageBusService,
  ) {}

  onModuleInit(): void {
    this.messageBus.subscribe<EventIngestedPayload>(
      Topics.EVENTS_INGESTED,
      async (payload) => {
        await this.handleEventIngested(payload);
      },
      { consumerName: 'notifications-evaluator' },
    );
    this.messageBus.subscribe<NotificationDeliveryPayload>(
      Topics.NOTIFICATIONS_DELIVER,
      async (payload) => {
        this.logger.log(
          `Delivering notification for rule=${payload.ruleId} destination=${payload.destinationId} event=${payload.eventId} attempt=${payload.attemptNumber ?? 1}`,
        );
        await this.deliveryService.deliver(payload);
      },
      { consumerName: 'notifications-delivery' },
    );
  }

  async listForApp(appId: string): Promise<NotificationRuleEntity[]> {
    return this.rulesRepository.find({
      where: { appId },
      order: { createdAt: 'DESC' },
    });
  }

  async listDeliveryAttempts(
    appId: string,
    query: DeliveryAttemptQueryDto,
  ): Promise<DeliveryAttemptPage> {
    const limit = Math.min(Math.max(query.limit ?? 25, 1), 100);
    const queryBuilder = this.buildDeliveryAttemptQuery(appId, query);

    if (query.cursor) {
      const cursorAttempt = await this.deliveryAttemptsRepository.findOne({
        where: { id: query.cursor, appId },
      });

      if (!cursorAttempt) {
        throw new NotFoundException('Delivery attempt cursor not found');
      }

      queryBuilder.andWhere(
        '(attempt."createdAt" < :cursorCreatedAt OR (attempt."createdAt" = :cursorCreatedAt AND attempt.id < :cursorId))',
        {
          cursorCreatedAt: cursorAttempt.createdAt,
          cursorId: cursorAttempt.id,
        },
      );
    }

    queryBuilder.take(limit + 1);

    const attempts = await queryBuilder.getMany();
    const hasMore = attempts.length > limit;
    const items = hasMore ? attempts.slice(0, limit) : attempts;
    const nextCursor = hasMore ? (items.at(-1)?.id ?? null) : null;

    return {
      items,
      nextCursor,
    };
  }

  async summarizeDeliveryAttempts(
    appId: string,
    query: DeliveryAttemptQueryDto,
  ): Promise<DeliveryAttemptSummaryDto> {
    const summaryQuery = { ...query };
    delete summaryQuery.cursor;
    delete summaryQuery.limit;

    const rows = await this.buildDeliveryAttemptQuery(appId, summaryQuery)
      .select('attempt.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('attempt.status')
      .getRawMany<{ status: string; count: string }>();

    const summary: DeliveryAttemptSummaryDto = {
      total: 0,
      pending: 0,
      delivered: 0,
      failed: 0,
    };

    for (const row of rows) {
      const count = Number(row.count);
      summary.total += count;

      if (row.status === 'pending') summary.pending = count;
      if (row.status === 'delivered') summary.delivered = count;
      if (row.status === 'failed') summary.failed = count;
    }

    return summary;
  }

  async inspectDeliveryDlq(
    appId: string,
    query: {
      limit?: number;
      ruleId?: string;
      destinationId?: string;
      eventId?: string;
    },
  ): Promise<DlqMessageSnapshot<NotificationDeliveryPayload>[]> {
    const messages =
      await this.messageBus.inspectDlq<NotificationDeliveryPayload>(
        Topics.NOTIFICATIONS_DELIVER,
        'notifications-delivery',
        Math.min(Math.max(query.limit ?? 25, 1), 100),
      );

    return messages.filter((message) =>
      this.matchesDlqFilter(message.payload, appId, query),
    );
  }

  async replayDeliveryDlq(
    appId: string,
    query: {
      limit?: number;
      ruleId?: string;
      destinationId?: string;
      eventId?: string;
    },
  ): Promise<{ inspected: number; replayed: number; remaining: number }> {
    return this.messageBus.replayDlq<NotificationDeliveryPayload>(
      Topics.NOTIFICATIONS_DELIVER,
      'notifications-delivery',
      {
        limit: Math.min(Math.max(query.limit ?? 25, 1), 100),
        match: (payload) => this.matchesDlqFilter(payload, appId, query),
        transform: (payload) => ({
          ...payload,
          attemptNumber: 1,
        }),
      },
    );
  }

  private buildDeliveryAttemptQuery(
    appId: string,
    query: DeliveryAttemptQueryDto,
  ) {
    const queryBuilder = this.deliveryAttemptsRepository
      .createQueryBuilder('attempt')
      .where('attempt.appId = :appId', { appId })
      .orderBy('attempt.createdAt', 'DESC')
      .addOrderBy('attempt.id', 'DESC');

    if (query.ruleId) {
      queryBuilder.andWhere('attempt.ruleId = :ruleId', {
        ruleId: query.ruleId,
      });
    }

    if (query.destinationId) {
      queryBuilder.andWhere('attempt.destinationId = :destinationId', {
        destinationId: query.destinationId,
      });
    }

    if (query.status) {
      queryBuilder.andWhere('attempt.status = :status', {
        status: query.status,
      });
    }

    return queryBuilder;
  }

  async getDeliveryAttemptMetadata(
    appId: string,
    attempts: NotificationDeliveryAttemptEntity[],
  ): Promise<{
    ruleNames: Map<string, string>;
    destinationLabels: Map<string, string>;
  }> {
    const ruleIds = [...new Set(attempts.map((attempt) => attempt.ruleId))];
    const destinationIds = [
      ...new Set(attempts.map((attempt) => attempt.destinationId)),
    ];

    const [rules, destinations] = await Promise.all([
      ruleIds.length
        ? this.rulesRepository.find({
            where: ruleIds.map((id) => ({ id, appId })),
          })
        : Promise.resolve([]),
      destinationIds.length
        ? this.destinationsRepository.find({
            where: destinationIds.map((id) => ({ id, appId })),
          })
        : Promise.resolve([]),
    ]);

    return {
      ruleNames: new Map(rules.map((rule) => [rule.id, rule.name])),
      destinationLabels: new Map(
        destinations.map((destination) => [destination.id, destination.label]),
      ),
    };
  }

  async create(
    appId: string,
    dto: CreateNotificationRuleDto,
  ): Promise<NotificationRuleEntity> {
    await this.validateDestinations(
      appId,
      dto.actions.map((action) => action.destinationId),
    );

    const rule = this.rulesRepository.create({
      appId,
      name: dto.name,
      eventName: dto.eventName,
      conditions: dto.conditions.map((condition) => ({ ...condition })),
      actions: dto.actions.map((action) => ({ ...action })),
      enabled: dto.enabled ?? true,
    } as Partial<NotificationRuleEntity>);

    return this.rulesRepository.save(rule);
  }

  async update(
    appId: string,
    ruleId: string,
    dto: UpdateNotificationRuleDto,
  ): Promise<NotificationRuleEntity> {
    const rule = await this.rulesRepository.findOne({
      where: { id: ruleId, appId },
    });

    if (!rule) {
      throw new NotFoundException('Notification rule not found');
    }

    if (dto.actions) {
      await this.validateDestinations(
        appId,
        dto.actions.map((action) => action.destinationId),
      );
      rule.actions = dto.actions.map((action) => ({ ...action }));
    }

    if (dto.conditions)
      rule.conditions = dto.conditions.map((condition) => ({ ...condition }));
    if (dto.name) rule.name = dto.name;
    if (dto.eventName) rule.eventName = dto.eventName;
    if (dto.enabled !== undefined) rule.enabled = dto.enabled;

    return this.rulesRepository.save(rule);
  }

  private async validateDestinations(
    appId: string,
    destinationIds: string[],
  ): Promise<void> {
    for (const destinationId of destinationIds) {
      await this.integrationsService.ensureDestinationBelongsToApp(
        appId,
        destinationId,
      );
    }
  }

  private async handleEventIngested(
    payload: EventIngestedPayload,
  ): Promise<void> {
    const event = await this.eventsRepository.findOne({
      where: { id: payload.eventId, appId: payload.appId },
    });

    if (!event) return;

    const rules = await this.rulesRepository.find({
      where: {
        appId: payload.appId,
        eventName: event.eventName,
        enabled: true,
      },
    });

    for (const rule of rules) {
      const matches = this.conditionEvaluator.matches(
        rule.conditions,
        event.payload,
        event.metadata,
      );

      if (!matches) continue;

      rule.lastTriggeredAt = new Date();
      rule.triggerCount = Number(rule.triggerCount) + 1;
      await this.rulesRepository.save(rule);

      for (const action of rule.actions) {
        if (action.enabled === false) continue;

        if (!action.destinationId) {
          throw new BadRequestException(
            'Notification action is missing a destinationId',
          );
        }

        await this.messageBus.publish(Topics.NOTIFICATIONS_DELIVER, {
          appId: payload.appId,
          eventId: event.id,
          ruleId: rule.id,
          destinationId: action.destinationId,
          channel: action.channel,
          attemptNumber: 1,
        });
      }
    }
  }

  private matchesDlqFilter(
    payload: NotificationDeliveryPayload,
    appId: string,
    query: {
      ruleId?: string;
      destinationId?: string;
      eventId?: string;
    },
  ): boolean {
    if (payload.appId !== appId) {
      return false;
    }

    if (query.ruleId && payload.ruleId !== query.ruleId) {
      return false;
    }

    if (query.destinationId && payload.destinationId !== query.destinationId) {
      return false;
    }

    if (query.eventId && payload.eventId !== query.eventId) {
      return false;
    }

    return true;
  }
}
