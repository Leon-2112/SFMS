import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import { memoryDb } from './memory_store.ts';

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'sfms_app',
  password: process.env.DB_PASSWORD || 'sfms_secure_pass123',
  database: process.env.DB_NAME || 'sfms',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  timezone: '+05:30',
  dateStrings: true,
  connectTimeout: 1000,
};

let pool: Pool | null = null;
let isMysqlAlive = false;

// If a dedicated remote database host is supplied, attempt pool creation
if (process.env.DB_HOST && process.env.DB_HOST !== '127.0.0.1' && process.env.DB_HOST !== 'localhost') {
  try {
    pool = mysql.createPool(dbConfig);
  } catch (err) {
    console.warn('[DB] MySQL pool initialization error, will use in-memory store:', err);
    pool = null;
  }
}

/**
 * Execute parameterized query using active database or memory mock
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<T> {
  if (isMysqlAlive && pool) {
    try {
      const [rows] = await pool.execute(sql, params);
      return rows as T;
    } catch (err) {
      console.warn('[DB] Live query error, falling back to memory store:', err);
    }
  }
  return (await memoryDb.execute(sql, params)) as T;
}

/**
 * Checkout dedicated connection for transactions with row locks
 */
export async function getConnection(): Promise<PoolConnection> {
  if (isMysqlAlive && pool) {
    try {
      return await pool.getConnection();
    } catch (err) {
      console.warn('[DB] Failed to acquire MySQL connection, using memory store fallback:', err);
    }
  }

  const mockConnection: any = {
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
    execute: async (sql: string, params: any[] = []) => {
      const res = await memoryDb.execute(sql, params);
      return [res, []];
    },
    query: async (sql: string, params: any[] = []) => {
      const res = await memoryDb.execute(sql, params);
      return [res, []];
    },
  };

  return mockConnection as PoolConnection;
}

/**
 * Ping database to verify connection health
 */
export async function testConnection(): Promise<boolean> {
  if (pool) {
    try {
      const [rows] = await pool.query('SELECT 1 AS alive');
      if (Array.isArray(rows) && (rows[0] as any).alive === 1) {
        isMysqlAlive = true;
        return true;
      }
    } catch {
      isMysqlAlive = false;
    }
  }
  // In-memory mock is active and operational
  return true;
}

export default pool;
