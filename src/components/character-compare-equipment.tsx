'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { SafeImage } from '@/components/safe-image'
import { ItemTooltip } from '@/components/item-tooltip'
import { renderHtmlText } from '@/utils/html-utils'

// Импортируем STAT_TYPE_MAP из item-tooltip (копируем для использования)
const STAT_TYPE_MAP: Record<number, string> = {
	0: 'к мане',
	1: 'к здоровью',
	3: 'к ловкости',
	4: 'к силе',
	5: 'к интеллекту',
	6: 'к духу',
	7: 'к выносливости',
	12: 'к рейтингу защиты',
	13: 'к рейтингу уклонения',
	14: 'к рейтингу парирования',
	15: 'к рейтингу блокирования',
	16: 'к рейтингу меткости в ближнем бою',
	17: 'к рейтингу меткости в дальнем бою',
	18: 'к рейтингу меткости заклинаний',
	19: 'к рейтингу критического удара в ближнем бою',
	20: 'к рейтингу критического удара в дальнем бою',
	21: 'к рейтингу критического удара заклинаний',
	22: 'к рейтингу получаемой меткости в ближнем бою',
	23: 'к рейтингу получаемой меткости в дальнем бою',
	24: 'к рейтингу получаемой меткости заклинаний',
	25: 'к рейтингу получаемого критического удара в ближнем бою',
	26: 'к рейтингу получаемого критического удара в дальнем бою',
	27: 'к рейтингу получаемого критического удара заклинаний',
	28: 'к рейтингу скорости атаки в ближнем бою',
	29: 'к рейтингу скорости атаки в дальнем бою',
	30: 'к рейтингу скорости заклинаний',
	31: 'к рейтингу меткости',
	32: 'к рейтингу критического удара',
	33: 'к рейтингу получаемой меткости',
	34: 'к рейтингу получаемого критического удара',
	35: 'к рейтингу устойчивости',
	36: 'к рейтингу скорости',
	37: 'к рейтингу экспертизы',
	38: 'к силе атаки',
	39: 'к силе атаки в дальнем бою',
	40: 'к рейтингу универсальности',
	41: 'к исцелению заклинаниями',
	42: 'к урону заклинаниями',
	43: 'к регенерации маны',
	44: 'к рейтингу пробивания брони',
	45: 'к силе заклинаний',
	46: 'к регенерации здоровья',
	47: 'к пробиванию заклинаний',
	48: 'к значению блокирования',
	49: 'к рейтингу мастерства',
	50: 'к дополнительной броне',
	51: 'к сопротивлению огню',
	52: 'к сопротивлению магии льда',
	53: 'к сопротивлению светлой магии',
	54: 'к сопротивлению темной магии',
	55: 'к сопротивлению силам природы',
	56: 'к сопротивлению тайной магии',
	57: 'к силе PvP',
	58: 'к усилению критического удара',
	59: 'к множественному удару',
	60: 'к готовности',
	61: 'к скорости',
	62: 'к вампиризму',
	63: 'к избеганию',
	64: 'к прочности',
	66: 'к рассекающему удару',
	71: 'к ловкости, силе и интеллекту',
	72: 'к ловкости и силе',
	73: 'к ловкости и интеллекту',
	74: 'к силе и интеллекту',
}

type EquipmentItem = {
	key?: string
	entry?: number
	icon?: string
	name?: string
	item_instance?: unknown
	quality?: number
	itemLevel?: number
}

interface ItemStats {
	stat_type1?: number
	stat_value1?: number
	stat_type2?: number
	stat_value2?: number
	stat_type3?: number
	stat_value3?: number
	stat_type4?: number
	stat_value4?: number
	stat_type5?: number
	stat_value5?: number
	stat_type6?: number
	stat_value6?: number
	stat_type7?: number
	stat_value7?: number
	stat_type8?: number
	stat_value8?: number
	stat_type9?: number
	stat_value9?: number
	stat_type10?: number
	stat_value10?: number
	armor?: number
}

interface ItemTooltipData {
	item: ItemStats & {
		entry: number
		name: string
		quality: number
		item_level: number
	}
}

const EQUIPMENT_SLOT_ORDER = [
	{ key: 'head', label: 'Шлем' },
	{ key: 'neck', label: 'Шея' },
	{ key: 'shoulders', label: 'Плечи' },
	{ key: 'back', label: 'Плащ' },
	{ key: 'chest', label: 'Грудь' },
	{ key: 'wrists', label: 'Наручи' },
	{ key: 'hands', label: 'Руки' },
	{ key: 'waist', label: 'Пояс' },
	{ key: 'legs', label: 'Штаны' },
	{ key: 'feet', label: 'Ступни' },
	{ key: 'finger1', label: 'Кольцо 1' },
	{ key: 'finger2', label: 'Кольцо 2' },
	{ key: 'trinket1', label: 'Аксессуар 1' },
	{ key: 'trinket2', label: 'Аксессуар 2' },
	{ key: 'mainhand', label: 'Правая рука' },
	{ key: 'offhand', label: 'Левая рука' },
	{ key: 'ranged', label: 'Дальнобойное' },
]

function getItemByKey(
	equipments: EquipmentItem[] | null | undefined,
	key: string,
): EquipmentItem | null {
	if (!equipments) return null
	return equipments.find((item) => item.key === key) ?? null
}

// Извлекает все характеристики из предмета
function extractItemStats(item: ItemStats | null | undefined): Map<number, number> {
	const stats = new Map<number, number>()
	if (!item) return stats

	for (let i = 1; i <= 10; i++) {
		const statType = item[`stat_type${i}` as keyof ItemStats] as number | undefined
		const statValue = item[`stat_value${i}` as keyof ItemStats] as number | undefined
		
		if (statType && statValue && statType !== 0 && statValue !== 0) {
			// Если уже есть такой тип, суммируем значения
			const current = stats.get(statType) || 0
			stats.set(statType, current + statValue)
		}
	}

	return stats
}

// Объединяет характеристики двух предметов
function combineItemStats(
	item1: ItemTooltipData | null | undefined,
	item2: ItemTooltipData | null | undefined,
): Map<number, number> {
	const stats1 = extractItemStats(item1?.item)
	const stats2 = extractItemStats(item2?.item)
	
	// Объединяем характеристики из обоих предметов
	const combined = new Map<number, number>()
	
	// Добавляем характеристики из первого предмета
	for (const [statType, value] of stats1) {
		combined.set(statType, (combined.get(statType) || 0) + value)
	}
	
	// Добавляем характеристики из второго предмета
	for (const [statType, value] of stats2) {
		combined.set(statType, (combined.get(statType) || 0) + value)
	}
	
	return combined
}

// Сравнивает два предмета и возвращает разницу
function compareItemStats(
	item1: ItemTooltipData | null | undefined,
	item2: ItemTooltipData | null | undefined,
): Array<{ statType: number; statName: string; value1: number; value2: number; diff: number }> {
	const stats1 = extractItemStats(item1?.item)
	const stats2 = extractItemStats(item2?.item)

	const allStatTypes = new Set([...stats1.keys(), ...stats2.keys()])
	const differences: Array<{ statType: number; statName: string; value1: number; value2: number; diff: number }> = []

	for (const statType of allStatTypes) {
		const value1 = stats1.get(statType) || 0
		const value2 = stats2.get(statType) || 0
		const diff = value1 - value2

		// Показываем только если есть разница
		if (diff !== 0) {
			const statName = STAT_TYPE_MAP[statType] || `стат ${statType}`
			differences.push({ statType, statName, value1, value2, diff })
		}
	}

	// Сортируем: сначала основные характеристики, потом по разнице (большая разница сначала)
	return differences.sort((a, b) => {
		const primaryStats = [3, 4, 5, 6, 7] // Ловкость, Сила, Интеллект, Дух, Выносливость
		const aIsPrimary = primaryStats.includes(a.statType)
		const bIsPrimary = primaryStats.includes(b.statType)
		
		if (aIsPrimary && !bIsPrimary) return -1
		if (!aIsPrimary && bIsPrimary) return 1
		
		return Math.abs(b.diff) - Math.abs(a.diff)
	})
}

// Сравнивает объединенные характеристики двух пар предметов (например, mainhand + offhand)
function compareCombinedItemStats(
	item1a: ItemTooltipData | null | undefined,
	item1b: ItemTooltipData | null | undefined,
	item2a: ItemTooltipData | null | undefined,
	item2b: ItemTooltipData | null | undefined,
): Array<{ statType: number; statName: string; value1: number; value2: number; diff: number }> {
	const combinedStats1 = combineItemStats(item1a, item1b)
	const combinedStats2 = combineItemStats(item2a, item2b)

	const allStatTypes = new Set([...combinedStats1.keys(), ...combinedStats2.keys()])
	const differences: Array<{ statType: number; statName: string; value1: number; value2: number; diff: number }> = []

	for (const statType of allStatTypes) {
		const value1 = combinedStats1.get(statType) || 0
		const value2 = combinedStats2.get(statType) || 0
		const diff = value1 - value2

		// Показываем только если есть разница
		if (diff !== 0) {
			const statName = STAT_TYPE_MAP[statType] || `стат ${statType}`
			differences.push({ statType, statName, value1, value2, diff })
		}
	}

	// Сортируем: сначала основные характеристики, потом по разнице (большая разница сначала)
	return differences.sort((a, b) => {
		const primaryStats = [3, 4, 5, 6, 7] // Ловкость, Сила, Интеллект, Дух, Выносливость
		const aIsPrimary = primaryStats.includes(a.statType)
		const bIsPrimary = primaryStats.includes(b.statType)
		
		if (aIsPrimary && !bIsPrimary) return -1
		if (!aIsPrimary && bIsPrimary) return 1
		
		return Math.abs(b.diff) - Math.abs(a.diff)
	})
}

function getQualityBorderColor(quality?: number): string {
	switch (quality) {
		case 0:
			return 'border-gray-600'
		case 1:
			return 'border-gray-500'
		case 2:
			return 'border-green-500'
		case 3:
			return 'border-blue-500'
		case 4:
			return 'border-purple-500'
		case 5:
			return 'border-orange-500'
		case 6:
			return 'border-red-500'
		case 7:
			return 'border-yellow-500'
		default:
			return 'border-zinc-700'
	}
}

function PinnedTooltipDisplay({
	itemId,
	characterGuid,
	position,
	onClose,
}: {
	itemId: number
	characterGuid: number
	position: { top: number; left: number; maxHeight: number }
	onClose: () => void
}) {
	const [tooltipPosition, setTooltipPosition] = React.useState(position)

	React.useEffect(() => {
		setTooltipPosition(position)
	}, [position])

	React.useEffect(() => {
		const updatePosition = () => {
			setTooltipPosition((prev) => {
				const maxTooltipHeight = window.innerHeight * 0.8
				const spacing = 8
				return {
					...prev,
					maxHeight: Math.min(prev.maxHeight, window.innerHeight - prev.top - spacing),
				}
			})
		}
		window.addEventListener('scroll', updatePosition, true)
		window.addEventListener('resize', updatePosition)
		return () => {
			window.removeEventListener('scroll', updatePosition, true)
			window.removeEventListener('resize', updatePosition)
		}
	}, [])

	return (
		<ItemTooltip
			itemId={itemId}
			characterGuid={characterGuid}
			pinned={true}
			pinnedPosition={tooltipPosition}
			onClose={onClose}
		>
			<div
				style={{
					position: 'fixed',
					top: `${tooltipPosition.top}px`,
					left: `${tooltipPosition.left}px`,
					width: '1px',
					height: '1px',
					opacity: 0,
					pointerEvents: 'none',
				}}
			/>
		</ItemTooltip>
	)
}

interface CharacterCompareEquipmentProps {
	equipments1: EquipmentItem[] | null | undefined
	equipments2: EquipmentItem[] | null | undefined
	character1Guid: number
	character2Guid: number
	character1Name: string
	character2Name: string
}

type PinnedTooltip = {
	slotKey: string
	itemId: number
	characterGuid: number
	iconRef: React.RefObject<HTMLDivElement | null>
} | null

export function CharacterCompareEquipment({
	equipments1,
	equipments2,
	character1Guid,
	character2Guid,
	character1Name,
	character2Name,
}: CharacterCompareEquipmentProps) {
	const [isExpanded, setIsExpanded] = React.useState(true)
	const [isLoading, setIsLoading] = React.useState(false)
	const [error, setError] = React.useState<string | null>(null)
	const [itemsData, setItemsData] = React.useState<Map<string, {
		item1: ItemTooltipData | null
		item2: ItemTooltipData | null
	}>>(new Map())
	const [pinnedTooltips, setPinnedTooltips] = React.useState<{
		left: PinnedTooltip
		right: PinnedTooltip
	}>({
		left: null,
		right: null,
	})
	const [tooltipPositions, setTooltipPositions] = React.useState<{
		left: { top: number; left: number; maxHeight: number } | null
		right: { top: number; left: number; maxHeight: number } | null
	}>({
		left: null,
		right: null,
	})
	const iconRefs = React.useRef<Map<string, { left: React.RefObject<HTMLDivElement | null>; right: React.RefObject<HTMLDivElement | null> }>>(new Map())

	const getIconRef = React.useCallback((slotKey: string, side: 'left' | 'right'): React.RefObject<HTMLDivElement | null> => {
		if (!iconRefs.current.has(slotKey)) {
			iconRefs.current.set(slotKey, {
				left: React.createRef<HTMLDivElement | null>(),
				right: React.createRef<HTMLDivElement | null>(),
			})
		}
		return iconRefs.current.get(slotKey)![side]
	}, [])

	React.useEffect(() => {
		const updatePositions = () => {
			const tooltipWidth = 320
			const spacing = 8
			const maxTooltipHeight = window.innerHeight * 0.8

			const calculatePosition = (iconRef: React.RefObject<HTMLDivElement | null>) => {
				if (!iconRef.current) return null

				const rect = iconRef.current.getBoundingClientRect()
				const spaceOnRight = window.innerWidth - rect.right
				const spaceOnLeft = rect.left

				let left: number
				if (spaceOnRight >= tooltipWidth + spacing) {
					left = rect.right + spacing
				} else if (spaceOnLeft >= tooltipWidth + spacing) {
					left = rect.left - tooltipWidth - spacing
				} else {
					left = Math.max(spacing, window.innerWidth - tooltipWidth - spacing)
				}

				const spaceBelow = window.innerHeight - rect.top - spacing
				const spaceAbove = rect.top - spacing
				const minComfortableHeight = 300

				let top: number
				let maxHeight: number

				if (spaceBelow >= maxTooltipHeight) {
					top = Math.max(spacing, rect.top)
					maxHeight = maxTooltipHeight
				} else if (spaceBelow >= minComfortableHeight) {
					top = Math.max(spacing, rect.top)
					maxHeight = spaceBelow
				} else {
					const neededTop = window.innerHeight - minComfortableHeight - spacing
					const maxAllowedLift = Math.max(0, rect.top - 100)
					const optimalTop = Math.max(spacing, Math.min(neededTop, maxAllowedLift))
					top = optimalTop
					maxHeight = window.innerHeight - top - spacing
					if (maxHeight < 200) {
						top = Math.max(spacing, window.innerHeight - 200 - spacing)
						maxHeight = 200
					}
				}

				return { top, left, maxHeight }
			}

			setTooltipPositions({
				left: pinnedTooltips.left ? calculatePosition(pinnedTooltips.left.iconRef) : null,
				right: pinnedTooltips.right ? calculatePosition(pinnedTooltips.right.iconRef) : null,
			})
		}

		updatePositions()
		window.addEventListener('scroll', updatePositions, true)
		window.addEventListener('resize', updatePositions)

		return () => {
			window.removeEventListener('scroll', updatePositions, true)
			window.removeEventListener('resize', updatePositions)
		}
	}, [pinnedTooltips.left, pinnedTooltips.right])

	if ((!equipments1 || equipments1.length === 0) && (!equipments2 || equipments2.length === 0)) {
		return null
	}

	const loadEquipmentData = React.useCallback(async () => {
		setIsLoading(true)
		setError(null)

		try {
			const loadItemData = async (
				item: EquipmentItem | null,
				characterGuid: number,
			): Promise<ItemTooltipData | null> => {
				if (!item || !item.entry) {
					return null
				}

				const { fetchSirusAPI, SIRUS_API } = await import('@/lib/sirus-api')
				return await fetchSirusAPI(SIRUS_API.itemTooltip(item.entry, characterGuid)) as ItemTooltipData
			}

			const newItemsData = new Map<string, {
				item1: ItemTooltipData | null
				item2: ItemTooltipData | null
			}>()

			for (const slot of EQUIPMENT_SLOT_ORDER) {
				const item1 = getItemByKey(equipments1, slot.key)
				const item2 = getItemByKey(equipments2, slot.key)

				if (!item1 && !item2) {
					continue
				}

				const [data1, data2] = await Promise.all([
					loadItemData(item1, character1Guid),
					loadItemData(item2, character2Guid),
				])

				newItemsData.set(slot.key, {
					item1: data1,
					item2: data2,
				})
			}

			setItemsData(newItemsData)
		} catch (err) {
			setError('Не удалось загрузить данные об экипировке')
			console.error(err)
		} finally {
			setIsLoading(false)
		}
	}, [equipments1, equipments2, character1Guid, character2Guid])


	const handleItemClick = React.useCallback((
		side: 'left' | 'right',
		slotKey: string,
		itemId: number | undefined,
		characterGuid: number,
		iconRef: React.RefObject<HTMLDivElement | null>,
	) => {
		if (!itemId) return

		setPinnedTooltips((prev) => {
			const current = prev[side]
			// Если кликнули на тот же предмет - открепляем
			if (current?.slotKey === slotKey && current?.itemId === itemId) {
				return {
					...prev,
					[side]: null,
				}
			}
			// Иначе закрепляем новый предмет
			return {
				...prev,
				[side]: {
					slotKey,
					itemId,
					characterGuid,
					iconRef,
				},
			}
		})
	}, [])

	return (
		<section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className="mb-6 flex w-full items-center justify-between text-xl font-semibold text-zinc-100 hover:text-zinc-200 transition-colors"
			>
				<span>Сравнение экипировки</span>
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
					{itemsData.size === 0 && (
						<div className="mb-4">
							<button
								onClick={loadEquipmentData}
								disabled={isLoading}
								className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
							>
								{isLoading ? 'Загрузка...' : 'Загрузить данные об экипировке'}
							</button>
						</div>
					)}

					{error && (
						<div className="mb-4 text-red-400 text-sm">{error}</div>
					)}

					{itemsData.size > 0 && (
						<>
							<div className="mb-4 pb-4 border-b border-zinc-800">
								<div className="grid grid-cols-3 gap-4 text-xs text-zinc-500">
									<div className="font-medium">Слот</div>
									<div className="font-medium text-left">{character1Name}</div>
									<div className="font-medium text-left">{character2Name}</div>
								</div>
							</div>
							<div className="space-y-4">
								{EQUIPMENT_SLOT_ORDER.map((slot) => {
									const item1 = getItemByKey(equipments1, slot.key)
									const item2 = getItemByKey(equipments2, slot.key)

									if (!item1 && !item2) {
										return null
									}

									const itemData = itemsData.get(slot.key)
									
									// Для mainhand суммируем характеристики обеих рук перед сравнением
									// Для offhand не показываем разницу, так как она уже учтена в mainhand
									let statsDiff: Array<{ statType: number; statName: string; value1: number; value2: number; diff: number }>
									
									if (slot.key === 'mainhand') {
										const mainhandData1 = itemsData.get('mainhand')?.item1
										const offhandData1 = itemsData.get('offhand')?.item1
										const mainhandData2 = itemsData.get('mainhand')?.item2
										const offhandData2 = itemsData.get('offhand')?.item2
										
										// Сравниваем объединенные характеристики обеих рук
										statsDiff = compareCombinedItemStats(
											mainhandData1,
											offhandData1,
											mainhandData2,
											offhandData2,
										)
									} else if (slot.key === 'offhand') {
										// Для offhand не показываем разницу, так как она уже учтена в mainhand
										statsDiff = []
									} else {
										// Для остальных слотов сравниваем как обычно
										statsDiff = compareItemStats(itemData?.item1, itemData?.item2)
									}
									
									// Проверяем, одинаковые ли предметы
									const isSameItem = item1?.entry && item2?.entry && item1.entry === item2.entry

									return (
										<div
											key={slot.key}
											className={`py-3 border-b border-zinc-800 last:border-0 ${
												isSameItem ? 'bg-green-900/20' : ''
											}`}
										>
											<div className="grid grid-cols-3 gap-4 items-start">
												<div className="text-sm text-zinc-400 font-medium">
													{slot.label}
												</div>
												<div className="flex flex-col gap-2">
													<div className="flex items-start gap-3">
														{item1 ? (
															<>
																{item1.entry ? (
																	<div className="relative">
																		<ItemTooltip
																			itemId={item1.entry}
																			characterGuid={character1Guid}
																		>
																			<div
																				ref={getIconRef(slot.key, 'left')}
																				onClick={(e) => {
																					e.stopPropagation()
																					handleItemClick('left', slot.key, item1.entry, character1Guid, getIconRef(slot.key, 'left'))
																				}}
																				className={`relative w-12 h-12 rounded border-2 ${getQualityBorderColor(
																					item1.quality,
																				)} ${pinnedTooltips.left?.slotKey === slot.key && pinnedTooltips.left?.itemId === item1.entry ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-900' : ''} bg-zinc-800 flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-zinc-700 transition-colors`}
																			>
																				{item1.icon && (
																					<SafeImage
																						src={item1.icon}
																						alt={item1.name ?? slot.label}
																						className="w-10 h-10"
																					/>
																				)}
																				{pinnedTooltips.left?.slotKey === slot.key && pinnedTooltips.left?.itemId === item1.entry && (
																					<div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
																						<svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
																							<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
																						</svg>
																					</div>
																				)}
																			</div>
																		</ItemTooltip>
																	</div>
																) : (
																	<div
																		className={`relative w-12 h-12 rounded border-2 ${getQualityBorderColor(
																			item1.quality,
																		)} bg-zinc-800 flex items-center justify-center flex-shrink-0`}
																	>
																		{item1.icon && (
																			<SafeImage
																				src={item1.icon}
																				alt={item1.name ?? slot.label}
																				className="w-10 h-10"
																			/>
																		)}
																	</div>
																)}
																<div className="flex-1 min-w-0">
																	<div className="text-sm text-zinc-200">
																		{renderHtmlText(item1.name) || 'Неизвестный предмет'}
																	</div>
																	{item1.itemLevel && (
																		<div className="text-xs text-zinc-500">
																			ilvl {item1.itemLevel}
																		</div>
																	)}
																</div>
															</>
														) : (
															<div className="text-sm text-zinc-600">Нет предмета</div>
														)}
													</div>
													{/* Показываем разницу характеристик */}
													{itemData && statsDiff.length > 0 && (
														<div className="ml-[60px] space-y-1 text-xs">
															{statsDiff.map((stat) => {
																const isPositive = stat.diff > 0
																const isNegative = stat.diff < 0
																const diffText = isPositive ? `+${stat.diff}` : `${stat.diff}`
																
																return (
																	<div key={stat.statType} className="flex items-center gap-2">
																		<span className="text-zinc-500">
																			{stat.statName}:
																		</span>
																		<span className={`font-medium ${
																			isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-zinc-400'
																		}`}>
																			{stat.value1} {stat.diff !== 0 && `(${diffText})`}
																		</span>
																	</div>
																)
															})}
														</div>
													)}
												</div>
												<div className="flex flex-col gap-2">
													<div className="flex items-start gap-3">
														{item2 ? (
															<>
																{item2.entry ? (
																	<div className="relative">
																		<ItemTooltip
																			itemId={item2.entry}
																			characterGuid={character2Guid}
																		>
																			<div
																				ref={getIconRef(slot.key, 'right')}
																				onClick={(e) => {
																					e.stopPropagation()
																					handleItemClick('right', slot.key, item2.entry, character2Guid, getIconRef(slot.key, 'right'))
																				}}
																				className={`relative w-12 h-12 rounded border-2 ${getQualityBorderColor(
																					item2.quality,
																				)} ${pinnedTooltips.right?.slotKey === slot.key && pinnedTooltips.right?.itemId === item2.entry ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-900' : ''} bg-zinc-800 flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-zinc-700 transition-colors`}
																			>
																				{item2.icon && (
																					<SafeImage
																						src={item2.icon}
																						alt={item2.name ?? slot.label}
																						className="w-10 h-10"
																					/>
																				)}
																				{pinnedTooltips.right?.slotKey === slot.key && pinnedTooltips.right?.itemId === item2.entry && (
																					<div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
																						<svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
																							<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
																						</svg>
																					</div>
																				)}
																			</div>
																		</ItemTooltip>
																	</div>
																) : (
																	<div
																		className={`relative w-12 h-12 rounded border-2 ${getQualityBorderColor(
																			item2.quality,
																		)} bg-zinc-800 flex items-center justify-center flex-shrink-0`}
																	>
																		{item2.icon && (
																			<SafeImage
																				src={item2.icon}
																				alt={item2.name ?? slot.label}
																				className="w-10 h-10"
																			/>
																		)}
																	</div>
																)}
																<div className="flex-1 min-w-0">
																	<div className="text-sm text-zinc-200">
																		{renderHtmlText(item2.name) || 'Неизвестный предмет'}
																	</div>
																	{item2.itemLevel && (
																		<div className="text-xs text-zinc-500">
																			ilvl {item2.itemLevel}
																		</div>
																	)}
																</div>
															</>
														) : (
															<div className="text-sm text-zinc-600">Нет предмета</div>
														)}
													</div>
													{/* Показываем разницу характеристик */}
													{itemData && statsDiff.length > 0 && (
														<div className="ml-[60px] space-y-1 text-xs">
															{statsDiff.map((stat) => {
																const isPositive = stat.diff < 0 // Для второго персонажа инвертируем
																const isNegative = stat.diff > 0
																const diffText = isPositive ? `+${Math.abs(stat.diff)}` : `-${Math.abs(stat.diff)}`
																
																return (
																	<div key={stat.statType} className="flex items-center gap-2">
																		<span className="text-zinc-500">
																			{stat.statName}:
																		</span>
																		<span className={`font-medium ${
																			isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-zinc-400'
																		}`}>
																			{stat.value2} {stat.diff !== 0 && `(${diffText})`}
																		</span>
																	</div>
																)
															})}
														</div>
													)}
												</div>
											</div>
										</div>
									)
								})}
							</div>
							<div className="mt-4 pt-4 border-t border-zinc-800">
								<div className="grid grid-cols-3 gap-4 text-xs text-zinc-500">
									<div></div>
									<div className="font-medium">{character1Name}</div>
									<div className="font-medium">{character2Name}</div>
								</div>
							</div>
						</>
					)}

					{isLoading && (
						<div className="flex items-center justify-center py-12">
							<p className="text-lg text-zinc-300">
								Загрузка данных об экипировке…
							</p>
						</div>
					)}
				</>
			)}
			{/* Закрепленные тултипы */}
			{pinnedTooltips.left && tooltipPositions.left && (
				<PinnedTooltipDisplay
					itemId={pinnedTooltips.left.itemId}
					characterGuid={pinnedTooltips.left.characterGuid}
					position={tooltipPositions.left}
					onClose={() => {
						setPinnedTooltips((prev) => ({
							...prev,
							left: null,
						}))
					}}
				/>
			)}
			{pinnedTooltips.right && tooltipPositions.right && (
				<PinnedTooltipDisplay
					itemId={pinnedTooltips.right.itemId}
					characterGuid={pinnedTooltips.right.characterGuid}
					position={tooltipPositions.right}
					onClose={() => {
						setPinnedTooltips((prev) => ({
							...prev,
							right: null,
						}))
					}}
				/>
			)}
		</section>
	)
}

