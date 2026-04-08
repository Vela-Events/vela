import { ApiProperty } from '@nestjs/swagger';
import { DeliveryAttemptSummaryDto } from './delivery-attempt-summary.dto';
import { NotificationDeliveryAttemptResponseDto } from './notification-delivery-attempt-response.dto';

export class DeliveryAttemptListResponseDto {
  @ApiProperty({ type: [NotificationDeliveryAttemptResponseDto] })
  items!: NotificationDeliveryAttemptResponseDto[];

  @ApiProperty({ required: false, nullable: true })
  nextCursor!: string | null;

  @ApiProperty({ type: DeliveryAttemptSummaryDto })
  summary!: DeliveryAttemptSummaryDto;
}
