import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runner } from 'node-pg-migrate';
import { validateMigrationEnvironment } from '../dist/src/config/database-environment.js';

export const migrationDirectory = fileURLToPath(new URL('../../../database/migrations/', import.meta.url));

/**
 * Explicit operator entry point. Importing this module never connects.
 * @param {string[]} args
 * @param {Record<string, unknown>} environment
 * @param {typeof runner} execute
 * @returns {Promise<number>}
 */
export async function runMigrationCommand(args, environment, execute = runner) {
  if (args.length !== 1 || args[0] !== 'up') {
    console.error('Invalid migration action. Usage: db:migrate -- up');
    return 2;
  }
  let connection;
  try {
    connection = validateMigrationEnvironment(environment);
  } catch {
    console.error('Invalid migration configuration. Supply all MIGRATION_DATABASE_* variables.');
    return 2;
  }
  // This development runner only permits the approved local connection path.
  // Remote/TLS connectivity needs a separately reviewed configuration.
  if (connection.host !== '127.0.0.1') {
    console.error('Migration configuration requires the approved development loopback host.');
    return 2;
  }
  try {
    await execute({
      databaseUrl: {...connection, ssl: false, connectionTimeoutMillis: 5000,
        options: '-c timezone=UTC -c lock_timeout=5000 -c statement_timeout=120000',
        application_name: 'tasktrack-migrator'},
      dir: migrationDirectory,
      ignorePattern: '^(?![0-9]+_.*\\.sql$)',
      migrationsTable: 'tasktrack_migrations',
      migrationsSchema: 'public',
      schema: 'public',
      createSchema: false,
      createMigrationsSchema: false,
      direction: 'up',
      checkOrder: true,
      singleTransaction: true,
      noLock: false,
      advisoryLockMode: 'fail',
      verbose: false,
      // Library errors can include SQL and credentials: emit only fixed messages below.
      logger: {debug() {}, info() {}, warn() {}, error() {}},
    });
    console.info('Migration execution completed.');
    return 0;
  } catch {
    console.error('Migration execution failed. Review configuration, connectivity and approved migration files.');
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exitCode = await runMigrationCommand(process.argv.slice(2), process.env);
}
