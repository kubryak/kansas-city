/**
 * Вспомогательные функции для обработки данных от Sirus API на клиенте
 */

import { fetchSirusAPI, SIRUS_API } from './sirus-api'

const REALM_ID = 22
const GUILD_ID = 39104

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

interface SirusPveInfoResponse {
	data: SirusInstance[]
}

interface ProgressItem {
	id: string
	name: string
	difficultyLabel: string
	killed: number
	total: number
	ilvl: number
	icon: string
	background: string
}

function getAbsoluteSirusImageUrl(relativePath: string): string {
	if (relativePath.startsWith('http')) {
		return relativePath
	}
	return `https://sirus.su${relativePath}`
}

function getDifficultyLabel(difficulty: number): string {
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

function getRaidIndex(instance: SirusInstance): number | null {
	const name = instance.name.toLowerCase()
	const diff = instance.difficulty

	if (name.includes('склеп аркавона')) {
		if (diff === 1) return 24
		if (diff === 0) return 23
	}
	if (name.includes('ульдуар')) {
		if (diff === 1) return 10
		if (diff === 0) return 9
	}
	if (name.includes('накс')) {
		if (diff === 3) return 8
		if (diff === 2) return 7
		if (diff === 1) return 4
		if (diff === 0) return 3
	}
	if (name.includes('око вечности')) {
		if (diff === 1) return 6
		if (diff === 0) return 5
	}
	if (name.includes('обсидиановое святилище') || name.includes('ос ')) {
		if (diff === 1) return 2
		if (diff === 0) return 1
	}

	return null
}

type PeriodKey = 'current' | 'previous' | 'last_two_weeks' | 'last_four_weeks'

export async function fetchLatestKills(params: {
	period?: PeriodKey
	page?: number
	raidIndex?: number | null
	bossId?: number | null
}) {
	const { period = 'current', page = 1, raidIndex = null, bossId = null } = params

	const killsUrl = `${SIRUS_API.latestKills()}&page=${page}`
	const initialJson = await fetchSirusAPI<SirusLatestKillsResponse>(killsUrl)

	const instancesByKey = new Map<string, SirusInstance>()
	for (const instance of initialJson.instances) {
		const key = `${instance.map_id}:${instance.difficulty}`
		if (!instancesByKey.has(key)) {
			instancesByKey.set(key, instance)
		}
	}

	let killsJson: SirusLatestKillsResponse = initialJson
	const selectedWeek = initialJson.weeks.find((week) => week.week === period)

	if (selectedWeek) {
		const urlParams = new URLSearchParams()
		urlParams.set('guild', String(GUILD_ID))
		urlParams.set('page', String(page))
		urlParams.set('week_from', selectedWeek.from)
		urlParams.set('week_to', selectedWeek.to)
		if (raidIndex !== null && !isNaN(raidIndex)) {
			urlParams.set('i', String(raidIndex))
		}
		if (bossId !== null && !isNaN(bossId)) {
			urlParams.set('boss', String(bossId))
		}

		const rangedUrl = `https://sirus.su/api/base/${REALM_ID}/progression/pve/latest-boss-kills?${urlParams.toString()}`
		try {
			killsJson = await fetchSirusAPI<SirusLatestKillsResponse>(rangedUrl)
			for (const instance of killsJson.instances) {
				const key = `${instance.map_id}:${instance.difficulty}`
				if (!instancesByKey.has(key)) {
					instancesByKey.set(key, instance)
				}
			}
		} catch {
			// Игнорируем ошибки, используем initialJson
		}
	} else if (raidIndex != null) {
		const urlParams = new URLSearchParams()
		urlParams.set('guild', String(GUILD_ID))
		urlParams.set('page', String(page))
		urlParams.set('i', String(raidIndex))
		if (bossId !== null && !isNaN(bossId)) {
			urlParams.set('boss', String(bossId))
		}

		const filteredUrl = `https://sirus.su/api/base/${REALM_ID}/progression/pve/latest-boss-kills?${urlParams.toString()}`
		try {
			killsJson = await fetchSirusAPI<SirusLatestKillsResponse>(filteredUrl)
			for (const instance of killsJson.instances) {
				const key = `${instance.map_id}:${instance.difficulty}`
				if (!instancesByKey.has(key)) {
					instancesByKey.set(key, instance)
				}
			}
		} catch {
			// Игнорируем ошибки, используем initialJson
		}
	}

	const kills = killsJson.data.slice().sort((a, b) => b.id - a.id)

	const availableRaids = Array.from(instancesByKey.values())
		.map((instance) => ({
			key: `${instance.map_id}:${instance.difficulty}`,
			name: instance.name,
			difficulty: instance.difficulty,
			difficultyLabel: getDifficultyLabel(instance.difficulty),
			index: getRaidIndex(instance),
		}))
		.sort((a, b) => {
			if (a.name !== b.name) {
				return a.name.localeCompare(b.name)
			}
			return a.difficulty - b.difficulty
		})

	const items: LatestKillItem[] = []

	for (const kill of kills) {
		const instanceKey = `${kill.mapId}:${kill.difficulty}`
		const instance = instancesByKey.get(instanceKey)

		if (!instance) continue

		const encounter = instance.encounters.find((e) => e.order === kill.encounter_id)
		if (!encounter) continue

		const dps = kill.player_count - (kill.healers ?? 0) - (kill.tanks ?? 0)

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

	let totalPages = 1
	let currentPage = page
	let perPage = 20
	let total = killsJson.data.length

	if (killsJson.meta?.last_page) {
		totalPages = killsJson.meta.last_page
		currentPage = killsJson.meta.current_page ?? page
		perPage = killsJson.meta.per_page ?? 20
		total = killsJson.meta.total ?? killsJson.data.length
	}

	const rawDataCount = killsJson.data.length
	if (rawDataCount === 0 && page > 1) {
		totalPages = Math.max(1, page - 1)
		currentPage = Math.min(currentPage, totalPages)
	} else if (rawDataCount > 0 && rawDataCount < perPage && page > 1) {
		totalPages = page
	} else if (rawDataCount === 0 && page === 1) {
		totalPages = 1
	}

	if (totalPages > 0 && totalPages < Math.ceil(total / perPage)) {
		total = Math.min(total, totalPages * perPage)
	}

	let availableBosses: Array<{ id: number; name: string; icon: string }> = []
	if (raidIndex !== null && !isNaN(raidIndex)) {
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

	return {
		kills: items,
		pagination: {
			currentPage,
			totalPages: Math.max(1, totalPages),
			perPage,
			total,
		},
		raids: availableRaids,
		bosses: availableBosses,
	}
}

export async function fetchProgression() {
	const killsUrl = `${SIRUS_API.latestKills()}&page=1`
	const pveInfoUrl = SIRUS_API.pveInfo

	const [initialKillsJson, pveInfoJson] = await Promise.all([
		fetchSirusAPI<SirusLatestKillsResponse>(killsUrl),
		fetchSirusAPI<SirusPveInfoResponse>(pveInfoUrl),
	])

	let killsJson: SirusLatestKillsResponse = initialKillsJson
	const lastFourWeeks = initialKillsJson.weeks.find((week) => week.week === 'last_four_weeks')

	if (lastFourWeeks) {
		const urlParams = new URLSearchParams()
		urlParams.set('guild', String(GUILD_ID))
		urlParams.set('page', '1')
		urlParams.set('week_from', lastFourWeeks.from)
		urlParams.set('week_to', lastFourWeeks.to)

		const rangedUrl = `https://sirus.su/api/base/${REALM_ID}/progression/pve/latest-boss-kills?${urlParams.toString()}`
		try {
			killsJson = await fetchSirusAPI<SirusLatestKillsResponse>(rangedUrl)
		} catch {
			// Игнорируем ошибки, используем initialKillsJson
		}
	}

	const killedByInstance = new Map<string, Set<number>>()

	for (const kill of killsJson.data) {
		const key = `${kill.mapId}:${kill.difficulty}`
		let set = killedByInstance.get(key)

		if (!set) {
			set = new Set<number>()
			killedByInstance.set(key, set)
		}

		set.add(kill.encounter_id)
	}

	const progress: ProgressItem[] = []

	for (const instance of pveInfoJson.data) {
		if (!instance.actual) {
			continue
		}

		const key = `${instance.map_id}:${instance.difficulty}`
		const killedSet = killedByInstance.get(key)

		const total = instance.encounters.length
		const killed = killedSet ? Math.min(killedSet.size, total) : 0

		const icon = instance.icon.startsWith('http')
			? instance.icon
			: `https://sirus.su${instance.icon}`

		const background = instance.background.startsWith('http')
			? instance.background
			: `https://sirus.su${instance.background}`

		progress.push({
			id: key,
			name: instance.name,
			difficultyLabel: getDifficultyLabel(instance.difficulty),
			killed,
			total,
			ilvl: instance.ilvl,
			icon,
			background,
		})
	}

	progress.sort((a, b) => b.ilvl - a.ilvl)

	return { progress }
}



