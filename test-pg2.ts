import { Pool, PoolClient } from 'pg';

const dbPoolConfig = {
  min: 2,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  query_timeout: 30000,
  statement_timeout: 60000,
  reconnect: {
    initial_delay_ms: 1000,
    max_delay_ms: 30000,
    failures_until_exit: 5,
  },
};

const pool = new Pool({
  connectionString: 'postgresql://localhost/test',
  ...dbPoolConfig,
  client_encoding: "utf8",
});

pool.query('SELECT 1');
pool.on('error', (err: Error) => {});
