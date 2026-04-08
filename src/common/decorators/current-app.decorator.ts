import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  AuthenticatedRequest,
  RequestAppContext,
} from '../interfaces/request-context.interface';

export const CurrentApp = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestAppContext | undefined => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.appContext;
  },
);
