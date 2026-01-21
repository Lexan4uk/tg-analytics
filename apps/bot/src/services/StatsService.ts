import { CacheService } from '../cache/CacheService'
import { getPool } from '../db/pool'
import type { StatsRange } from '../utils/timeRange'
import { rangeSinceUtc } from '../utils/timeRange'

export type TopUserRow = {
	user_id: number
	username: string | null
	first_name: string | null
	last_name: string | null
	cnt: number
}

export type ChatTotals = {
	total_messages: number
	total_users: number
}

function keyTop(chatId: number, range: StatsRange) {
	return `stats:top:${chatId}:${range}`
}
function keyUser(chatId: number, range: StatsRange, userId: number) {
	return `stats:user:${chatId}:${range}:${userId}`
}
function keyUsersList(chatId: number) {
	return `stats:userslist:${chatId}`
}
function keyTotals(chatId: number, range: StatsRange) {
	return `stats:totals:${chatId}:${range}`
}

export class StatsService {
	static async getTopUsers(
		chatId: number,
		range: StatsRange,
	): Promise<TopUserRow[]> {
		const pool = getPool()
		const cacheKey = keyTop(chatId, range)
		const cached = await CacheService.getJson<TopUserRow[]>(cacheKey)
		if (cached) return cached

		const since = rangeSinceUtc(range)
		const params: any[] = [chatId]
		let whereDate = ''
		if (since) {
			params.push(since.toISOString())
			whereDate = `AND m.message_date >= $2`
		}

		const q = `
      SELECT
        u.id AS user_id,
        u.username,
        u.first_name,
        u.last_name,
        COUNT(*)::int AS cnt
      FROM messages m
      JOIN users u ON u.id = m.user_id
      WHERE m.chat_id = $1
      ${whereDate}
      GROUP BY u.id, u.username, u.first_name, u.last_name
      ORDER BY cnt DESC
      LIMIT 10
    `

		const res = await pool.query<TopUserRow>(q, params)
		await CacheService.setJson(cacheKey, res.rows)
		return res.rows
	}

	static async getChatTotals(
		chatId: number,
		range: StatsRange,
	): Promise<ChatTotals> {
		const pool = getPool()
		const cacheKey = keyTotals(chatId, range)
		const cached = await CacheService.getJson<ChatTotals>(cacheKey)
		if (cached) return cached

		const since = rangeSinceUtc(range)
		const params: any[] = [chatId]
		let whereDate = ''
		if (since) {
			params.push(since.toISOString())
			whereDate = `AND message_date >= $2`
		}

		const q = `
      SELECT
        COUNT(*)::int AS total_messages,
        COUNT(DISTINCT user_id)::int AS total_users
      FROM messages
      WHERE chat_id = $1
      ${whereDate}
    `
		const res = await pool.query<ChatTotals>(q, params)
		const totals = res.rows[0] ?? { total_messages: 0, total_users: 0 }

		await CacheService.setJson(cacheKey, totals)
		return totals
	}

	static async getUserMessageCount(
		chatId: number,
		range: StatsRange,
		userId: number,
	): Promise<number> {
		const pool = getPool()
		const cacheKey = keyUser(chatId, range, userId)
		const cached = await CacheService.getJson<{ cnt: number }>(cacheKey)
		if (cached) return cached.cnt

		const since = rangeSinceUtc(range)
		const params: any[] = [chatId, userId]
		let whereDate = ''
		if (since) {
			params.push(since.toISOString())
			whereDate = `AND message_date >= $3`
		}

		const q = `
      SELECT COUNT(*)::int AS cnt
      FROM messages
      WHERE chat_id = $1 AND user_id = $2
      ${whereDate}
    `
		const res = await pool.query<{ cnt: number }>(q, params)
		const cnt = res.rows[0]?.cnt ?? 0

		await CacheService.setJson(cacheKey, { cnt })
		return cnt
	}

	static async getUsersForChat(chatId: number): Promise<TopUserRow[]> {
		const pool = getPool()
		const cacheKey = keyUsersList(chatId)
		const cached = await CacheService.getJson<TopUserRow[]>(cacheKey)
		if (cached) return cached

		const q = `
      SELECT
        u.id AS user_id,
        u.username,
        u.first_name,
        u.last_name,
        COUNT(*)::int AS cnt
      FROM messages m
      JOIN users u ON u.id = m.user_id
      WHERE m.chat_id = $1
      GROUP BY u.id, u.username, u.first_name, u.last_name
      ORDER BY cnt DESC
      LIMIT 12
    `
		const res = await pool.query<TopUserRow>(q, [chatId])
		await CacheService.setJson(cacheKey, res.rows)
		return res.rows
	}
	static async getActivityByDaytime(chatId: number) {
		const pool = getPool()
		const q = `
    SELECT
      CASE
        WHEN EXTRACT(HOUR FROM message_date) BETWEEN 0 AND 5 THEN 'night'
        WHEN EXTRACT(HOUR FROM message_date) BETWEEN 6 AND 11 THEN 'morning'
        WHEN EXTRACT(HOUR FROM message_date) BETWEEN 12 AND 17 THEN 'day'
        ELSE 'evening'
      END AS period,
      COUNT(*)::int AS cnt
    FROM messages
    WHERE chat_id = $1
    GROUP BY period
  `

		const res = await pool.query<{ period: string; cnt: number }>(q, [chatId])

		return res.rows
	}
}
