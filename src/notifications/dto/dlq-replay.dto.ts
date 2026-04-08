import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsUUID } from 'class-validator';

export class DlqReplayDto {
  @ApiPropertyOptional({ default: 25 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ruleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  destinationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  eventId?: string;
}
