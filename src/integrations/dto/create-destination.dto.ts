import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { NotificationDestinationKind } from '../../common/enums/domain.enums';

export class CreateDestinationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  connectionId?: string;

  @ApiProperty({ enum: NotificationDestinationKind })
  @IsEnum(NotificationDestinationKind)
  kind!: NotificationDestinationKind;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  label!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  emailAddress?: string;
}
