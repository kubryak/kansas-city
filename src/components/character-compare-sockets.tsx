'use client'

import React from 'react'
import { CharacterSocketsSummary } from '@/components/character-sockets-summary'

type EquipmentItem = {
	key?: string
	entry?: number
	icon?: string
	name?: string
	item_instance?: unknown
	quality?: number
}

interface CharacterCompareSocketsProps {
	equipments1: EquipmentItem[] | null | undefined
	equipments2: EquipmentItem[] | null | undefined
	character1Guid: number
	character2Guid: number
	character1Name: string
	character2Name: string
}

export function CharacterCompareSockets({
	equipments1,
	equipments2,
	character1Guid,
	character2Guid,
	character1Name,
	character2Name,
}: CharacterCompareSocketsProps) {
	const [isExpanded, setIsExpanded] = React.useState(true)

	if ((!equipments1 || equipments1.length === 0) && (!equipments2 || equipments2.length === 0)) {
		return null
	}

	return (
		<section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className="mb-6 flex w-full items-center justify-between text-xl font-semibold text-zinc-100 hover:text-zinc-200 transition-colors"
			>
				<span>Сравнение сокетов и комплектов</span>
				<svg
					className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			</button>
			{isExpanded && (
				<>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div>
					<h3 className="mb-4 text-lg font-medium text-zinc-300">
						{character1Name}
					</h3>
					<CharacterSocketsSummary
						characterGuid={character1Guid}
						equipments={equipments1}
					/>
				</div>
				<div>
					<h3 className="mb-4 text-lg font-medium text-zinc-300">
						{character2Name}
					</h3>
					<CharacterSocketsSummary
						characterGuid={character2Guid}
						equipments={equipments2}
					/>
				</div>
			</div>
				</>
			)}
		</section>
	)
}

