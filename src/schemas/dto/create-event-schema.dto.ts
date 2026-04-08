import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { SchemaFieldDto } from './schema-field.dto';
import { SchemaMetadataFieldDto } from './schema-metadata-field.dto';

export class CreateEventSchemaDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  eventName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [SchemaFieldDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SchemaFieldDto)
  fields!: SchemaFieldDto[];

  @ApiPropertyOptional({ type: [SchemaMetadataFieldDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SchemaMetadataFieldDto)
  metadataFields?: SchemaMetadataFieldDto[];
}
