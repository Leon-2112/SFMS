import mysql, { Pool, PoolConnection } from 'mysql2/promise';

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
  timezone: 'Z',
  dateStrings: true,
};

let pool: Pool;

try {
  pool = mysql.createPool(dbConfig);
} catch (err) {
  console.error('[DB] Failed to initialize primary connection pool, attempting root fallback:', err);
  pool = mysql.createPool({
    ...dbConfig,
    user: 'root',
    password: '',
  });
}

/**
 * Execute parameterized query using pool
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<T> {
  const [rows] = await pool.execute(sql, params);
  return rows as T;
}

/**
 * Checkout dedicated connection from pool for transactions with row locks
 */
export async function getConnection(): Promise<PoolConnection> {
  return await pool.getConnection();
}

/**
 * Ping database to verify connection health
 */
export async function testConnection(): Promise<boolean> {
  try {
    const [rows] = await pool.query('SELECT 1 AS alive');
    return Array.isArray(rows) && (rows[0] as any).alive === 1;
  } catch (error) {
    console.error('[DB] Ping failed:', error);
    return false;
  }
}

export default pool;
