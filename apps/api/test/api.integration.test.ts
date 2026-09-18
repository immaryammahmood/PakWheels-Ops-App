import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';
import type { AddressInfo } from 'node:net';
import { BadRequestException, Controller, Get, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module.js';
import { configureApplication, createApplication } from '../src/application.js';
import { RequestContext } from '../src/common/request-context.js';
import { StructuredLogger } from '../src/common/structured-logger.js';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
@Controller('fixture')
class FixtureController {
  constructor(private readonly context: RequestContext) {}
  @Get('crash') crash(): never { throw new Error('secret-token /private/stack/path'); }
  @Get('bad') bad(): never { throw new BadRequestException({message: 'secret-password', token: 'secret-token'}); }
  @Get('context') async contextId() {
    const before = this.context.requestId;
    await setTimeout(5);
    return {before, after: this.context.requestId};
  }
}
@Module({imports: [AppModule.register({NODE_ENV: 'test'})], controllers: [FixtureController]})
class FixtureModule {}

async function listen(app: NestExpressApplication): Promise<string> {
  await app.listen(0, '127.0.0.1');
  const address = app.getHttpServer().address() as AddressInfo;
  assert.equal(address.address, '127.0.0.1');
  return `http://127.0.0.1:${address.port}`;
}

test('HTTP foundation', async t => {
  const lines: string[] = [];
  const logger = new StructuredLogger(line => lines.push(line));
  const module = await Test.createTestingModule({imports: [FixtureModule]}).setLogger(logger).compile();
  const app = module.createNestApplication<NestExpressApplication>({bodyParser: false, logger});
  configureApplication(app, logger);
  t.after(async () => { await app.close(); });
  const base = await listen(app);
  await t.test('health is safe, versioned and protected by headers', async () => {
    const response = await fetch(base + '/api/v1/health');
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {status: 'ok'});
    assert.match(response.headers.get('x-request-id') ?? '', uuid);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('x-frame-options'), 'SAMEORIGIN');
    assert.equal(response.headers.get('x-powered-by'), null);
    assert.ok(response.headers.get('content-security-policy'));
  });
  await t.test('unknown paths have safe 404 and a matching response correlation ID', async () => {
    for (const path of ['/missing/secret-path?token=secret-token', '/api/v1/missing?token=secret-token',
      '/apiary', '/api', '/api/', '/health', '/api/health']) {
      const response = await fetch(base + path);
      assert.equal(response.status, 404);
      assert.match(response.headers.get('content-type') ?? '', /^application\/json(?:;|$)/);
      const text = await response.text();
      assert.doesNotMatch(text, /<!doctype|<html|stack|secret|missing/i);
      const body = JSON.parse(text);
      const requestId = response.headers.get('x-request-id');
      assert.ok(requestId, 'X-Request-ID header must be present');
      assert.equal(typeof requestId, 'string');
      assert.match(requestId, uuid);
      assert.deepEqual(body, {statusCode: 404, error: 'Not Found', message: 'Not Found', requestId});
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    }
  });
  await t.test('incoming IDs are ignored and asynchronous context is isolated across concurrent requests', async () => {
    const responses = await Promise.all(Array.from({length: 8}, () => fetch(base + '/api/v1/fixture/context', {
      headers: {'X-Request-ID': 'client-controlled-secret', Authorization: 'Bearer secret-token'},
    })));
    const ids = new Set<string>();
    for (const response of responses) {
      const id = response.headers.get('x-request-id') ?? '';
      assert.match(id, uuid); ids.add(id);
      assert.deepEqual(await response.json(), {before: id, after: id});
    }
    assert.equal(ids.size, 8);
  });
  await t.test('unexpected and HTTP exceptions never expose internal details', async () => {
    for (const [route, status, message] of [['crash', 500, 'Internal Server Error'], ['bad', 400, 'Bad Request']] as const) {
      const response = await fetch(base + '/api/v1/fixture/' + route);
      assert.equal(response.status, status);
      const body = await response.json();
      assert.deepEqual(body, {statusCode: status, error: message, message, requestId: response.headers.get('x-request-id')});
      assert.doesNotMatch(JSON.stringify(body), /secret|stack|private/);
    }
  });
  await t.test('malformed and oversized JSON get safe errors with headers and IDs', async () => {
    for (const [body, status] of [['{"password":"secret"', 400], [JSON.stringify({password: 'secret'.repeat(4000)}), 413]] as const) {
      const response = await fetch(base + '/api/v1/health', {method: 'POST', headers: {'Content-Type': 'application/json'}, body});
      assert.equal(response.status, status);
      const payload = await response.json();
      assert.equal(payload.statusCode, status);
      assert.match(payload.requestId, uuid);
      assert.equal(payload.requestId, response.headers.get('x-request-id'));
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
      assert.doesNotMatch(JSON.stringify(payload), /password|secret|stack/);
    }
  });
  await t.test('Swagger is unavailable outside development', async () => {
    for (const url of ['/api/docs', '/api/docs-json', '/api/docs-yaml']) assert.equal((await fetch(base + url)).status, 404);
  });
  await t.test('request logs contain only safe fields, IDs, template routes and UTC timestamps', () => {
    const records = lines.map(line => JSON.parse(line)).filter(record => record.event === 'http.request');
    assert.ok(records.length >= 15);
    for (const record of records) {
      assert.deepEqual(Object.keys(record).sort(), ['timestamp','level','event','requestId','method','route','status','durationMs'].sort());
      assert.match(record.requestId, uuid);
      assert.equal(new Date(record.timestamp).toISOString(), record.timestamp);
      assert.ok(record.durationMs >= 0);
    }
    assert.ok(records.some(record => record.route === '<unmatched>' && record.status === 404));
    assert.doesNotMatch(lines.join('\n'), /secret|Authorization|password|Bearer|private|client-controlled/);
  });
});

test('development OpenAPI documents only the real health endpoint', async t => {
  const app = await createApplication({NODE_ENV: 'development'}, new StructuredLogger(() => {}));
  t.after(async () => { await app.close(); });
  const base = await listen(app);
  const response = await fetch(base + '/api/docs-json');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('x-request-id') ?? '', uuid);
  const document = await response.json();
  assert.deepEqual(Object.keys(document.paths), ['/api/v1/health']);
  assert.ok(document.paths['/api/v1/health'].get.responses['200']);
  const ui = await fetch(base + '/api/docs');
  assert.equal(ui.status, 200);
  assert.match(await ui.text(), /swagger-ui/);
});
