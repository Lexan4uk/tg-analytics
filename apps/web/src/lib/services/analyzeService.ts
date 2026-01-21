import { GeminiClient } from '../llm/geminiClient'

export type AnalyzeResult = {
	style: string
	topics: string[]
	avg_message_length: number
	activity: string
	sentiment: string
	frequent_words: string[]
	notes: string[]
	sample_size: number
}

function safeJsonParse(text: string): any | null {
	const cleaned = text
		.replace(/^```json\s*/i, '')
		.replace(/^```\s*/i, '')
		.replace(/```$/i, '')
		.trim()

	try {
		return JSON.parse(cleaned)
	} catch {
		return null
	}
}

export function buildAnalyzePrompt(params: {
	usernameLabel: string
	messages: { text: string; message_date: string }[]
}): string {
	const { usernameLabel, messages } = params

	const items = messages
		.slice(0, 100)
		.map(m => `- [${m.message_date}] ${m.text}`)
		.join('\n')

	return `
Ты анализируешь сообщения пользователя в групповом чате.
Верни РОВНО JSON без пояснений и без markdown.

Схема JSON:
{
  "style": string,
  "topics": string[],
  "avg_message_length": number,
  "activity": string,
  "sentiment": "positive" | "neutral" | "negative" | string,
  "frequent_words": string[],
  "notes": string[],
  "sample_size": number
}

Пользователь: ${usernameLabel}
Сообщения (новые сверху):
${items}
`.trim()
}

export async function analyzeUser(params: {
	userLabel: string
	messages: { text: string; message_date: string }[]
}): Promise<{ parsed: AnalyzeResult | null; raw: string }> {
	const client = new GeminiClient()
	const prompt = buildAnalyzePrompt({
		usernameLabel: params.userLabel,
		messages: params.messages,
	})

	const raw = await client.generate(prompt)
	const parsed = safeJsonParse(raw) as AnalyzeResult | null

	return { parsed, raw }
}
