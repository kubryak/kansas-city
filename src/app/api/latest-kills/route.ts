import { NextResponse } from 'next/server'
import { getSirusHeaders } from '@/lib/sirus-headers'

interface SirusLatestKill {
	id: number
	encounter_id: number
	difficulty: number
	guildId: number
	equipment: number
	time: string
	timeEnd: string
	mapId: number
	player_count: number
	healers: number
	tanks: number
}

interface SirusInstanceEncounter {
	order: number
	name: string
	creature_name: string
	icon: string
}

interface SirusInstance {
	map_id: number
	difficulty: number
	name: string
	ilvl: number
	actual: boolean
	icon: string
	background: string
	encounters: SirusInstanceEncounter[]
}

interface SirusLatestKillsWeek {
	week: string
	from: string
	to: string
}

interface SirusLatestKillsResponse {
	data: SirusLatestKill[]
	instances: SirusInstance[]
	weeks: SirusLatestKillsWeek[]
	meta?: {
		current_page?: number
		last_page?: number
		per_page?: number
		total?: number
	}
}

interface LatestKillItem {
	id: number
	bossName: string
	bossIcon: string
	raidName: string
	difficultyLabel: string
	equipment: number
	dps: number
	healers: number
	tanks: number
	time: string
	timeEnd: string
}

const REALM_ID = 22
const GUILD_ID = 39104
const MAX_KILLS = 50

// Хардкод-таблица соответствий рейда/сложности к параметру i Sirus API
// difficulty: 0 = 10 об, 1 = 25 об, 2 = 10 гер, 3 = 25 гер
function getRaidIndex (instance: SirusInstance): number | null {
	const name = instance.name.toLowerCase()
	const diff = instance.difficulty

	// Склеп Аркавона
	if (name.includes('склеп аркавона')) {
		if (diff === 1) return 24 // 25 об
		if (diff === 0) return 23 // 10 об
	}

	// Ульдуар
	if (name.includes('ульдуар')) {
		if (diff === 1) return 10 // 25 об
		if (diff === 0) return 9 // 10 об
	}

	// Наксрамас
	if (name.includes('накс')) {
		if (diff === 3) return 8 // 25 гер
		if (diff === 2) return 7 // 10 гер
		if (diff === 1) return 4 // 25 об
		if (diff === 0) return 3 // 10 об
	}

	// Око Вечности
	if (name.includes('око вечности')) {
		if (diff === 1) return 6 // 25 об
		if (diff === 0) return 5 // 10 об
	}

	// Обсидиановое святилище (ОС)
	if (name.includes('обсидиановое святилище') || name.includes('ос ')) {
		if (diff === 1) return 2 // 25 об
		if (diff === 0) return 1 // 10 об
	}

	return null
}

function getDifficultyLabel (difficulty: number): string {
	switch (difficulty) {
	case 0:
		return '10 об'
	case 1:
		return '25 об'
	case 2:
		return '10 гер'
	case 3:
		return '25 гер'
	default:
		return `${difficulty}`
	}
}

function getAbsoluteSirusImageUrl (relativePath: string): string {
	if (relativePath.startsWith('http')) {
		return relativePath
	}

	return `https://sirus.su${relativePath}`
}

type PeriodKey = 'current' | 'previous' | 'last_two_weeks' | 'last_four_weeks'

export async function GET (request: Request) {
	const { searchParams } = new URL(request.url)
	const period =
		(searchParams.get('period') as PeriodKey | null) ?? 'current'
	const page = Math.max(1, Number(searchParams.get('page')) || 1)
	const raidIndexParam = searchParams.get('i') // Параметр i для фильтрации по рейду
	const raidIndex = raidIndexParam ? Number(raidIndexParam) : null
	const bossParam = searchParams.get('boss') // Параметр boss для фильтрации по боссу
	const bossId = bossParam ? Number(bossParam) : null

	const killsUrl = `https://sirus.su/api/base/${REALM_ID}/progression/pve/latest-boss-kills?guild=${GUILD_ID}&page=${page}`

	try {
		const killsRes = await fetch(killsUrl, {
			headers: getSirusHeaders(),
			next: { revalidate: 60 },
		})

		if (!killsRes.ok) {
			const errorText = await killsRes.text()

			return NextResponse.json(
				{
					error: 'Failed to fetch latest boss kills from Sirus',
					status: killsRes.status,
					statusText: killsRes.statusText,
					details: errorText,
				},
				{ status: killsRes.status },
			)
		}

		const initialJson = (await killsRes.json()) as SirusLatestKillsResponse

		// Используем instances из первого запроса для всех страниц, так как они полные
		const instancesByKey = new Map<string, SirusInstance>()

		for (const instance of initialJson.instances) {
			const key = `${instance.map_id}:${instance.difficulty}`

			if (!instancesByKey.has(key)) {
				instancesByKey.set(key, instance)
			}
		}

		let killsJson: SirusLatestKillsResponse = initialJson

		const selectedWeek = initialJson.weeks.find(
			(week) => week.week === period,
		)

		let responseHeaders: Headers | null = null

		if (selectedWeek) {
			const params = new URLSearchParams()
			params.set('guild', String(GUILD_ID))
			params.set('page', String(page))
			params.set('week_from', selectedWeek.from)
			params.set('week_to', selectedWeek.to)
			if (raidIndex !== null && !isNaN(raidIndex)) {
				params.set('i', String(raidIndex))
			}
			if (bossId !== null && !isNaN(bossId)) {
				params.set('boss', String(bossId))
			}

			const rangedUrl = `https://sirus.su/api/base/${REALM_ID}/progression/pve/latest-boss-kills?${params.toString()}`

			const rangedRes = await fetch(rangedUrl, {
				headers: getSirusHeaders(),
				next: { revalidate: 60 },
			})

			if (rangedRes.ok) {
				killsJson = (await rangedRes.json()) as SirusLatestKillsResponse
				responseHeaders = rangedRes.headers

				// Дополняем instances из текущего запроса, если там есть новые
				for (const instance of killsJson.instances) {
					const key = `${instance.map_id}:${instance.difficulty}`

					if (!instancesByKey.has(key)) {
						instancesByKey.set(key, instance)
					}
				}
			}
		} else if (raidIndex != null) {
			// Если выбран фильтр по рейду, но нет выбранного периода, делаем запрос с параметром i
			const params = new URLSearchParams()
			params.set('guild', String(GUILD_ID))
			params.set('page', String(page))
			params.set('i', String(raidIndex))
			if (bossId !== null && !isNaN(bossId)) {
				params.set('boss', String(bossId))
			}

			const filteredUrl = `https://sirus.su/api/base/${REALM_ID}/progression/pve/latest-boss-kills?${params.toString()}`

			const filteredRes = await fetch(filteredUrl, {
				headers: getSirusHeaders(),
				next: { revalidate: 60 },
			})

			if (filteredRes.ok) {
				killsJson = (await filteredRes.json()) as SirusLatestKillsResponse
				responseHeaders = filteredRes.headers

				// Дополняем instances из текущего запроса, если там есть новые
				for (const instance of killsJson.instances) {
					const key = `${instance.map_id}:${instance.difficulty}`

					if (!instancesByKey.has(key)) {
						instancesByKey.set(key, instance)
					}
				}
			}
		} else {
			responseHeaders = killsRes.headers
		}

		const kills = killsJson.data
			.slice()
			.sort((a, b) => b.id - a.id)

		// Получаем список всех доступных рейдов из instances
		const availableRaids = Array.from(instancesByKey.values())
			.map((instance) => ({
				key: `${instance.map_id}:${instance.difficulty}`,
				name: instance.name,
				difficulty: instance.difficulty,
				difficultyLabel: getDifficultyLabel(instance.difficulty),
				index: getRaidIndex(instance),
			}))
			.sort((a, b) => {
				// Сортируем по имени рейда, затем по сложности
				if (a.name !== b.name) {
					return a.name.localeCompare(b.name)
				}
				return a.difficulty - b.difficulty
			})

		const items: LatestKillItem[] = []

		for (const kill of kills) {
			const instanceKey = `${kill.mapId}:${kill.difficulty}`
			const instance = instancesByKey.get(instanceKey)

			if (!instance) {
				continue
			}

			const encounter = instance.encounters.find(
				(e) => e.order === kill.encounter_id,
			)

			if (!encounter) {
				continue
			}

			const dps =
				kill.player_count - (kill.healers ?? 0) - (kill.tanks ?? 0)

			items.push({
				id: kill.id,
				bossName: encounter.name,
				bossIcon: getAbsoluteSirusImageUrl(encounter.icon),
				raidName: instance.name,
				difficultyLabel: getDifficultyLabel(kill.difficulty),
				equipment: kill.equipment,
				dps: dps > 0 ? dps : 0,
				healers: kill.healers,
				tanks: kill.tanks,
				time: kill.time,
				timeEnd: kill.timeEnd,
			})
		}

		// Проверяем метаданные пагинации из заголовков или тела ответа
		let totalPages = 1
		let currentPage = page
		let perPage = 20
		let total = killsJson.data.length

		// Проверяем метаданные в теле ответа
		if (killsJson.meta?.last_page) {
			totalPages = killsJson.meta.last_page
			currentPage = killsJson.meta.current_page ?? page
			perPage = killsJson.meta.per_page ?? 20
			total = killsJson.meta.total ?? killsJson.data.length
		} else if (responseHeaders) {
			// Проверяем заголовки ответа на наличие метаданных пагинации
			const headerTotalPages = responseHeaders.get('X-Total-Pages')
			const headerCurrentPage = responseHeaders.get('X-Current-Page')
			const headerPerPage = responseHeaders.get('X-Per-Page')
			const headerTotal = responseHeaders.get('X-Total-Count')

			if (headerTotalPages) {
				totalPages = Number(headerTotalPages)
			}
			if (headerCurrentPage) {
				currentPage = Number(headerCurrentPage)
			}
			if (headerPerPage) {
				perPage = Number(headerPerPage)
			}
			if (headerTotal) {
				total = Number(headerTotal)
			}
		}

		// Корректируем totalPages на основе реального количества данных от API
		// Если API вернул меньше данных чем perPage, значит это последняя страница
		const rawDataCount = killsJson.data.length

		if (rawDataCount === 0 && page > 1) {
			// Если данных нет и мы не на первой странице, значит предыдущая была последней
			totalPages = Math.max(1, page - 1)
			currentPage = Math.min(currentPage, totalPages)
		} else if (rawDataCount > 0 && rawDataCount < perPage && page > 1) {
			// Если данных меньше чем perPage и это не первая страница, значит это последняя страница
			totalPages = page
		} else if (rawDataCount === 0 && page === 1) {
			// Если на первой странице нет данных, значит всего страниц 0 (но мы вернем 1)
			totalPages = 1
		}

		// Корректируем total на основе реального количества страниц
		// Если total из метаданных явно завышен, используем более реалистичное значение
		if (totalPages > 0 && totalPages < Math.ceil(total / perPage)) {
			// Если скорректированное количество страниц меньше чем должно быть по total,
			// значит total завышен, корректируем его
			total = Math.min(total, totalPages * perPage)
		}

		// Получаем список боссов для выбранного рейда
		let availableBosses: Array<{ id: number; name: string; icon: string }> = []
		if (raidIndex !== null && !isNaN(raidIndex)) {
			// Находим instance по raidIndex
			const selectedInstance = Array.from(instancesByKey.values()).find(
				(instance) => getRaidIndex(instance) === raidIndex,
			)

			if (selectedInstance) {
				availableBosses = selectedInstance.encounters
					.map((encounter) => ({
						id: encounter.order,
						name: encounter.name,
						icon: getAbsoluteSirusImageUrl(encounter.icon),
					}))
					.sort((a, b) => a.id - b.id)
			}
		}

		return NextResponse.json({
			kills: items,
			pagination: {
				currentPage,
				totalPages: Math.max(1, totalPages),
				perPage,
				total,
			},
			raids: availableRaids,
			bosses: availableBosses,
		})
	} catch (err) {
		console.error('Error in /api/latest-kills:', err)
		return NextResponse.json(
			{
				error: 'Unexpected error while fetching latest boss kills',
				details: (err as Error).message,
			},
			{ status: 500 },
		)
	}
}


