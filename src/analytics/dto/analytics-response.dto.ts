import { ApiProperty } from '@nestjs/swagger';

/** One chart point; `date` is ISO 8601 (hourly or daily UTC bucket start). */
export class TimeSeriesPointDto {
  @ApiProperty({
    example: '2026-03-28T12:00:00.000Z',
    description: 'Bucket start (UTC), ISO string',
  })
  date!: string;

  @ApiProperty({
    description:
      'For eventTrends: event count in the bucket. For errorRate: % of events in the bucket that were level=error (0–100).',
  })
  value!: number;
}

export class EventDistributionDto {
  @ApiProperty({ example: 'order.placed' })
  event!: string;

  @ApiProperty()
  count!: number;

  @ApiProperty({
    description:
      'Share of all events in the range window (0–100, two decimals)',
  })
  percentage!: number;
}

export class ErrorBreakdownDto {
  @ApiProperty()
  event!: string;

  @ApiProperty()
  count!: number;

  @ApiProperty({
    description:
      'Change vs the immediately preceding window of equal length (current count − previous count)',
  })
  change!: number;
}

export class AnalyticsResponseDto {
  @ApiProperty({ type: [TimeSeriesPointDto] })
  eventTrends!: TimeSeriesPointDto[];

  @ApiProperty({
    type: [TimeSeriesPointDto],
    description:
      'Same bucket boundaries as eventTrends; value = error share % per bucket',
  })
  errorRate!: TimeSeriesPointDto[];

  @ApiProperty({ type: [EventDistributionDto] })
  eventDistribution!: EventDistributionDto[];

  @ApiProperty({ type: [ErrorBreakdownDto] })
  errorBreakdown!: ErrorBreakdownDto[];

  @ApiProperty({
    description: 'Total events in the selected range window',
  })
  totalEvents!: number;

  @ApiProperty({
    description: 'Events with occurredAt ≥ start of current UTC calendar day',
  })
  eventsToday!: number;

  @ApiProperty({
    description: 'Events with level=error in the selected range window',
  })
  errorCount!: number;

  @ApiProperty({
    description:
      'Distinct non-empty metadata.source values in the selected range window',
  })
  activeSources!: number;
}
