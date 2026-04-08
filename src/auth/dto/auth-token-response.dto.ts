import { ApiProperty } from '@nestjs/swagger';
import { AccountResponseDto } from '../../accounts/dto/account-response.dto';

export class AuthTokenResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ type: AccountResponseDto })
  account!: AccountResponseDto;
}
