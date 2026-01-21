import 'dotenv/config'
import * as http from 'node:http'
import { Telegraf } from 'telegraf'
import { connectRedis } from './cache/redis'
import { checkDb } from './db/pool'
import { handleActivity } from './handlers/activity'
import { handleAnalyze } from './handlers/analyze'
import {
	parseStatsCallback,
	sendTop,
	sendUsersList,
	sendUserStats,
} from './handlers/stats'
import { ChatModel } from './models/ChatModel'
import { MessageModel } from './models/MessageModel'
import { UserModel } from './models/UserModel'

const token = process.env.BOT_TOKEN
if (!token) {
	console.error('BOT_TOKEN is missing. Put it in .env')
	process.exit(1)
}

const bot = new Telegraf(token)

bot.command('stats', async ctx => {
	await sendTop(ctx, 'all')
})
bot.command('analyze', async ctx => {
	try {
		await handleAnalyze(ctx)
	} catch (e) {
		console.error('analyze error:', e)
		await ctx.reply('Ошибка анализа (проверь GEMINI_API_KEY и логи).')
	}
})

bot.command('activity', async ctx => {
	try {
		await handleActivity(ctx)
	} catch (e) {
		console.error('activity error:', e)
		await ctx.reply('Ошибка при расчёте активности.')
	}
})

bot.on('callback_query', async ctx => {
	try {
		const data = (ctx.callbackQuery as any)?.data
		if (!data || typeof data !== 'string') return

		const parsed = parseStatsCallback(data)
		if (!parsed) return

		await ctx.answerCbQuery()

		if (parsed.kind === 'top') {
			await sendTop(ctx, parsed.range)
			return
		}
		if (parsed.kind === 'users') {
			await sendUsersList(ctx, parsed.range)
			return
		}
		if (parsed.kind === 'userpick' && parsed.userId) {
			await sendUserStats(ctx, parsed.range, parsed.userId)
			return
		}
	} catch (e) {
		console.error('callback_query error:', e)
	}
})

bot.on('text', async ctx => {
	try {
		const chat = ctx.message.chat
		const from = ctx.message.from
		const text = ctx.message.text

		// Фильтруем личку: нужно именно group chat
		if (chat.type !== 'group' && chat.type !== 'supergroup') return

		// upsert chat & user
		const dbChat = await ChatModel.upsert({
			tgChatId: chat.id,
			title: 'title' in chat ? (chat.title ?? null) : null,
			type: chat.type,
		})

		const dbUser = await UserModel.upsert({
			tgUserId: from.id,
			username: from.username ? from.username : null,
			firstName: from.first_name ?? null,
			lastName: from.last_name ?? null,
		})

		// В телеге message.date — unix seconds
		const msgDate = new Date(ctx.message.date * 1000)

		await MessageModel.insert({
			chatId: dbChat.id,
			userId: dbUser.id,
			tgMessageId: ctx.message.message_id,
			text,
			messageDate: msgDate,
		})
	} catch (e) {
		console.error('Failed to save message:', e)
		// Не спамим чат ошибками; максимум можно логировать
	}
})

bot.catch(err => {
	console.error('Telegraf error:', err)
})

async function main() {
	await checkDb()
	await connectRedis()

	const server = http.createServer((req, res) => {
		if (req.url === '/health') {
			res.writeHead(200, { 'content-type': 'application/json' })
			res.end(JSON.stringify({ ok: true }))
			return
		}
		res.writeHead(404)
		res.end()
	})

	server.listen(3001, () => console.log('Bot health server on :3001'))

	await bot.launch()
	console.log('🤖 Bot launched and DB is reachable')

	process.once('SIGINT', () => bot.stop('SIGINT'))
	process.once('SIGTERM', () => bot.stop('SIGTERM'))
}

main().catch(e => {
	console.error(e)
	process.exit(1)
})
