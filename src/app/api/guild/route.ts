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

export async function GET () {
	try {
		const res = await fetch(SIRUS_GUILD_URL, {
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


