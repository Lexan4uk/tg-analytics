import { Pool } from 'pg'

let pool: Pool | null = null

export function getPool(): Pool {
	if (pool) return pool

	const connectionString = process.env.DATABASE_URL
	if (!connectionString) {
		throw new Error('DATABASE_URL is missing in env')
	}

	pool = new Pool({
		connectionString,
		max: 10,
	})

	return pool
}

export async function checkDb(): Promise<void> {
	const pool = getPool()
	const res = await pool.query('SELECT 1 as ok')
	if (res.rows?.[0]?.ok !== 1) throw new Error('DB check failed')
}
