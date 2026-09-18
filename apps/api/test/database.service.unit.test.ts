import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Client, Pool } from 'pg';
import type { QueryResult, QueryResultRow } from 'pg';
import { DatabaseModule } from '../src/database/database.module.js';
import { DatabaseService } from '../src/database/database.service.js';
import type { DatabaseClient, DatabasePool, DatabaseQuery } from '../src/database/database.service.js';

function fixture(failures: Record<string, Error> = {}) {
  const events: unknown[] = [];
  const result = {command: 'SELECT', rowCount: 0, oid: 0, fields: [], rows: []};
  const query = (owner: string) => async <Row extends QueryResultRow>(text: string, values?: unknown[]): Promise<QueryResult<Row>> => {
    events.push([owner, text, values]);
    if (failures[text]) throw failures[text];
    return result;
  };
  const client: DatabaseClient = {query: query('client'), release: destroy => {events.push(['release', destroy]);}};
  const pool: DatabasePool = {
    query: query('pool'),
    connect: async () => {events.push('connect'); if (failures.connect) throw failures.connect; return client;},
    end: async () => {events.push('end'); if (failures.end) throw failures.end;},
  };
  return {events, result, pool, service: new DatabaseService(pool)};
}

const control = (text: string) => ['client', text, undefined];

test('query forwards SQL and parameter values separately to Pool.query and returns its result', async () => {
  const {service, events, result} = fixture();
  const values = ["input'; SELECT unsafe", 42, null];
  assert.equal(await service.query('SELECT $1, $2, $3', values), result);
  assert.deepEqual(events, [['pool', 'SELECT $1, $2, $3', values]]);
});

test('successful transaction uses one client in order and returns the callback value', async () => {
  const {service, events, result} = fixture();
  const returned = {ok: true};
  assert.equal(await service.withTransaction(async transaction => {
    events.push('callback');
    assert.equal(await transaction.query('SELECT $1', [42]), result);
    await transaction.query('SELECT $1', [43]);
    return returned;
  }), returned);
  assert.deepEqual(events, ['connect', control('BEGIN'), 'callback', ['client', 'SELECT $1', [42]],
    ['client', 'SELECT $1', [43]], control('COMMIT'), ['release', false]]);
});

test('callback failure rolls back and releases while preserving the original error', async () => {
  const {service, events} = fixture();
  const original = new Error('TEST_ONLY failure');
  await assert.rejects(service.withTransaction(async () => {throw original;}), error => error === original);
  assert.deepEqual(events, ['connect', control('BEGIN'), control('ROLLBACK'), ['release', false]]);
});

test('query failure rolls back using the checked-out client', async () => {
  const original = new Error('TEST_ONLY query failure');
  const {service, events} = fixture({'SELECT $1': original});
  await assert.rejects(service.withTransaction(tx => tx.query('SELECT $1', [1])), error => error === original);
  assert.deepEqual(events, ['connect', control('BEGIN'), ['client', 'SELECT $1', [1]], control('ROLLBACK'), ['release', false]]);
});

test('COMMIT failure attempts rollback, releases once and preserves the commit error', async () => {
  const original = new Error('TEST_ONLY commit failure');
  const {service, events} = fixture({COMMIT: original});
  await assert.rejects(service.withTransaction(async () => 42), error => error === original);
  assert.deepEqual(events, ['connect', control('BEGIN'), control('COMMIT'), control('ROLLBACK'), ['release', false]]);
});

test('ROLLBACK failure discards the client without masking the original failure', async () => {
  const original = new Error('TEST_ONLY original failure');
  const {service, events} = fixture({ROLLBACK: new Error('TEST_ONLY rollback failure')});
  await assert.rejects(service.withTransaction(async () => {throw original;}), error => error === original);
  assert.deepEqual(events, ['connect', control('BEGIN'), control('ROLLBACK'), ['release', true]]);
});

test('BEGIN failure cleans up and never invokes the callback', async () => {
  const original = new Error('TEST_ONLY begin failure');
  const {service, events} = fixture({BEGIN: original});
  await assert.rejects(service.withTransaction(async () => {assert.fail('callback must not run');}), error => error === original);
  assert.deepEqual(events, ['connect', control('BEGIN'), control('ROLLBACK'), ['release', false]]);
});

test('checkout failure propagates without attempting transaction commands or release', async () => {
  const original = new Error('TEST_ONLY checkout failure');
  const {service, events} = fixture({connect: original});
  await assert.rejects(service.withTransaction(async () => 42), error => error === original);
  assert.deepEqual(events, ['connect']);
});

test('a retained transaction executor cannot query a released client', async () => {
  const {service, events} = fixture();
  let retained: DatabaseQuery | undefined;
  await service.withTransaction(async tx => {retained = tx;});
  await assert.rejects(retained!.query('SELECT $1', [1]), {message: 'Transaction is no longer active'});
  assert.deepEqual(events, ['connect', control('BEGIN'), control('COMMIT'), ['release', false]]);
});

const applicationEnvironment = {DATABASE_HOST: '127.0.0.1', DATABASE_PORT: '5432',
  DATABASE_NAME: 'TEST_ONLY_DATABASE', DATABASE_USER: 'TEST_ONLY_RUNTIME', DATABASE_PASSWORD: 'NOT_A_SECRET_TEST_ONLY'};
const migrationEnvironment = {MIGRATION_DATABASE_HOST: '127.0.0.1', MIGRATION_DATABASE_PORT: '5432',
  MIGRATION_DATABASE_NAME: 'TEST_ONLY_MIGRATION', MIGRATION_DATABASE_USER: 'TEST_ONLY_MIGRATOR',
  MIGRATION_DATABASE_PASSWORD: 'NOT_A_SECRET_MIGRATION_TEST_ONLY'};

test('module shutdown closes the injected pool exactly once', async () => {
  const {pool, events} = fixture();
  const module = await Test.createTestingModule({imports: [DatabaseModule.register(applicationEnvironment)]})
    .overrideProvider(Pool).useValue(pool).compile();
  await module.init();
  const service = module.get(DatabaseService);
  await module.close();
  await service.onModuleDestroy();
  assert.deepEqual(events, ['end']);
});

test('pool shutdown failure propagates and repeated shutdown does not call end again', async () => {
  const original = new Error('TEST_ONLY shutdown failure');
  const {service, events} = fixture({end: original});
  await assert.rejects(service.onModuleDestroy(), error => error === original);
  await assert.rejects(service.onModuleDestroy(), error => error === original);
  assert.deepEqual(events, ['end']);
});

test('module rejects missing application credentials without using migration credentials', () => {
  assert.throws(() => DatabaseModule.register(migrationEnvironment), {message: 'Invalid configuration: DATABASE_HOST'});
  assert.throws(() => DatabaseModule.register({...applicationEnvironment, ...migrationEnvironment, DATABASE_PASSWORD: undefined}),
    {message: 'Invalid configuration: DATABASE_PASSWORD'});
});

test('module constructs a lazy pool from application configuration only and handles idle errors safely', async t => {
  // Tripwire intercepts any accidental connection before pg can open a socket.
  const connect = t.mock.method(Client.prototype, 'connect', () => {assert.fail('Real pg connection forbidden');});
  const logged: unknown[][] = [];
  t.mock.method(Logger.prototype, 'error', (...args: unknown[]) => {logged.push(args);});
  const module = await Test.createTestingModule({imports: [DatabaseModule.register({...applicationEnvironment, ...migrationEnvironment})]}).compile();
  try {
    await module.init();
    const pool = module.get<Pool>(Pool);
    assert.equal(pool.options.host, applicationEnvironment.DATABASE_HOST);
    assert.equal(pool.options.port, 5432);
    assert.equal(pool.options.database, applicationEnvironment.DATABASE_NAME);
    assert.equal(pool.options.user, applicationEnvironment.DATABASE_USER);
    assert.equal(pool.options.password, applicationEnvironment.DATABASE_PASSWORD);
    assert.equal(pool.options.options, '-c timezone=UTC');
    assert.equal(pool.options.connectionTimeoutMillis, 5000);
    assert.equal(pool.totalCount, 0);
    pool.emit('error', new Error('NOT_A_SECRET_TEST_ONLY simulated sensitive detail'));
    assert.deepEqual(logged, [['Database idle connection failed']]);
  } finally { await module.close(); }
  assert.equal(connect.mock.callCount(), 0);
});
