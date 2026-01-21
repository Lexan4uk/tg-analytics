import type { Context } from 'telegraf'
import { ChatModel } from '../models/ChatModel'
import { StatsService } from '../services/StatsService'

const LABELS: Record<string, string> = {
	night: '🌙 Ночь (00–06)',
	morning: '🌅 Утро (06–12)',
	day: '☀️ День (12–18)',
	evening: '🌆 Вечер (18–24)',
}

export async function handleActivity(ctx: Context) {
	const chat = (ctx as any).chat
	if (!chat || (chat.type !== 'group' && chat.type !== 'supergroup')) {
		await ctx.reply('Команда работает только в групповом чате.')
		return
	}

	const dbChat = await ChatModel.findByTgChatId(chat.id)
	if (!dbChat) {
		await ctx.reply('Чат ещё не найден в БД.')
		return
	}

	const rows = await StatsService.getActivityByDaytime(dbChat.id)

	if (!rows.length) {
		await ctx.reply('Пока нет данных по активности.')
		return
	}

	let max = rows[0]
	for (const r of rows) {
		if (r.cnt > max.cnt) max = r
	}

	const lines = rows.map(
		r => `${LABELS[r.period] ?? r.period}: ${r.cnt} сообщений`,
	)

	const text =
		`Активность чата за всё время:\n\n` +
		lines.join('\n') +
		`\n\nПик активности: ${LABELS[max.period]}`

	await ctx.reply(text)
}
