import { ApiProperty } from '@nestjs/swagger';
import { AppResponseDto } from './app-response.dto';

export class AppWithKeyResponseDto {
  @ApiProperty({ type: AppResponseDto })
  app!: AppResponseDto;

  @ApiProperty()
  apiKey!: string;
}
