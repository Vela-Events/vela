import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClientSecretEntity } from '../entities/client-secret.entity';

export class ClientSecretResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() label!: string;
  @ApiProperty() keyPrefix!: string;
  @ApiPropertyOptional({ nullable: true }) lastUsedAt!: string | null;
  @ApiProperty() createdAt!: string;

  static fromEntity(e: ClientSecretEntity): ClientSecretResponseDto {
    const dto = new ClientSecretResponseDto();
    dto.id = e.id;
    dto.label = e.label;
    dto.keyPrefix = e.keyPrefix;
    dto.lastUsedAt = e.lastUsedAt ? e.lastUsedAt.toISOString() : null;
    dto.createdAt = e.createdAt.toISOString();
    return dto;
  }
}

export class ClientSecretWithKeyResponseDto extends ClientSecretResponseDto {
  @ApiProperty({ description: 'Full secret — shown once, store securely' })
  clientSecret!: string;

  static fromEntityWithKey(
    e: ClientSecretEntity,
    plainTextKey: string,
  ): ClientSecretWithKeyResponseDto {
    const dto = new ClientSecretWithKeyResponseDto();
    dto.id = e.id;
    dto.label = e.label;
    dto.keyPrefix = e.keyPrefix;
    dto.lastUsedAt = e.lastUsedAt ? e.lastUsedAt.toISOString() : null;
    dto.createdAt = e.createdAt.toISOString();
    dto.clientSecret = plainTextKey;
    return dto;
  }
}
