import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { EVENT_LEVELS, type EventLevel } from '../../common/enums/domain.enums';

export class IngestEventDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  event!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  customer_id?: string;

  @ApiProperty()
  @IsObject()
  data!: Record<string, unknown>;

  @ApiProperty({ enum: EVENT_LEVELS })
  @IsIn([...EVENT_LEVELS])
  level!: EventLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  timestamp?: string;
}
