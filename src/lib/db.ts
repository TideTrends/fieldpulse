import { Pool } from 'pg';

// Use internal Docker URL in production, fallback to env var for local dev
const connectionString = process.env.DATABASE_URL
    || 'postgres://lukaah:cPiD5OFalZ4zkGsPH7qKRY3pStpjHPWU3KOYUwCgheimxuDrUghsCiK3XB5mgxev@d848wc00ogwowgkk4840k0gk:5432/maindb';

let pool: Pool;

function getPool(): Pool {
    if (!pool) {
        pool = new Pool({
            connectionString,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
            ssl: false, // Internal Docker network, no SSL needed
        });
    }
    return pool;
}

export async function query<T = Record<string, unknown>>(
    text: string,
    params?: unknown[]
): Promise<T[]> {
    const client = await getPool().connect();
    try {
        const result = await client.query(text, params);
        return result.rows as T[];
    } finally {
        client.release();
    }
}

export async function queryOne<T = Record<string, unknown>>(
    text: string,
    params?: unknown[]
): Promise<T | null> {
    const rows = await query<T>(text, params);
    return rows[0] || null;
}

export async function execute(
    text: string,
    params?: unknown[]
): Promise<number> {
    const client = await getPool().connect();
    try {
        const result = await client.query(text, params);
        return result.rowCount ?? 0;
    } finally {
        client.release();
    }
}

export default getPool;
