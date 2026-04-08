import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventSchemaEntity } from '../entities/event-schema.entity';

export class EventSchemaResponseDto {
  @ApiProperty({ example: 'sch_1774737919717' })
  id!: string;

  @ApiProperty()
  appId!: string;

  @ApiProperty()
  eventName!: string;

  @ApiPropertyOptional()
  description!: string | null;

  @ApiProperty()
  fields!: Array<Record<string, unknown>>;

  @ApiProperty()
  metadataFields!: Array<Record<string, unknown>>;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  static fromEntity(entity: EventSchemaEntity): EventSchemaResponseDto {
    return {
      id: entity.id,
      appId: entity.appId,
      eventName: entity.eventName,
      description: entity.description,
      fields: entity.fields,
      metadataFields: entity.metadataFields,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
