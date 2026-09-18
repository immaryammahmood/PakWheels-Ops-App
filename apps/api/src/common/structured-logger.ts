import type { LoggerService } from '@nestjs/common';

type Level = 'info' | 'warn' | 'error' | 'debug';
interface RequestLog { requestId: string; method: string; route: string; status: number; durationMs: number }

export class StructuredLogger implements LoggerService {
  constructor(private readonly write: (line: string) => void = line => { process.stdout.write(line + '\n'); }) {}
  private emit(level: Level, event: string, fields: Record<string, unknown> = {}): void {
    this.write(JSON.stringify({timestamp: new Date().toISOString(), level, event, ...fields}));
  }
  request(data: RequestLog): void {
    this.emit(data.status >= 500 ? 'error' : 'info', 'http.request', {
      requestId: data.requestId,
      method: ['GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS'].includes(data.method) ? data.method : 'OTHER',
      route: data.route, status: data.status, durationMs: data.durationMs,
    });
  }
  lifecycle(event: 'application.started' | 'application.failed'): void {
    this.emit(event === 'application.failed' ? 'error' : 'info', event);
  }
  // Framework arguments may contain exception objects or credentials. Do not serialize them.
  log(_message: unknown, ..._params: unknown[]): void { this.emit('info', 'framework.log'); }
  error(_message: unknown, ..._params: unknown[]): void { this.emit('error', 'framework.error'); }
  warn(_message: unknown, ..._params: unknown[]): void { this.emit('warn', 'framework.warn'); }
  debug(_message: unknown, ..._params: unknown[]): void { this.emit('debug', 'framework.debug'); }
  verbose(_message: unknown, ..._params: unknown[]): void { this.emit('debug', 'framework.verbose'); }
  fatal(_message: unknown, ..._params: unknown[]): void { this.emit('error', 'framework.fatal'); }
}
