import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthRedirectService } from '../auth-redirect.service';

@Injectable()
export class GoogleCallbackGuard extends AuthGuard('google') {
  constructor(private readonly authRedirectService: AuthRedirectService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return (await super.canActivate(context)) as boolean;
    } catch (error) {
      this.redirectWithError(context, error);
      return false;
    }
  }

  handleRequest<TUser = unknown>(error: unknown, user: TUser): TUser {
    if (error || !user) {
      throw error instanceof Error
        ? error
        : new UnauthorizedException('Google sign-in failed');
    }

    return user;
  }

  private redirectWithError(context: ExecutionContext, error: unknown): void {
    const response = context.switchToHttp().getResponse<Response>();
    const message =
      error instanceof Error ? error.message : 'Google sign-in failed';
    response.redirect(
      this.authRedirectService.buildErrorUrl('Unauthorized', message),
    );
  }
}
