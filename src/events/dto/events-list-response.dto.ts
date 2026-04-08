import { ApiProperty } from '@nestjs/swagger';
import { EventResponseDto } from './event-response.dto';

export class EventsListResponseDto {
  @ApiProperty({ type: [EventResponseDto] })
  items!: EventResponseDto[];

  @ApiProperty({
    nullable: true,
    description:
      'Opaque cursor (event id). Pass as the `cursor` query param to fetch the next page.',
  })
  nextCursor!: string | null;
}
