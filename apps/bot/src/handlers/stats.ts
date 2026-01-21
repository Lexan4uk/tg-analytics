import type { Context } from 'telegraf'
import { Markup } from 'telegraf'
import { ChatModel } from '../models/ChatModel'
import { UserModel } from '../models/UserModel'
import { StatsService } from '../services/StatsService'
import { formatRangeTitle, formatUserLabel } from '../utils/format'
import { parseRange, type StatsRange } from '../utils/timeRange'

function rangesKeyboard(
	prefix: 'stats:top' | 'stats:users',
	range: StatsRange,
) {
	const btn = (r: StatsRange, label: string) =>
		Markup.button.callback(label, `${prefix}:${r}`)

	return Markup.inlineKeyboard([
		[btn('today', 'За сегодня'), btn('week', 'За неделю')],
		[btn('month', 'За месяц'), btn('all', 'За всё время')],
		...(prefix === 'stats:users'
			? [[Markup.button.callback('⬅️ Назад к топу', `stats:top:${range}`)]]
			: [
					[
						Markup.button.callback(
							'👤 Статистика пользователя',
							`stats:users:${range}`,
						),
					],
				]),
	])
}

export async function sendTop(ctx: Context, range: StatsRange) {
	const chat = (ctx as any).chat
	if (!chat || (chat.type !== 'group' && chat.type !== 'supergroup')) {
		await ctx.reply('Команда работает только в групповом чате.')
		return
	}

	const tgChatId = chat.id as number
	const dbChat = await ChatModel.findByTgChatId(tgChatId)

	if (!dbChat) {
		await ctx.reply(
			'Чат ещё не найден в БД. Напишите пару сообщений в чат и попробуйте снова.',
		)
		return
	}

	const chatId = dbChat.id

	const [top, totals] = await Promise.all([
		StatsService.getTopUsers(chatId, range),
		StatsService.getChatTotals(chatId, range),
	])

	const lines = top.map(
		(u, i) => `${i + 1}. ${formatUserLabel(u)} — ${u.cnt} сообщений`,
	)
	const text =
		`Статистика чата ${formatRangeTitle(range)}:\n\n` +
		(lines.length ? lines.join('\n') : 'Пока нет сообщений.\n') +
		`\n\nВсего: ${totals.total_messages} сообщений от ${totals.total_users} пользователей`

	const kb = rangesKeyboard('stats:top', range)

	if ('callbackQuery' in (ctx as any) && (ctx as any).callbackQuery?.message) {
		const currentText =
			(ctx.callbackQuery?.message as any)?.text ??
			(ctx.callbackQuery?.message as any)?.caption

		if (currentText === text) {
			return
		}
		await (ctx as any).editMessageText(text, kb)
	} else {
		await ctx.reply(text, kb)
	}
}

export async function sendUsersList(ctx: Context, range: StatsRange) {
	const chat = (ctx as any).chat
	if (!chat || (chat.type !== 'group' && chat.type !== 'supergroup')) {
		await ctx.reply('Команда работает только в групповом чате.')
		return
	}

	const tgChatId = chat.id as number
	const dbChat = await ChatModel.findByTgChatId(tgChatId)

	if (!dbChat) {
		await ctx.reply(
			'Чат ещё не найден в БД. Напишите пару сообщений в чат и попробуйте снова.',
		)
		return
	}

	const chatId = dbChat.id

	const users = await StatsService.getUsersForChat(chatId)

	if (!users.length) {
		await ctx.reply('Пока нет данных по пользователям.')
		return
	}

	const buttons = users.map(u =>
		Markup.button.callback(
			formatUserLabel(u),
			`stats:userpick:${range}:${u.user_id}`,
		),
	)

	const rows: any[] = []
	for (let i = 0; i < buttons.length; i += 2) {
		rows.push([buttons[i], buttons[i + 1]].filter(Boolean))
	}
	rows.push([Markup.button.callback('⬅️ Назад', `stats:top:${range}`)])

	const kb = Markup.inlineKeyboard(rows)
	const text = `Выберите пользователя (${formatRangeTitle(range)}):`

	await (ctx as any).editMessageText?.(text, kb).catch(async () => {
		await ctx.reply(text, kb)
	})
}

export async function sendUserStats(
	ctx: Context,
	range: StatsRange,
	userId: number,
) {
	const chat = (ctx as any).chat
	if (!chat || (chat.type !== 'group' && chat.type !== 'supergroup')) {
		await ctx.reply('Команда работает только в групповом чате.')
		return
	}

	const tgChatId = chat.id as number
	const dbChat = await ChatModel.findByTgChatId(tgChatId)
	if (!dbChat) {
		await ctx.reply(
			'Чат ещё не найден в БД. Напишите пару сообщений и попробуйте снова.',
		)
		return
	}

	const [cnt, user] = await Promise.all([
		StatsService.getUserMessageCount(dbChat.id, range, userId),
		UserModel.findById(userId),
	])

	const name = user ? formatUserLabel(user) : `user_id=${userId}`

	const text =
		`Статистика пользователя ${name} ${formatRangeTitle(range)}:\n\n` +
		`Сообщений: ${cnt}`

	// клавиатура как была
	const kb = Markup.inlineKeyboard([
		[
			Markup.button.callback('За сегодня', `stats:userpick:today:${userId}`),
			Markup.button.callback('За неделю', `stats:userpick:week:${userId}`),
		],
		[
			Markup.button.callback('За месяц', `stats:userpick:month:${userId}`),
			Markup.button.callback('За всё время', `stats:userpick:all:${userId}`),
		],
		[
			Markup.button.callback(
				'⬅️ К списку пользователей',
				`stats:users:${range}`,
			),
		],
		[Markup.button.callback('🏆 К топу', `stats:top:${range}`)],
	])

	await (ctx as any).editMessageText?.(text, kb).catch(async () => {
		await ctx.reply(text, kb)
	})
}

export function parseStatsCallback(
	data: string,
): { kind: string; range: StatsRange; userId?: number } | null {
	// top: stats:top:<range>
	// users list: stats:users:<range>
	// user pick: stats:userpick:<range>:<userId>
	const parts = data.split(':')
	if (parts[0] !== 'stats') return null

	const kind = parts[1]
	if (kind === 'top' && parts.length === 3) {
		return { kind, range: parseRange(parts[2]) }
	}
	if (kind === 'users' && parts.length === 3) {
		return { kind, range: parseRange(parts[2]) }
	}
	if (kind === 'userpick' && parts.length === 4) {
		const userId = Number(parts[3])
		if (!Number.isFinite(userId)) return null
		return { kind, range: parseRange(parts[2]), userId }
	}
	return null
}
