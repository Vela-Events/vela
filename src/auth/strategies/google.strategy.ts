import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { SocialAuthUser } from '../interfaces/social-auth-user.interface';

type Done = (error: Error | null, user?: SocialAuthUser | false) => void;

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID', ''),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET', ''),
      callbackURL: configService.get<string>(
        'GOOGLE_CALLBACK_URL',
        'http://localhost:3000/v1/auth/google/callback',
      ),
      scope: ['profile', 'email'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: Done,
  ): void {
    const email = profile.emails?.find((entry) => entry.verified)?.value;

    if (!email) {
      done(
        new UnauthorizedException(
          'Google account must expose a verified email address',
        ),
        false,
      );
      return;
    }

    const user: SocialAuthUser = {
      provider: 'google',
      email: email.toLowerCase(),
      name: profile.displayName || undefined,
    };
    done(null, user);
  }
}
