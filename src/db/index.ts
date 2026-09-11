import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

type Db = NodePgDatabase;

const databaseUrl = process.env.DATABASE_URL;

const globalForDb = globalThis as typeof globalThis & {
  __rawchatPool?: Pool;
  __rawchatDb?: Db;
};

/** True when a Postgres connection string is configured. */
export function isDbConfigured(): boolean {
  return Boolean(databaseUrl);
}

function getPool(): Pool {
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not configured. Add it to your .env file — see .env.example — and run `npm run db:push` to create the tables.",
    );
  }
  if (!globalForDb.__rawchatPool) {
    globalForDb.__rawchatPool = new Pool({ connectionString: databaseUrl });
  }
  return globalForDb.__rawchatPool;
}

/**
 * Lazily-created drizzle client. Safe to import at module scope (e.g. during
 * `next build` page-data collection) even when DATABASE_URL is missing — the
 * error is only thrown when a query is actually attempted.
 */
function getDbInstance(): Db {
  if (!globalForDb.__rawchatDb) {
    globalForDb.__rawchatDb = drizzle(getPool());
  }
  return globalForDb.__rawchatDb;
}

export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    const instance = getDbInstance() as unknown as Record<string | symbol, unknown>;
    const value = instance[prop as string];
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(instance)
      : value;
  },
});

export const pool: Pool = new Proxy({} as Pool, {
  get(_target, prop) {
    const instance = getPool() as unknown as Record<string | symbol, unknown>;
    const value = instance[prop as string];
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(instance)
      : value;
  },
});
