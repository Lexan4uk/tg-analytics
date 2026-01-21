import { GoogleGenAI } from '@google/genai'

export class GeminiClient {
	private ai: GoogleGenAI
	private model: string

	constructor() {
		this.ai = new GoogleGenAI({})
		this.model = process.env.GEMINI_MODEL || 'gemini-3-flash-preview'
	}

	async generate(prompt: string): Promise<string> {
		const response = await this.ai.models.generateContent({
			model: this.model,
			contents: prompt,
		})

		if (!response.text) throw new Error('Gemini returned empty response')
		return response.text.trim()
	}
}
