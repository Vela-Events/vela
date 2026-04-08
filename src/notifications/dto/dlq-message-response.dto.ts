import { ApiProperty } from '@nestjs/swagger';

export class DlqMessageResponseDto {
  @ApiProperty()
  messageId!: string;

  @ApiProperty()
  topic!: string;

  @ApiProperty()
  publishedAt!: string;

  @ApiProperty()
  retryCount!: number;

  @ApiProperty({ required: false, nullable: true })
  finalError!: string | null;

  @ApiProperty()
  payload!: Record<string, unknown>;
}
