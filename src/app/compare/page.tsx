'use client'

import React from 'react'
import { useCharacter } from '@/hooks/use-character'
import { CharacterCompareForm } from '@/components/character-compare-form'
import { CharacterCompareStats } from '@/components/character-compare-stats'
import { CharacterCompareEquipment } from '@/components/character-compare-equipment'
import { CharacterCompareTalents } from '@/components/character-compare-talents'
import { CharacterCompareSocketsEnhanced } from '@/components/character-compare-sockets-enhanced'
import { CharacterCompareHeader } from '@/components/character-compare-header'
import Link from 'next/link'

export default function ComparePage() {
	const [character1Name, setCharacter1Name] = React.useState<string>('')
	const [character2Name, setCharacter2Name] = React.useState<string>('')
	const [shouldCompare, setShouldCompare] = React.useState(false)

	const {
		character: character1,
		equipments: equipments1,
		classTalents: classTalents1,
		glyphs: glyphs1,
		talents: talents1,
		isLoading: isLoading1,
		isError: isError1,
	} = useCharacter(character1Name)

	const {
		character: character2,
		equipments: equipments2,
		classTalents: classTalents2,
		glyphs: glyphs2,
		talents: talents2,
		isLoading: isLoading2,
		isError: isError2,
	} = useCharacter(character2Name)

	const stats1 = character1?.stats
	const stats2 = character2?.stats

	const handleCompare = (name1: string, name2: string) => {
		setCharacter1Name(name1)
		setCharacter2Name(name2)
		setShouldCompare(true)
	}

	const isLoading = isLoading1 || isLoading2
	const hasError = isError1 || isError2
	const hasData = shouldCompare && character1 && character2

	return (
		<main className="mx-auto flex max-w-[1500px] flex-col gap-8 px-6 py-8">
			<Link
				href="/members"
				className="text-sm text-zinc-400 hover:text-zinc-200"
			>
				← Назад к составу гильдии
			</Link>

			<div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
				<h1 className="mb-6 text-2xl font-semibold text-zinc-100">
					Сравнение персонажей
				</h1>
				<CharacterCompareForm onCompare={handleCompare} />
			</div>

			{isLoading && (
				<div className="flex items-center justify-center py-12">
					<p className="text-lg text-zinc-300">
						Загрузка данных персонажей…
					</p>
				</div>
			)}

			{hasError && shouldCompare && (
				<div className="flex items-center justify-center py-12">
					<p className="text-lg text-red-500">
						Не удалось загрузить данные одного или обоих персонажей
					</p>
				</div>
			)}

			{hasData && (
				<>
					<CharacterCompareHeader
						character1={character1}
						character2={character2}
					/>

					<CharacterCompareStats
						stats1={stats1}
						stats2={stats2}
						character1Name={character1.name}
						character2Name={character2.name}
					/>

					<CharacterCompareEquipment
						equipments1={equipments1}
						equipments2={equipments2}
						character1Guid={character1.guid}
						character2Guid={character2.guid}
						character1Name={character1.name}
						character2Name={character2.name}
					/>

					<CharacterCompareSocketsEnhanced
						equipments1={equipments1}
						equipments2={equipments2}
						character1Guid={character1.guid}
						character2Guid={character2.guid}
						character1Name={character1.name}
						character2Name={character2.name}
						character1Class={character1.class}
						character2Class={character2.class}
					/>

					<CharacterCompareTalents
						classTalents1={classTalents1}
						classTalents2={classTalents2}
						glyphs1={glyphs1}
						glyphs2={glyphs2}
						talents1={talents1}
						talents2={talents2}
						character1Class={character1.class}
						character2Class={character2.class}
						character1Name={character1.name}
						character2Name={character2.name}
					/>
				</>
			)}
		</main>
	)
}
