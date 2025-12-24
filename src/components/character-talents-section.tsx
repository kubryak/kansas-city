'use client'

import React from 'react'
import { TalentTree } from '@/components/talent-tree'

interface CharacterTalentsSectionProps {
	classTalents: any[]
	glyphs?: any[] | null
	characterTalents?: any[][] | null
	characterClass: number
}

export function CharacterTalentsSection ({
	classTalents,
	glyphs,
	characterTalents,
	characterClass,
}: CharacterTalentsSectionProps) {
	if (!classTalents || classTalents.length === 0) {
		return null
	}

	return (
		<section className='rounded-xl border border-zinc-800 bg-zinc-900/80 p-6'>
			<TalentTree
				classTalents={classTalents}
				glyphs={glyphs}
				characterTalents={characterTalents}
				characterClass={characterClass}
			/>
		</section>
	)
}


