import { ApiProperty } from '@nestjs/swagger';
import { Allow, IsIn, IsString } from 'class-validator';

const operators = [
  'equals',
  'not_equals',
  'greater_than',
  'less_than',
  'contains',
  'starts_with',
] as const;

export class NotificationConditionDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty()
  @IsString()
  field!: string;

  @ApiProperty({ enum: operators })
  @IsString()
  @IsIn(operators)
  operator!: (typeof operators)[number];

  @ApiProperty()
  @Allow()
  value!: unknown;
}
