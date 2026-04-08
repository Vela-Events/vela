import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = isHttpException ? exception.getResponse() : null;

    if (!isHttpException) {
      const trace =
        exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(
        `${request.method} ${request.url} — ${exception instanceof Error ? exception.message : trace}`,
        trace,
      );
    }

    const fallbackMessage =
      exception instanceof Error ? exception.message : 'Internal server error';
    const exceptionMessage =
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
        ? exceptionResponse.message
        : null;
    const normalizedMessage = Array.isArray(exceptionMessage)
      ? exceptionMessage.join(', ')
      : typeof exceptionMessage === 'string'
        ? exceptionMessage
        : fallbackMessage;
    const normalizedError =
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'error' in exceptionResponse &&
      typeof exceptionResponse.error === 'string'
        ? exceptionResponse.error
        : isHttpException
          ? typeof exceptionResponse === 'string'
            ? exceptionResponse
            : fallbackMessage
          : fallbackMessage;

    const body: Record<string, unknown> = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: normalizedError,
      message: normalizedMessage,
    };

    response.status(status).json(body);
  }
}
