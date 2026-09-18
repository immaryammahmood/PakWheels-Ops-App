import 'reflect-metadata';
import { NotFoundException, VersioningType } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import type { ApplicationConfig } from './config/environment.js';
import { RequestContext } from './common/request-context.js';
import { SafeExceptionFilter } from './common/safe-exception.filter.js';
import { StructuredLogger } from './common/structured-logger.js';

export function configureApplication(app: NestExpressApplication, logger: StructuredLogger): void {
  const config = app.get(ConfigService).getOrThrow<ApplicationConfig>('app');
  app.set('trust proxy', false);
  app.disable('x-powered-by');
  app.use(app.get(RequestContext).middleware(logger));
  // Local HTTP only: do not force browsers to upgrade loopback requests to HTTPS.
  app.use(helmet({strictTransportSecurity: false,
    contentSecurityPolicy: {directives: {upgradeInsecureRequests: null}}}));
  // This service owns only its API prefix. Nest 12 scopes its default 404
  // handler to that prefix; send outside paths through its root error handler.
  app.use((req: Request, _res: Response, next: NextFunction): void => {
    const path = req.path.toLowerCase();
    const prefix = `/${config.prefix}`;
    if (path === prefix || path.startsWith(`${prefix}/`)) next();
    else next(new NotFoundException());
  });
  app.useBodyParser('json', {limit: '16kb'});
  app.setGlobalPrefix(config.prefix);
  app.enableVersioning({type: VersioningType.URI, defaultVersion: config.version});
  app.useGlobalFilters(new SafeExceptionFilter());
  if (config.openApi) {
    const document = SwaggerModule.createDocument(app, new DocumentBuilder()
      .setTitle('PakWheels TaskTrack API').setDescription('Local development foundation; health only.')
      .setVersion(config.version).build());
    SwaggerModule.setup(`${config.prefix}/docs`, app, document, {
      raw: ['json'], swaggerOptions: {supportedSubmitMethods: []},
    });
  }
}

export async function createApplication(environment: Record<string, unknown> = process.env,
  logger = new StructuredLogger()): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule.register(environment), {
    bodyParser: false, logger, abortOnError: false,
  });
  configureApplication(app, logger);
  app.enableShutdownHooks();
  return app;
}
