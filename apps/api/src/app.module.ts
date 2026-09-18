import { Module } from '@nestjs/common';
import type { DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnvironment } from './config/environment.js';
import { RequestContext } from './common/request-context.js';
import { HealthModule } from './health/health.module.js';

@Module({})
export class AppModule {
  static register(environment: Record<string, unknown> = process.env): DynamicModule {
    const app = validateEnvironment(environment);
    return {module: AppModule, imports: [
      ConfigModule.forRoot({isGlobal: true, ignoreEnvFile: true, skipProcessEnv: true,
        validatePredefined: false, load: [() => ({app})]}), HealthModule,
    ], providers: [RequestContext], exports: [RequestContext]};
  }
}
