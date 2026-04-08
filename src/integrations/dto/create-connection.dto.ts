import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  IntegrationProvider,
  IntegrationStatus,
} from '../../common/enums/domain.enums';

export class CreateConnectionDto {
  @ApiProperty({ enum: IntegrationProvider })
  @IsEnum(IntegrationProvider)
  provider!: IntegrationProvider;

  @ApiPropertyOptional({ enum: IntegrationStatus })
  @IsOptional()
  @IsEnum(IntegrationStatus)
  status?: IntegrationStatus;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  displayName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  credentials?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalTeamId?: string;
}
