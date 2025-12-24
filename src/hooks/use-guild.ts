import { useQuery } from '@tanstack/react-query'
import type { GuildResponse } from '@/app/api/guild/route'

interface UseGuildResult {
	data: GuildResponse | undefined
	isLoading: boolean
	isError: boolean
	guild: GuildResponse['guild'] | null
	members: GuildResponse['members']
	ranks: GuildResponse['ranks']
	rankById: Map<number, string>
	mains: GuildResponse['members']
	twinks: GuildResponse['members']
	mainsLevel80: GuildResponse['members']
	avgIlvl: number
	classCounts: Record<number, number>
	classMembers: Record<number, string[]>
	sortedMembers: GuildResponse['members']
}

export function useGuild (): UseGuildResult {
	const { data, isLoading, isError } = useQuery<GuildResponse>({
		queryKey: ['guild'],
		queryFn: async () => {
			const res = await fetch('/api/guild')

			if (!res.ok) {
				throw new Error('Failed to fetch guild')
			}

			return res.json()
		},
	})

	if (!data) {
		return {
			data,
			isLoading,
			isError,
			guild: null,
			members: [],
			ranks: [],
			rankById: new Map(),
			mains: [],
			twinks: [],
			mainsLevel80: [],
			avgIlvl: 0,
			classCounts: {},
			classMembers: {},
			sortedMembers: [],
		}
	}

	const { guild, members, ranks } = data

	const rankById = new Map(ranks.map((rank) => [rank.rid, rank.rname]))

	const twinkRank = ranks.find(
		(rank) => rank.rname.toLowerCase() === 'твинк',
	)

	const twinkRankId = twinkRank?.rid

	const twinks = twinkRankId
		? members.filter((member) => member.rank === twinkRankId)
		: []

	const EXCLUDED_MAIN_NAMES = new Set(['эгорм', 'негрони', 'пашакалуга'])

	const mainsAll =
		twinkRankId != null
			? members.filter(
					(member) =>
						member.rank !== twinkRankId &&
						!EXCLUDED_MAIN_NAMES.has(member.name.toLowerCase()),
			  )
			: members.filter(
					(member) =>
						!EXCLUDED_MAIN_NAMES.has(member.name.toLowerCase()),
			  )

	const mainsLevel80 = mainsAll.filter((member) => member.level === 80)
	const mains = mainsLevel80

	const avgIlvl =
		mainsLevel80.length > 0
			? mainsLevel80.reduce((sum, member) => sum + member.ilvl, 0) /
			  mainsLevel80.length
			: 0

	const classCounts = mainsLevel80.reduce<Record<number, number>>(
		(acc, member) => {
			acc[member.class] = (acc[member.class] ?? 0) + 1
			return acc
		},
		{},
	)

	const classMembers = mainsLevel80.reduce<Record<number, string[]>>(
		(acc, member) => {
			if (!acc[member.class]) {
				acc[member.class] = []
			}

			acc[member.class]!.push(member.name)

			return acc
		},
		{},
	)

	const sortedMembers = [...members].sort((a, b) => b.ilvl - a.ilvl)

	return {
		data,
		isLoading,
		isError,
		guild,
		members,
		ranks,
		rankById,
		mains,
		twinks,
		mainsLevel80,
		avgIlvl,
		classCounts,
		classMembers,
		sortedMembers,
	}
}


