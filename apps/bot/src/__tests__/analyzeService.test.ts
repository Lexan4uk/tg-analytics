import { describe, expect, it, vi } from 'vitest'
import { analyzeUser } from '../services/AnalyzeService'

// мок GeminiClient
vi.mock('../llm/geminiClient', () => ({
	GeminiClient: class {
		async generate() {
			return JSON.stringify({
				style: 'informal',
				topics: ['tech'],
				avg_message_length: 12,
				activity: 'evening',
				sentiment: 'positive',
				frequent_words: ['ok'],
				notes: [],
				sample_size: 10,
			})
		}
	},
}))

describe('analyzeService', () => {
	it('parses valid JSON response', async () => {
		const { parsed } = await analyzeUser({
			userLabel: '@test',
			messages: [{ text: 'hello', message_date: new Date().toISOString() }],
		})

		expect(parsed).not.toBeNull()
		expect(parsed?.style).toBe('informal')
	})
})
