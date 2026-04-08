import { PartialType } from '@nestjs/swagger';
import { CreateEventSchemaDto } from './create-event-schema.dto';

export class UpdateEventSchemaDto extends PartialType(CreateEventSchemaDto) {}
