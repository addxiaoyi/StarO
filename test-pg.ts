import { Pool, PoolClient } from 'pg';
const pool = new Pool();
const client: PoolClient = {} as PoolClient;
pool.query('SELECT 1');
pool.on('error', (err: Error) => {});
