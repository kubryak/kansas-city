import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSirusHeaders } from '@/lib/sirus-headers'

// Базовая схема для данных персонажа
// Будет расширена после получения реальных данных от API
const characterSchema = z.object({
	character: z.object({
		guid: z.number(),
		name: z.string(),
		race: z.number(),
		class: z.number(),
		level: z.number(),
		gender: z.number(),
		ilvl: z.number(),
		faction: z.number(),
		raceIcon: z.string().optional(),
		spec: z.number().optional(),
		guild: z.object({
			id: z.number(),
			name: z.string(),
			level: z.number(),
		}).optional(),
	}).passthrough(), // passthrough позволяет дополнительные поля
	equipments: z.array(z.object({
		entry: z.number().optional(),
		icon: z.string().optional(),
		name: z.string().optional(),
		slot: z.number().optional(),
		key: z.string().optional(),
		quality: z.number().optional(),
		itemLevel: z.number().optional(),
		item_instance: z.unknown().optional(),
	}).passthrough()).optional(),
	classTalents: z.array(z.unknown()).optional(),
	characterTalents: z.array(z.unknown()).optional(),
	glyphs: z.array(z.unknown()).optional(),
	professions: z.array(z.unknown()).optional(),
	secondarySkills: z.array(z.unknown()).optional(),
	pvp: z.unknown().optional(),
	arena: z.unknown().optional(),
	pve: z.unknown().optional(),
}).passthrough()

export type CharacterResponse = z.infer<typeof characterSchema>

const REALM_ID = 22

export async function GET (
	request: Request,
	{ params }: { params: Promise<{ name: string }> },
) {
	try {
		const { name } = await params
		
		if (!name || typeof name !== 'string') {
			return NextResponse.json(
				{ error: 'Character name is required' },
				{ status: 400 },
			)
		}

		// Next.js уже декодировал параметр маршрута, поэтому кодируем для запроса к Sirus API
		const encodedName = encodeURIComponent(name)
		const SIRUS_CHARACTER_URL = `https://sirus.su/api/base/${REALM_ID}/character/${encodedName}`

		const res = await fetch(SIRUS_CHARACTER_URL, {
			headers: getSirusHeaders(),
			cache: 'no-store', // Отключаем кэширование, чтобы не кэшировать 403
		})

		if (!res.ok) {
			const text = await res.text().catch(() => '')

			return NextResponse.json(
				{
					error: 'Failed to fetch character data from Sirus',
					status: res.status,
					statusText: res.statusText,
					details: text.slice(0, 500),
				},
				{ status: res.status },
			)
		}

		const data = await res.json()
		const parsed = characterSchema.parse(data)

		return NextResponse.json(parsed)
	} catch (err) {
		if (err instanceof z.ZodError) {
			return NextResponse.json(
				{
					error: 'Invalid character data structure',
					details: err.issues,
				},
				{ status: 500 },
			)
		}

		return NextResponse.json(
			{
				error: 'Unexpected error while fetching character data',
				details: err instanceof Error ? err.message : String(err),
			},
			{ status: 500 },
		)
	}
}

