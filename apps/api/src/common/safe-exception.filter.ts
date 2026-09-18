import { STATUS_CODES } from 'node:http';
import { Catch, HttpException } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class SafeExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    if (response.headersSent) { response.end(); return; }
    let status = exception instanceof HttpException ? exception.getStatus() : 500;
    // Express JSON-parser errors occur before controllers; expose no parser details.
    if (exception !== null && typeof exception === 'object' && 'type' in exception) {
      if (exception.type === 'entity.parse.failed') status = 400;
      if (exception.type === 'entity.too.large') status = 413;
    }
    if (!Number.isInteger(status) || status < 400 || status > 599) status = 500;
    const error = STATUS_CODES[status] ?? 'Request Failed';
    response.status(status).json({statusCode: status, error, message: error, requestId: response.locals.requestId});
  }
}
