import { ApiProperty } from '@nestjs/swagger';

export class DlqReplayResponseDto {
  @ApiProperty()
  inspected!: number;

  @ApiProperty()
  replayed!: number;

  @ApiProperty()
  remaining!: number;
}
