import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AccountsModule } from '../accounts/accounts.module';
import { AuthController } from './auth.controller';
import { AuthRedirectService } from './auth-redirect.service';
import { AuthService } from './auth.service';
import { GithubCallbackGuard } from './guards/github-callback.guard';
import { GoogleCallbackGuard } from './guards/google-callback.guard';
import { GithubStrategy } from './strategies/github.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [
    AccountsModule,
    PassportModule.register({ session: false }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '12h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRedirectService,
    GoogleStrategy,
    GithubStrategy,
    GoogleCallbackGuard,
    GithubCallbackGuard,
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
