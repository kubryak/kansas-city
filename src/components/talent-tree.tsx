'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SafeImage } from './safe-image'

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

interface TalentTreeProps {
	classTalents: ClassTalent[]
	glyphs?: Glyph[] | null
	characterTalents?: CharacterTalent[][] | null
	characterClass?: number
}

function getAbsoluteSirusImageUrl (relativePath: string): string {
	if (relativePath.startsWith('http')) {
		return relativePath
	}
	return `https://sirus.su${relativePath}`
}

function getGlyphIconUrl (iconName: string): string {
	return `https://cdn.scourge.tech/icons/${iconName}.png`
}

interface TalentTooltipProps {
	name: string
	description: string
	learnedRank?: number
	maxRank?: number
	children: React.ReactNode
}

interface GlyphTooltipProps {
	name: string
	itemEntry?: number
	children: React.ReactNode
}

function TalentTooltip ({ name, description, learnedRank, maxRank, children }: TalentTooltipProps) {
	const [isHovered, setIsHovered] = useState(false)
	const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null)
	const triggerRef = useRef<HTMLDivElement>(null)
	const tooltipRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (isHovered && triggerRef.current) {
			const updatePosition = () => {
				if (!triggerRef.current) return

				const rect = triggerRef.current.getBoundingClientRect()
				const spacing = 8
				const tooltipWidth = 280

				// Позиционируем tooltip так, чтобы его левый нижний угол был рядом с верхним правым углом таланта
				let left = rect.right + spacing
				// Используем transform для позиционирования снизу вверх
				// top будет установлен на верхний край таланта, а transform переместит tooltip вверх
				let top = rect.top

				// Проверяем, не выходит ли tooltip за правый край
				if (left + tooltipWidth > window.innerWidth - spacing) {
					// Если не помещается справа, показываем слева от таланта
					left = rect.left - tooltipWidth - spacing
				}

				// Проверяем, не выходит ли tooltip за левый край
				if (left < spacing) {
					left = spacing
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
					ref={tooltipRef}
					className='fixed z-50 w-[280px] max-h-[80vh] overflow-y-auto rounded-lg border border-zinc-600 bg-zinc-800 p-3 shadow-lg'
					style={{
						top: `${tooltipPosition.top}px`,
						left: `${tooltipPosition.left}px`,
						transform: 'translateY(-100%)',
					}}
					onMouseEnter={() => setIsHovered(true)}
					onMouseLeave={() => setIsHovered(false)}
				>
					<div className='mb-2 flex items-center justify-between text-sm font-semibold text-yellow-400'>
						<span>{name}</span>
						{maxRank !== undefined && (
							<span className='text-zinc-400'>
								{learnedRank || 0}/{maxRank}
							</span>
						)}
					</div>
					<div className='text-xs text-zinc-300 leading-relaxed'>
						{description.replace(/<br\s*\/?>/gi, ' ')}
					</div>
				</div>
			)}
		</>
	)
}

function GlyphTooltip ({ name, itemEntry, children }: GlyphTooltipProps) {
	const [isHovered, setIsHovered] = useState(false)
	const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null)
	const triggerRef = useRef<HTMLDivElement>(null)
	const tooltipRef = useRef<HTMLDivElement>(null)
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

	useEffect(() => {
		if (isHovered && triggerRef.current) {
			const updatePosition = () => {
				if (!triggerRef.current) return

				const rect = triggerRef.current.getBoundingClientRect()
				const spacing = 20
				const tooltipWidth = 280

				// Позиционируем tooltip слева от иконки символа
				// Правый край tooltip должен быть рядом с левым краем иконки
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
					ref={tooltipRef}
					className='fixed z-50 w-[280px] max-h-[80vh] overflow-y-auto rounded-lg border border-zinc-600 bg-zinc-800 p-3 shadow-lg'
					style={{
						top: `${tooltipPosition.top}px`,
						left: `${tooltipPosition.left}px`,
						transform: 'translateY(-50%)',
					}}
					onMouseEnter={() => setIsHovered(true)}
					onMouseLeave={() => setIsHovered(false)}
				>
					<div className='mb-2 text-sm font-semibold text-yellow-400'>
						{name}
					</div>
					{description && !isLoading && (
						<div className='text-xs text-zinc-300 leading-relaxed'>
							{description.replace(/<br\s*\/?>/gi, ' ')}
						</div>
					)}
					{isLoading && (
						<div className='text-xs text-zinc-500'>Загрузка...</div>
					)}
				</div>
			)}
		</>
	)
}

const SPEC_ICON_MAP: Record<number, Record<number, string>> = {
	1: {
		0: 'https://wow.zamimg.com/images/wow/icons/medium/ability_warrior_savageblow.jpg',
		1: 'https://wow.zamimg.com/images/wow/icons/medium/ability_warrior_innerrage.jpg',
		2: 'https://wow.zamimg.com/images/wow/icons/medium/inv_shield_05.jpg',
	},
	2: {
		0: 'https://wow.zamimg.com/images/wow/icons/medium/spell_holy_holybolt.jpg',
		1: 'https://wow.zamimg.com/images/wow/icons/medium/inv_shield_06.jpg',
		2: 'https://wow.zamimg.com/images/wow/icons/medium/spell_holy_auraoflight.jpg',
	},
	3: {
		0: 'https://wow.zamimg.com/images/wow/icons/medium/ability_hunter_beasttaming.jpg',
		1: 'https://wow.zamimg.com/images/wow/icons/medium/ability_marksmanship.jpg',
		2: 'https://wow.zamimg.com/images/wow/icons/medium/ability_hunter_swiftstrike.jpg',
	},
	4: {
		0: 'https://wow.zamimg.com/images/wow/icons/medium/ability_rogue_eviscerate.jpg',
		1: 'https://wow.zamimg.com/images/wow/icons/medium/ability_backstab.jpg',
		2: 'https://wow.zamimg.com/images/wow/icons/medium/ability_stealth.jpg',
	},
	5: {
		0: 'https://wow.zamimg.com/images/wow/icons/medium/spell_holy_wordfortitude.jpg',
		1: 'https://wow.zamimg.com/images/wow/icons/medium/spell_holy_guardianspirit.jpg',
		2: 'https://wow.zamimg.com/images/wow/icons/medium/spell_shadow_shadowwordpain.jpg',
	},
	6: {
		0: 'https://wow.zamimg.com/images/wow/icons/medium/spell_deathknight_bloodpresence.jpg',
		1: 'https://wow.zamimg.com/images/wow/icons/medium/spell_deathknight_frostpresence.jpg',
		2: 'https://wow.zamimg.com/images/wow/icons/medium/spell_deathknight_unholypresence.jpg',
	},
	7: {
		0: 'https://wow.zamimg.com/images/wow/icons/medium/spell_nature_lightning.jpg',
		1: 'https://wow.zamimg.com/images/wow/icons/medium/spell_nature_lightningshield.jpg',
		2: 'https://wow.zamimg.com/images/wow/icons/medium/spell_nature_magicimmunity.jpg',
	},
	8: {
		0: 'https://wow.zamimg.com/images/wow/icons/medium/spell_holy_magicalsentry.jpg',
		1: 'https://wow.zamimg.com/images/wow/icons/medium/spell_fire_firebolt02.jpg',
		2: 'https://wow.zamimg.com/images/wow/icons/medium/spell_frost_frostbolt02.jpg',
	},
	9: {
		0: 'https://wow.zamimg.com/images/wow/icons/medium/spell_shadow_curseoftounges.jpg',
		1: 'https://wow.zamimg.com/images/wow/icons/medium/spell_shadow_metamorphosis.jpg',
		2: 'https://wow.zamimg.com/images/wow/icons/medium/spell_shadow_rainoffire.jpg',
	},
	11: {
		0: 'https://wow.zamimg.com/images/wow/icons/medium/spell_nature_starfall.jpg',
		1: 'https://wow.zamimg.com/images/wow/icons/medium/ability_racial_bearform.jpg',
		2: 'https://wow.zamimg.com/images/wow/icons/medium/spell_nature_healingtouch.jpg'
	},
}

const SPEC_NAMES: Record<number, string[]> = {
	1: ['Оружие', 'Неистовство', 'Защита'],
	2: ['Свет', 'Защита', 'Воздаяние'],
	3: ['Повелитель зверей', 'Стрельба', 'Выживание'],
	4: ['Ликвидация', 'Бой', 'Скрытность'],
	5: ['Послушание', 'Свет', 'Тьма'],
	6: ['Кровь', 'Лед', 'Нечестивость'],
	7: ['Стихии', 'Совершенствование', 'Исцеление'],
	8: ['Тайная магия', 'Огонь', 'Лед'],
	9: ['Колдовство', 'Демонология', 'Разрушение'],
	11: ['Баланс', 'Сила зверя', 'Исцеление'],
}

function getSpecName (classId: number, spec: number): string {
	const specs = SPEC_NAMES[classId]
	if (!specs || spec < 0 || spec >= specs.length) {
		return `Спек ${spec}`
	}
	return specs[spec]
}

function getSpecIcon (classId: number, spec: number): string | null {
	const classSpecs = SPEC_ICON_MAP[classId]
	if (!classSpecs) return null
	return classSpecs[spec] ?? null
}

export function TalentTree ({ classTalents, glyphs, characterTalents, characterClass }: TalentTreeProps) {
	if (!classTalents || classTalents.length === 0) {
		return null
	}

	// Определяем количество специализаций
	const talentGroupsCount = characterTalents?.length || 1
	const [selectedTalentGroup, setSelectedTalentGroup] = useState(0)

	// Получаем изученные таланты для выбранной специализации
	const getLearnedTalents = (talentGroup: number): Map<number, number> => {
		const learnedMap = new Map<number, number>() // Map<talentId, learnedRank>
		
		if (!characterTalents || !characterTalents[talentGroup]) {
			return learnedMap
		}

		const groupTalents = characterTalents[talentGroup]
		
		// Проходим по всем талантам в classTalents
		classTalents.forEach((talentTab) => {
			talentTab.talents.forEach((talent) => {
				// Ищем изученные ранги этого таланта
				talent.rank_spells.forEach((rankSpell, rankIndex) => {
					// Проверяем, есть ли этот spell в characterTalents
					const learnedTalent = groupTalents.find(ct => ct.spell === rankSpell.spell_id)
					if (learnedTalent) {
						// Находим индекс в массиве ranks
						const rankInRanks = talent.ranks.indexOf(rankSpell.spell_id)
						if (rankInRanks !== -1) {
							// Сохраняем максимальный изученный ранг для этого таланта
							const currentRank = learnedMap.get(talent.id) || 0
							learnedMap.set(talent.id, Math.max(currentRank, rankInRanks + 1))
						}
					}
				})
			})
		})

		return learnedMap
	}

	const learnedTalents = getLearnedTalents(selectedTalentGroup)

	// Сортируем таланты по order
	const sortedTalents = [...classTalents].sort((a, b) => a.order - b.order)

	// Группируем символы по типу и выбранной специализации
	const getGlyphsByType = (type: number, talentGroup: number) => {
		if (!glyphs) return []
		return glyphs
			.filter(g => g.glyphData.type === type && g.talentGroup === talentGroup)
			.sort((a, b) => a.glyphSlot - b.glyphSlot)
			.slice(0, 3)
	}

	// Получаем количество очков в каждой ветке для специализации
	const getBranchPointsForTalentGroup = (talentGroup: number): Array<{ order: number; name: string; points: number }> => {
		const groupLearnedTalents = getLearnedTalents(talentGroup)
		
		return sortedTalents.map((talentTab) => {
			const points = talentTab.talents.reduce((sum, talent) => {
				const rank = groupLearnedTalents.get(talent.id) || 0
				return sum + rank
			}, 0)
			return {
				order: talentTab.order,
				name: talentTab.name,
				points,
			}
		})
	}

	// Определяем специализацию для каждой группы талантов на основе количества вложенных очков
	const getSpecForTalentGroup = (talentGroup: number): { spec: number; name: string; icon: string | null; branchPoints: Array<{ order: number; name: string; points: number }> } => {
		if (!characterClass) {
			return { spec: 0, name: `Специализация ${talentGroup + 1}`, icon: null, branchPoints: [] }
		}

		const branchPoints = getBranchPointsForTalentGroup(talentGroup)
		
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

	return (
		<section>
			<h2 className='mb-6 text-lg font-semibold text-zinc-100'>
				Дерево талантов
			</h2>
			{/* Карточки переключения специализаций */}
			{talentGroupsCount > 1 && (
				<div className='mb-6 flex gap-3'>
					{Array.from({ length: talentGroupsCount }).map((_, index) => {
						const specInfo = getSpecForTalentGroup(index)
						return (
							<button
								key={index}
								onClick={() => setSelectedTalentGroup(index)}
								className={`flex items-start gap-3 rounded-lg border-2 px-4 py-2 transition-all ${
									selectedTalentGroup === index
										? 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
										: 'border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800'
								}`}
							>
								{specInfo.icon && (
									<SafeImage
										src={specInfo.icon}
										alt={specInfo.name}
										className='h-[48px] w-[48px] rounded border border-zinc-600 flex-shrink-0'
									/>
								)}
								<div className='flex flex-col gap-1 items-start'>
									<span className='text-sm font-medium text-left'>
										{specInfo.name}
									</span>
									{specInfo.branchPoints.length > 0 && (
										<div className='flex flex-wrap gap-2 text-xs text-zinc-400 text-left'>
											{specInfo.branchPoints.map((branch) => (
												<span key={branch.order}>
													{branch.name}: {branch.points}
												</span>
											))}
										</div>
									)}
								</div>
							</button>
						)
					})}
				</div>
			)}

			{/* Ветки талантов и символы */}
			<div className='flex flex-row gap-6 items-start'>
				{/* Ветки талантов */}
				<div className='flex flex-row gap-6 flex-1'>
					{sortedTalents.map((talentTab) => {
						// Находим максимальные значения col и row для определения размера сетки
						const maxCol = Math.max(...talentTab.talents.map(t => t.col), 0)
						const maxRow = Math.max(...talentTab.talents.map(t => t.row), 0)

						// Создаем сетку для талантов
						const gridCols = maxCol + 1
						const gridRows = maxRow + 1

						return (
							<div key={talentTab._id} className='flex-1'>
							{/* Фон таба */}
							<div className='relative rounded-lg border border-zinc-700 bg-zinc-800/50 p-4'>
								{talentTab.background && (
									<div className='absolute inset-0 overflow-hidden rounded-lg opacity-20'>
										<SafeImage
											src={getAbsoluteSirusImageUrl(talentTab.background)}
											alt=''
											className='h-full w-full object-cover'
										/>
									</div>
								)}

								{/* Заголовок таба */}
								<div className='relative z-10 mb-4 flex items-center gap-3'>
									{talentTab.icon && (
										<SafeImage
											src={getAbsoluteSirusImageUrl(talentTab.icon)}
											alt={talentTab.name}
											className='h-8 w-8 rounded'
										/>
									)}
									<h3 className='text-base font-semibold text-zinc-200'>
										{talentTab.name}
									</h3>
									{(() => {
										// Подсчитываем количество очков талантов, потраченных на ветку
										const learnedPoints = talentTab.talents.reduce((sum, talent) => {
											const rank = learnedTalents.get(talent.id) || 0
											return sum + rank
										}, 0)
										const totalPoints = talentTab.talents.reduce((sum, talent) => {
											return sum + talent.max_rank
										}, 0)
										return (
											<span className='text-sm text-zinc-400'>
												({learnedPoints}/{totalPoints})
											</span>
										)
									})()}
								</div>

								{/* Сетка талантов */}
								<div className='flex justify-center'>
									<div
										className='relative grid place-items-center gap-4'
										style={{
											gridTemplateColumns: `repeat(${gridCols}, 48px)`,
											gridTemplateRows: `repeat(${gridRows}, 48px)`,
										}}
									>
									{/* Создаем все ячейки сетки */}
									{Array.from({ length: gridRows * gridCols }).map((_, index) => {
										const row = Math.floor(index / gridCols)
										const col = index % gridCols
										const talent = talentTab.talents.find(
											t => t.row === row && t.col === col
										)

										if (!talent) {
											return <div key={`empty-${row}-${col}`} className='aspect-square' />
										}

										// Проверяем зависимости - талант доступен если нет зависимости или зависимый талант существует
										const dependsOnTalent = talent.dependsOn > 0 
											? talentTab.talents.find(t => t.id === talent.dependsOn)
											: null
										const isAvailable = talent.dependsOn === 0 || dependsOnTalent !== null

										// Получаем изученный ранг таланта
										const learnedRank = learnedTalents.get(talent.id) || 0
										const isLearned = learnedRank > 0

										// Определяем, какое описание показывать
										// Если талант изучен, показываем описание соответствующего ранга
										// Если не изучен, показываем описание первого ранга
										const displayRank = isLearned ? learnedRank : 1
										const displaySpell = talent.rank_spells[displayRank - 1] || talent.rank_spells[0]
										const icon = displaySpell?.icon || ''

										return (
											<div
												key={talent.id}
												className='relative flex items-center justify-center'
												style={{
													gridColumn: col + 1,
													gridRow: row + 1,
												}}
											>
												{/* Иконка таланта */}
												<TalentTooltip
													name={displaySpell?.name || `Талант ${talent.id}`}
													description={displaySpell?.description || ''}
													learnedRank={learnedRank}
													maxRank={talent.max_rank}
												>
													<div
														className={`relative z-10 flex h-[48px] w-[48px] items-center justify-center rounded border-2 box-border transition-all ${
															isLearned
																? learnedRank === talent.max_rank
																	? 'border-yellow-500/50 bg-zinc-800/80 hover:border-yellow-500 hover:bg-zinc-800 cursor-pointer'
																	: 'border-green-500/50 bg-zinc-800/80 hover:border-green-500 hover:bg-zinc-800 cursor-pointer'
																: 'border-zinc-600/30 bg-zinc-900/50'
														} ${!isLearned ? 'grayscale' : ''}`}
													>
													{icon && (
														<SafeImage
															src={getAbsoluteSirusImageUrl(icon)}
															alt={displaySpell?.name || ''}
															className='h-full w-full rounded'
														/>
													)}
														{/* Индикатор рангов */}
														{talent.max_rank > 1 && (
															<div className={`absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-zinc-600 bg-zinc-900 text-[9px] font-semibold ${
																isLearned
																	? learnedRank === talent.max_rank
																		? 'text-yellow-400'
																		: 'text-green-400'
																	: 'text-zinc-300'
															}`}>
																{isLearned ? learnedRank : talent.max_rank}
															</div>
														)}
														{/* Индикатор для талантов с одним рангом */}
														{talent.max_rank === 1 && (
															<div className={`absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-zinc-600 bg-zinc-900 text-[9px] font-semibold ${
																isLearned
																	? learnedRank === talent.max_rank
																		? 'text-yellow-400'
																		: 'text-green-400'
																	: 'text-zinc-300'
															}`}>
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

				{/* Символы справа от веток талантов */}
				{talentGroupsCount > 1 && (
					<div className='flex flex-col gap-3'>
						{/* Большие символы */}
						<div className='flex flex-col gap-2'>
							<div className='text-xs font-semibold text-zinc-400'>
								Большие символы
							</div>
							<div className='flex flex-col gap-2'>
								{Array.from({ length: 3 }).map((_, glyphIndex) => {
									const majorGlyphsForGroup = getGlyphsByType(1, selectedTalentGroup)
									const glyph = majorGlyphsForGroup[glyphIndex]
									return (
										<div
											key={`major-${glyphIndex}`}
											className='flex h-[64px] w-[200px] items-center gap-2 rounded border-2 border-zinc-700 bg-zinc-800/50 px-2'
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
															className='h-[48px] w-[48px] rounded flex-shrink-0 cursor-pointer'
														/>
													</GlyphTooltip>
													<span className='text-xs text-zinc-300 line-clamp-2'>
														{glyph.glyphData.glyph_name}
													</span>
												</>
											) : (
												<>
													<div className='h-[48px] w-[48px] rounded bg-zinc-900/50 flex-shrink-0' />
													<span className='text-xs text-zinc-500'>Пусто</span>
												</>
											)}
										</div>
									)
								})}
							</div>
						</div>

						{/* Малые символы */}
						<div className='flex flex-col gap-2'>
							<div className='text-xs font-semibold text-zinc-400'>
								Малые символы
							</div>
							<div className='flex flex-col gap-2'>
								{Array.from({ length: 3 }).map((_, glyphIndex) => {
									const minorGlyphsForGroup = getGlyphsByType(2, selectedTalentGroup)
									const glyph = minorGlyphsForGroup[glyphIndex]
									return (
										<div
											key={`minor-${glyphIndex}`}
											className='flex h-[64px] w-[200px] items-center gap-2 rounded border-2 border-zinc-700 bg-zinc-800/50 px-2'
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
															className='h-[48px] w-[48px] rounded flex-shrink-0 cursor-pointer'
														/>
													</GlyphTooltip>
													<span className='text-xs text-zinc-300 line-clamp-2'>
														{glyph.glyphData.glyph_name}
													</span>
												</>
											) : (
												<>
													<div className='h-[48px] w-[48px] rounded bg-zinc-900/50 flex-shrink-0' />
													<span className='text-xs text-zinc-500'>Пусто</span>
												</>
											)}
										</div>
									)
								})}
							</div>
						</div>
					</div>
				)}
			</div>
		</section>
	)
}

