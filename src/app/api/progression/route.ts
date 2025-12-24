import { NextResponse } from 'next/server'
import { getSirusHeaders } from '@/lib/sirus-headers'

interface SirusKill {
	mapId: number
	encounter_id: number
	difficulty: number
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
	data: SirusKill[]
	instances: SirusInstance[]
	weeks: SirusLatestKillsWeek[]
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

const REALM_ID = 22
const GUILD_ID = 39104

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

export async function GET () {
	const killsUrl = `https://sirus.su/api/base/${REALM_ID}/progression/pve/latest-boss-kills?guild=${GUILD_ID}&page=1`
	const pveInfoUrl = `https://sirus.su/api/base/${REALM_ID}/pve-info?encounters=true`

	try {
		const [killsRes, pveInfoRes] = await Promise.all([
			fetch(killsUrl, {
				headers: getSirusHeaders(),
				next: { revalidate: 60 },
			}),
			fetch(pveInfoUrl, {
				headers: getSirusHeaders(),
				next: { revalidate: 300 },
			}),
		])

		if (!killsRes.ok) {
			const errorText = await killsRes.text()
			return NextResponse.json(
				{
					error: 'Failed to fetch progression data from Sirus',
					status: killsRes.status,
					statusText: killsRes.statusText,
					details: errorText,
				},
				{ status: killsRes.status },
			)
		}

		if (!pveInfoRes.ok) {
			const errorText = await pveInfoRes.text()
			return NextResponse.json(
				{
					error: 'Failed to fetch PvE info from Sirus',
					status: pveInfoRes.status,
					statusText: pveInfoRes.statusText,
					details: errorText,
				},
				{ status: pveInfoRes.status },
			)
		}

		const initialKillsJson =
			(await killsRes.json()) as SirusLatestKillsResponse
		const pveInfoJson = (await pveInfoRes.json()) as SirusPveInfoResponse

		let killsJson: SirusLatestKillsResponse = initialKillsJson

		const lastFourWeeks = initialKillsJson.weeks.find(
			(week) => week.week === 'last_four_weeks',
		)

		if (lastFourWeeks) {
			const params = new URLSearchParams()
			params.set('guild', String(GUILD_ID))
			params.set('page', '1')
			params.set('week_from', lastFourWeeks.from)
			params.set('week_to', lastFourWeeks.to)

			const rangedUrl = `https://sirus.su/api/base/${REALM_ID}/progression/pve/latest-boss-kills?${params.toString()}`

			const rangedRes = await fetch(rangedUrl, {
				headers: {
					Accept: 'application/json',
					'Accept-Language': 'ru',
					'User-Agent':
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) KansasCityGuildDash/1.0',
				},
				next: { revalidate: 60 },
			})

			if (rangedRes.ok) {
				killsJson = (await rangedRes.json()) as SirusLatestKillsResponse
			}
		}

		// mapId + difficulty -> Set<encounter_id> (killed)
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
			const killed = killedSet
				? Math.min(killedSet.size, total)
				: 0

			const icon =
				instance.icon.startsWith('http')
					? instance.icon
					: `https://sirus.su${instance.icon}`

			const background =
				instance.background.startsWith('http')
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

		return NextResponse.json({ progress })
	} catch (err) {
		console.error('Error in /api/progression:', err)
		return NextResponse.json(
			{
				error: 'Unexpected error while fetching progression data',
				details: (err as Error).message,
			},
			{ status: 500 },
		)
	}
}


