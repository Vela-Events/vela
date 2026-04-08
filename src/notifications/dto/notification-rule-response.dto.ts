import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationRuleEntity } from '../entities/notification-rule.entity';

export class NotificationRuleResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  appId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  eventName!: string;

  @ApiProperty()
  conditions!: Array<Record<string, unknown>>;

  @ApiProperty()
  actions!: Array<Record<string, unknown>>;

  @ApiProperty()
  enabled!: boolean;

  @ApiPropertyOptional()
  lastTriggeredAt!: string | null;

  @ApiProperty()
  triggerCount!: number;

  @ApiProperty()
  createdAt!: string;

  static fromEntity(
    entity: NotificationRuleEntity,
  ): NotificationRuleResponseDto {
    return {
      id: entity.id,
      appId: entity.appId,
      name: entity.name,
      eventName: entity.eventName,
      conditions: entity.conditions,
      actions: entity.actions,
      enabled: entity.enabled,
      lastTriggeredAt: entity.lastTriggeredAt
        ? entity.lastTriggeredAt.toISOString()
        : null,
      triggerCount: Number(entity.triggerCount),
      createdAt: entity.createdAt.toISOString(),
    };
  }
}
