import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SchemaFieldValidationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  min?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  max?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pattern?: string;
}
