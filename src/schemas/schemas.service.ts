import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEventSchemaDto } from './dto/create-event-schema.dto';
import { UpdateEventSchemaDto } from './dto/update-event-schema.dto';
import { EventSchemaEntity } from './entities/event-schema.entity';

function newEventSchemaId(): string {
  return `sch_${Date.now()}`;
}

@Injectable()
export class SchemasService {
  constructor(
    @InjectRepository(EventSchemaEntity)
    private readonly schemasRepository: Repository<EventSchemaEntity>,
  ) {}

  async listForApp(appId: string): Promise<EventSchemaEntity[]> {
    return this.schemasRepository.find({
      where: { appId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByEventName(
    appId: string,
    eventName: string,
  ): Promise<EventSchemaEntity> {
    const schema = await this.schemasRepository.findOne({
      where: { appId, eventName },
    });

    if (!schema) {
      throw new NotFoundException(
        `No schema registered for event name "${eventName}"`,
      );
    }

    return schema;
  }

  async create(
    appId: string,
    dto: CreateEventSchemaDto,
  ): Promise<EventSchemaEntity> {
    const existing = await this.schemasRepository.findOne({
      where: { appId, eventName: dto.eventName },
    });

    if (existing) {
      throw new ConflictException(
        'A schema already exists for this event name',
      );
    }

    const schema = this.schemasRepository.create({
      id: newEventSchemaId(),
      appId,
      eventName: dto.eventName,
      description: dto.description ?? null,
      fields: dto.fields.map((field) => ({ ...field })),
      metadataFields: (dto.metadataFields ?? []).map((field) => ({ ...field })),
    } as Partial<EventSchemaEntity>);

    return this.schemasRepository.save(schema);
  }

  async update(
    appId: string,
    schemaId: string,
    dto: UpdateEventSchemaDto,
  ): Promise<EventSchemaEntity> {
    const schema = await this.schemasRepository.findOne({
      where: { id: schemaId, appId },
    });

    if (!schema) {
      throw new NotFoundException('Schema not found');
    }

    if (dto.eventName && dto.eventName !== schema.eventName) {
      const conflicting = await this.schemasRepository.findOne({
        where: { appId, eventName: dto.eventName },
      });

      if (conflicting && conflicting.id !== schema.id) {
        throw new ConflictException(
          'A schema already exists for this event name',
        );
      }

      schema.eventName = dto.eventName;
    }

    if (dto.description !== undefined) {
      schema.description = dto.description ?? null;
    }

    if (dto.fields) {
      schema.fields = dto.fields.map((field) => ({ ...field }));
    }

    if (dto.metadataFields) {
      schema.metadataFields = dto.metadataFields.map((field) => ({
        ...field,
      }));
    }

    return this.schemasRepository.save(schema);
  }
}
