import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSirusHeaders } from '@/lib/sirus-headers'

const skillSchema = z.object({
	skill: z.number(),
	value: z.number(),
	max: z.number(),
})

const memberSchema = z.object({
	guid: z.number(),
	name: z.string(),
	race: z.number(),
	class: z.number(),
	level: z.number(),
	gender: z.number(),
	ilvl: z.number(),
	skills: z.array(skillSchema),
	rank: z.number(),
	faction: z.number(),
})

const rankSchema = z.object({
	rid: z.number(),
	rname: z.string(),
})

const guildSchema = z.object({
	guild: z.object({
		id: z.number(),
		name: z.string(),
		level: z.number(),
	}),
	ranks: z.array(rankSchema),
	members: z.array(memberSchema),
})

export type GuildResponse = z.infer<typeof guildSchema>

const REALM_ID = 22
const GUILD_ID = 39104
const SIRUS_GUILD_URL = `https://sirus.su/api/base/${REALM_ID}/guild/${GUILD_ID}`

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
	for (let i = 0; i < maxRetries; i++) {
		try {
			// Если это повторная попытка, изменяем заголовки
			const retryOptions = i > 0 ? {
				...options,
				headers: {
					...getSirusHeaders(),
					'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${120 + i}.0.0.0 Safari/537.36`,
				},
			} : options
			
			const res = await fetch(url, retryOptions)
			
			// Если получили 403 и это не последняя попытка, пробуем снова
			if (res.status === 403 && i < maxRetries - 1) {
				// Добавляем случайную задержку от 1 до 3 секунд
				await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
				continue
			}
			
			return res
		} catch (err) {
			if (i === maxRetries - 1) throw err
			await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
		}
	}
	
	throw new Error('Max retries exceeded')
}

export async function GET () {
	try {
		const res = await fetchWithRetry(SIRUS_GUILD_URL, {
			// Отключаем кэш, чтобы не сохранять возможные ответы Cloudflare 403
			cache: 'no-store',
			// Минимизируем заголовки, чтобы не триггерить защиту Cloudflare
			headers: getSirusHeaders(),
		})

		if (!res.ok) {
			const text = await res.text().catch(() => '')

			return NextResponse.json(
				{
					error: 'Failed to fetch guild data from Sirus',
					status: res.status,
					statusText: res.statusText,
					details: text.slice(0, 500),
				},
				{ status: res.status },
			)
		}

		const data = await res.json()
		const parsed = guildSchema.parse(data)

		return NextResponse.json(parsed)
	} catch (err) {
		return NextResponse.json(
			{
				error: 'Unexpected error while fetching guild data',
				details: err instanceof Error ? err.message : String(err),
			},
			{ status: 500 },
		)
	}
}


