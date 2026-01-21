import { getPool } from '../db/pool'

export type DbMsg = { text: string; message_date: string }

export class MessageModel {
	static async getRecentByUser(params: {
		userId: number
		limit: number
	}): Promise<DbMsg[]> {
		const pool = getPool()
		const { userId, limit } = params

		const res = await pool.query<DbMsg>(
			`
      SELECT text, message_date
      FROM messages
      WHERE user_id = $1
      ORDER BY message_date DESC
      LIMIT $2
      `,
			[userId, limit],
		)
		return res.rows
	}
}
