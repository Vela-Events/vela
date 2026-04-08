import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IngestEventDto } from './ingest-event.dto';

export class BatchIngestEventsDto {
  @ApiProperty({ type: [IngestEventDto] })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => IngestEventDto)
  events!: IngestEventDto[];
}
