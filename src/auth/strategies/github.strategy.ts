import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-github2';
import { SocialAuthUser } from '../interfaces/social-auth-user.interface';

type Done = (error: Error | null, user?: SocialAuthUser | false) => void;

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID', ''),
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET', ''),
      callbackURL: configService.get<string>(
        'GITHUB_CALLBACK_URL',
        'http://localhost:3000/v1/auth/github/callback',
      ),
      scope: ['user:email'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: Done,
  ): void {
    const email = profile.emails?.[0]?.value;

    if (!email) {
      done(
        new UnauthorizedException(
          'GitHub account must expose a verified primary email address',
        ),
        false,
      );
      return;
    }

    const user: SocialAuthUser = {
      provider: 'github',
      email: email.toLowerCase(),
      name: profile.displayName || profile.username || undefined,
    };
    done(null, user);
  }
}
