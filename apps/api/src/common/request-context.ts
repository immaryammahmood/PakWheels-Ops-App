import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { Injectable } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import type { StructuredLogger } from './structured-logger.js';

@Injectable()
export class RequestContext {
  private readonly storage = new AsyncLocalStorage<{ requestId: string }>();
  get requestId(): string | undefined { return this.storage.getStore()?.requestId; }

  middleware(logger: StructuredLogger) {
    return (req: Request, res: Response, next: NextFunction): void => {
      // Never accept a client-supplied ID. Trusted proxy policy is future work.
      const requestId = randomUUID();
      const started = performance.now();
      res.locals.requestId = requestId;
      res.setHeader('X-Request-ID', requestId);
      let recorded = false;
      const record = (aborted: boolean): void => {
        if (recorded) return;
        recorded = true;
        // Only framework route templates are logged, never raw URLs or query strings.
        const route: unknown = req.route?.path;
        logger.request({requestId, method: req.method, route: typeof route === 'string' ? route : '<unmatched>',
          status: aborted ? 499 : res.statusCode, durationMs: Math.round((performance.now() - started) * 100) / 100});
      };
      res.once('finish', () => record(false));
      res.once('close', () => record(!res.writableFinished));
      this.storage.run({ requestId }, next);
    };
  }
}
