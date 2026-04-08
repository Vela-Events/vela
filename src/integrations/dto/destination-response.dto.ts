import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationDestinationKind } from '../../common/enums/domain.enums';
import { NotificationDestinationEntity } from '../entities/notification-destination.entity';

export class DestinationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  appId!: string;

  @ApiPropertyOptional()
  connectionId!: string | null;

  @ApiProperty({ enum: NotificationDestinationKind })
  kind!: NotificationDestinationKind;

  @ApiProperty()
  label!: string;

  @ApiPropertyOptional()
  emailAddress!: string | null;

  @ApiPropertyOptional()
  verifiedAt!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  static fromEntity(
    entity: NotificationDestinationEntity,
  ): DestinationResponseDto {
    return {
      id: entity.id,
      appId: entity.appId,
      connectionId: entity.connectionId,
      kind: entity.kind,
      label: entity.label,
      emailAddress: entity.emailAddress,
      verifiedAt: entity.verifiedAt ? entity.verifiedAt.toISOString() : null,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
