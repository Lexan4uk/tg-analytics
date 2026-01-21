export function formatUserLabel(u: {
	username: string | null
	first_name: string | null
	last_name: string | null
}): string {
	if (u.username) return `@${u.username}`
	const fn = u.first_name?.trim() ?? ''
	const ln = u.last_name?.trim() ?? ''
	const full = `${fn} ${ln}`.trim()
	return full || 'Unknown'
}

export function formatRangeTitle(range: string): string {
	if (range === 'today') return 'за сегодня'
	if (range === 'week') return 'за неделю'
	if (range === 'month') return 'за месяц'
	return 'за всё время'
}
