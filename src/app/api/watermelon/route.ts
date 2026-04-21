import { NextResponse } from 'next/server'
import { getSirusHeaders } from '@/lib/sirus-headers'

interface LeaderboardEntry {
	name: string
	fights?: FightEntry[]
}

interface FightEntry {
	encounter_id?: number
	datetime?: number
}

interface LeaderboardResponse {
	data?: LeaderboardEntry[]
	meta?: {
		current_page?: number
		last_page?: number
	}
}

interface PveInfoResponse {
	data?: Array<{
		map_id?: number
		difficulty?: number
		encounters?: Array<{
			order?: number
			name?: string
		}>
	}>
}

interface CharacterCard {
	name: string
	fightsCount: number
	bossNames: string[]
	completeRun: boolean
	killsAfterFinal: number
	finalBossKillAt: number | null
	repeatedKillsAfterFinal: Array<{
		bossName: string
		datetime: number
	}>
}

const API_URL = 'https://sirus.su/api/base/x3/leaderboard/pve'
const PVE_INFO_URL = 'https://sirus.su/api/base/x3/pve-info?encounters=true'

const INSTANCES: Record<number, { name: string; minFightsExclusive: number }> = {
	11: { name: 'Каражан', minFightsExclusive: 9 },
	14: { name: 'Испытание крестоносца 10', minFightsExclusive: 5 },
	15: { name: 'Испытание крестоносца 25', minFightsExclusive: 5 },
	16: { name: 'Логово Магтеридона', minFightsExclusive: 1 },
	17: { name: 'Логово Груула', minFightsExclusive: 2 },
}

const INSTANCE_RUN_RULES: Record<number, { requiredEncounters: number[]; finalEncounter: number }> = {
	11: { requiredEncounters: [0, 1, 2, 3, 4, 5, 6, 7, 9], finalEncounter: 9 },
	14: { requiredEncounters: [0, 1, 2, 3, 4], finalEncounter: 4 },
	15: { requiredEncounters: [0, 1, 2, 3, 4], finalEncounter: 4 },
	16: { requiredEncounters: [0], finalEncounter: 0 },
	17: { requiredEncounters: [0, 1], finalEncounter: 1 },
}

const INSTANCE_IGNORED_AFTER_FINAL_ENCOUNTERS: Record<number, number[]> = {
	11: [10, 11],
}

const INSTANCE_BOSS_NAME_OVERRIDES: Record<number, Record<number, string>> = {
	16: {
		0: 'Магтеридон',
	},
	17: {
		0: 'Король Молгар',
		1: 'Груул',
	},
}

function resolveBossName(instanceId: number, encounterId: number, bossNamesByEncounter: Map<number, string>): string {
	const override = INSTANCE_BOSS_NAME_OVERRIDES[instanceId]?.[encounterId]
	if (override) {
		return override
	}

	return bossNamesByEncounter.get(encounterId) ?? `Босс #${encounterId}`
}

function analyzeRunByFights(
	fights: FightEntry[],
	rules: { requiredEncounters: number[]; finalEncounter: number },
	ignoredAfterFinalEncounterIds: number[] = [],
): {
	completeRun: boolean
	killsAfterFinal: number
	finalBossKillAt: number | null
	repeatedEncountersAfterFinal: Array<{ encounterId: number; datetime: number }>
} {
	if (!Array.isArray(fights) || fights.length === 0) {
		return {
			completeRun: false,
			killsAfterFinal: 0,
			finalBossKillAt: null,
			repeatedEncountersAfterFinal: [],
		}
	}

	const ordered = [...fights].sort((a, b) => {
		const t1 = typeof a.datetime === 'number' ? a.datetime : 0
		const t2 = typeof b.datetime === 'number' ? b.datetime : 0
		return t1 - t2
	})

	const finalKillIndexes: number[] = []
	for (let i = 0; i < ordered.length; i += 1) {
		if (ordered[i].encounter_id === rules.finalEncounter) {
			finalKillIndexes.push(i)
		}
	}

	if (finalKillIndexes.length === 0) {
		return {
			completeRun: false,
			killsAfterFinal: 0,
			finalBossKillAt: null,
			repeatedEncountersAfterFinal: [],
		}
	}

	for (const finalIndex of finalKillIndexes) {
		const seen = new Set<number>()
		for (let i = 0; i <= finalIndex; i += 1) {
			const encounterId = ordered[i].encounter_id
			if (typeof encounterId === 'number') {
				seen.add(encounterId)
			}
		}

		const completeRun = rules.requiredEncounters.every((id) => seen.has(id))
		if (completeRun) {
			const finalFight = ordered[finalIndex]
			const ignoredSet = new Set(ignoredAfterFinalEncounterIds)
			const repeatedEncountersAfterFinal = ordered
				.slice(finalIndex + 1)
				.filter((fight): fight is { encounter_id: number; datetime: number } => {
					return (
						typeof fight.encounter_id === 'number' &&
						typeof fight.datetime === 'number' &&
						!ignoredSet.has(fight.encounter_id)
					)
				})
				.map((fight) => ({
					encounterId: fight.encounter_id,
					datetime: fight.datetime,
				}))

			return {
				completeRun: true,
				killsAfterFinal: repeatedEncountersAfterFinal.length,
				finalBossKillAt: typeof finalFight.datetime === 'number' ? finalFight.datetime : null,
				repeatedEncountersAfterFinal,
			}
		}
	}

	return {
		completeRun: false,
		killsAfterFinal: 0,
		finalBossKillAt: null,
		repeatedEncountersAfterFinal: [],
	}
}

function formatDate(date: Date): string {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

function getWeekRange(): { weekFrom: string; weekTo: string } {
	const today = new Date()
	const day = today.getDay()
	const distanceFromThursday = (day - 4 + 7) % 7

	const thursday = new Date(today)
	thursday.setDate(today.getDate() - distanceFromThursday)

	return {
		weekFrom: formatDate(thursday),
		weekTo: formatDate(today),
	}
}

async function fetchPage(
	instanceId: number,
	page: number,
	weekFrom: string,
	weekTo: string,
): Promise<LeaderboardResponse> {
	const params = new URLSearchParams({
		ladder: 'players',
		type: 'dps',
		aggregation: 'max',
		week_from: weekFrom,
		week_to: weekTo,
		per_page: '500',
		page: String(page),
		i: String(instanceId),
	})

	const res = await fetch(`${API_URL}?${params.toString()}`, {
		headers: getSirusHeaders(),
		next: { revalidate: 300 },
	})

	if (!res.ok) {
		const details = await res.text().catch(() => '')
		throw new Error(`Sirus leaderboard request failed: ${res.status} ${details.slice(0, 200)}`)
	}

	return (await res.json()) as LeaderboardResponse
}

async function fetchPveInfo(): Promise<PveInfoResponse> {
	const res = await fetch(PVE_INFO_URL, {
		headers: getSirusHeaders(),
		next: { revalidate: 3600 },
	})

	if (!res.ok) {
		const details = await res.text().catch(() => '')
		throw new Error(`Sirus pve-info request failed: ${res.status} ${details.slice(0, 200)}`)
	}

	return (await res.json()) as PveInfoResponse
}

function getBossNamesByEncounter(instanceId: number, pveInfo: PveInfoResponse): Map<number, string> {
	if (!Array.isArray(pveInfo.data)) {
		return new Map<number, string>()
	}

	const matchingInstance = pveInfo.data.find((item) => {
		if (!Array.isArray(item.encounters)) {
			return false
		}

		const encounterOrders = new Set(
			item.encounters
				.map((encounter) => encounter.order)
				.filter((order): order is number => typeof order === 'number'),
		)

		if (instanceId === 15 || instanceId === 14) {
			return encounterOrders.has(0) && encounterOrders.has(4)
		}

		if (instanceId === 11) {
			return encounterOrders.has(0) && encounterOrders.has(9) && encounterOrders.has(10)
		}

		if (instanceId === 17) {
			return encounterOrders.has(0) && encounterOrders.has(1)
		}

		if (instanceId === 16) {
			return encounterOrders.has(0)
		}

		return false
	})

	if (!matchingInstance || !Array.isArray(matchingInstance.encounters)) {
		return new Map<number, string>()
	}

	const bossNamesByEncounter = new Map<number, string>()
	for (const encounter of matchingInstance.encounters) {
		if (typeof encounter.order === 'number' && encounter.name) {
			bossNamesByEncounter.set(encounter.order, encounter.name)
		}
	}

	return bossNamesByEncounter
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const instanceParam = Number(searchParams.get('instance'))

	if (!Object.prototype.hasOwnProperty.call(INSTANCES, instanceParam)) {
		return NextResponse.json(
			{ error: 'Unknown instance id. Use one of: 11, 14, 15, 16, 17.' },
			{ status: 400 },
		)
	}

	const instance = INSTANCES[instanceParam]
	const runRules = INSTANCE_RUN_RULES[instanceParam]
	const ignoredAfterFinalEncounterIds = INSTANCE_IGNORED_AFTER_FINAL_ENCOUNTERS[instanceParam] ?? []
	const { weekFrom, weekTo } = getWeekRange()

	try {
		const [firstPage, pveInfo] = await Promise.all([
			fetchPage(instanceParam, 1, weekFrom, weekTo),
			fetchPveInfo(),
		])
		const totalPages = Math.max(1, firstPage.meta?.last_page ?? 1)
		const allEntries: LeaderboardEntry[] = [...(firstPage.data ?? [])]
		const bossNamesByEncounter = getBossNamesByEncounter(instanceParam, pveInfo)

		for (let page = 2; page <= totalPages; page += 1) {
			const pageJson = await fetchPage(instanceParam, page, weekFrom, weekTo)
			if (Array.isArray(pageJson.data)) {
				allEntries.push(...pageJson.data)
			}
		}

		const charactersByName = new Map<string, CharacterCard>()

		for (const entry of allEntries) {
			const fights = Array.isArray(entry.fights) ? entry.fights.length : 0
			if (fights > instance.minFightsExclusive && entry.name) {
				const bossNamesSet = new Set<string>()
				const runAnalysis = analyzeRunByFights(
					entry.fights ?? [],
					runRules,
					ignoredAfterFinalEncounterIds,
				)

				if (instanceParam === 11 && (!runAnalysis.completeRun || runAnalysis.killsAfterFinal === 0)) {
					continue
				}
				const repeatedKillsAfterFinal = runAnalysis.repeatedEncountersAfterFinal.map((kill) => ({
					bossName: resolveBossName(instanceParam, kill.encounterId, bossNamesByEncounter),
					datetime: kill.datetime,
				}))

				for (const fight of entry.fights ?? []) {
					const encounterId = fight?.encounter_id
					if (typeof encounterId === 'number') {
						bossNamesSet.add(resolveBossName(instanceParam, encounterId, bossNamesByEncounter))
					}
				}

				const existing = charactersByName.get(entry.name)
				if (!existing) {
					charactersByName.set(entry.name, {
						name: entry.name,
						fightsCount: fights,
						bossNames: Array.from(bossNamesSet),
						completeRun: runAnalysis.completeRun,
						killsAfterFinal: runAnalysis.killsAfterFinal,
						finalBossKillAt: runAnalysis.finalBossKillAt,
						repeatedKillsAfterFinal,
					})
					continue
				}

				existing.fightsCount = Math.max(existing.fightsCount, fights)
				existing.completeRun = existing.completeRun || runAnalysis.completeRun
				existing.killsAfterFinal = Math.max(
					existing.killsAfterFinal,
					runAnalysis.killsAfterFinal,
				)
				if (runAnalysis.finalBossKillAt !== null) {
					existing.finalBossKillAt =
						existing.finalBossKillAt === null
							? runAnalysis.finalBossKillAt
							: Math.max(existing.finalBossKillAt, runAnalysis.finalBossKillAt)
				}
				for (const repeatedKill of repeatedKillsAfterFinal) {
					if (
						!existing.repeatedKillsAfterFinal.some(
							(item) => item.datetime === repeatedKill.datetime && item.bossName === repeatedKill.bossName,
						)
					) {
						existing.repeatedKillsAfterFinal.push(repeatedKill)
					}
				}
				for (const bossName of bossNamesSet) {
					if (!existing.bossNames.includes(bossName)) {
						existing.bossNames.push(bossName)
					}
				}
			}
		}

		const characters = Array.from(charactersByName.values())
			.map((character) => ({
				...character,
				bossNames: character.bossNames.sort((a, b) => a.localeCompare(b, 'ru')),
				repeatedKillsAfterFinal: character.repeatedKillsAfterFinal.sort((a, b) => a.datetime - b.datetime),
			}))
			.sort((a, b) => a.name.localeCompare(b.name, 'ru'))

		return NextResponse.json({
			instanceId: instanceParam,
			instanceName: instance.name,
			minFightsExclusive: instance.minFightsExclusive,
			week_from: weekFrom,
			week_to: weekTo,
			totalPages,
			totalEntries: allEntries.length,
			characters,
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		return NextResponse.json(
			{ error: 'Failed to load leaderboard data', details: message },
			{ status: 502 },
		)
	}
}
