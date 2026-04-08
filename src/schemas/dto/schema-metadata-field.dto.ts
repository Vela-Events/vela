import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

const metadataFieldTypes = [
  'string',
  'number',
  'boolean',
  'date',
  'enum',
  'object',
] as const;

export class SchemaMetadataFieldDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ enum: metadataFieldTypes })
  @IsString()
  @IsIn(metadataFieldTypes)
  type!: (typeof metadataFieldTypes)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
