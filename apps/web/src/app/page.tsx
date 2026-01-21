'use client'

import { useState } from 'react'

type ApiResponse =
	| {
			user: { label: string }
			sample_size: number
			parsed: any
			raw: string
	  }
	| { error: string; details?: string }

export default function Home() {
	const [username, setUsername] = useState('')
	const [loading, setLoading] = useState(false)
	const [data, setData] = useState<ApiResponse | null>(null)

	async function onAnalyze() {
		setLoading(true)
		setData(null)
		try {
			const res = await fetch(
				`/api/analyze?username=${encodeURIComponent(username.trim())}`,
			)
			const json = (await res.json()) as ApiResponse
			setData(json)
		} catch (e: any) {
			setData({ error: 'Fetch failed', details: String(e?.message ?? e) })
		} finally {
			setLoading(false)
		}
	}

	return (
		<main style={{ padding: 24, fontFamily: 'system-ui', maxWidth: 800 }}>
			<h1>Анализ пользователя</h1>

			<div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
				<input
					value={username}
					onChange={e => setUsername(e.target.value)}
					placeholder='@username'
					style={{ flex: 1, padding: 10, fontSize: 16 }}
				/>
				<button
					onClick={onAnalyze}
					disabled={loading || !username.trim()}
					style={{ padding: '10px 16px', fontSize: 16, cursor: 'pointer' }}
				>
					{loading ? '...' : 'Анализировать'}
				</button>
			</div>

			<div style={{ marginTop: 20 }}>
				{!data ? null : 'error' in data ? (
					<div style={{ whiteSpace: 'pre-wrap' }}>
						<b>Ошибка:</b> {data.error}
						{data.details ? `\n${data.details}` : null}
					</div>
				) : (
					<div>
						<div style={{ marginBottom: 12 }}>
							<b>Пользователь:</b> {data.user.label} <br />
							<b>Сообщений:</b> {data.sample_size}
						</div>

						<h3>Результат (parsed)</h3>
						<pre
							style={{ padding: 12, background: '#f3f3f3', overflow: 'auto' }}
						>
							{JSON.stringify(data.parsed, null, 2)}
						</pre>

						<h3>Raw ответ модели</h3>
						<pre
							style={{ padding: 12, background: '#f3f3f3', overflow: 'auto' }}
						>
							{data.raw}
						</pre>
					</div>
				)}
			</div>
		</main>
	)
}
