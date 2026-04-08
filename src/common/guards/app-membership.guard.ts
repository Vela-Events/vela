import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppEntity } from '../../apps/entities/app.entity';
import { ownedAppWhere } from '../utils/app-lookup.util';
import { AuthenticatedRequest } from '../interfaces/request-context.interface';

@Injectable()
export class AppMembershipGuard implements CanActivate {
  constructor(private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const accountId = request.user?.accountId;
    const appIdOrSlug = request.params?.appId;

    if (!accountId) {
      throw new UnauthorizedException('Missing authenticated account context');
    }

    if (!appIdOrSlug) {
      throw new ForbiddenException('App identifier is required');
    }

    const appsRepository = this.dataSource.getRepository(AppEntity);
    const app = await appsRepository.findOne({
      where: ownedAppWhere(accountId, appIdOrSlug),
    });

    if (!app) {
      throw new ForbiddenException('App does not belong to this account');
    }

    request.appContext = {
      appId: app.id,
      slug: app.slug,
    };

    return true;
  }
}
