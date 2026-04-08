import { isUUID } from 'class-validator';
import { FindOptionsWhere } from 'typeorm';
import { AppEntity } from '../../apps/entities/app.entity';

/**
 * Lookup key for an app owned by `accountId`. Path param may be the app UUID
 * or the globally unique slug.
 */
export function ownedAppWhere(
  accountId: string,
  appIdOrSlug: string,
): FindOptionsWhere<AppEntity> {
  if (isUUID(appIdOrSlug)) {
    return { accountId, id: appIdOrSlug };
  }
  return { accountId, slug: appIdOrSlug };
}
