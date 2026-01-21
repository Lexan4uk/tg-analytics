import { GoogleGenAI } from '@google/genai'
import 'dotenv/config'

export class GeminiClient {
	private ai: GoogleGenAI
	private model: string

	constructor() {
		// API key берётся автоматически из GEMINI_API_KEY
		this.ai = new GoogleGenAI({})
		this.model = process.env.GEMINI_MODEL || 'gemini-3-flash-preview'
	}

	async generate(prompt: string): Promise<string> {
		const response = await this.ai.models.generateContent({
			model: this.model,
			contents: prompt,
		})

		// SDK уже даёт удобный text
		if (!response.text) {
			throw new Error('Gemini returned empty response')
		}

		return response.text.trim()
	}
}
