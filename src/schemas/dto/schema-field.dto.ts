import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SchemaFieldValidationDto } from './schema-field-validation.dto';

const schemaFieldTypes = [
  'string',
  'number',
  'boolean',
  'date',
  'enum',
  'object',
] as const;

export class SchemaFieldDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ enum: schemaFieldTypes })
  @IsString()
  @IsIn(schemaFieldTypes)
  type!: (typeof schemaFieldTypes)[number];

  @ApiProperty()
  @IsBoolean()
  required!: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  defaultValue?: unknown;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  enumValues?: string[];

  @ApiPropertyOptional({ type: SchemaFieldValidationDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SchemaFieldValidationDto)
  validation?: SchemaFieldValidationDto;
}
