import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { IntegrationProvider } from '../../common/enums/domain.enums';

export class NotificationActionDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty()
  @IsUUID()
  destinationId!: string;

  @ApiProperty({ enum: IntegrationProvider })
  @IsEnum(IntegrationProvider)
  channel!: IntegrationProvider;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  target?: string;

  @ApiProperty()
  @IsBoolean()
  enabled!: boolean;
}
