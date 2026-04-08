import { ApiProperty } from '@nestjs/swagger';

/** Dashboard stat cards — all counts are non-negative integers. */
export class DashboardStatsResponseDto {
  @ApiProperty({
    description:
      'All-time count of ingested events for this app (`events` table, scoped by `appId`).',
    example: 12450,
  })
  totalEvents!: number;

  @ApiProperty({
    description:
      'Events with `occurredAt` on or after **00:00:00.000 UTC** on the current calendar day.',
    example: 42,
  })
  eventsToday!: number;

  @ApiProperty({
    description: 'All-time count of events with `level = error` for this app.',
    example: 3,
  })
  errorCount!: number;

  @ApiProperty({
    description:
      'Distinct non-empty `metadata.source` string values for events in the **last 7×24h** (rolling window from request time), scoped by `appId`. Events without `metadata.source` do not contribute.',
    example: 4,
  })
  activeSources!: number;
}
