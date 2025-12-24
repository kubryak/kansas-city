import React from 'react'
import { SafeImage } from '@/components/safe-image'
import { renderHtmlText } from '@/utils/html-utils'

type EquipmentItem = {
	entry?: number
	icon?: string
	item_instance?: unknown
}

type SocketType = {
	type: string
	gem?: {
		GemID?: number
		icon?: string
		description?: string
	} | null
}

const SOCKET_COLOR_LABELS: Record<string, string> = {
	red: 'Красное',
	yellow: 'Жёлтое',
	blue: 'Синее',
	meta: 'Мета',
	prismatic: 'Призматическое',
}

function hasItemInstance (item: EquipmentItem | null | undefined): boolean {
	if (!item) return false
	const instance: unknown = item.item_instance
	return instance != null
}

function getAbsoluteSirusImageUrl (relativePath: string): string {
	if (relativePath.startsWith('http')) {
		return relativePath
	}
	return `https://sirus.su${relativePath}`
}

function parseWowText (text: string | null | undefined): string {
	if (!text) {
		return ''
	}

	return text
		.replace(/\|c[A-Fa-f0-9]{8}/g, '')
		.replace(/\|r/g, '')
		.replace(/\|n/g, ' ')
		.trim()
}

interface CharacterSocketsSummaryProps {
	characterGuid: number
	equipments: Array<EquipmentItem> | null | undefined
}

interface GemSummaryItem {
	color: string
	name: string
	description: string
	icon?: string
	count: number
}

interface ItemSetSummaryItem {
	id: number
	name: string
	equipped: number
	total: number
}

export function CharacterSocketsSummary ({
	characterGuid,
	equipments,
}: CharacterSocketsSummaryProps) {
	const [gemsSummary, setGemsSummary] = React.useState<GemSummaryItem[]>([])
	const [itemSetsSummary, setItemSetsSummary] = React.useState<ItemSetSummaryItem[]>([])
	const [isGemsLoading, setIsGemsLoading] = React.useState(false)
	const [gemsError, setGemsError] = React.useState<string | null>(null)
	const [lastClickTime, setLastClickTime] = React.useState<number | null>(null)
	const [cooldownRemaining, setCooldownRemaining] = React.useState<number>(0)

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

	const handleCalculateGems = React.useCallback(async () => {
		if (isGemsLoading || cooldownRemaining > 0) {
			return
		}

		if (!equipments || equipments.length === 0) {
			setGemsSummary([])
			setItemSetsSummary([])
			return
		}

		const itemsWithEntry = equipments.filter(
			(item) => item.entry != null || hasItemInstance(item),
		)

		if (itemsWithEntry.length === 0) {
			setGemsSummary([])
			setItemSetsSummary([])
			return
		}

		setIsGemsLoading(true)
		setGemsError(null)

		const summaryMap = new Map<string, GemSummaryItem>()
		const itemSetMap = new Map<number, ItemSetSummaryItem>()

		try {
			const tooltipPromises = itemsWithEntry.map(async (item) => {
				if (!item.entry) {
					return { sockets: [] as SocketType[], itemset: null as any }
				}

				const res = await fetch(
					`/api/tooltip/item/${item.entry}?guid=${characterGuid}`,
				)

				if (!res.ok) {
					throw new Error('Failed to fetch item tooltip')
				}

				const data = await res.json() as any
				const sockets = data?.item?.sockets as SocketType[] | undefined
				const itemset = data?.item?.itemset_data as {
					id?: number
					name?: string
					items?: Array<{ equipped?: boolean }>
					equipped?: number
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

				const name = parseWowText(itemset.name ?? '')

				const currentSet = itemSetMap.get(setId)
				if (currentSet) {
					currentSet.equipped = Math.max(
						currentSet.equipped,
						equippedPieces,
					)
					currentSet.total = Math.max(currentSet.total, total)
				} else {
					itemSetMap.set(setId, {
						id: setId,
						name: name || `Комплект ${setId}`,
						equipped: equippedPieces,
						total,
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
			setGemsSummary(gemsList)

			const setsList = Array.from(itemSetMap.values()).sort((a, b) => {
				if (b.equipped !== a.equipped) {
					return b.equipped - a.equipped
				}
				return a.name.localeCompare(b.name, 'ru')
			})
			setItemSetsSummary(setsList)
		} catch (err) {
			setGemsError('Не удалось загрузить данные о сокетах')
			setGemsSummary([])
			setItemSetsSummary([])
		} finally {
			setIsGemsLoading(false)
			setLastClickTime(Date.now())
		}
	}, [characterGuid, equipments, isGemsLoading, cooldownRemaining])

	const isCooldownActive = cooldownRemaining > 0
	const cooldownSeconds = Math.ceil(cooldownRemaining / 1000)

	return (
		<div className='w-64 text-xs text-zinc-300'>
			<div className='mb-4 flex items-center justify-end gap-2'>
				<button
					type='button'
					disabled={isGemsLoading || isCooldownActive}
					className={`text-[11px] px-2 py-1 rounded border border-zinc-700 text-zinc-200 ${
						isGemsLoading || isCooldownActive
							? 'opacity-60 cursor-not-allowed'
							: 'hover:bg-zinc-800'
					}`}
					onClick={handleCalculateGems}
				>
					{isCooldownActive
						? `Кулдаун ${cooldownSeconds}с`
						: 'Показать сокеты и комплекты'}
				</button>
			</div>
			{isGemsLoading && (
				<p className='text-zinc-400'>Загрузка сокетов…</p>
			)}
			{!isGemsLoading && gemsError && (
				<p className='text-red-400'>{gemsError}</p>
			)}
			{!isGemsLoading && !gemsError && gemsSummary.length === 0 && itemSetsSummary.length === 0 && (
				<p className='text-zinc-500'>
					Нажмите кнопку, чтобы загрузить сокеты и комплекты.
				</p>
			)}
			{!isGemsLoading && !gemsError && gemsSummary.length > 0 && (
				<ul className='space-y-2'>
					{gemsSummary.map((gem) => (
						<li
							key={`${gem.color}-${gem.name}-${gem.description}`}
							className='flex gap-2 leading-snug'
						>
							{gem.icon && (
								<SafeImage
									src={getAbsoluteSirusImageUrl(gem.icon)}
									alt={gem.description || ''}
									className='h-5 w-5 rounded flex-shrink-0 mt-0.5'
								/>
							)}
							<div className='flex-1'>
								<div className='flex justify-between gap-2'>
									<span className='text-zinc-200 text-[11px] mt-0.5'>
										{renderHtmlText(gem.description)}
									</span>
									<span className='text-zinc-500 text-[11px]'>
										×{gem.count}
									</span>
								</div>
							</div>
						</li>
					))}
				</ul>
			)}
			{!isGemsLoading && !gemsError && itemSetsSummary.length > 0 && (
				<div className='mt-4'>
					<h4 className='text-xs font-semibold text-zinc-300 mb-1'>
						Комплекты
					</h4>
					<ul className='space-y-1'>
						{itemSetsSummary.map((set) => (
							<li
								key={set.id}
								className='flex justify-between gap-2 text-[11px]'
							>
								<span className='text-zinc-200'>
									{renderHtmlText(set.name)}
								</span>
								<span className='text-zinc-400'>
									{set.equipped}/{set.total}
								</span>
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	)
}


