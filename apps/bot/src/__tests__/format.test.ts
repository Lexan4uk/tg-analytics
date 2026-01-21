import { describe, expect, it } from 'vitest'
import { formatUserLabel } from '../utils/format'

describe('formatUserLabel', () => {
	it('uses username if exists', () => {
		const res = formatUserLabel({
			username: 'john_doe',
			first_name: 'John',
			last_name: 'Doe',
		})
		expect(res).toBe('@john_doe')
	})

	it('falls back to full name', () => {
		const res = formatUserLabel({
			username: null,
			first_name: 'John',
			last_name: 'Doe',
		})
		expect(res).toBe('John Doe')
	})

	it('returns Unknown if no data', () => {
		const res = formatUserLabel({
			username: null,
			first_name: null,
			last_name: null,
		})
		expect(res).toBe('Unknown')
	})
})
