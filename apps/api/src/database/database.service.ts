import { Inject, Injectable } from '@nestjs/common';
import type { OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import type { QueryResult, QueryResultRow } from 'pg';

export interface DatabaseQuery {
  query<Row extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]): Promise<QueryResult<Row>>;
}

export interface DatabaseClient extends DatabaseQuery {
  release(destroy?: boolean): void;
}

// Narrow structural contract keeps tests independent of real pg clients/sockets.
export interface DatabasePool extends DatabaseQuery {
  connect(): Promise<DatabaseClient>;
  end(): Promise<void>;
}

@Injectable()
export class DatabaseService implements OnModuleDestroy, DatabaseQuery {
  private closing?: Promise<void>;

  constructor(@Inject(Pool) private readonly pool: DatabasePool) {}

  // SQL/identifiers must be backend-owned. Bind all input values via $1, $2, ... .
  query<Row extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []): Promise<QueryResult<Row>> {
    return this.pool.query<Row>(text, values);
  }

  // Await all callback queries; use only the supplied executor within a transaction.
  // No automatic retries: a failed COMMIT can have an uncertain outcome.
  async withTransaction<T>(callback: (transaction: DatabaseQuery) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    let destroy = false;
    let active = true;
    const transaction: DatabaseQuery = {
      query: <Row extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) => {
        if (!active) return Promise.reject(new Error('Transaction is no longer active'));
        return client.query<Row>(text, values);
      },
    };
    try {
      await client.query('BEGIN');
      const result = await callback(Object.freeze(transaction));
      active = false;
      await client.query('COMMIT');
      return result;
    } catch (error) {
      active = false;
      try { await client.query('ROLLBACK'); }
      catch { destroy = true; } // Never recycle a client with unknown transaction state.
      throw error; // Preserve the original failure, even if rollback fails.
    } finally {
      active = false;
      client.release(destroy);
    }
  }

  // Nest calls this on module/app close (and signals when shutdown hooks are enabled).
  // Signal-hook registration belongs to the later application integration step.
  onModuleDestroy(): Promise<void> {
    return this.closing ??= this.pool.end();
  }
}
