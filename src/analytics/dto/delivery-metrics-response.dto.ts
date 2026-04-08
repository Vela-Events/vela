import { ApiProperty } from '@nestjs/swagger';

class DeliveryMetricTrendPointDto {
  @ApiProperty()
  bucket!: string;

  @ApiProperty()
  delivered!: number;

  @ApiProperty()
  failed!: number;

  @ApiProperty()
  pending!: number;

  @ApiProperty()
  retries!: number;
}

export class DeliveryMetricsResponseDto {
  @ApiProperty()
  totalAttempts!: number;

  @ApiProperty()
  deliveredAttempts!: number;

  @ApiProperty()
  failedAttempts!: number;

  @ApiProperty()
  pendingAttempts!: number;

  @ApiProperty()
  retryAttempts!: number;

  @ApiProperty()
  successRate!: number;

  @ApiProperty()
  retryVolume!: number;

  @ApiProperty({ type: [DeliveryMetricTrendPointDto] })
  deliveryTrends!: DeliveryMetricTrendPointDto[];
}
