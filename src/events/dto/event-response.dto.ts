import { ApiProperty } from '@nestjs/swagger';
import { EVENT_LEVELS, type EventLevel } from '../../common/enums/domain.enums';
import { EventEntity } from '../entities/event.entity';

export class EventResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  appId!: string;

  @ApiProperty()
  event!: string;

  @ApiProperty({ nullable: true })
  customer_id!: string | null;

  @ApiProperty()
  data!: Record<string, unknown>;

  @ApiProperty({ enum: EVENT_LEVELS })
  level!: EventLevel;

  @ApiProperty()
  metadata!: Record<string, unknown>;

  @ApiProperty()
  timestamp!: string;

  @ApiProperty()
  ingestedAt!: string;

  static fromEntity(entity: EventEntity): EventResponseDto {
    return {
      id: entity.id,
      appId: entity.appId,
      event: entity.eventName,
      customer_id: entity.customerId,
      data: entity.payload,
      level: entity.level,
      metadata: entity.metadata,
      timestamp: entity.occurredAt.toISOString(),
      ingestedAt: entity.ingestedAt.toISOString(),
    };
  }
}
