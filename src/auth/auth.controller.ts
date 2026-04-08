import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import type { Response } from 'express';
import { AuthRedirectService } from './auth-redirect.service';
import { AuthService } from './auth.service';
import { GithubCallbackGuard } from './guards/github-callback.guard';
import { GoogleCallbackGuard } from './guards/google-callback.guard';
import { SocialAuthUser } from './interfaces/social-auth-user.interface';

interface SocialAuthRequest extends Request {
  user: SocialAuthUser;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authRedirectService: AuthRedirectService,
  ) {}

  @Get('google')
  @ApiExcludeEndpoint()
  @UseGuards(AuthGuard('google'))
  signInWithGoogle(): void {}

  @Get('google/callback')
  @ApiExcludeEndpoint()
  @UseGuards(GoogleCallbackGuard)
  async handleGoogleCallback(
    @Req() request: SocialAuthRequest,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.authService.issueSocialToken(request.user);
    response.redirect(
      this.authRedirectService.buildSuccessUrl({
        accessToken: result.accessToken,
        account: result.account,
      }),
    );
  }

  @Get('github')
  @ApiExcludeEndpoint()
  @UseGuards(AuthGuard('github'))
  signInWithGithub(): void {}

  @Get('github/callback')
  @ApiExcludeEndpoint()
  @UseGuards(GithubCallbackGuard)
  async handleGithubCallback(
    @Req() request: SocialAuthRequest,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.authService.issueSocialToken(request.user);
    response.redirect(
      this.authRedirectService.buildSuccessUrl({
        accessToken: result.accessToken,
        account: result.account,
      }),
    );
  }
}
