import { getPool } from '../db/pool'

export type DbChat = {
	id: number
	tg_chat_id: number
	title: string | null
	type: string | null
}

export class ChatModel {
	static async findByTgChatId(tgChatId: number): Promise<DbChat | null> {
		const pool = getPool()
		const res = await pool.query<DbChat>(
			`SELECT id, tg_chat_id, title, type
       FROM chats
       WHERE tg_chat_id = $1`,
			[tgChatId],
		)
		return res.rows[0] ?? null
	}

	static async findById(id: number): Promise<DbChat | null> {
		const pool = getPool()
		const res = await pool.query<DbChat>(
			`SELECT id, tg_chat_id, title, type
       FROM chats
       WHERE id = $1`,
			[id],
		)
		return res.rows[0] ?? null
	}
}
