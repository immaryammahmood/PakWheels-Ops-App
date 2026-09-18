import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../src/app.module.js';
import { validateEnvironment } from '../src/config/environment.js';
import { HealthController } from '../src/health/health.controller.js';
import { StructuredLogger } from '../src/common/structured-logger.js';

test('configuration has safe defaults and rejects unsafe or malformed values without echoing them', () => {
  assert.deepEqual(validateEnvironment({}), {host: '127.0.0.1', port: 3000, prefix: 'api', version: '1',
    timezone: 'Asia/Karachi', environment: 'development', openApi: true});
  for (const [key, value] of Object.entries({APP_HOST: '0.0.0.0', APP_PORT: '3000secret',
    APP_API_PREFIX: '../secret', APP_API_VERSION: 'v1secret', APP_TIMEZONE: 'secret', NODE_ENV: 'secret'})) {
    assert.throws(() => validateEnvironment({[key]: value}), error => error instanceof Error && !error.message.includes(value));
  }
  for (const port of ['0', '-1', '65536', '3000.5', '', ' 3000', '1e3']) {
    assert.throws(() => validateEnvironment({APP_PORT: port}));
  }
  assert.throws(() => validateEnvironment({APP_HOST: '192.168.110.15'}));
  assert.throws(() => validateEnvironment({APP_OPENAPI_ENABLED: 'yes'}));
  assert.throws(() => validateEnvironment({NODE_ENV: 'production', APP_OPENAPI_ENABLED: 'true'}));
  assert.equal(validateEnvironment({NODE_ENV: 'production'}).openApi, false);
  assert.equal(validateEnvironment({NODE_ENV: 'test'}).openApi, false);
  assert.throws(() => AppModule.register({APP_HOST: '0.0.0.0'}));
});

test('root application module compiles and provides health and validated configuration without listening', async () => {
  const module = await Test.createTestingModule({imports: [AppModule.register({NODE_ENV: 'test'})]})
    .setLogger(new StructuredLogger(() => {})).compile();
  try {
    await module.init();
    assert.deepEqual(module.get(HealthController).health(), {status: 'ok'});
    assert.equal(module.get(ConfigService).get('app.host'), '127.0.0.1');
    assert.equal(module.get(ConfigService).get('app.timezone'), 'Asia/Karachi');
  } finally { await module.close(); }
});

test('framework logging discards arbitrary messages, exception objects and optional arguments', () => {
  const lines: string[] = [];
  const logger = new StructuredLogger(line => lines.push(line));
  logger.error(new Error('secret-password /private/path'), 'Bearer secret-token');
  logger.log({Authorization: 'secret-token', password: 'secret-password'});
  assert.equal(lines.length, 2);
  for (const line of lines) {
    assert.doesNotMatch(line, /secret|Bearer|Authorization|private/);
    const record = JSON.parse(line);
    assert.equal(new Date(record.timestamp).toISOString(), record.timestamp);
    assert.ok(['info', 'error'].includes(record.level));
  }
});
