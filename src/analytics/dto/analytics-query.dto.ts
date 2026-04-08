import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

const ANALYTICS_RANGES = ['24h', '7d', '30d', '90d'] as const;

export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number];

export class AnalyticsQueryDto {
  @ApiPropertyOptional({
    enum: ANALYTICS_RANGES,
    default: '24h',
    description: 'Rolling window for charts and window-scoped totals',
  })
  @IsOptional()
  @IsIn([...ANALYTICS_RANGES])
  range?: AnalyticsRange;
}
