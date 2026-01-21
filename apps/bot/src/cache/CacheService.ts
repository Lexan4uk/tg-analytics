import { redis } from './redis'

export class CacheService {
	private static ttlSeconds(): number {
		const min = Number(process.env.CACHE_TTL_MIN ?? 20)
		return Math.max(10, Math.floor(min * 60))
	}

	static async getJson<T>(key: string): Promise<T | null> {
		const raw = await redis.get(key)
		if (!raw) return null
		try {
			return JSON.parse(raw) as T
		} catch {
			return null
		}
	}

	static async setJson(key: string, value: unknown): Promise<void> {
		const ttl = this.ttlSeconds()
		await redis.setEx(key, ttl, JSON.stringify(value))
	}
}
