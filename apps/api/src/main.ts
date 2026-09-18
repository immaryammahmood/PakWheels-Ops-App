import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { createApplication } from './application.js';
import type { ApplicationConfig } from './config/environment.js';
import { StructuredLogger } from './common/structured-logger.js';

const logger = new StructuredLogger();
try {
  const app = await createApplication(process.env, logger);
  const config = app.get(ConfigService).getOrThrow<ApplicationConfig>('app');
  await app.listen(config.port, config.host);
  logger.lifecycle('application.started');
} catch {
  logger.lifecycle('application.failed');
  process.exitCode = 1;
}
