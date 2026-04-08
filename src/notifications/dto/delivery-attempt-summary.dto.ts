import { ApiProperty } from '@nestjs/swagger';

export class DeliveryAttemptSummaryDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  pending!: number;

  @ApiProperty()
  delivered!: number;

  @ApiProperty()
  failed!: number;
}
