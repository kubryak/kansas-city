'use client'

import React from 'react'
import { SafeImage } from '@/components/safe-image'
import { renderHtmlText } from '@/utils/html-utils'
import { getClassColor } from '@/utils/character-meta'

type EquipmentItem = {
	key?: string
	entry?: number
	icon?: string
	name?: string
	item_instance?: unknown
	quality?: number
}

type SocketType = {
	type: string
	gem?: {
		GemID?: number
		icon?: string
		description?: string
		stat_type1?: number
		stat_value1?: number
		stat_type2?: number
		stat_value2?: number
		stat_type3?: number
		stat_value3?: number
	} | null
}

const SOCKET_COLOR_LABELS: Record<string, string> = {
	red: 'Красное',
	yellow: 'Жёлтое',
	blue: 'Синее',
	meta: 'Мета',
	prismatic: 'Призматическое',
}

const STAT_TYPE_MAP: Record<number, string> = {
	3: 'к ловкости',
	4: 'к силе',
	5: 'к интеллекту',
	6: 'к духу',
	7: 'к выносливости',
	19: 'критического удара',
	20: 'меткости',
	21: 'критического удара заклинаний',
	22: 'скорости',
	27: 'экспертизы',
	32: 'критического удара',
	35: 'меткости',
	36: 'критического удара',
	39: 'меткости',
	40: 'критического удара',
	45: 'силы заклинаний',
}

interface GemSummaryItem {
	color: string
	name: string
	description: string
	icon?: string
	count: number
	stats: Array<{ type: number; value: number; label: string }>
}

interface ItemSetSummaryItem {
	id: number
	name: string
	equipped: number
	total: number
	setBonuses: Array<{
		requiredItems: number
		spell: string
		spell_id: number
		used: boolean
	}>
}

interface SocketStats {
	strength: number
	agility: number
	stamina: number
	intellect: number
	spirit: number
	critRating: number
	hitRating: number
	hasteRating: number
	expertiseRating: number
	spellPower: number
}

function hasItemInstance(item: EquipmentItem | null | undefined): boolean {
	if (!item) return false
	const instance: unknown = item.item_instance
	return instance != null
}

function getAbsoluteSirusImageUrl(relativePath: string): string {
	if (relativePath.startsWith('http')) {
		return relativePath
	}
	return `https://sirus.su${relativePath}`
}

function parseWowText(text: string | null | undefined): string {
	if (!text) {
		return ''
	}

	return text
		.replace(/\|c[A-Fa-f0-9]{8}/g, '')
		.replace(/\|r/g, '')
		.replace(/\|n/g, ' ')
		.trim()
}

function parseGemStats(gem: any): Array<{ type: number; value: number; label: string }> {
	const stats: Array<{ type: number; value: number; label: string }> = []
	
	for (let i = 1; i <= 3; i++) {
		const statType = gem[`stat_type${i}`] as number | undefined
		const statValue = gem[`stat_value${i}`] as number | undefined
		
		if (statType && statValue) {
			const label = STAT_TYPE_MAP[statType] || `стат ${statType}`
			stats.push({ type: statType, value: statValue, label })
		}
	}
	
	return stats
}

function calculateTotalStats(gems: GemSummaryItem[]): SocketStats {
	const totals: SocketStats = {
		strength: 0,
		agility: 0,
		stamina: 0,
		intellect: 0,
		spirit: 0,
		critRating: 0,
		hitRating: 0,
		hasteRating: 0,
		expertiseRating: 0,
		spellPower: 0,
	}

	for (const gem of gems) {
		// Пропускаем мета-камни
		if (gem.color === SOCKET_COLOR_LABELS.meta || gem.color === 'meta' || gem.color === 'Мета') {
			continue
		}

		for (const stat of gem.stats) {
			const value = stat.value * gem.count
			
			switch (stat.type) {
				case 4:
					totals.strength += value
					break
				case 3:
					totals.agility += value
					break
				case 7:
					totals.stamina += value
					break
				case 5:
					totals.intellect += value
					break
				case 6:
					totals.spirit += value
					break
				case 19:
				case 21:
				case 32:
				case 36:
				case 40:
					totals.critRating += value
					break
				case 20:
				case 35:
				case 39:
					totals.hitRating += value
					break
				case 22:
					totals.hasteRating += value
					break
				case 27:
					totals.expertiseRating += value
					break
				case 45:
					totals.spellPower += value
					break
			}
		}
	}

	return totals
}

interface CharacterCompareSocketsEnhancedProps {
	equipments1: EquipmentItem[] | null | undefined
	equipments2: EquipmentItem[] | null | undefined
	character1Guid: number
	character2Guid: number
	character1Name: string
	character2Name: string
	character1Class: number
	character2Class: number
}

export function CharacterCompareSocketsEnhanced({
	equipments1,
	equipments2,
	character1Guid,
	character2Guid,
	character1Name,
	character2Name,
	character1Class,
	character2Class,
}: CharacterCompareSocketsEnhancedProps) {
	const classColor1 = getClassColor(character1Class)
	const classColor2 = getClassColor(character2Class)
	const [isExpanded, setIsExpanded] = React.useState(true)
	const [isLoading, setIsLoading] = React.useState(false)
	const [error, setError] = React.useState<string | null>(null)
	const [lastClickTime, setLastClickTime] = React.useState<number | null>(null)
	const [cooldownRemaining, setCooldownRemaining] = React.useState<number>(0)
	
	const [gems1, setGems1] = React.useState<GemSummaryItem[]>([])
	const [sets1, setSets1] = React.useState<ItemSetSummaryItem[]>([])
	const [gems2, setGems2] = React.useState<GemSummaryItem[]>([])
	const [sets2, setSets2] = React.useState<ItemSetSummaryItem[]>([])

	const COOLDOWN_DURATION = 30000 // 30 секунд в миллисекундах

	React.useEffect(() => {
		if (lastClickTime === null) return

		const interval = setInterval(() => {
			const elapsed = Date.now() - lastClickTime
			const remaining = Math.max(0, COOLDOWN_DURATION - elapsed)
			setCooldownRemaining(remaining)

			if (remaining === 0) {
				setLastClickTime(null)
			}
		}, 100)

		return () => clearInterval(interval)
	}, [lastClickTime, COOLDOWN_DURATION])

	const loadSocketsData = React.useCallback(async () => {
		if (isLoading || cooldownRemaining > 0) {
			return
		}

		setLastClickTime(Date.now())
		setIsLoading(true)
		setError(null)

		try {
			const loadCharacterData = async (
				equipments: EquipmentItem[] | null | undefined,
				characterGuid: number,
			): Promise<{ gems: GemSummaryItem[]; sets: ItemSetSummaryItem[] }> => {
				if (!equipments || equipments.length === 0) {
					return { gems: [], sets: [] }
				}

				const itemsWithEntry = equipments.filter(
					(item) => item.entry != null || hasItemInstance(item),
				)

				if (itemsWithEntry.length === 0) {
					return { gems: [], sets: [] }
				}

				const summaryMap = new Map<string, GemSummaryItem>()
				const itemSetMap = new Map<number, ItemSetSummaryItem>()

				const tooltipPromises = itemsWithEntry.map(async (item) => {
					if (!item.entry) {
						return { sockets: [] as SocketType[], itemset: null as any }
					}

					const { fetchSirusAPI, SIRUS_API } = await import('@/lib/sirus-api')
					const data = await fetchSirusAPI(SIRUS_API.itemTooltip(item.entry, characterGuid)) as any
					const sockets = data?.item?.sockets as SocketType[] | undefined
					const itemset = data?.item?.itemset_data as {
						id?: number
						name?: string
						items?: Array<{ equipped?: boolean }>
						equipped?: number
						setBonuses?: Array<{
							requiredItems: number
							spell: string
							spell_id: number
							used: boolean
						}>
					} | null | undefined

					return {
						sockets: sockets ?? [],
						itemset,
					}
				})

				const tooltipDataList = await Promise.all(tooltipPromises)

				for (const tooltipData of tooltipDataList) {
					for (const socket of tooltipData.sockets) {
						if (!socket || !socket.gem || typeof socket.gem !== 'object') continue

						const gem: any = socket.gem
						const description: string = gem.description ?? ''
						const colorLabel = SOCKET_COLOR_LABELS[socket.type] ?? socket.type
						const icon: string | undefined = gem.icon
						const stats = parseGemStats(gem)

						const gemId = typeof gem.GemID === 'number' ? gem.GemID : null

						const keyBase = gemId !== null
							? `id:${gemId}`
							: `icon:${icon ?? ''}|desc:${description}`

						const key = keyBase

						const current = summaryMap.get(key)
						if (current) {
							current.count += 1
						} else {
							summaryMap.set(key, {
								color: colorLabel,
								name: description || `${colorLabel} камень`,
								description,
								icon,
								count: 1,
								stats,
							})
						}
					}

					const itemset = tooltipData.itemset
					if (!itemset || typeof itemset !== 'object') continue

					const setId = typeof itemset.id === 'number' ? itemset.id : null
					if (setId === null) continue

					const total = Array.isArray(itemset.items)
						? itemset.items.length
						: 0

					const equippedPieces =
						typeof itemset.equipped === 'number'
							? itemset.equipped
							: Array.isArray(itemset.items)
								? itemset.items.filter((it: { equipped?: boolean }) => it.equipped).length
								: 0

					if (equippedPieces <= 0 || total <= 0) continue

					const name = parseWowText(itemset.name ?? `Комплект ${setId}`)
					const setBonuses = Array.isArray(itemset.setBonuses) ? itemset.setBonuses : []

					const currentSet = itemSetMap.get(setId)
					if (currentSet) {
						currentSet.equipped = Math.max(
							currentSet.equipped,
							equippedPieces,
						)
						currentSet.total = Math.max(currentSet.total, total)
						// Объединяем бонусы, избегая дубликатов
						const existingBonusIds = new Set(currentSet.setBonuses.map(b => b.spell_id))
						for (const bonus of setBonuses) {
							if (!existingBonusIds.has(bonus.spell_id)) {
								currentSet.setBonuses.push(bonus)
							}
						}
					} else {
						itemSetMap.set(setId, {
							id: setId,
							name: name,
							equipped: equippedPieces,
							total,
							setBonuses: [...setBonuses],
						})
					}
				}

				const gemsList = Array.from(summaryMap.values()).sort((a, b) => {
					const isAMeta = a.color === SOCKET_COLOR_LABELS.meta
					const isBMeta = b.color === SOCKET_COLOR_LABELS.meta

					if (isAMeta && !isBMeta) return -1
					if (!isAMeta && isBMeta) return 1

					return b.count - a.count
				})

				const setsList = Array.from(itemSetMap.values()).sort((a, b) => {
					if (b.equipped !== a.equipped) {
						return b.equipped - a.equipped
					}
					return a.name.localeCompare(b.name, 'ru')
				})

				return { gems: gemsList, sets: setsList }
			}

			const [data1, data2] = await Promise.all([
				loadCharacterData(equipments1, character1Guid),
				loadCharacterData(equipments2, character2Guid),
			])

			setGems1(data1.gems)
			setSets1(data1.sets)
			setGems2(data2.gems)
			setSets2(data2.sets)
		} catch (err) {
			setError('Не удалось загрузить данные о сокетах')
			setGems1([])
			setSets1([])
			setGems2([])
			setSets2([])
		} finally {
			setIsLoading(false)
		}
	}, [equipments1, equipments2, character1Guid, character2Guid, isLoading])

	const stats1 = calculateTotalStats(gems1)
	const stats2 = calculateTotalStats(gems2)

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
					<div className="mb-4">
						<button
							onClick={loadSocketsData}
							disabled={isLoading || cooldownRemaining > 0}
							className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
						>
							{isLoading
								? 'Загрузка...'
								: cooldownRemaining > 0
									? `Кулдаун: ${Math.ceil(cooldownRemaining / 1000)}с`
									: 'Загрузить данные о сокетах'}
						</button>
					</div>

					{error && (
						<div className="mb-4 text-red-400 text-sm">{error}</div>
					)}

					<div className="grid grid-cols-1 md:grid-cols-2 gap-20">
						{/* Первый персонаж */}
						{(gems1.length > 0 || sets1.length > 0) && (
							<div className="flex flex-col">
								<h3 className={`mb-4 text-lg font-medium ${classColor1}`}>
									{character1Name}
								</h3>
								
								{/* Сокеты */}
								{gems1.length > 0 && (
								<div className="mb-6">
									<h4 className="text-sm font-semibold text-zinc-300 mb-2">
										Сокеты
									</h4>
									<ul className="space-y-0">
										{gems1.map((gem, index) => (
											<li
												key={`${gem.color}-${gem.name}-${gem.description}`}
												className={`flex gap-3 leading-relaxed pb-3 ${
													index < gems1.length - 1 ? 'border-b border-zinc-800 mb-3' : ''
												}`}
											>
												{gem.icon && (
													<SafeImage
														src={getAbsoluteSirusImageUrl(gem.icon)}
														alt={gem.description || ''}
														className="h-8 w-8 rounded flex-shrink-0"
													/>
												)}
												<div className="flex-1">
													<div className="flex justify-between gap-2 items-start">
														<span className="text-zinc-200 text-sm">
															{renderHtmlText(gem.description)}
														</span>
														<span className="text-zinc-500 text-sm font-medium">
															×{gem.count}
														</span>
													</div>
												</div>
											</li>
										))}
									</ul>
								</div>
							)}

							{/* Комплекты */}
							{sets1.length > 0 && (
								<div className="mb-6 mt-auto">
									<h4 className="text-sm font-semibold text-zinc-300 mb-2">
										Комплекты
									</h4>
									<ul className="space-y-3">
										{sets1.map((set) => (
											<li key={set.id} className="space-y-1">
												<div className="flex justify-between gap-2 text-sm items-start">
													<span className="text-zinc-200">
														{set.name}
													</span>
													<span className="text-zinc-400">
														{set.equipped}/{set.total}
													</span>
												</div>
												{set.setBonuses && set.setBonuses.length > 0 && (
													<div className="ml-0 space-y-1">
														{set.setBonuses
															.filter(bonus => bonus.used)
															.map((bonus, index) => (
																<div key={index} className="text-xs text-green-400 w-[80%]">
																	Комплект ({bonus.requiredItems} предмет): {renderHtmlText(bonus.spell)}
																</div>
															))}
													</div>
												)}
											</li>
										))}
									</ul>
								</div>
							)}

							</div>
						)}

						{/* Второй персонаж */}
						{(gems2.length > 0 || sets2.length > 0) && (
							<div className="text-right flex flex-col">
								<h3 className={`mb-4 text-lg font-medium ${classColor2}`}>
									{character2Name}
								</h3>
								
								{/* Сокеты */}
								{gems2.length > 0 && (
								<div className="mb-6">
									<h4 className="text-sm font-semibold text-zinc-300 mb-2">
										Сокеты
									</h4>
									<ul className="space-y-0">
										{gems2.map((gem, index) => (
											<li
												key={`${gem.color}-${gem.name}-${gem.description}`}
												className={`flex gap-3 leading-relaxed justify-end pb-3 ${
													index < gems2.length - 1 ? 'border-b border-zinc-800 mb-3' : ''
												}`}
											>
												<div className="flex-1 text-right">
													<div className="flex justify-between gap-2 items-start flex-row-reverse">
														<span className="text-zinc-200 text-sm">
															{renderHtmlText(gem.description)}
														</span>
														<span className="text-zinc-500 text-sm font-medium">
															×{gem.count}
														</span>
													</div>
												</div>
												{gem.icon && (
													<SafeImage
														src={getAbsoluteSirusImageUrl(gem.icon)}
														alt={gem.description || ''}
														className="h-8 w-8 rounded flex-shrink-0"
													/>
												)}
											</li>
										))}
									</ul>
								</div>
							)}

							{/* Комплекты */}
							{sets2.length > 0 && (
								<div className="mb-6 mt-auto">
									<h4 className="text-sm font-semibold text-zinc-300 mb-2">
										Комплекты
									</h4>
									<ul className="space-y-3">
										{sets2.map((set) => (
											<li key={set.id} className="space-y-1">
												<div className="flex justify-between gap-2 text-sm items-start flex-row-reverse">
													<span className="text-zinc-200">
														{set.name}
													</span>
													<span className="text-zinc-400">
														{set.equipped}/{set.total}
													</span>
												</div>
												{set.setBonuses && set.setBonuses.length > 0 && (
													<div className="mr-0 space-y-1 text-right">
														{set.setBonuses
															.filter(bonus => bonus.used)
															.map((bonus, index) => (
																<div key={index} className="text-xs text-green-400 w-[80%] ml-auto">
																	Комплект ({bonus.requiredItems} предмет): {renderHtmlText(bonus.spell)}
																</div>
															))}
													</div>
												)}
											</li>
										))}
									</ul>
								</div>
							)}

							</div>
						)}
					</div>
				</>
			)}
		</section>
	)
}

