import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class DeliveryAttemptQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ruleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  destinationId?: string;

  @ApiPropertyOptional({ enum: ['pending', 'delivered', 'failed'] })
  @IsOptional()
  @IsIn(['pending', 'delivered', 'failed'])
  status?: 'pending' | 'delivered' | 'failed';

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @ApiPropertyOptional({ default: 25 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  limit?: number;
}
