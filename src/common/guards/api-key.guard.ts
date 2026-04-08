import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppEntity } from '../../apps/entities/app.entity';
import { verifyApiKey } from '../utils/crypto.util';
import { AuthenticatedRequest } from '../interfaces/request-context.interface';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const raw = request.headers['x-api-key'];
    const apiKey = Array.isArray(raw) ? raw[0] : raw;

    if (!apiKey) {
      throw new UnauthorizedException('Missing x-api-key header');
    }

    const prefixParts = apiKey.split('_');

    if (prefixParts.length < 3) {
      throw new ForbiddenException('Invalid API key format');
    }

    const keyPrefix = `${prefixParts[0]}_${prefixParts[1]}_${prefixParts[2].slice(0, 8)}`;
    const appsRepository = this.dataSource.getRepository(AppEntity);
    const candidates = await appsRepository.find({
      where: { apiKeyPrefix: keyPrefix },
    });
    const app = candidates.find((candidate) =>
      verifyApiKey(apiKey, candidate.apiKeyHash),
    );

    if (!app) {
      throw new ForbiddenException('Invalid API key');
    }

    request.appContext = {
      appId: app.id,
      slug: app.slug,
    };

    return true;
  }
}
