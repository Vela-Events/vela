import { applyDecorators } from '@nestjs/common';
import { ApiParam } from '@nestjs/swagger';

/**
 * Documents `apps/:appId/...` for OpenAPI. Use on the controller or on each
 * handler, since `appId` is read in guards rather than `@Param('appId')`.
 */
export function ApiAppIdParam() {
  return applyDecorators(
    ApiParam({
      name: 'appId',
      description: 'Application id (UUID) or globally unique slug',
      schema: { type: 'string' },
      required: true,
    }),
  );
}
