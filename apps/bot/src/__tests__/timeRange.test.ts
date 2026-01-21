import { describe, expect, it } from 'vitest'
import { parseRange, rangeSinceUtc } from '../utils/timeRange'

describe('timeRange utils', () => {
	it('parseRange returns valid ranges', () => {
		expect(parseRange('today')).toBe('today')
		expect(parseRange('week')).toBe('week')
		expect(parseRange('month')).toBe('month')
		expect(parseRange('all')).toBe('all')
	})

	it('parseRange fallback to all', () => {
		expect(parseRange('invalid')).toBe('all')
		expect(parseRange(undefined)).toBe('all')
	})

	it('rangeSinceUtc returns date or null', () => {
		expect(rangeSinceUtc('all')).toBeNull()
		expect(rangeSinceUtc('today')).toBeInstanceOf(Date)
		expect(rangeSinceUtc('week')).toBeInstanceOf(Date)
	})
})
