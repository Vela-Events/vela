import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  AuthenticatedRequest,
  RequestAccountContext,
} from '../interfaces/request-context.interface';

export const CurrentAccount = createParamDecorator(
  (
    _data: unknown,
    ctx: ExecutionContext,
  ): RequestAccountContext | undefined => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
