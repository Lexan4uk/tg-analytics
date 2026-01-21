import { Pool } from 'pg'

let pool: Pool | null = null

export function getPool(): Pool {
	if (pool) return pool

	const connectionString = process.env.DATABASE_URL
	if (!connectionString) {
		throw new Error('DATABASE_URL is missing in env (runtime)')
	}

	pool = new Pool({
		connectionString,
		max: 10,
	})

	return pool
}
