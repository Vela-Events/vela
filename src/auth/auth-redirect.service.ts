import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthRedirectService {
  private readonly frontendCallbackUrl =
    process.env.FRONTEND_AUTH_CALLBACK_URL ??
    'http://localhost:3000/auth/callback';

  buildSuccessUrl(payload: Record<string, unknown>): string {
    return this.buildRedirectUrl({
      status: 'success',
      ...payload,
    });
  }

  buildErrorUrl(error: string, message: string): string {
    return this.buildRedirectUrl({
      status: 'error',
      error,
      message,
    });
  }

  private buildRedirectUrl(payload: Record<string, unknown>): string {
    const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString(
      'base64url',
    );
    const url = new URL(this.frontendCallbackUrl);
    url.searchParams.set('data', encoded);
    return url.toString();
  }
}
