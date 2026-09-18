import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateDatabaseEnvironment, validateMigrationEnvironment } from '../src/config/database-environment.js';

const values = {HOST: '127.0.0.1', PORT: '5432', NAME: 'test_only_database', USER: 'test_only_user', PASSWORD: 'NOT_A_SECRET_TEST_ONLY'};
for (const [prefix, validate] of [['DATABASE', validateDatabaseEnvironment], ['MIGRATION_DATABASE', validateMigrationEnvironment]] as const) {
  const valid = Object.fromEntries(Object.entries(values).map(([key, value]) => [`${prefix}_${key}`, value]));
  test(`${prefix}: valid configuration is typed and immutable`, () => {
    const result = validate(valid);
    assert.deepEqual(result, {host: values.HOST, port: 5432, database: values.NAME, user: values.USER, password: values.PASSWORD});
    assert.ok(Object.isFrozen(result));
    for (const port of ['1', '65535']) assert.equal(validate({...valid, [`${prefix}_PORT`]: port}).port, Number(port));
    assert.equal(validate({...valid, [`${prefix}_PASSWORD`]: ' test-only with spaces '}).password, ' test-only with spaces ');
  });
  test(`${prefix}: required fields reject missing, empty and invalid types without leaking values`, () => {
    for (const suffix of Object.keys(values)) {
      const key = `${prefix}_${suffix}`;
      for (const invalid of [undefined, null, '', '   ', 5432, {}, 'TEST_SENTINEL\0']) {
        assert.throws(() => validate({...valid, [key]: invalid}), error => {
          assert.ok(error instanceof Error);
          assert.equal(error.message, `Invalid configuration: ${key}`);
          assert.doesNotMatch(error.message, /NOT_A_SECRET|TEST_SENTINEL/);
          return true;
        });
      }
    }
  });
  test(`${prefix}: malformed and out-of-range ports are rejected`, () => {
    for (const port of ['0', '65536', '-1', '5432.5', '1e3', 'abc', '5432PASSWORD', ' 5432', '5432 ']) {
      assert.throws(() => validate({...valid, [`${prefix}_PORT`]: port}), {message: `Invalid configuration: ${prefix}_PORT`});
    }
  });
}

test('migration configuration never falls back to application or bootstrap credentials', () => {
  const application = Object.fromEntries(Object.entries(values).map(([key, value]) => [`DATABASE_${key}`, value]));
  assert.throws(() => validateMigrationEnvironment({...application, POSTGRES_USER: 'TEST_ONLY', POSTGRES_PASSWORD: values.PASSWORD}),
    {message: 'Invalid configuration: MIGRATION_DATABASE_HOST'});
  const migration = Object.fromEntries(Object.entries(values).map(([key, value]) => [`MIGRATION_DATABASE_${key}`, value]));
  assert.throws(() => validateDatabaseEnvironment(migration), {message: 'Invalid configuration: DATABASE_HOST'});
});
