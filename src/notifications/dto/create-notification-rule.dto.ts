import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { NotificationActionDto } from './notification-action.dto';
import { NotificationConditionDto } from './notification-condition.dto';

export class CreateNotificationRuleDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  eventName!: string;

  @ApiProperty({ type: [NotificationConditionDto] })
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => NotificationConditionDto)
  conditions!: NotificationConditionDto[];

  @ApiProperty({ type: [NotificationActionDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => NotificationActionDto)
  actions!: NotificationActionDto[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
