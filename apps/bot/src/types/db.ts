export type DbChat = {
	id: number
	tg_chat_id: number
	title: string | null
	type: string | null
}

export type DbUser = {
	id: number
	tg_user_id: number
	username: string | null
	first_name: string | null
	last_name: string | null
}

export type DbMessage = {
	id: number
	chat_id: number
	user_id: number
	tg_message_id: number | null
	text: string
	message_date: string // ISO
}
