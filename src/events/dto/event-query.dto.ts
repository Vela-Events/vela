import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { EVENT_LEVELS, type EventLevel } from '../../common/enums/domain.enums';

export class EventQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: EVENT_LEVELS })
  @IsOptional()
  @IsIn([...EVENT_LEVELS])
  level?: EventLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    description:
      "Event id from the previous response's `nextCursor` (keyset pagination).",
  })
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @ApiPropertyOptional({ default: 25 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  limit?: number;
}
