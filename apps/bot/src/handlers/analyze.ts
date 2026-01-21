import type { Context } from 'telegraf'
import { ChatModel } from '../models/ChatModel'
import { MessageModel } from '../models/MessageModel'
import { UserModel } from '../models/UserModel'
import {
	analyzeUser,
	formatAnalyzeForTelegram,
} from '../services/AnalyzeService'
import { formatUserLabel } from '../utils/format'

function getAnalyzeLimit(): number {
	const n = Number(process.env.ANALYZE_LIMIT ?? 80)
	return Math.max(20, Math.min(100, Number.isFinite(n) ? n : 80))
}

export async function handleAnalyze(ctx: Context) {
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

	// 1) Определяем пользователя: либо @username в тексте команды, либо reply
	const text: string = (ctx as any).message?.text ?? ''
	const match = text.match(/\/analyze\s+@?([a-zA-Z0-9_]{3,})/)
	const username = match?.[1]?.trim()

	let dbUser = null as any

	if (username) {
		dbUser = await UserModel.findByUsername(username)
		if (!dbUser) {
			await ctx.reply(
				`Не нашёл пользователя @${username} в БД (он должен хоть раз написать в чат).`,
			)
			return
		}
	} else {
		const replyFrom = (ctx as any).message?.reply_to_message?.from
		if (!replyFrom) {
			await ctx.reply(
				'Использование: /analyze @username или ответьте (reply) на сообщение и напишите /analyze',
			)
			return
		}
		dbUser = await UserModel.findByTgUserId(replyFrom.id)
		if (!dbUser) {
			await ctx.reply(
				'Не нашёл этого пользователя в БД (он должен хоть раз написать в чат).',
			)
			return
		}
	}

	const userLabel = formatUserLabel(dbUser)

	// 2) Берем последние сообщения
	const limit = getAnalyzeLimit()
	const messages = await MessageModel.getRecentByUser({
		chatId: dbChat.id,
		userId: dbUser.id,
		limit,
	})

	if (!messages.length) {
		await ctx.reply(`Нет сообщений для ${userLabel}`)
		return
	}

	// 3) Gemini анализ
	await ctx.reply(`Анализирую ${userLabel} (сообщений: ${messages.length})...`)

	const { parsed, raw } = await analyzeUser({
		userLabel,
		messages: messages.map(m => ({
			text: m.text,
			message_date: new Date(m.message_date).toISOString(),
		})),
	})

	// 4) Ответ
	const out = formatAnalyzeForTelegram({ userLabel, parsed, raw })
	await ctx.reply(out)
}
