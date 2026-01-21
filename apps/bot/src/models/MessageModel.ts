import { getPool } from '../db/pool.js'
import type { DbMessage } from '../types/db.js'

export class MessageModel {
	static async insert(params: {
		chatId: number
		userId: number
		tgMessageId?: number | null
		text: string
		messageDate: Date
	}): Promise<DbMessage> {
		const pool = getPool()
		const { chatId, userId, tgMessageId = null, text, messageDate } = params

		const q = `
      INSERT INTO messages (chat_id, user_id, tg_message_id, text, message_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, chat_id, user_id, tg_message_id, text, message_date
    `

		const res = await pool.query<DbMessage>(q, [
			chatId,
			userId,
			tgMessageId,
			text,
			messageDate.toISOString(),
		])
		return res.rows[0]!
	}

	static async getRecentByUser(params: {
		chatId: number
		userId: number
		limit: number
	}): Promise<Pick<DbMessage, 'text' | 'message_date'>[]> {
		const pool = getPool()
		const { chatId, userId, limit } = params

		const q = `
      SELECT text, message_date
      FROM messages
      WHERE chat_id = $1 AND user_id = $2
      ORDER BY message_date DESC
      LIMIT $3
    `

		const res = await pool.query<Pick<DbMessage, 'text' | 'message_date'>>(q, [
			chatId,
			userId,
			limit,
		])
		return res.rows
	}
}
