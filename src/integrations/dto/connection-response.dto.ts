import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IntegrationProvider,
  IntegrationStatus,
} from '../../common/enums/domain.enums';
import { IntegrationConnectionEntity } from '../entities/integration-connection.entity';

export class ConnectionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  accountId!: string;

  @ApiProperty({ enum: IntegrationProvider })
  provider!: IntegrationProvider;

  @ApiProperty({ enum: IntegrationStatus })
  status!: IntegrationStatus;

  @ApiProperty()
  displayName!: string;

  @ApiPropertyOptional()
  externalTeamId!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  static fromEntity(
    entity: IntegrationConnectionEntity,
  ): ConnectionResponseDto {
    return {
      id: entity.id,
      accountId: entity.accountId,
      provider: entity.provider,
      status: entity.status,
      displayName: entity.displayName,
      externalTeamId: entity.externalTeamId,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
