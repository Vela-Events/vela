import { ApiProperty } from '@nestjs/swagger';
import { AppEntity } from '../entities/app.entity';

export class AppResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  accountId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  apiKeyPrefix!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  static fromEntity(entity: AppEntity): AppResponseDto {
    return {
      id: entity.id,
      accountId: entity.accountId,
      name: entity.name,
      slug: entity.slug,
      apiKeyPrefix: entity.apiKeyPrefix,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
