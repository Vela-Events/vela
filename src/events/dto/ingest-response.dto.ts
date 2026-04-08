import { ApiProperty } from '@nestjs/swagger';
import { EventResponseDto } from './event-response.dto';

export class IngestResponseDto {
  @ApiProperty()
  accepted!: number;

  @ApiProperty({ type: [EventResponseDto] })
  events!: EventResponseDto[];
}
