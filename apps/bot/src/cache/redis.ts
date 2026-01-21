import { createClient } from 'redis'

const url = process.env.REDIS_URL
if (!url) throw new Error('REDIS_URL is missing in env')

export const redis = createClient({ url })

export async function connectRedis(): Promise<void> {
	redis.on('error', err => console.error('Redis error:', err))
	await redis.connect()
	await redis.ping()
}
