'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { SafeImage } from '@/components/safe-image'
import { getSpecName, getSpecIcon, getClassColor } from '@/utils/character-meta'

interface RankSpell {
	spell_id: number
	class: number
	spec: number
	name: string
	range: {
		rangeID: number
		rangeMin: number
		rangeMinFriendly: number
		rangeMax: number
		rangeMaxFriendly: number
		name: string
	}
	description: string
	power_type: number
	power_cost: number | null
	power_cost_runes: number
	power_cost_percent: number | null
	power_cost_per_level: number
	power_per_second: number | null
	cast_time: number
	icon: string
	modifies: Array<{
		id: number
		name: string
		icon: string
	}>
}

interface Talent {
	id: number
	col: number
	row: number
	tab: number
	ranks: number[]
	rank_spells: RankSpell[]
	dependsOn: number
	dependsOnRank: number
	max_rank: number
}

interface ClassTalent {
	_id: number
	name: string
	order: number
	class: number
	background: string
	icon: string
	talents: Talent[]
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

interface CharacterTalent {
	guid: number
	spell: number
	talentGroup: number
}

interface CharacterCompareTalentsProps {
	classTalents1: ClassTalent[] | null
	classTalents2: ClassTalent[] | null
	glyphs1?: Glyph[] | null
	glyphs2?: Glyph[] | null
	talents1?: CharacterTalent[][] | null
	talents2?: CharacterTalent[][] | null
	character1Class: number
	character2Class: number
	character1Name: string
	character2Name: string
}

function getAbsoluteSirusImageUrl(relativePath: string): string {
	if (relativePath.startsWith('http')) {
		return relativePath
	}
	return `https://sirus.su${relativePath}`
}

function getGlyphIconUrl(iconName: string): string {
	return `https://cdn.scourge.tech/icons/${iconName}.png`
}

function GlyphTooltip({
	name,
	itemEntry,
	children,
}: {
	name: string
	itemEntry?: number
	children: React.ReactNode
}) {
	const [isHovered, setIsHovered] = React.useState(false)
	const [tooltipPosition, setTooltipPosition] = React.useState<{ top: number; left: number } | null>(null)
	const triggerRef = React.useRef<HTMLDivElement>(null)
	const { data: itemData, isLoading } = useQuery<{ item?: { spell_triggers?: Array<{ description?: string }> } }>({
		queryKey: ['item-tooltip', itemEntry],
		queryFn: async () => {
			if (!itemEntry) return {}
			try {
				const res = await fetch(`/api/tooltip/item/${itemEntry}`)
				if (!res.ok) return {}
				return res.json()
			} catch {
				return {}
			}
		},
		staleTime: 3600000,
		enabled: !!itemEntry && isHovered,
	})

	const description = itemData?.item?.spell_triggers?.[0]?.description || ''

	React.useEffect(() => {
		if (isHovered && triggerRef.current) {
			const updatePosition = () => {
				if (!triggerRef.current) return

				const rect = triggerRef.current.getBoundingClientRect()
				const spacing = 20
				const tooltipWidth = 280

				// Позиционируем tooltip слева от иконки символа
				let left = rect.left - tooltipWidth - spacing
				// Выравниваем tooltip по вертикали с центром иконки
				let top = rect.top + rect.height / 2

				// Проверяем, не выходит ли tooltip за левый край
				if (left < spacing) {
					// Если не помещается слева, показываем справа от иконки
					left = rect.right + spacing
				}

				// Проверяем, не выходит ли tooltip за правый край
				if (left + tooltipWidth > window.innerWidth - spacing) {
					left = window.innerWidth - tooltipWidth - spacing
				}

				setTooltipPosition({ top, left })
			}

			updatePosition()

			// Обновляем позицию после рендера tooltip
			const timeoutId = setTimeout(updatePosition, 0)
			return () => clearTimeout(timeoutId)
		} else {
			setTooltipPosition(null)
		}
	}, [isHovered])

	return (
		<>
			<div
				ref={triggerRef}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				{children}
			</div>
			{isHovered && tooltipPosition && (
				<div
					className="fixed z-50 w-[280px] max-h-[80vh] overflow-y-auto rounded-lg border border-zinc-600 bg-zinc-800 p-3 shadow-lg"
					style={{
						top: `${tooltipPosition.top}px`,
						left: `${tooltipPosition.left}px`,
						transform: 'translateY(-50%)',
					}}
					onMouseEnter={() => setIsHovered(true)}
					onMouseLeave={() => setIsHovered(false)}
				>
					<div className="mb-2 text-sm font-semibold text-yellow-400">
						{name}
					</div>
					{description && !isLoading && (
						<div className="text-xs text-zinc-300 leading-relaxed">
							{description.replace(/<br\s*\/?>/gi, ' ')}
						</div>
					)}
					{isLoading && (
						<div className="text-xs text-zinc-500">Загрузка...</div>
					)}
				</div>
			)}
		</>
	)
}

function getLearnedTalents(
	classTalents: ClassTalent[],
	characterTalents: CharacterTalent[][] | null | undefined,
	talentGroup: number,
): Map<number, number> {
	const learnedMap = new Map<number, number>()

	if (!characterTalents || !characterTalents[talentGroup]) {
		return learnedMap
	}

	const groupTalents = characterTalents[talentGroup]

	classTalents.forEach((talentTab) => {
		talentTab.talents.forEach((talent) => {
			talent.rank_spells.forEach((rankSpell) => {
				const learnedTalent = groupTalents.find((ct) => ct.spell === rankSpell.spell_id)
				if (learnedTalent) {
					const rankInRanks = talent.ranks.indexOf(rankSpell.spell_id)
					if (rankInRanks !== -1) {
						const currentRank = learnedMap.get(talent.id) || 0
						learnedMap.set(talent.id, Math.max(currentRank, rankInRanks + 1))
					}
				}
			})
		})
	})

	return learnedMap
}

function getBranchPoints(
	classTalents: ClassTalent[],
	learnedTalents: Map<number, number>,
): Array<{ order: number; name: string; points: number }> {
	return classTalents.map((talentTab) => {
		const points = talentTab.talents.reduce((sum, talent) => {
			const rank = learnedTalents.get(talent.id) || 0
			return sum + rank
		}, 0)
		return {
			order: talentTab.order,
			name: talentTab.name,
			points,
		}
	})
}

function TalentTooltip({
	name,
	description,
	learnedRank,
	maxRank,
	children,
}: {
	name: string
	description: string
	learnedRank?: number
	maxRank?: number
	children: React.ReactNode
}) {
	const [isHovered, setIsHovered] = React.useState(false)
	const [tooltipPosition, setTooltipPosition] = React.useState<{ top: number; left: number } | null>(null)
	const triggerRef = React.useRef<HTMLDivElement>(null)

	React.useEffect(() => {
		if (isHovered && triggerRef.current) {
			const updatePosition = () => {
				if (!triggerRef.current) return

				const rect = triggerRef.current.getBoundingClientRect()
				const spacing = 8
				const tooltipWidth = 280

				let left = rect.right + spacing
				let top = rect.top

				if (left + tooltipWidth > window.innerWidth - spacing) {
					left = rect.left - tooltipWidth - spacing
				}

				if (left < spacing) {
					left = spacing
				}

				setTooltipPosition({ top, left })
			}

			updatePosition()
			const timeoutId = setTimeout(updatePosition, 0)
			return () => clearTimeout(timeoutId)
		} else {
			setTooltipPosition(null)
		}
	}, [isHovered])

	return (
		<>
			<div
				ref={triggerRef}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				{children}
			</div>
			{isHovered && tooltipPosition && (
				<div
					className="fixed z-50 w-[280px] max-h-[80vh] overflow-y-auto rounded-lg border border-zinc-600 bg-zinc-800 p-3 shadow-lg"
					style={{
						top: `${tooltipPosition.top}px`,
						left: `${tooltipPosition.left}px`,
						transform: 'translateY(-100%)',
					}}
					onMouseEnter={() => setIsHovered(true)}
					onMouseLeave={() => setIsHovered(false)}
				>
					<div className="mb-2 flex items-center justify-between text-sm font-semibold text-yellow-400">
						<span>{name}</span>
						{maxRank !== undefined && (
							<span className="text-zinc-400">
								{learnedRank || 0}/{maxRank}
							</span>
						)}
					</div>
					<div className="text-xs text-zinc-300 leading-relaxed">
						{description.replace(/<br\s*\/?>/gi, ' ')}
					</div>
				</div>
			)}
		</>
	)
}

export function CharacterCompareTalents({
	classTalents1,
	classTalents2,
	glyphs1,
	glyphs2,
	talents1,
	talents2,
	character1Class,
	character2Class,
	character1Name,
	character2Name,
}: CharacterCompareTalentsProps) {
	const [isExpanded, setIsExpanded] = React.useState(true)
	const [selectedTalentGroup1, setSelectedTalentGroup1] = React.useState(0)
	const [selectedTalentGroup2, setSelectedTalentGroup2] = React.useState(0)

	if ((!classTalents1 || classTalents1.length === 0) && (!classTalents2 || classTalents2.length === 0)) {
		return null
	}

	const talentGroupsCount1 = talents1?.length || 1
	const talentGroupsCount2 = talents2?.length || 1

	const sortedTalents1 = classTalents1 ? [...classTalents1].sort((a, b) => a.order - b.order) : []
	const sortedTalents2 = classTalents2 ? [...classTalents2].sort((a, b) => a.order - b.order) : []

	const learnedTalents1 = classTalents1
		? getLearnedTalents(classTalents1, talents1, selectedTalentGroup1)
		: new Map<number, number>()
	const learnedTalents2 = classTalents2
		? getLearnedTalents(classTalents2, talents2, selectedTalentGroup2)
		: new Map<number, number>()

	const branchPoints1 = getBranchPoints(sortedTalents1, learnedTalents1)
	const branchPoints2 = getBranchPoints(sortedTalents2, learnedTalents2)

	const getSpecForTalentGroup = (
		classTalents: ClassTalent[],
		branchPoints: Array<{ order: number; name: string; points: number }>,
		characterClass: number,
		talentGroup: number,
	): { spec: number; name: string; icon: string | null; branchPoints: Array<{ order: number; name: string; points: number }> } => {
		if (!characterClass || !classTalents || classTalents.length === 0) {
			return { spec: 0, name: `Специализация ${talentGroup + 1}`, icon: null, branchPoints: [] }
		}

		// Находим ветку с максимальным количеством очков
		let maxPoints = -1
		let maxOrder = 0
		branchPoints.forEach((branch) => {
			if (branch.points > maxPoints) {
				maxPoints = branch.points
				maxOrder = branch.order
			}
		})

		// Если нет вложенных очков, используем первую ветку по умолчанию
		if (maxPoints === 0) {
			maxOrder = classTalents[0]?.order ?? 0
		}

		const specName = getSpecName(characterClass, maxOrder)
		const specIcon = getSpecIcon(characterClass, maxOrder)

		return { spec: maxOrder, name: specName, icon: specIcon, branchPoints }
	}

	const getGlyphsByType = (glyphs: Glyph[] | null | undefined, type: number, talentGroup: number) => {
		if (!glyphs) return []
		return glyphs
			.filter((g) => g.glyphData.type === type && g.talentGroup === talentGroup)
			.sort((a, b) => a.glyphSlot - b.glyphSlot)
			.slice(0, 3)
	}

	return (
		<section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className="mb-6 flex w-full items-center justify-between text-xl font-semibold text-zinc-100 hover:text-zinc-200 transition-colors"
			>
				<span>Сравнение талантов</span>
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
					{/* Переключатели специализаций */}
					{(talentGroupsCount1 > 1 || talentGroupsCount2 > 1) && (
						<div className="mb-6 grid grid-cols-2 gap-6">
							{/* Блок первого персонажа */}
							<div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
								<div className={`mb-3 text-[18px] font-semibold ${getClassColor(character1Class)}`}>
									{character1Name}
								</div>
								{talentGroupsCount1 > 1 ? (
									<div className="flex gap-2">
										{Array.from({ length: talentGroupsCount1 }).map((_, index) => {
											// Получаем информацию о спеке для этой группы талантов
											const learnedTalentsForGroup = classTalents1
												? getLearnedTalents(classTalents1, talents1, index)
												: new Map<number, number>()
											const branchPointsForGroup = getBranchPoints(sortedTalents1, learnedTalentsForGroup)
											const specInfo = getSpecForTalentGroup(
												classTalents1 || [],
												branchPointsForGroup,
												character1Class,
												index,
											)
											return (
												<button
													key={index}
													onClick={() => setSelectedTalentGroup1(index)}
													className={`flex items-center gap-2 px-3 py-1 rounded border transition-all ${
														selectedTalentGroup1 === index
															? 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
															: 'border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600'
													}`}
												>
													{specInfo.icon && (
														<SafeImage
															src={specInfo.icon}
															alt={specInfo.name}
															className="h-[46px] w-[46px] rounded border border-zinc-600"
														/>
													)}
													<span className="text-[14px]">{specInfo.name}</span>
												</button>
											)
										})}
									</div>
								) : (
									<div className="text-sm text-zinc-500">Одна специализация</div>
								)}
							</div>
							{/* Блок второго персонажа */}
							<div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
								<div className={`mb-3 text-[18px] font-semibold ${getClassColor(character2Class)}`}>
									{character2Name}
								</div>
								{talentGroupsCount2 > 1 ? (
									<div className="flex gap-2">
										{Array.from({ length: talentGroupsCount2 }).map((_, index) => {
											// Получаем информацию о спеке для этой группы талантов
											const learnedTalentsForGroup = classTalents2
												? getLearnedTalents(classTalents2, talents2, index)
												: new Map<number, number>()
											const branchPointsForGroup = getBranchPoints(sortedTalents2, learnedTalentsForGroup)
											const specInfo = getSpecForTalentGroup(
												classTalents2 || [],
												branchPointsForGroup,
												character2Class,
												index,
											)
											return (
												<button
													key={index}
													onClick={() => setSelectedTalentGroup2(index)}
													className={`flex items-center gap-2 px-3 py-1 rounded border transition-all ${
														selectedTalentGroup2 === index
															? 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
															: 'border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600'
													}`}
												>
													{specInfo.icon && (
														<SafeImage
															src={specInfo.icon}
															alt={specInfo.name}
															className="h-[46px] w-[46px] rounded border border-zinc-600"
														/>
													)}
													<span className="text-[14px]">{specInfo.name}</span>
												</button>
											)
										})}
									</div>
								) : (
									<div className="text-sm text-zinc-500">Одна специализация</div>
								)}
							</div>
						</div>
					)}

					{/* Очки по веткам талантов */}
					<div className="mb-6 grid grid-cols-2 gap-6">
						{/* Блок первого персонажа */}
						<div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
							<div className="mb-3 text-sm font-semibold text-zinc-300">
								Очки по веткам талантов — <span className={`text-[18px] ${getClassColor(character1Class)}`}>{character1Name}</span>
							</div>
							<div className="space-y-2">
								{Array.from({ length: Math.max(branchPoints1.length, branchPoints2.length) }).map((_, index) => {
									const branch1 = branchPoints1[index]
									const branch2 = branchPoints2[index]
									const points1 = branch1?.points || 0
									const points2 = branch2?.points || 0
									const diff = points1 - points2
									const hasDiff = diff !== 0

									return (
										<div
											key={index}
											className={`rounded px-3 py-2 ${
												hasDiff ? 'bg-zinc-700/30' : ''
											}`}
										>
											<div className="flex items-center justify-between">
												<div className="text-sm text-zinc-400">
													{branch1?.name || branch2?.name || `Ветка ${index + 1}`}
												</div>
												<div className="text-sm font-medium text-zinc-200">
													{points1} очков
													{hasDiff && (
														<span
															className={`ml-2 text-xs ${
																diff > 0 ? 'text-green-400' : 'text-red-400'
															}`}
														>
															({diff > 0 ? '+' : ''}{diff})
														</span>
													)}
												</div>
											</div>
										</div>
									)
								})}
							</div>
						</div>
						{/* Блок второго персонажа */}
						<div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
							<div className="mb-3 text-sm font-semibold text-zinc-300">
								Очки по веткам талантов — <span className={`text-[18px] ${getClassColor(character2Class)}`}>{character2Name}</span>
							</div>
							<div className="space-y-2">
								{Array.from({ length: Math.max(branchPoints1.length, branchPoints2.length) }).map((_, index) => {
									const branch1 = branchPoints1[index]
									const branch2 = branchPoints2[index]
									const points1 = branch1?.points || 0
									const points2 = branch2?.points || 0
									const diff = points1 - points2
									const hasDiff = diff !== 0

									return (
										<div
											key={index}
											className={`rounded px-3 py-2 ${
												hasDiff ? 'bg-zinc-700/30' : ''
											}`}
										>
											<div className="flex items-center justify-between">
												<div className="text-sm text-zinc-400">
													{branch1?.name || branch2?.name || `Ветка ${index + 1}`}
												</div>
												<div className="text-sm font-medium text-zinc-200">
													{points2} очков
													{hasDiff && (
														<span
															className={`ml-2 text-xs ${
																diff < 0 ? 'text-green-400' : 'text-red-400'
															}`}
														>
															({diff < 0 ? '+' : '-'}{Math.abs(diff)})
														</span>
													)}
												</div>
											</div>
										</div>
									)
								})}
							</div>
						</div>
					</div>

					{/* Сравнение талантов по веткам */}
					<div className="grid grid-cols-2 gap-6">
						{/* Блок первого персонажа */}
						<div className="space-y-6">
							{Array.from({ length: Math.max(sortedTalents1.length, sortedTalents2.length) }).map((_, tabIndex) => {
								const talentTab1 = sortedTalents1[tabIndex]

								if (!talentTab1) return null

								const maxCol1 = Math.max(...talentTab1.talents.map((t) => t.col), 0)
								const maxRow1 = Math.max(...talentTab1.talents.map((t) => t.row), 0)
								const gridCols1 = maxCol1 + 1
								const gridRows1 = maxRow1 + 1

								return (
									<div key={tabIndex} className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
										<div className="mb-4 flex items-center gap-3">
											{talentTab1.icon && (
												<SafeImage
													src={getAbsoluteSirusImageUrl(talentTab1.icon)}
													alt={talentTab1.name}
													className="h-8 w-8 rounded"
												/>
											)}
											<h3 className="text-base font-semibold text-zinc-200">
												{talentTab1.name}
											</h3>
											<span className="text-sm text-zinc-400">
												({branchPoints1[tabIndex]?.points || 0} очков)
											</span>
										</div>
										<div className="relative rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
											{talentTab1.background && (
												<div className="absolute inset-0 overflow-hidden rounded-lg opacity-20">
													<SafeImage
														src={getAbsoluteSirusImageUrl(talentTab1.background)}
														alt=""
														className="h-full w-full object-cover"
													/>
												</div>
											)}
											<div className="relative z-10 flex justify-center">
												<div
													className="grid place-items-center gap-4"
													style={{
														gridTemplateColumns: `repeat(${gridCols1}, 48px)`,
														gridTemplateRows: `repeat(${gridRows1}, 48px)`,
													}}
												>
													{Array.from({ length: gridRows1 * gridCols1 }).map((_, index) => {
														const row = Math.floor(index / gridCols1)
														const col = index % gridCols1
														const talent = talentTab1.talents.find(
															(t) => t.row === row && t.col === col,
														)

														if (!talent) {
															return <div key={`empty-${row}-${col}`} className="aspect-square" />
														}

														const learnedRank = learnedTalents1.get(talent.id) || 0
														const isLearned = learnedRank > 0
														const displayRank = isLearned ? learnedRank : 1
														const displaySpell =
															talent.rank_spells[displayRank - 1] || talent.rank_spells[0]
														const icon = displaySpell?.icon || ''

														// Проверяем различия
														const talentTab2 = sortedTalents2[tabIndex]
														const talent2 = talentTab2?.talents.find((t) => t.id === talent.id)
														const learnedRank2 = talent2 ? learnedTalents2.get(talent2.id) || 0 : 0
														const hasDiff = learnedRank !== learnedRank2

														return (
															<div
																key={talent.id}
																className="relative flex items-center justify-center"
																style={{
																	gridColumn: col + 1,
																	gridRow: row + 1,
																}}
															>
																<TalentTooltip
																	name={displaySpell?.name || `Талант ${talent.id}`}
																	description={displaySpell?.description || ''}
																	learnedRank={learnedRank}
																	maxRank={talent.max_rank}
																>
																	<div
																		className={`relative z-10 flex h-[48px] w-[48px] items-center justify-center rounded border-2 box-border transition-all ${
																			hasDiff
																				? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-800 animate-pulse-ring'
																				: ''
																		} ${
																			isLearned
																				? learnedRank === talent.max_rank
																					? 'border-yellow-500/50 bg-zinc-800/80'
																					: 'border-green-500/50 bg-zinc-800/80'
																				: 'border-zinc-600/30 bg-zinc-900/50'
																		}`}
																	>
																		{icon && (
																			<SafeImage
																				src={getAbsoluteSirusImageUrl(icon)}
																				alt={displaySpell?.name || ''}
																				className={`h-full w-full rounded ${!isLearned ? 'grayscale' : ''}`}
																			/>
																		)}
																		{talent.max_rank > 1 && (
																			<div
																				className={`absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-zinc-600 bg-zinc-900 text-[9px] font-semibold ${
																					isLearned
																						? learnedRank === talent.max_rank
																							? 'text-yellow-400'
																							: 'text-green-400'
																						: 'text-zinc-300'
																				}`}
																			>
																				{isLearned ? learnedRank : talent.max_rank}
																			</div>
																		)}
																		{talent.max_rank === 1 && (
																			<div
																				className={`absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-zinc-600 bg-zinc-900 text-[9px] font-semibold ${
																					isLearned
																						? learnedRank === talent.max_rank
																							? 'text-yellow-400'
																							: 'text-green-400'
																						: 'text-zinc-300'
																				}`}
																			>
																				1
																			</div>
																		)}
																	</div>
																</TalentTooltip>
															</div>
														)
													})}
												</div>
											</div>
										</div>
									</div>
								)
							})}
						</div>

						{/* Блок второго персонажа */}
						<div className="space-y-6">
							{Array.from({ length: Math.max(sortedTalents1.length, sortedTalents2.length) }).map((_, tabIndex) => {
								const talentTab2 = sortedTalents2[tabIndex]

								if (!talentTab2) return null

								const maxCol2 = Math.max(...talentTab2.talents.map((t) => t.col), 0)
								const maxRow2 = Math.max(...talentTab2.talents.map((t) => t.row), 0)
								const gridCols2 = maxCol2 + 1
								const gridRows2 = maxRow2 + 1

								return (
									<div key={tabIndex} className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
										<div className="mb-4 flex items-center gap-3">
											{talentTab2.icon && (
												<SafeImage
													src={getAbsoluteSirusImageUrl(talentTab2.icon)}
													alt={talentTab2.name}
													className="h-8 w-8 rounded"
												/>
											)}
											<h3 className="text-base font-semibold text-zinc-200">
												{talentTab2.name}
											</h3>
											<span className="text-sm text-zinc-400">
												({branchPoints2[tabIndex]?.points || 0} очков)
											</span>
										</div>
										<div className="relative rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
											{talentTab2.background && (
												<div className="absolute inset-0 overflow-hidden rounded-lg opacity-20">
													<SafeImage
														src={getAbsoluteSirusImageUrl(talentTab2.background)}
														alt=""
														className="h-full w-full object-cover"
													/>
												</div>
											)}
											<div className="relative z-10 flex justify-center">
												<div
													className="grid place-items-center gap-4"
													style={{
														gridTemplateColumns: `repeat(${gridCols2}, 48px)`,
														gridTemplateRows: `repeat(${gridRows2}, 48px)`,
													}}
												>
													{Array.from({ length: gridRows2 * gridCols2 }).map((_, index) => {
														const row = Math.floor(index / gridCols2)
														const col = index % gridCols2
														const talent = talentTab2.talents.find(
															(t) => t.row === row && t.col === col,
														)

														if (!talent) {
															return <div key={`empty-${row}-${col}`} className="aspect-square" />
														}

														const learnedRank = learnedTalents2.get(talent.id) || 0
														const isLearned = learnedRank > 0
														const displayRank = isLearned ? learnedRank : 1
														const displaySpell =
															talent.rank_spells[displayRank - 1] || talent.rank_spells[0]
														const icon = displaySpell?.icon || ''

														// Проверяем различия
														const talentTab1 = sortedTalents1[tabIndex]
														const talent1 = talentTab1?.talents.find((t) => t.id === talent.id)
														const learnedRank1 = talent1 ? learnedTalents1.get(talent1.id) || 0 : 0
														const hasDiff = learnedRank !== learnedRank1

														return (
															<div
																key={talent.id}
																className="relative flex items-center justify-center"
																style={{
																	gridColumn: col + 1,
																	gridRow: row + 1,
																}}
															>
																<TalentTooltip
																	name={displaySpell?.name || `Талант ${talent.id}`}
																	description={displaySpell?.description || ''}
																	learnedRank={learnedRank}
																	maxRank={talent.max_rank}
																>
																	<div
																		className={`relative z-10 flex h-[48px] w-[48px] items-center justify-center rounded border-2 box-border transition-all ${
																			hasDiff
																				? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-800 animate-pulse-ring'
																				: ''
																		} ${
																			isLearned
																				? learnedRank === talent.max_rank
																					? 'border-yellow-500/50 bg-zinc-800/80'
																					: 'border-green-500/50 bg-zinc-800/80'
																				: 'border-zinc-600/30 bg-zinc-900/50'
																		}`}
																	>
																		{icon && (
																			<SafeImage
																				src={getAbsoluteSirusImageUrl(icon)}
																				alt={displaySpell?.name || ''}
																				className={`h-full w-full rounded ${!isLearned ? 'grayscale' : ''}`}
																			/>
																		)}
																		{talent.max_rank > 1 && (
																			<div
																				className={`absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-zinc-600 bg-zinc-900 text-[9px] font-semibold ${
																					isLearned
																						? learnedRank === talent.max_rank
																							? 'text-yellow-400'
																							: 'text-green-400'
																						: 'text-zinc-300'
																				}`}
																			>
																				{isLearned ? learnedRank : talent.max_rank}
																			</div>
																		)}
																		{talent.max_rank === 1 && (
																			<div
																				className={`absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-zinc-600 bg-zinc-900 text-[9px] font-semibold ${
																					isLearned
																						? learnedRank === talent.max_rank
																							? 'text-yellow-400'
																							: 'text-green-400'
																						: 'text-zinc-300'
																				}`}
																			>
																				1
																			</div>
																		)}
																	</div>
																</TalentTooltip>
															</div>
														)
													})}
												</div>
											</div>
										</div>
									</div>
								)
							})}
						</div>
					</div>

					{/* Сравнение символов */}
					{(glyphs1 || glyphs2) && (() => {
						// Функция для проверки, есть ли символ у другого персонажа
						const hasGlyphInOther = (
							glyphId: number | undefined,
							otherGlyphs: Glyph[] | null | undefined,
							type: number,
							talentGroup: number,
						): boolean => {
							if (!glyphId || !otherGlyphs) return false
							const otherGlyphsOfType = getGlyphsByType(otherGlyphs, type, talentGroup)
							return otherGlyphsOfType.some((g) => g.glyphData.glyph_id === glyphId)
						}

						return (
							<div className="mt-6 grid grid-cols-2 gap-6">
								{/* Блок первого персонажа */}
								<div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
									<div className={`mb-4 text-sm font-semibold`}>
										Символы - <span className={`text-[18px] ${getClassColor(character1Class)}`}>{character1Name}</span>
									</div>
									<div className="space-y-4">
										<div>
											<div className="mb-2 text-xs font-semibold text-zinc-500">
												Большие символы
											</div>
											<div className="flex flex-col gap-2">
												{Array.from({ length: 3 }).map((_, glyphIndex) => {
													const majorGlyphs = getGlyphsByType(glyphs1, 1, selectedTalentGroup1)
													const glyph = majorGlyphs[glyphIndex]
													const hasInOther = hasGlyphInOther(
														glyph?.glyphData.glyph_id,
														glyphs2,
														1,
														selectedTalentGroup2,
													)
													const hasDiff = glyph && !hasInOther
													return (
														<div
															key={`major-${glyphIndex}`}
															className={`flex h-[48px] items-center gap-2 rounded border px-2 ${
																hasDiff
																	? 'border-blue-500 bg-blue-500/10'
																	: 'border-zinc-700 bg-zinc-900/50'
															}`}
														>
															{glyph ? (
																<>
																	<GlyphTooltip
																		name={glyph.glyphData.glyph_name}
																		itemEntry={glyph.glyphData.glyph_item_entry}
																	>
																		<SafeImage
																			src={getGlyphIconUrl(glyph.glyphData.glyph_icon)}
																			alt={glyph.glyphData.glyph_name}
																			className="h-8 w-8 rounded flex-shrink-0 cursor-pointer"
																		/>
																	</GlyphTooltip>
																	<span className="text-xs text-zinc-300 line-clamp-1">
																		{glyph.glyphData.glyph_name}
																	</span>
																</>
															) : (
																<span className="text-xs text-zinc-600">Пусто</span>
															)}
														</div>
													)
												})}
											</div>
										</div>
										<div>
											<div className="mb-2 text-xs font-semibold text-zinc-500">
												Малые символы
											</div>
											<div className="flex flex-col gap-2">
												{Array.from({ length: 3 }).map((_, glyphIndex) => {
													const minorGlyphs = getGlyphsByType(glyphs1, 2, selectedTalentGroup1)
													const glyph = minorGlyphs[glyphIndex]
													const hasInOther = hasGlyphInOther(
														glyph?.glyphData.glyph_id,
														glyphs2,
														2,
														selectedTalentGroup2,
													)
													const hasDiff = glyph && !hasInOther
													return (
														<div
															key={`minor-${glyphIndex}`}
															className={`flex h-[48px] items-center gap-2 rounded border px-2 ${
																hasDiff
																	? 'border-blue-500 bg-blue-500/10'
																	: 'border-zinc-700 bg-zinc-900/50'
															}`}
														>
															{glyph ? (
																<>
																	<GlyphTooltip
																		name={glyph.glyphData.glyph_name}
																		itemEntry={glyph.glyphData.glyph_item_entry}
																	>
																		<SafeImage
																			src={getGlyphIconUrl(glyph.glyphData.glyph_icon)}
																			alt={glyph.glyphData.glyph_name}
																			className="h-8 w-8 rounded flex-shrink-0 cursor-pointer"
																		/>
																	</GlyphTooltip>
																	<span className="text-xs text-zinc-300 line-clamp-1">
																		{glyph.glyphData.glyph_name}
																	</span>
																</>
															) : (
																<span className="text-xs text-zinc-600">Пусто</span>
															)}
														</div>
													)
												})}
											</div>
										</div>
									</div>
								</div>
								{/* Блок второго персонажа */}
								<div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
									<div className={`mb-4 text-sm font-semibold`}>
										Символы - <span className={`text-[18px] ${getClassColor(character2Class)}`}>{character2Name}</span>
									</div>
									<div className="space-y-4">
										<div>
											<div className="mb-2 text-xs font-semibold text-zinc-500">
												Большие символы
											</div>
											<div className="flex flex-col gap-2">
												{Array.from({ length: 3 }).map((_, glyphIndex) => {
													const majorGlyphs = getGlyphsByType(glyphs2, 1, selectedTalentGroup2)
													const glyph = majorGlyphs[glyphIndex]
													const hasInOther = hasGlyphInOther(
														glyph?.glyphData.glyph_id,
														glyphs1,
														1,
														selectedTalentGroup1,
													)
													const hasDiff = glyph && !hasInOther
													return (
														<div
															key={`major-${glyphIndex}`}
															className={`flex h-[48px] items-center gap-2 rounded border px-2 ${
																hasDiff
																	? 'border-blue-500 bg-blue-500/10'
																	: 'border-zinc-700 bg-zinc-900/50'
															}`}
														>
															{glyph ? (
																<>
																	<GlyphTooltip
																		name={glyph.glyphData.glyph_name}
																		itemEntry={glyph.glyphData.glyph_item_entry}
																	>
																		<SafeImage
																			src={getGlyphIconUrl(glyph.glyphData.glyph_icon)}
																			alt={glyph.glyphData.glyph_name}
																			className="h-8 w-8 rounded flex-shrink-0 cursor-pointer"
																		/>
																	</GlyphTooltip>
																	<span className="text-xs text-zinc-300 line-clamp-1">
																		{glyph.glyphData.glyph_name}
																	</span>
																</>
															) : (
																<span className="text-xs text-zinc-600">Пусто</span>
															)}
														</div>
													)
												})}
											</div>
										</div>
										<div>
											<div className="mb-2 text-xs font-semibold text-zinc-500">
												Малые символы
											</div>
											<div className="flex flex-col gap-2">
												{Array.from({ length: 3 }).map((_, glyphIndex) => {
													const minorGlyphs = getGlyphsByType(glyphs2, 2, selectedTalentGroup2)
													const glyph = minorGlyphs[glyphIndex]
													const hasInOther = hasGlyphInOther(
														glyph?.glyphData.glyph_id,
														glyphs1,
														2,
														selectedTalentGroup1,
													)
													const hasDiff = glyph && !hasInOther
													return (
														<div
															key={`minor-${glyphIndex}`}
															className={`flex h-[48px] items-center gap-2 rounded border px-2 ${
																hasDiff
																	? 'border-blue-500 bg-blue-500/10'
																	: 'border-zinc-700 bg-zinc-900/50'
															}`}
														>
															{glyph ? (
																<>
																	<GlyphTooltip
																		name={glyph.glyphData.glyph_name}
																		itemEntry={glyph.glyphData.glyph_item_entry}
																	>
																		<SafeImage
																			src={getGlyphIconUrl(glyph.glyphData.glyph_icon)}
																			alt={glyph.glyphData.glyph_name}
																			className="h-8 w-8 rounded flex-shrink-0 cursor-pointer"
																		/>
																	</GlyphTooltip>
																	<span className="text-xs text-zinc-300 line-clamp-1">
																		{glyph.glyphData.glyph_name}
																	</span>
																</>
															) : (
																<span className="text-xs text-zinc-600">Пусто</span>
															)}
														</div>
													)
												})}
											</div>
										</div>
									</div>
								</div>
							</div>
						)
					})()}
				</>
			)}
		</section>
	)
}

