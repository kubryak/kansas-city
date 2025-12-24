import { useQuery } from '@tanstack/react-query'
import type { CharacterResponse } from '@/app/api/character/[name]/route'

interface Talent {
	guid: number
	spell: number
	talentGroup: number
}

interface ClassTalent {
	_id: number
	name: string
	order: number
	class: number
	background: string
	icon: string
	talents: Array<{
		id: number
		col: number
		row: number
		tab: number
		ranks: number[]
		rank_spells: Array<{
			spell_id: number
			name: string
			icon: string
			description: string
		}>
		dependsOn: number
		dependsOnRank: number
		max_rank: number
	}>
}

interface Glyph {
	glyphSlot: number
	talentGroup: number
	glyphData: {
		glyph_id: number
		glyph_spellid: number
		glyph_item_entry: number
		glyph_icon: string
		skill: number
		level: number
		class: number
		type: number
		glyph_name: string
		skill_name: string
		skill_line: {
			id: number
			categoryId: number
			name: string
			icon: string
		}
	}
}

interface PveEncounter {
	name: string
	killed: boolean
}

interface PveInstance {
	order: number
	map_id: number
	map_name: string
	difficulty: number
	background: string
	equipment: number
	actual: boolean
	encounters: PveEncounter[]
	progressed: number
	percentage: number
}

interface UseCharacterResult {
	data: CharacterResponse | undefined
	isLoading: boolean
	isError: boolean
	character: CharacterResponse['character'] | null
	equipments: CharacterResponse['equipments'] | null
	professions: CharacterResponse['professions'] | null
	secondarySkills: CharacterResponse['secondarySkills'] | null
	talents: Talent[][] | null
	activeTalentGroup: number | null
	classTalents: ClassTalent[] | null
	glyphs: Glyph[] | null
	pve: PveInstance[] | null
}

export function useCharacter (name: string): UseCharacterResult {
	const { data, isLoading, isError } = useQuery<CharacterResponse>({
		queryKey: ['character', name],
		queryFn: async () => {
			// Next.js автоматически обработает кодирование URL
			const res = await fetch(`/api/character/${name}`)

			if (!res.ok) {
				throw new Error('Failed to fetch character')
			}

			return res.json()
		},
		enabled: !!name,
	})

	const character = data?.character as (CharacterResponse['character'] & {
		talents?: Talent[][]
		activeTalentGroup?: number
	}) | null

	// Проверяем таланты в разных местах
	const talents = character?.talents ?? 
		(data?.characterTalents as Talent[][] | undefined) ?? 
		null

	const classTalents = (data?.classTalents as ClassTalent[] | undefined) ?? null
	const glyphs = (data?.glyphs as Glyph[] | undefined) ?? null

	// Преобразуем объект pve в массив и сортируем по order
	const pveData = data?.pve as Record<string, PveInstance> | undefined
	const pve = pveData
		? Object.values(pveData)
			.sort((a, b) => a.order - b.order)
		: null

	return {
		data,
		isLoading,
		isError,
		character,
		equipments: data?.equipments ?? null,
		professions: data?.professions ?? null,
		secondarySkills: data?.secondarySkills ?? null,
		talents,
		activeTalentGroup: character?.activeTalentGroup ?? null,
		classTalents,
		glyphs,
		pve,
	}
}

