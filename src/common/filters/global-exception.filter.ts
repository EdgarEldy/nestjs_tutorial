import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from '../dto/api-response.dto';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException ? exception.message : 'Internal server error';

    this.logger.error(
      `${request.method} ${request.url} ${status}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    const body: ApiResponse<null> = {
      success: false,
      message,
      errors: this.extractErrors(exception),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(body);
  }

  private extractErrors(exception: unknown): string[] {
    if (!(exception instanceof HttpException)) {
      return ['Internal server error'];
    }
    const res = exception.getResponse();
    if (typeof res === 'object' && res !== null && 'message' in res) {
      const msg = (res as Record<string, unknown>)['message'];
      if (Array.isArray(msg)) {
        return msg.map(String);
      }
      return [String(msg)];
    }
    return [typeof res === 'string' ? res : 'Unknown error'];
  }
}
