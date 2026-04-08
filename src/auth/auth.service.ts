import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccountResponseDto } from '../accounts/dto/account-response.dto';
import { AccountsService } from '../accounts/accounts.service';
import { AccountEntity } from '../accounts/entities/account.entity';
import { AuthTokenResponseDto } from './dto/auth-token-response.dto';
import { SocialAuthUser } from './interfaces/social-auth-user.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly jwtService: JwtService,
  ) {}

  async issueSocialToken(user: SocialAuthUser): Promise<AuthTokenResponseDto> {
    const account = await this.accountsService.ensureAccount(
      user.email,
      user.name,
    );

    return this.createAuthResponse(account);
  }

  private async createAuthResponse(
    account: AccountEntity,
  ): Promise<AuthTokenResponseDto> {
    const accessToken = await this.jwtService.signAsync({
      sub: account.id,
      email: account.email,
      name: account.name,
    });

    return {
      accessToken,
      account: AccountResponseDto.fromEntity(account),
    };
  }
}
