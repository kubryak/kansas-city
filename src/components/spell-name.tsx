'use client'

import { useQuery } from '@tanstack/react-query'

interface SpellNameProps {
	spellId: string | number
	fallback?: string
}

interface SpellTooltipData {
	spell?: {
		name: string
		[id: string]: unknown
	}
	[id: string]: unknown
}

export function SpellName ({ spellId, fallback }: SpellNameProps) {
	const { data, isLoading } = useQuery<SpellTooltipData>({
		queryKey: ['spell', spellId],
		queryFn: async () => {
			try {
				const res = await fetch(`/api/tooltip/spell/${spellId}`)

				if (!res.ok) {
					return {}
				}

				return res.json()
			} catch {
				return {}
			}
		},
		staleTime: 3600000, // 1 hour
		enabled: !!spellId && spellId !== '0',
	})

	if (isLoading) {
		return <span>{fallback ?? `Заклинание ${spellId}`}</span>
	}

	// Пробуем разные варианты структуры ответа
	const spellName =
		data?.spell?.name ??
		(data as { name?: string })?.name ??
		fallback ??
		`Заклинание ${spellId}`

	return <span>{spellName}</span>
}

