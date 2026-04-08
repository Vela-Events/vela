import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateClientSecretDto {
  @ApiProperty({ example: 'Production server' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  label!: string;
}
