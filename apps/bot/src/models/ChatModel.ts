import { getPool } from '../db/pool.js'
import type { DbChat } from '../types/db.js'

export class ChatModel {
	static async upsert(params: {
		tgChatId: number
		title?: string | null
		type?: string | null
	}): Promise<DbChat> {
		const pool = getPool()
		const { tgChatId, title = null, type = null } = params

		const q = `
      INSERT INTO chats (tg_chat_id, title, type)
      VALUES ($1, $2, $3)
      ON CONFLICT (tg_chat_id)
      DO UPDATE SET title = EXCLUDED.title, type = EXCLUDED.type
      RETURNING id, tg_chat_id, title, type
    `
		const res = await pool.query<DbChat>(q, [tgChatId, title, type])
		return res.rows[0]!
	}

	static async findByTgChatId(tgChatId: number): Promise<DbChat | null> {
		const pool = getPool()
		const res = await pool.query<DbChat>(
			`SELECT id, tg_chat_id, title, type FROM chats WHERE tg_chat_id = $1`,
			[tgChatId],
		)
		return res.rows[0] ?? null
	}
}
