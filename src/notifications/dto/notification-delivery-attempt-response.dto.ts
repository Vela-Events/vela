import { ApiProperty } from '@nestjs/swagger';
import { NotificationDeliveryAttemptEntity } from '../entities/notification-delivery-attempt.entity';

export class NotificationDeliveryAttemptResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  appId!: string;

  @ApiProperty()
  eventId!: string;

  @ApiProperty()
  ruleId!: string;

  @ApiProperty({ required: false, nullable: true })
  ruleName!: string | null;

  @ApiProperty()
  destinationId!: string;

  @ApiProperty({ required: false, nullable: true })
  destinationLabel!: string | null;

  @ApiProperty()
  channel!: string;

  @ApiProperty()
  attemptNumber!: number;

  @ApiProperty({ enum: ['pending', 'delivered', 'failed'] })
  status!: 'pending' | 'delivered' | 'failed';

  @ApiProperty({ required: false, nullable: true })
  responseCode!: number | null;

  @ApiProperty({ required: false, nullable: true })
  responseBody!: string | null;

  @ApiProperty({ required: false, nullable: true })
  errorMessage!: string | null;

  @ApiProperty({ required: false, nullable: true })
  deliveredAt!: string | null;

  @ApiProperty()
  createdAt!: string;

  static fromEntity(
    entity: NotificationDeliveryAttemptEntity,
    metadata?: { ruleName?: string | null; destinationLabel?: string | null },
  ): NotificationDeliveryAttemptResponseDto {
    return {
      id: entity.id,
      appId: entity.appId,
      eventId: entity.eventId,
      ruleId: entity.ruleId,
      ruleName: metadata?.ruleName ?? null,
      destinationId: entity.destinationId,
      destinationLabel: metadata?.destinationLabel ?? null,
      channel: entity.channel,
      attemptNumber: entity.attemptNumber,
      status: entity.status,
      responseCode: entity.responseCode,
      responseBody: entity.responseBody,
      errorMessage: entity.errorMessage,
      deliveredAt: entity.deliveredAt?.toISOString() ?? null,
      createdAt: entity.createdAt.toISOString(),
    };
  }
}
