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

interface UseGuildByIdResult {
	data: GuildResponse | undefined
	isLoading: boolean
	isError: boolean
	guild: GuildResponse['guild'] | null
	members: GuildResponse['members']
	ranks: GuildResponse['ranks']
	rankById: Map<number, string>
	sortedMembers: GuildResponse['members']
}

export function useGuildById (guildId: number): UseGuildByIdResult {
	const { data, isLoading, isError } = useQuery<GuildResponse>({
		queryKey: ['guild', guildId],
		queryFn: async () => {
			const rawData = await fetchSirusAPI<unknown>(SIRUS_API.guildById(guildId))
			return guildSchema.parse(rawData)
		},
		enabled: !!guildId,
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
			sortedMembers: [],
		}
	}

	const { guild, members, ranks } = data

	const rankById = new Map(ranks.map((rank) => [rank.rid, rank.rname]))

	const sortedMembers = [...members].sort((a, b) => b.ilvl - a.ilvl)

	return {
		data,
		isLoading,
		isError,
		guild,
		members,
		ranks,
		rankById,
		sortedMembers,
	}
}

