'use client'

import React from 'react'
import { CharacterEquipmentPaperdoll } from '@/components/character-equipment-paperdoll'
import { CharacterStats } from '@/components/character-stats'
import { CharacterSocketsSummary } from '@/components/character-sockets-summary'

interface EquipmentItem {
	key?: string
	entry?: number
	icon?: string
	name?: string
	item_instance?: unknown
	quality?: number
}

interface CharacterEquipmentSectionProps {
	equipments: Array<EquipmentItem> | null | undefined
	characterGuid: number
	stats: unknown
}

export function CharacterEquipmentSection ({
	equipments,
	characterGuid,
	stats,
}: CharacterEquipmentSectionProps) {
	if (!equipments || equipments.length === 0) {
		return null
	}

	return (
		<section className='flex-1 rounded-xl border border-zinc-800 bg-zinc-900/80 p-6'>
			<div className='mb-4 flex items-center justify-between gap-4'>
				<h2 className='text-lg font-semibold text-zinc-100'>
					Экипировка
				</h2>
				<h2 className='text-lg font-semibold text-zinc-100'>
					Сокеты и комплекты
				</h2>
			</div>
			<div className='flex gap-6 items-start justify-start'>
				<CharacterEquipmentPaperdoll
					equipments={equipments}
					characterGuid={characterGuid}
					statsNode={<CharacterStats stats={stats as any} />}
				/>

				<CharacterSocketsSummary
					characterGuid={characterGuid}
					equipments={equipments}
				/>
			</div>
		</section>
	)
}


