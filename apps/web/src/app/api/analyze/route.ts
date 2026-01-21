import { MessageModel } from '@/lib/models/MessageModel'
import { UserModel } from '@/lib/models/UserModel'
import { analyzeUser } from '@/lib/services/analyzeService'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url)
		const username = searchParams.get('username')?.trim()

		if (!username) {
			return Response.json({ error: 'username is required' }, { status: 400 })
		}

		const user = await UserModel.findByUsername(username)
		if (!user) {
			return Response.json(
				{ error: `User @${username.replace(/^@/, '')} not found in DB` },
				{ status: 404 },
			)
		}

		const limit = Math.max(
			20,
			Math.min(100, Number(process.env.ANALYZE_LIMIT ?? 80)),
		)
		const msgs = await MessageModel.getRecentByUser({ userId: user.id, limit })

		if (!msgs.length) {
			return Response.json(
				{ error: 'No messages for this user' },
				{ status: 404 },
			)
		}

		const userLabel = user.username
			? `@${user.username}`
			: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()

		const { parsed, raw } = await analyzeUser({
			userLabel,
			messages: msgs.map(m => ({
				text: m.text,
				message_date: new Date(m.message_date).toISOString(),
			})),
		})

		return Response.json({
			user: {
				id: user.id,
				username: user.username,
				first_name: user.first_name,
				last_name: user.last_name,
				label: userLabel,
			},
			sample_size: msgs.length,
			parsed,
			raw,
		})
	} catch (e: any) {
		console.error(e)
		return Response.json(
			{ error: 'Internal error', details: String(e?.message ?? e) },
			{ status: 500 },
		)
	}
}
