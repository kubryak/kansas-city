import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

interface SpellData {
	id: number
	name: string
	iconUrl: string
	rank: string
	range: string
	castTime: string
	cooldown: string
	description: {
		text: string
		relatedSpells: unknown[]
		scaling: boolean
	}
}

export function useSpellNames (spellIds: Array<string | number>) {
	const uniqueIds = Array.from(
		new Set(
			spellIds
				.map((id) => Number(id))
				.filter((id) => !isNaN(id) && id > 0),
		),
	)

	return useQuery<SpellData[]>({
		queryKey: ['spells', 'many', uniqueIds.sort((a, b) => a - b).join(',')],
		queryFn: async () => {
			if (uniqueIds.length === 0) {
				return []
			}

			const { fetchSirusAPI, SIRUS_API } = await import('@/lib/sirus-api')
			const url = SIRUS_API.spellTooltipMany(uniqueIds, 'ru')
			const response = await fetchSirusAPI(url)
			
			// API возвращает объект с полем data, содержащим массив
			const data = Array.isArray(response) ? response : (response?.data || [])
			
			// Убеждаемся, что возвращаем массив
			if (!Array.isArray(data)) {
				console.error('Spells API returned non-array:', response)
				return []
			}
			
			console.log(`Loaded ${data.length} spells for ${uniqueIds.length} IDs`)
			if (data.length > 0) {
				console.log('Sample spell:', data[0])
				const spellsWithIcons = data.filter((s: SpellData) => s.iconUrl && s.iconUrl.trim() !== '')
				console.log(`Spells with icons: ${spellsWithIcons.length} out of ${data.length}`)
				const spellsWithoutIcons = data.filter((s: SpellData) => !s.iconUrl || s.iconUrl.trim() === '')
				if (spellsWithoutIcons.length > 0) {
					console.log('Spells without icons:', spellsWithoutIcons.map((s: SpellData) => s.id).slice(0, 10))
				}
			}
			return data
		},
		staleTime: 3600000, // 1 hour
		enabled: uniqueIds.length > 0,
	})
}

export function useSpellNameMap (spellIds: Array<string | number>) {
	const { data: spells } = useSpellNames(spellIds)

	return useMemo(() => {
		const map = new Map<number, string>()
		if (spells) {
			for (const spell of spells) {
				map.set(spell.id, spell.name)
			}
		}
		return map
	}, [spells])
}

