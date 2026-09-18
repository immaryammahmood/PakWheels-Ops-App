export interface ApplicationConfig {
  host: '127.0.0.1';
  port: number;
  prefix: string;
  version: string;
  timezone: 'Asia/Karachi';
  environment: 'development' | 'test' | 'production';
  openApi: boolean;
}

export function validateEnvironment(input: Record<string, unknown>): Readonly<ApplicationConfig> {
  const read = (key: string, fallback: string): string => {
    const value = input[key] ?? fallback;
    if (typeof value !== 'string' || value.trim() !== value || value.length === 0) {
      throw new Error(`Invalid configuration: ${key}`);
    }
    return value;
  };
  const environment = read('NODE_ENV', 'development');
  if (!['development', 'test', 'production'].includes(environment)) throw new Error('Invalid configuration: NODE_ENV');
  const host = read('APP_HOST', '127.0.0.1');
  if (host !== '127.0.0.1') throw new Error('Invalid configuration: APP_HOST must be loopback');
  const port = read('APP_PORT', '3000');
  if (!/^\d{1,5}$/.test(port) || Number(port) < 1 || Number(port) > 65535) throw new Error('Invalid configuration: APP_PORT');
  const prefix = read('APP_API_PREFIX', 'api');
  if (!/^[a-z][a-z0-9-]{0,31}$/.test(prefix)) throw new Error('Invalid configuration: APP_API_PREFIX');
  const version = read('APP_API_VERSION', '1');
  if (!/^[1-9]\d{0,2}$/.test(version)) throw new Error('Invalid configuration: APP_API_VERSION');
  const timezone = read('APP_TIMEZONE', 'Asia/Karachi');
  if (timezone !== 'Asia/Karachi') throw new Error('Invalid configuration: APP_TIMEZONE');
  const docs = read('APP_OPENAPI_ENABLED', environment === 'development' ? 'true' : 'false');
  if (!['true', 'false'].includes(docs) || (docs === 'true' && environment !== 'development')) {
    throw new Error('Invalid configuration: APP_OPENAPI_ENABLED requires development');
  }
  return Object.freeze({host, port: Number(port), prefix, version, timezone,
    environment: environment as ApplicationConfig['environment'], openApi: docs === 'true'});
}
