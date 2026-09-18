export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

// Shared database validation; no environment reads, file loading or connections on import.
function validateConnection(input: Record<string, unknown>, prefix: 'DATABASE' | 'MIGRATION_DATABASE'): Readonly<DatabaseConfig> {
  const read = (suffix: string): string => {
    const key = `${prefix}_${suffix}`;
    const value = input[key];
    if (typeof value !== 'string' || value.trim().length === 0 || value.includes('\0') ||
      (suffix !== 'PASSWORD' && value.trim() !== value)) {
      throw new Error(`Invalid configuration: ${key}`);
    }
    return value;
  };
  const host = read('HOST');
  const port = read('PORT');
  if (!/^\d{1,5}$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
    throw new Error(`Invalid configuration: ${prefix}_PORT`);
  }
  return Object.freeze({host, port: Number(port), database: read('NAME'), user: read('USER'), password: read('PASSWORD')});
}

export function validateDatabaseEnvironment(input: Record<string, unknown>): Readonly<DatabaseConfig> {
  return validateConnection(input, 'DATABASE');
}

// Deliberately no fallback to DATABASE_* or POSTGRES_* bootstrap credentials.
export function validateMigrationEnvironment(input: Record<string, unknown>): Readonly<DatabaseConfig> {
  return validateConnection(input, 'MIGRATION_DATABASE');
}
