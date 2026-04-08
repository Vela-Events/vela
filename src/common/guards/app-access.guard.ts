import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { DataSource } from 'typeorm';
import { AppEntity } from '../../apps/entities/app.entity';
import { AuthenticatedRequest } from '../interfaces/request-context.interface';

/**
 * Resolves `apps/:appId` by UUID or globally unique slug, sets `request.appContext`.
 * - **401** if there is no authenticated account on the request.
 * - **404** if no app exists for that id/slug.
 * - **403** if the app exists but is not owned by the authenticated account.
 */
@Injectable()
export class AppAccessGuard implements CanActivate {
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
      where: isUUID(appIdOrSlug) ? { id: appIdOrSlug } : { slug: appIdOrSlug },
    });

    if (!app) {
      throw new NotFoundException('App not found');
    }

    if (app.accountId !== accountId) {
      throw new ForbiddenException('App does not belong to this account');
    }

    request.appContext = {
      appId: app.id,
      slug: app.slug,
    };

    return true;
  }
}
