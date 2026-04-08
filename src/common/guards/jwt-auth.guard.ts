import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  JsonWebTokenError,
  TokenExpiredError,
  verify,
} from 'jsonwebtoken';
import { AuthenticatedRequest } from '../interfaces/request-context.interface';
import { AccountEntity } from '../../accounts/entities/account.entity';
import { ClientSecretEntity } from '../../client-secrets/entities/client-secret.entity';
import { verifyClientSecret } from '../utils/crypto.util';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorizationHeader = request.headers.authorization;
    const bearerToken = Array.isArray(authorizationHeader)
      ? authorizationHeader[0]
      : authorizationHeader;

    if (!bearerToken?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = bearerToken.slice(7);

    if (token.startsWith('vela_cs_')) {
      return this.authenticateClientSecret(token, request);
    }

    return this.authenticateJwt(token, request);
  }

  private async authenticateClientSecret(
    token: string,
    request: AuthenticatedRequest,
  ): Promise<boolean> {
    const parts = token.split('_');
    if (parts.length < 3) {
      throw new UnauthorizedException('Invalid client secret format');
    }

    const keyPrefix = `vela_cs_${parts[2].slice(0, 8)}`;
    const secretsRepo = this.dataSource.getRepository(ClientSecretEntity);
    const candidates = await secretsRepo.find({ where: { keyPrefix } });

    const matched = candidates.find((c) =>
      verifyClientSecret(token, c.keyHash),
    );
    if (!matched) {
      throw new UnauthorizedException('Invalid client secret');
    }

    // Update lastUsedAt without blocking the request
    secretsRepo
      .update(matched.id, { lastUsedAt: new Date() })
      .catch(() => undefined);

    const accountsRepo = this.dataSource.getRepository(AccountEntity);
    const account = await accountsRepo.findOne({
      where: { id: matched.accountId },
    });

    if (!account) {
      throw new UnauthorizedException('Account not found');
    }

    request.user = {
      accountId: account.id,
      email: account.email,
      name: account.name,
    };

    return true;
  }

  private async authenticateJwt(
    token: string,
    request: AuthenticatedRequest,
  ): Promise<boolean> {
    const secret = process.env.JWT_SECRET!;
    let payload: ReturnType<typeof verify>;
    try {
      payload = verify(token, secret);
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw new UnauthorizedException('jwt expired');
      }
      if (err instanceof JsonWebTokenError) {
        throw new UnauthorizedException(err.message);
      }
      throw err;
    }

    if (
      !payload ||
      typeof payload !== 'object' ||
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string'
    ) {
      throw new UnauthorizedException('Invalid bearer token');
    }

    const accountsRepo = this.dataSource.getRepository(AccountEntity);
    const account = await accountsRepo.findOne({
      where: { id: payload.sub, email: payload.email.toLowerCase() },
    });

    if (!account) {
      throw new UnauthorizedException(
        'Account referenced by token was not found',
      );
    }

    request.user = {
      accountId: account.id,
      email: account.email,
      name: account.name,
    };

    return true;
  }
}
