import { getPool } from '../db/pool'
export type DbUser = {
	id: number
	tg_user_id: number
	username: string | null
	first_name: string | null
	last_name: string | null
}

export class UserModel {
	static async findByUsername(username: string): Promise<DbUser | null> {
		const pool = getPool()
		const u = username.replace(/^@/, '')
		const res = await pool.query<DbUser>(
			`SELECT id, tg_user_id, username, first_name, last_name
       FROM users
       WHERE username = $1`,
			[u],
		)
		return res.rows[0] ?? null
	}
}
