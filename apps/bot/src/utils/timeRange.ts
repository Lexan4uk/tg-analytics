export type StatsRange = 'today' | 'week' | 'month' | 'all'

export function parseRange(input?: string | null): StatsRange {
	if (
		input === 'today' ||
		input === 'week' ||
		input === 'month' ||
		input === 'all'
	)
		return input
	return 'all'
}

// Возвращаем нижнюю границу для SQL (UTC). Если all — null.
export function rangeSinceUtc(range: StatsRange): Date | null {
	const now = new Date()

	if (range === 'all') return null

	if (range === 'today') {
		// начало дня в UTC
		return new Date(
			Date.UTC(
				now.getUTCFullYear(),
				now.getUTCMonth(),
				now.getUTCDate(),
				0,
				0,
				0,
			),
		)
	}

	const days = range === 'week' ? 7 : 30
	return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
}
