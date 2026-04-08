import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppEntity } from '../apps/entities/app.entity';
import { Topics } from '../common/constants/topics';
import { MessageBusService } from '../messaging/message-bus.service';
import { EventSchemaEntity } from '../schemas/entities/event-schema.entity';
import { SchemaValidatorService } from '../schemas/schema-validator.service';
import { EventQueryDto } from './dto/event-query.dto';
import { IngestEventDto } from './dto/ingest-event.dto';
import { EventEntity } from './entities/event.entity';

export interface EventsListPage {
  items: EventEntity[];
  nextCursor: string | null;
}

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(EventEntity)
    private readonly eventsRepository: Repository<EventEntity>,
    @InjectRepository(AppEntity)
    private readonly appsRepository: Repository<AppEntity>,
    @InjectRepository(EventSchemaEntity)
    private readonly schemasRepository: Repository<EventSchemaEntity>,
    private readonly schemaValidator: SchemaValidatorService,
    private readonly messageBus: MessageBusService,
  ) {}

  async ingest(
    appId: string,
    payload: IngestEventDto[],
  ): Promise<EventEntity[]> {
    const events = await Promise.all(
      payload.map(async (item) => {
        const schema = await this.schemasRepository.findOne({
          where: { appId, eventName: item.event },
        });
        if (!schema) {
          throw new BadRequestException(
            `No event schema registered for "${item.event}". Create one with POST /v1/apps/{appId}/schemas before ingesting.`,
          );
        }

        const metadata = item.metadata ?? {};
        this.schemaValidator.validateEventAgainstSchema(
          schema,
          item.data,
          metadata,
        );

        return this.eventsRepository.create({
          appId,
          eventName: item.event,
          customerId: item.customer_id ?? null,
          payload: item.data,
          level: item.level,
          metadata,
          occurredAt: item.timestamp ? new Date(item.timestamp) : new Date(),
          schemaId: schema.id,
        });
      }),
    );

    const saved = await this.eventsRepository.save(events);
    await Promise.all(
      saved.map((event) =>
        this.messageBus.publish(Topics.EVENTS_INGESTED, {
          eventId: event.id,
          appId: event.appId,
        }),
      ),
    );

    return saved;
  }

  async listForApp(
    appId: string,
    query: EventQueryDto,
  ): Promise<EventsListPage> {
    const limit = Math.min(Math.max(query.limit ?? 25, 1), 100);
    const cursorEvent = query.cursor
      ? await this.eventsRepository.findOne({
          where: { id: query.cursor, appId },
        })
      : null;

    const qb = this.eventsRepository
      .createQueryBuilder('event')
      .where('event.appId = :appId', { appId })
      .orderBy('event.occurredAt', 'DESC')
      .addOrderBy('event.id', 'DESC')
      .take(limit + 1);

    if (query.level) {
      qb.andWhere('event.level = :level', { level: query.level });
    }

    if (query.type) {
      qb.andWhere('event.eventName = :eventName', { eventName: query.type });
    }

    if (query.search) {
      qb.andWhere(
        '(event.eventName ILIKE :search OR event.customerId ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.from) {
      qb.andWhere('event.occurredAt >= :from', { from: new Date(query.from) });
    }

    if (query.to) {
      qb.andWhere('event.occurredAt <= :to', { to: new Date(query.to) });
    }

    if (cursorEvent) {
      qb.andWhere(
        '(event.occurredAt < :cursorAt OR (event.occurredAt = :cursorAt AND event.id < :cursorId))',
        {
          cursorAt: cursorEvent.occurredAt,
          cursorId: cursorEvent.id,
        },
      );
    }

    const rows = await qb.getMany();
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? (items.at(-1)?.id ?? null) : null;

    return { items, nextCursor };
  }

  async assertAppExists(appId: string): Promise<AppEntity | null> {
    return this.appsRepository.findOne({ where: { id: appId } });
  }
}
