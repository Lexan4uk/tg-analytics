import { describe, expect, it, vi } from 'vitest'
import { StatsService } from '../services/StatsService'

// mock pg pool
const mockPool = {
	query: vi.fn(),
}
vi.mock('../db/pool', () => ({
	getPool: () => mockPool,
}))

// mock redis cache
vi.mock('../cache/CacheService', () => ({
	CacheService: {
		getJson: vi.fn(),
		setJson: vi.fn(),
	},
}))

import { CacheService } from '../cache/CacheService'

describe('StatsService.getTopUsers', () => {
	it('returns cached value if exists', async () => {
		;(CacheService.getJson as any).mockResolvedValue([{ user_id: 1, cnt: 10 }])

		const res = await StatsService.getTopUsers(1, 'all')

		expect(res.length).toBe(1)
		expect(mockPool.query).not.toHaveBeenCalled()
	})

	it('queries db if cache empty', async () => {
		;(CacheService.getJson as any).mockResolvedValue(null)
		;(mockPool.query as any).mockResolvedValue({
			rows: [{ user_id: 1, cnt: 5 }],
		})

		const res = await StatsService.getTopUsers(1, 'all')

		expect(mockPool.query).toHaveBeenCalled()
		expect(res[0].cnt).toBe(5)
	})
})
