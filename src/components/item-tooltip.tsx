'use client'

import { useState, useRef, useEffect, forwardRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { renderHtmlText } from '@/utils/html-utils'

interface ItemTooltipData {
	item: {
		entry: number
		name: string
		quality: number
		item_level: number
		required_level: number
		type: string
		inventory_type: number
		armor: number
		bonding: number
		durability: number
		sell_price: number
		price: {
			copper: number
			silver: number
			gold: number
		}
		stat_type1: number
		stat_value1: number
		stat_type2: number
		stat_value2: number
		stat_type3: number
		stat_value3: number
		stat_type4: number
		stat_value4: number
		stat_type5: number
		stat_value5: number
		stat_type6: number
		stat_value6: number
		stat_type7: number
		stat_value7: number
		stat_type8: number
		stat_value8: number
		stat_type9: number
		stat_value9: number
		stat_type10: number
		stat_value10: number
		sockets: Array<{
			slot: number
			color: number
			type: string
			gem: {
				GemID?: number
				icon?: string
				color?: number
				requires?: boolean
				slot?: number
				description?: string
			} | null
		}>
		socket_bonus_ench: {
			id: number
			name: string
		} | null
		is_right_gem_colors?: boolean
		enchantments?: {
			entry: number
			name: string
		} | null
		spell_triggers?: Array<{
			spellid: number
			trigger: number
			description: string
		}>
		itemset_data?: {
			id: number
			name: string
			items: Array<{
				entry: number
				quality: number
				icon: string
				name: string
				color: string
				realm_id: number
				slot: string
				equipped: boolean
			}>
			setBonuses: Array<{
				requiredItems: number
				spell: string
				spell_id: number
				used: boolean
			}>
			equipped: number
		} | null
	}
}

const STAT_TYPE_MAP: Record<number, string> = {
	3: 'к ловкости',
	4: 'к силе',
	5: 'к интеллекту',
	6: 'к духу',
	7: 'к выносливости',
	12: 'к защите',
	13: 'к уклонению',
	14: 'к парированию',
	15: 'к блокированию',
	16: 'к меткости в ближнем бою',
	17: 'к меткости в дальнем бою',
	18: 'к рейтингу блокирования',
	19: 'к рейтингу критического удара',
	20: 'к рейтингу меткости',
	21: 'к рейтингу критического удара заклинаний',
	22: 'к рейтингу скорости атаки',
	23: 'к рейтингу скорости заклинаний',
	24: 'к рейтингу меткости заклинаний',
	25: 'к рейтингу скорости атаки',
	26: 'к рейтингу скорости заклинаний',
	27: 'к рейтингу экспертизы',
	28: 'к рейтингу скорости атаки',
	29: 'к рейтингу скорости заклинаний',
	30: 'к рейтингу меткости',
	31: 'к рейтингу меткости',
	32: 'к рейтингу критического удара',
	33: 'к рейтингу скорости атаки',
	34: 'к рейтингу скорости заклинаний',
	35: 'к рейтингу меткости',
	36: 'к рейтингу критического удара',
	37: 'к рейтингу скорости атаки',
	38: 'к рейтингу скорости заклинаний',
	39: 'к рейтингу меткости',
	40: 'к рейтингу критического удара',
	41: 'к рейтингу скорости атаки',
	42: 'к рейтингу скорости заклинаний',
	43: 'к рейтингу меткости',
	44: 'к рейтингу критического удара',
	45: 'к силе заклинаний',
	46: 'к рейтингу скорости атаки',
	47: 'к рейтингу скорости заклинаний',
	48: 'к рейтингу мастерства',
}

const INVENTORY_TYPE_MAP: Record<number, string> = {
	1: 'Голова',
	2: 'Шея',
	3: 'Плечо',
	4: 'Рубашка',
	5: 'Грудь',
	6: 'Пояс',
	7: 'Ноги',
	8: 'Ступни',
	9: 'Запястья',
	10: 'Кисти рук',
	11: 'Палец',
	12: 'Аксессуар',
	13: 'Одноручное',
	14: 'Щит',
	15: 'Дальний бой',
	16: 'Спина',
	17: 'Двуручное',
	19: 'Сумка',
	20: 'Горло',
	21: 'Основная рука',
	22: 'Левая рука',
	23: 'Левая рука',
	25: 'Правая рука',
	26: 'Левая рука',
	28: 'Левая рука',
}

const SOCKET_COLOR_MAP: Record<string, string> = {
	red: 'Красное',
	yellow: 'Желтое',
	blue: 'Синее',
	meta: 'Особое',
	prismatic: 'Призматическое',
}

const QUALITY_COLORS: Record<number, string> = {
	0: '#9d9d9d', // Poor
	1: '#ffffff', // Common
	2: '#1eff00', // Uncommon
	3: '#0070dd', // Rare
	4: '#a335ee', // Epic
	5: '#ff8000', // Legendary
	6: '#e6cc80', // Artifact
}

// Основные статы (отображаются в основной секции)
const PRIMARY_STATS = [3, 4, 5, 6, 7] // Ловкость, Сила, Интеллект, Дух, Выносливость

// Дополнительные эффекты (отображаются в секции "Если на персонаже")
const SECONDARY_STATS = [
	12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
	30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47,
	48,
] // Все рейтинги и специальные эффекты

function formatStat (statType: number, statValue: number): string | null {
	if (!statType || !statValue) {
		return null
	}

	const statName = STAT_TYPE_MAP[statType]
	if (!statName) {
		return null
	}

	const sign = statValue > 0 ? '+' : ''
	return `${sign}${statValue} ${statName}`
}

const RATING_NAME_MAP: Record<number, string> = {
	12: 'защиты',
	13: 'уклонения',
	14: 'парирования',
	15: 'блокирования',
	16: 'меткости в ближнем бою',
	17: 'меткости в дальнем бою',
	18: 'блокирования',
	19: '1',
	20: 'меткости',
	21: 'критического удара заклинаний',
	22: 'скорости атаки',
	23: 'скорости заклинаний',
	24: 'меткости заклинаний',
	25: 'скорости атаки',
	26: 'скорости заклинаний',
	27: 'экспертизы',
	28: 'скорости атаки',
	29: 'скорости заклинаний',
	30: 'меткости',
	31: 'меткости',
	32: 'критического удара',
	33: 'скорости атаки',
	34: 'скорости заклинаний',
	35: 'меткости',
	36: 'скорости',
	37: 'скорости атаки',
	38: 'скорости заклинаний',
	39: 'меткости',
	40: '4',
	41: 'скорости атаки',
	42: 'скорости заклинаний',
	43: 'меткости',
	44: 'критического удара',
	45: 'силы заклинаний',
	46: 'скорости атаки',
	47: 'скорости заклинаний',
	48: 'мастерства',
}

function formatEquipEffect (statType: number, statValue: number): string | null {
	if (!statType || !statValue) {
		return null
	}

	// Для силы заклинаний
	if (statType === 45) {
		return `Увеличивает силу заклинаний на ${statValue}.`
	}

	// Для рейтингов используем специальный формат
	const ratingName = RATING_NAME_MAP[statType]
	if (ratingName) {
		return `Рейтинг ${ratingName} +${statValue}.`
	}

	return null
}

function formatPrice (price: { gold: number; silver: number; copper: number }): string {
	const parts: string[] = []

	if (price.gold > 0) {
		parts.push(`${price.gold.toLocaleString('ru-RU')} з`)
	}

	if (price.silver > 0) {
		parts.push(`${price.silver} с`)
	}

	if (price.copper > 0) {
		parts.push(`${price.copper} м`)
	}

	return parts.join(' ')
}

// Функция для парсинга WoW цветовых кодов из названия
function parseWowText (text: string): string {
	if (!text) {
		return ''
	}

	// Удаляем цветовые коды WoW: |c[A-Fa-f0-9]{8} (цвет) и |r (сброс цвета)
	// Также удаляем |n (новая строка) и заменяем на пробел
	return text
		.replace(/\|c[A-Fa-f0-9]{8}/g, '') // Удаляем |c + 8 hex символов
		.replace(/\|r/g, '') // Удаляем |r
		.replace(/\|n/g, ' ') // Заменяем |n на пробел
		.trim()
}

interface ItemTooltipProps {
	itemId: number
	children: React.ReactNode
	characterGuid?: number | null
	pinned?: boolean
	pinnedPosition?: { top: number; left: number; maxHeight: number }
	onClose?: () => void
}

export function ItemTooltip ({ itemId, children, characterGuid, pinned = false, pinnedPosition, onClose }: ItemTooltipProps) {
	const [isHovered, setIsHovered] = useState(false)
	const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number; maxHeight: number } | null>(null)
	const containerRef = useRef<HTMLDivElement>(null)
	const tooltipRef = useRef<HTMLDivElement>(null)
	const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)

	const { data, isLoading } = useQuery<ItemTooltipData>({
		queryKey: ['item-tooltip', itemId, characterGuid],
		queryFn: async () => {
			const { fetchSirusAPI, SIRUS_API } = await import('@/lib/sirus-api')
			const url = SIRUS_API.itemTooltip(itemId, characterGuid ?? undefined)
			return fetchSirusAPI(url)
		},
		enabled: !!itemId && (isHovered || pinned),
	})

	useEffect(() => {
		if (isHovered && containerRef.current) {
			const updatePosition = () => {
				if (containerRef.current) {
					const rect = containerRef.current.getBoundingClientRect()
					const tooltipWidth = 320 // w-80 = 320px
					const maxTooltipHeight = window.innerHeight * 0.8 // 80vh
					const spacing = 8 // отступ

					// Проверяем, помещается ли тултип справа
					const spaceOnRight = window.innerWidth - rect.right
					const spaceOnLeft = rect.left

					let left: number
					if (spaceOnRight >= tooltipWidth + spacing) {
						// Помещается справа
						left = rect.right + spacing
					} else if (spaceOnLeft >= tooltipWidth + spacing) {
						// Помещается слева
						left = rect.left - tooltipWidth - spacing
					} else {
						// Не помещается ни справа, ни слева - показываем справа, но с учетом границ
						left = Math.max(spacing, window.innerWidth - tooltipWidth - spacing)
					}

					// Вычисляем позицию по вертикали
					// Приоритет: оставаться рядом с элементом, но обеспечить достаточную высоту
					let top: number
					let maxHeight: number

					// Проверяем доступное пространство
					const spaceBelow = window.innerHeight - rect.top - spacing
					const spaceAbove = rect.top - spacing
					const minComfortableHeight = 300 // Минимальная комфортная высота для просмотра

					// Если снизу достаточно места для максимальной высоты
					if (spaceBelow >= maxTooltipHeight) {
						// Используем максимальную высоту, выравниваем по верху элемента
						top = Math.max(spacing, rect.top)
						maxHeight = maxTooltipHeight
					} else if (spaceBelow >= minComfortableHeight) {
						// Снизу достаточно места для комфортного просмотра
						// Остаемся рядом с элементом
						top = Math.max(spacing, rect.top)
						maxHeight = spaceBelow
					} else {
						// Снизу очень мало места - нужно поднять тултип
						// Но стараемся остаться как можно ближе к элементу
						
						// Вычисляем, насколько нужно поднять, чтобы получить комфортную высоту
						const neededTop = window.innerHeight - minComfortableHeight - spacing
						
						// Ограничиваем поднятие - не поднимаем выше, чем на 100px от верха элемента
						// Это сохраняет визуальную связь с элементом
						const maxAllowedLift = Math.max(0, rect.top - 100)
						const optimalTop = Math.max(spacing, Math.min(neededTop, maxAllowedLift))
						
						top = optimalTop
						maxHeight = window.innerHeight - top - spacing
						
						// Если все равно получилось слишком мало места, используем минимум
						if (maxHeight < 200) {
							top = Math.max(spacing, window.innerHeight - 200 - spacing)
							maxHeight = 200
						}
					}

					setTooltipPosition({ top, left, maxHeight })
				}
			}

			updatePosition()
			window.addEventListener('scroll', updatePosition, true)
			window.addEventListener('resize', updatePosition)

			return () => {
				window.removeEventListener('scroll', updatePosition, true)
				window.removeEventListener('resize', updatePosition)
			}
		} else {
			setTooltipPosition(null)
		}
	}, [isHovered])

	const handleMouseEnter = () => {
		// Очищаем таймер скрытия, если он есть
		if (hideTimeoutRef.current) {
			clearTimeout(hideTimeoutRef.current)
			hideTimeoutRef.current = null
		}
		setIsHovered(true)
	}

	const handleMouseLeave = () => {
		// Добавляем задержку перед скрытием тултипа
		hideTimeoutRef.current = setTimeout(() => {
			setIsHovered(false)
			hideTimeoutRef.current = null
		}, 100) // 100ms задержка для плавного перехода
	}

	// Очищаем таймер при размонтировании
	useEffect(() => {
		return () => {
			if (hideTimeoutRef.current) {
				clearTimeout(hideTimeoutRef.current)
			}
		}
	}, [])

	const showTooltip = (isHovered || pinned) && data && !isLoading
	const finalPosition = pinned && pinnedPosition ? pinnedPosition : tooltipPosition

	return (
		<>
			<div
				ref={containerRef}
				className='group relative inline-block'
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
			>
				{children}
			</div>
			{showTooltip && finalPosition && (
				<TooltipContent
					ref={tooltipRef}
					item={data.item}
					itemset={data.item.itemset_data}
					position={finalPosition}
					onMouseEnter={handleMouseEnter}
					onMouseLeave={handleMouseLeave}
					pinned={pinned}
					onClose={onClose}
				/>
			)}
		</>
	)
}

const TooltipContent = forwardRef<
	HTMLDivElement,
	{
		item: ItemTooltipData['item']
		itemset?: ItemTooltipData['item']['itemset_data']
		position: { top: number; left: number; maxHeight: number }
		onMouseEnter: () => void
		onMouseLeave: () => void
		pinned?: boolean
		onClose?: () => void
	}
>(function TooltipContent ({ item, itemset, position, onMouseEnter, onMouseLeave, pinned = false, onClose }, ref) {
	const qualityColor = QUALITY_COLORS[item.quality] ?? '#ffffff'
	const inventoryTypeName = INVENTORY_TYPE_MAP[item.inventory_type] ?? ''

	const primaryStats: string[] = []
	const equipEffects: string[] = []
	const statPairs = [
		[item.stat_type1, item.stat_value1],
		[item.stat_type2, item.stat_value2],
		[item.stat_type3, item.stat_value3],
		[item.stat_type4, item.stat_value4],
		[item.stat_type5, item.stat_value5],
		[item.stat_type6, item.stat_value6],
		[item.stat_type7, item.stat_value7],
		[item.stat_type8, item.stat_value8],
		[item.stat_type9, item.stat_value9],
		[item.stat_type10, item.stat_value10],
	]

	for (const [statType, statValue] of statPairs) {
		if (!statType || !statValue) {
			continue
		}

		if (PRIMARY_STATS.includes(statType)) {
			const formattedStat = formatStat(statType, statValue)
			if (formattedStat) {
				primaryStats.push(formattedStat)
			}
		} else if (SECONDARY_STATS.includes(statType)) {
			const formattedEffect = formatEquipEffect(statType, statValue)
			if (formattedEffect) {
				equipEffects.push(formattedEffect)
			}
		}
	}

	// Разделяем гнезда на пустые и заполненные
	const emptySockets = item.sockets
		.filter((socket) => {
			// Гнездо считается пустым, если gem отсутствует, null, или не является объектом
			return !socket.gem || socket.gem === null || typeof socket.gem !== 'object'
		})
		.map((socket) => {
			const colorName = SOCKET_COLOR_MAP[socket.type] ?? socket.type
			return {
				text: `${colorName} гнездо`,
				type: socket.type,
			}
		})

	const filledSockets = item.sockets
		.filter((socket) => {
			// Гнездо считается заполненным, если gem существует и является объектом
			return socket.gem && typeof socket.gem === 'object' && 'GemID' in socket.gem
		})
		.map((socket) => socket)

	const getSocketColorClass = (socketType: string): string => {
		switch (socketType) {
		case 'red':
			return 'text-red-400'
		case 'yellow':
			return 'text-yellow-400'
		case 'blue':
			return 'text-blue-400'
		case 'meta':
			return 'text-purple-400'
		case 'prismatic':
			return 'text-cyan-400'
		default:
			return 'text-blue-400'
		}
	}

	return (
		<div
			ref={ref}
			className='pointer-events-auto fixed z-50 w-80 overflow-y-auto rounded border-2 border-zinc-600 bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 p-3 text-xs shadow-2xl backdrop-blur-sm'
			style={{
				top: `${position.top}px`,
				left: `${position.left}px`,
				maxHeight: `${position.maxHeight}px`,
			}}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
		>
			{pinned && onClose && (
				<button
					onClick={(e) => {
						e.stopPropagation()
						onClose()
					}}
					className='absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200'
					aria-label='Закрыть тултип'
				>
					<svg
						className='h-4 w-4'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M6 18L18 6M6 6l12 12'
						/>
					</svg>
				</button>
			)}
			<div className='space-y-0.5'>
					{/* Название предмета */}
					<div
						className='text-sm font-semibold leading-tight'
						style={{ color: qualityColor }}
					>
						{renderHtmlText(item.name)}
					</div>

					{/* Становится персональным */}
					{item.bonding === 1 && (
						<div className='text-zinc-400 text-[11px]'>
							Становится персональным при получении
						</div>
					)}

					{/* Тип предмета */}
					{inventoryTypeName && (
						<div className='text-zinc-300 text-[11px]'>
							{inventoryTypeName}
						</div>
					)}

					{/* Тип брони */}
					{item.type && (
						<div className='text-zinc-300 text-[11px]'>
							{item.type}
						</div>
					)}

					{/* Броня */}
					{item.armor > 0 && (
						<div className='text-zinc-300 text-[11px]'>
							Броня: {item.armor}
						</div>
					)}

					{/* Основные статы */}
					{primaryStats.map((stat, index) => (
						<div key={index} className='text-zinc-300 text-[11px]'>
							{stat}
						</div>
					))}

					{/* Зачарования */}
					{item.enchantments && item.enchantments.name && (
						<div className='text-green-400 text-[11px] mt-1'>
							{renderHtmlText(item.enchantments.name)}
						</div>
					)}

					{/* Гнезда с камнями (показываем первыми) */}
					{filledSockets.length > 0 && (
						<div className='space-y-1 mt-1'>
							{filledSockets.map((socket, index) => {
								if (!socket.gem || typeof socket.gem !== 'object' || !('GemID' in socket.gem)) return null
								const gem = socket.gem
								const colorName = SOCKET_COLOR_MAP[socket.type] ?? socket.type
								return (
									<div key={index} className='flex items-start gap-2'>
										{gem.icon && (
											<img
												src={gem.icon}
												alt=''
												className='h-4 w-4 rounded flex-shrink-0 mt-0.5'
											/>
										)}
										<div className='flex-1'>
											<div className={`${getSocketColorClass(socket.type)} text-[11px]`}>
												{colorName} гнездо
											</div>
											{gem.description && (
												<div className='text-zinc-300 text-[11px] mt-0.5'>
													{renderHtmlText(gem.description)}
												</div>
											)}
										</div>
									</div>
								)
							})}
						</div>
					)}

					{/* Пустые гнезда */}
					{emptySockets.length > 0 && (
						<div className='space-y-0.5 mt-1'>
							{emptySockets.map((socket, index) => (
								<div
									key={index}
									className={`${getSocketColorClass(socket.type)} text-[11px]`}
								>
									{socket.text}
								</div>
							))}
						</div>
					)}

					{/* Бонус гнезд */}
					{item.socket_bonus_ench && (
						<div
							className={`text-[11px] ${
								item.is_right_gem_colors
									? 'text-green-400'
									: 'text-zinc-500'
							}`}
						>
							При соответствии цвета: {item.socket_bonus_ench.name}
						</div>
					)}

					{/* Прочность */}
					{item.durability > 0 && (
						<div className='text-zinc-300 text-[11px]'>
							Прочность {item.durability} / {item.durability}
						</div>
					)}

					{/* Требуется уровень */}
					{item.required_level > 0 && (
						<div className='text-zinc-300 text-[11px]'>
							Требуется уровень: {item.required_level}
						</div>
					)}

					{/* Уровень предмета */}
					<div className='text-yellow-400 text-[11px]'>
						Уровень предмета {item.item_level}
					</div>

					{/* Эффекты при надевании */}
					{equipEffects.length > 0 && (
						<>
							{equipEffects.map((effect, index) => (
								<div key={index} className='text-green-400 text-[11px]'>
									Если на персонаже: {renderHtmlText(effect)}
								</div>
							))}
						</>
					)}

					{/* Дополнительные эффекты из spell_triggers */}
					{item.spell_triggers &&
						item.spell_triggers
							.filter((trigger) => trigger.trigger === 1)
							.map((trigger, index) => (
								<div key={index} className='text-green-400 text-[11px]'>
									Если на персонаже: {renderHtmlText(trigger.description)}
								</div>
							))}

					{/* Комплект предметов */}
					{itemset && itemset.items && itemset.items.length > 0 && (
						<div className='mt-2 space-y-1 border-t border-zinc-700 pt-2'>
							{/* Название сета с счетчиком */}
							<div className='text-zinc-200 text-[11px]'>
								{parseWowText(itemset.name)} ({itemset.equipped}/{itemset.items.length})
							</div>

							{/* Список предметов сета */}
							<div className='space-y-0.5 mt-1'>
								{itemset.items.map((setItem) => {
									const itemColor = QUALITY_COLORS[setItem.quality] ?? '#ffffff'
									return (
										<div
											key={setItem.entry}
											className='text-[11px]'
											style={{
												color: setItem.equipped
													? itemColor
													: '#9d9d9d',
											}}
										>
											- {renderHtmlText(setItem.name)}
										</div>
									)
								})}
							</div>

							{/* Бонусы сета */}
							{itemset.setBonuses && itemset.setBonuses.length > 0 && (
								<div className='mt-2 space-y-0.5'>
									{itemset.setBonuses.map((bonus, index) => (
										<div
											key={index}
											className={`text-[11px] ${
												bonus.used
													? 'text-green-400'
													: 'text-zinc-300'
											}`}
										>
											Комплект ({bonus.requiredItems} предмет): {renderHtmlText(bonus.spell)}
										</div>
									))}
								</div>
							)}
						</div>
					)}

					{/* Цена продажи */}
					{item.sell_price > 0 && (
						<div className='mt-1 flex items-center gap-1 text-zinc-300 text-[11px]'>
							<span>Цена продажи:</span>
							<span>{formatPrice(item.price)}</span>
						</div>
					)}
				</div>
		</div>
	)
})

