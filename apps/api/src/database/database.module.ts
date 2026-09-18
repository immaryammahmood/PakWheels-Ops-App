import { Logger, Module } from '@nestjs/common';
import type { DynamicModule } from '@nestjs/common';
import { Pool } from 'pg';
import { validateDatabaseEnvironment } from '../config/database-environment.js';
import { DatabaseService } from './database.service.js';

@Module({})
export class DatabaseModule {
  // Explicit opt-in; neither import nor registration connects or runs migrations.
  static register(environment: Record<string, unknown> = process.env): DynamicModule {
    const database = validateDatabaseEnvironment(environment);
    return {module: DatabaseModule, providers: [
      {provide: Pool, useFactory: () => {
        // Keep pg capacity/idle defaults; production sizing awaits workload evidence.
        // Bound connection acquisition to 5s rather than waiting indefinitely.
        const pool = new Pool({...database, connectionTimeoutMillis: 5000, options: '-c timezone=UTC'});
        const logger = new Logger(DatabaseModule.name);
        // Idle-client errors must be handled without printing pg errors/configuration.
        pool.on('error', () => logger.error('Database idle connection failed'));
        return pool;
      }},
      DatabaseService,
    ], exports: [DatabaseService]};
  }
}
