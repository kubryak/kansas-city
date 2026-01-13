import { useQuery } from '@tanstack/react-query'
import { fetchSirusAPI, SIRUS_API } from '@/lib/sirus-api'
import { z } from 'zod'

// Схема для валидации данных от Sirus API
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
	others: GuildResponse['members']
	othersClassCounts: Record<number, number>
	othersClassMembers: Record<number, string[]>
}

export function useGuild (): UseGuildResult {
	const { data, isLoading, isError } = useQuery<GuildResponse>({
		queryKey: ['guild'],
		queryFn: async () => {
			// Делаем запрос напрямую к Sirus API с клиента
			const rawData = await fetchSirusAPI<unknown>(SIRUS_API.guild)
			// Валидируем данные с помощью Zod
			return guildSchema.parse(rawData)
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
			others: [],
			othersClassCounts: {},
			othersClassMembers: {},
		}
	}

	const { guild, members, ranks } = data

	const rankById = new Map(ranks.map((rank) => [rank.rid, rank.rname]))

	const twinkRank = ranks.find(
		(rank) => rank.rname.toLowerCase() === 'твинк',
	)

	const twinkRankId = twinkRank?.rid

	const excludedRankNames = new Set([
		'твинк',
		'замена',
		'крафтер',
		'статик-10',
	])

	const excludedRankIds = new Set(
		ranks
			.filter((rank) =>
				excludedRankNames.has(rank.rname.toLowerCase()),
			)
			.map((rank) => rank.rid),
	)

	const twinks = twinkRankId
		? members.filter((member) => member.rank === twinkRankId)
		: []

	const EXCLUDED_MAIN_NAMES = new Set(['негрони'])

	const mainsAll = members.filter(
		(member) =>
			!excludedRankIds.has(member.rank) &&
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

	// Остальные персонажи: уровень 80, не твинки, не мейны
	// Это те, кто уровень 80, но либо имеет исключенное звание (кроме крафтера), либо исключен по имени
	const craftRank = ranks.find(
		(rank) => rank.rname.toLowerCase() === 'крафтер',
	)
	const craftRankId = craftRank?.rid

	const othersLevel80 = members.filter(
		(member) =>
			member.level === 80 &&
			(twinkRankId == null || member.rank !== twinkRankId) &&
			(craftRankId == null || member.rank !== craftRankId) &&
			(excludedRankIds.has(member.rank) ||
				EXCLUDED_MAIN_NAMES.has(member.name.toLowerCase())),
	)

	const othersClassCounts = othersLevel80.reduce<Record<number, number>>(
		(acc, member) => {
			acc[member.class] = (acc[member.class] ?? 0) + 1
			return acc
		},
		{},
	)

	const othersClassMembers = othersLevel80.reduce<Record<number, string[]>>(
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
		others: othersLevel80,
		othersClassCounts,
		othersClassMembers,
	}
}


