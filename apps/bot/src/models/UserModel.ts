import { getPool } from '../db/pool.js'
import type { DbUser } from '../types/db.js'

export class UserModel {
	static async upsert(params: {
		tgUserId: number
		username?: string | null
		firstName?: string | null
		lastName?: string | null
	}): Promise<DbUser> {
		const pool = getPool()
		const {
			tgUserId,
			username = null,
			firstName = null,
			lastName = null,
		} = params

		const q = `
      INSERT INTO users (tg_user_id, username, first_name, last_name)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (tg_user_id)
      DO UPDATE SET
        username = EXCLUDED.username,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name
      RETURNING id, tg_user_id, username, first_name, last_name
    `

		const res = await pool.query<DbUser>(q, [
			tgUserId,
			username,
			firstName,
			lastName,
		])
		return res.rows[0]!
	}

	static async findByUsername(username: string): Promise<DbUser | null> {
		const pool = getPool()
		// username в телеге без "@", хранить можно как есть
		const res = await pool.query<DbUser>(
			`SELECT id, tg_user_id, username, first_name, last_name
       FROM users
       WHERE username = $1`,
			[username.replace(/^@/, '')],
		)
		return res.rows[0] ?? null
	}

	static async findByTgUserId(tgUserId: number): Promise<DbUser | null> {
		const pool = getPool()
		const res = await pool.query<DbUser>(
			`SELECT id, tg_user_id, username, first_name, last_name
       FROM users
       WHERE tg_user_id = $1`,
			[tgUserId],
		)
		return res.rows[0] ?? null
	}
	static async findById(id: number): Promise<DbUser | null> {
		const pool = getPool()
		const res = await pool.query<DbUser>(
			`SELECT id, tg_user_id, username, first_name, last_name
     FROM users
     WHERE id = $1`,
			[id],
		)
		return res.rows[0] ?? null
	}
}
