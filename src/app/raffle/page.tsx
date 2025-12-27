'use client'

import { useState, useMemo, Fragment } from 'react'
import { RaffleCard } from '@/components/raffle/raffle-card'
import { WheelOfFortune } from '@/components/raffle/WheelOfFortune'
import { rafflePrizes } from '@/data/raffle-prizes'
import type { RafflePrize } from '@/types/raffle'

function shuffleArray<T> (array: T[]): T[] {
	const shuffled = [...array]
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
	}
	return shuffled
}

export default function RafflePage () {
	const [mode, setMode] = useState<'raffle' | 'wheel'>('raffle')
	const [shuffledPrizes, setShuffledPrizes] = useState(() => shuffleArray(rafflePrizes))
	const [hoveredRow, setHoveredRow] = useState<number | null>(null)
	const [hoveredCol, setHoveredCol] = useState<number | null>(null)
	const [players, setPlayers] = useState<string[]>([])
	const [playerInput, setPlayerInput] = useState('')
	const [revealedPrizeIds, setRevealedPrizeIds] = useState<Set<number>>(new Set())
	const [playerPrizes, setPlayerPrizes] = useState<Map<string, RafflePrize[]>>(new Map())
	const [prizeToPlayer, setPrizeToPlayer] = useState<Map<number, string>>(new Map())
	const [draggedOverPlayer, setDraggedOverPlayer] = useState<string | null>(null)
	const [cardKeys, setCardKeys] = useState(0)

	const handleReset = () => {
		setShuffledPrizes(shuffleArray(rafflePrizes))
		setRevealedPrizeIds(new Set())
		setPlayerPrizes(new Map())
		setPrizeToPlayer(new Map())
		setCardKeys((prev) => prev + 1)
	}

	const handlePrizeRevealed = (prizeId: number) => {
		setRevealedPrizeIds((prev) => new Set([...prev, prizeId]))
	}

	const handleDrop = (e: React.DragEvent, playerName: string) => {
		e.preventDefault()
		setDraggedOverPlayer(null)
		const prizeData = e.dataTransfer.getData('application/json')
		if (prizeData) {
			try {
				const prize: RafflePrize = JSON.parse(prizeData)
				// Проверяем, не была ли карточка уже перетащена
				if (prizeToPlayer.has(prize.id)) {
					return
				}
				
				setPlayerPrizes((prev) => {
					const newMap = new Map(prev)
					const currentPrizes = newMap.get(playerName) || []
					newMap.set(playerName, [...currentPrizes, prize])
					return newMap
				})
				
				setPrizeToPlayer((prev) => {
					const newMap = new Map(prev)
					newMap.set(prize.id, playerName)
					return newMap
				})
			} catch (error) {
				console.error('Failed to parse prize data:', error)
			}
		}
	}

	const handleDragOver = (e: React.DragEvent, playerName: string) => {
		e.preventDefault()
		e.dataTransfer.dropEffect = 'move'
		setDraggedOverPlayer(playerName)
	}

	const handleDragLeave = () => {
		setDraggedOverPlayer(null)
	}

	const handleAddPlayer = () => {
		const trimmedName = playerInput.trim()
		if (trimmedName && !players.includes(trimmedName)) {
			setPlayers([...players, trimmedName])
			setPlayerInput('')
		}
	}

	const handleRemovePlayer = (playerName: string) => {
		setPlayers(players.filter((p) => p !== playerName))
		
		// Удаляем призы участника
		setPlayerPrizes((prev) => {
			const newMap = new Map(prev)
			newMap.delete(playerName)
			return newMap
		})
		
		// Очищаем привязки карточек к этому участнику
		setPrizeToPlayer((prev) => {
			const newMap = new Map(prev)
			const prizesToRemove: number[] = []
			
			// Находим все карточки, привязанные к этому участнику
			newMap.forEach((assignedPlayer, prizeId) => {
				if (assignedPlayer === playerName) {
					prizesToRemove.push(prizeId)
				}
			})
			
			// Удаляем привязки
			prizesToRemove.forEach((prizeId) => {
				newMap.delete(prizeId)
			})
			
			return newMap
		})
	}

	const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			handleAddPlayer()
		}
	}

	const handlePlayerEliminated = (playerName: string) => {
		setPlayers((prev) => prev.filter((p) => p !== playerName))
	}

	const handleShufflePlayers = () => {
		setPlayers(shuffleArray(players))
	}

	// Количество столбцов в зависимости от размера экрана
	const colsCount = {
		base: 2,
		sm: 3,
		md: 4,
		lg: 5,
		xl: 10,
	}

	// Вычисляем количество строк на основе количества карточек и столбцов
	const getRowsCount = (cols: number) => Math.ceil(shuffledPrizes.length / cols)
	const rowsCount = getRowsCount(colsCount.xl)

	// Группируем призы по названию для списка
	const prizeGroups = useMemo(() => {
		const groups = new Map<string, { icon: string; quantities: number[]; rarity: string; prizeIds: number[] }>()
		
		rafflePrizes.forEach((prize) => {
			const existing = groups.get(prize.name)
			if (existing) {
				existing.quantities.push(prize.quantity)
				existing.prizeIds.push(prize.id)
			} else {
				groups.set(prize.name, {
					icon: prize.icon,
					quantities: [prize.quantity],
					rarity: prize.rarity || 'common',
					prizeIds: [prize.id],
				})
			}
		})

		return Array.from(groups.entries()).map(([name, data]) => {
			const revealedCount = data.prizeIds.filter((id) => revealedPrizeIds.has(id)).length
			const isFullyRevealed = revealedCount === data.prizeIds.length
			
			return {
				name,
				icon: data.icon,
				quantities: data.quantities,
				rarity: data.rarity,
				totalCount: data.quantities.length,
				revealedCount,
				isFullyRevealed,
			}
		})
	}, [revealedPrizeIds])

	const rarityColors = {
		common: 'border-zinc-600',
		uncommon: 'border-green-600',
		rare: 'border-blue-600',
		epic: 'border-purple-600',
		legendary: 'border-amber-500',
	}

	return (
		<main className='flex min-h-screen w-full flex-col'>
			{/* Заголовок с кнопкой сброса */}
			<div className='flex-shrink-0 border-b border-zinc-800 bg-zinc-950/80 px-6 py-4'>
				<div className='flex items-center justify-between'>
					<div>
						<h1 className='text-3xl font-bold text-zinc-100'>
							{mode === 'raffle' ? 'Розыгрыш призов' : 'Рулетка выбывания'}
						</h1>
						<p className='mt-1 text-zinc-400'>
							{mode === 'raffle'
								? 'Выберите карточку, чтобы узнать свой приз!'
								: 'Крутите колесо, чтобы определить выбывающего участника!'}
						</p>
					</div>
					<div className='flex items-center gap-4'>
						{/* Переключатель режимов */}
						<div className='flex rounded-lg border border-zinc-700 bg-zinc-800/50 p-1'>
							<button
								type='button'
								onClick={() => setMode('raffle')}
								className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
									mode === 'raffle'
										? 'bg-blue-600 text-white'
										: 'text-zinc-400 hover:text-zinc-100'
								}`}
							>
								Розыгрыш
							</button>
							<button
								type='button'
								onClick={() => setMode('wheel')}
								className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
									mode === 'wheel'
										? 'bg-blue-600 text-white'
										: 'text-zinc-400 hover:text-zinc-100'
								}`}
							>
								Рулетка
							</button>
						</div>
						{mode === 'raffle' && (
							<button
								type='button'
								onClick={handleReset}
								className='rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-700 hover:border-zinc-600'
							>
								Сбросить карточки
							</button>
						)}
					</div>
				</div>
			</div>

			{/* Основной контент */}
			<div className='flex min-h-0 h-100 flex-1 gap-8 overflow-hidden px-6 py-6'>
				{mode === 'wheel' ? (
					<div className='flex min-h-0 flex-1 flex-col gap-6 overflow-hidden'>
						<WheelOfFortune
							players={players}
							onPlayerEliminated={handlePlayerEliminated}
							onShufflePlayers={handleShufflePlayers}
						/>
					</div>
				) : (
					<div className='flex min-h-0 flex-1 flex-col gap-6 overflow-hidden'>
					{/* Блок с карточками */}
					<div className='flex min-h-0 flex-1 flex-col overflow-hidden' key={cardKeys}>
						<div className='flex min-h-0 flex-1 flex-col'>
							{/* Заголовки столбцов */}
							<div className='mb-2 flex-shrink-0 grid gap-4' style={{ gridTemplateColumns: `auto repeat(${colsCount.xl}, minmax(0, 1fr))` }}>
								<div className='flex items-center justify-center text-sm font-semibold text-zinc-500'>
									{/* Пустая ячейка для угла */}
								</div>
								{Array.from({ length: colsCount.xl }, (_, i) => (
									<div
										key={`col-${i}`}
										className={`flex items-center justify-center text-sm font-semibold transition-colors ${
											hoveredCol === i ? 'text-blue-400' : 'text-zinc-500'
										}`}
									>
										{i + 1}
									</div>
								))}
							</div>

							{/* Сетка карточек с номерами строк */}
							<div className='min-h-0 flex-1 overflow-hidden'>
								<div className='grid gap-4' style={{ gridTemplateColumns: `auto repeat(${colsCount.xl}, minmax(0, 1fr))` }}>
									{Array.from({ length: rowsCount }, (_, rowIndex) => {
										const startIndex = rowIndex * colsCount.xl
										const rowPrizes = shuffledPrizes.slice(startIndex, startIndex + colsCount.xl)

										return (
											<Fragment key={`row-${rowIndex}`}>
												{/* Номер строки */}
												<div
													className={`flex items-center justify-center text-sm font-semibold transition-colors ${
														hoveredRow === rowIndex ? 'text-blue-400' : 'text-zinc-500'
													}`}
												>
													{rowIndex + 1}
												</div>
												{/* Карточки в строке */}
												{rowPrizes.map((prize, colIndex) => {
													const index = startIndex + colIndex
													return (
														<RaffleCard
															key={`${prize.id}-${index}-${cardKeys}`}
															prize={prize}
															index={index}
															rowIndex={rowIndex}
															colIndex={colIndex}
															hoveredRow={hoveredRow}
															hoveredCol={hoveredCol}
															onMouseEnter={() => {
																setHoveredRow(rowIndex)
																setHoveredCol(colIndex)
															}}
															onMouseLeave={() => {
																setHoveredRow(null)
																setHoveredCol(null)
															}}
															onRevealed={handlePrizeRevealed}
															isAssigned={prizeToPlayer.has(prize.id)}
															assignedTo={prizeToPlayer.get(prize.id) || undefined}
														/>
													)
												})}
												{/* Заполнители для неполных строк */}
												{Array.from({ length: colsCount.xl - rowPrizes.length }, (_, i) => (
													<div key={`empty-${rowIndex}-${i}`} />
												))}
											</Fragment>
										)
									})}
								</div>
							</div>
						</div>
					</div>
					</div>
				)}

				{/* Список игроков и призов справа */}
				<aside className='hidden lg:flex min-h-0 max-h-[80vh] flex-shrink-0 gap-6'>
					{/* Список игроков */}
					<div className='flex max-h-[80vh] w-80 min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-lg shadow-black/40'>
						<h2 className='mb-4 flex-shrink-0 text-lg font-semibold text-zinc-100'>
							Участники ({players.length})
						</h2>
						
						{/* Поле ввода */}
						<div className='mb-4 flex flex-shrink-0 gap-2'>
							<input
								type='text'
								value={playerInput}
								onChange={(e) => setPlayerInput(e.target.value)}
								onKeyPress={handleKeyPress}
								placeholder='Введите имя игрока'
								className='flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
							/>
							<button
								type='button'
								onClick={handleAddPlayer}
								disabled={!playerInput.trim() || players.includes(playerInput.trim())}
								className='rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
							>
								+
							</button>
						</div>

						{/* Список игроков */}
						<div className='flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto'>
							{players.length === 0 ? (
								<div className='py-4 text-center text-sm text-zinc-500'>
									Список игроков пуст
								</div>
							) : (
								players.map((player, index) => {
									const wonPrizes = playerPrizes.get(player) || []
									const isDraggedOver = draggedOverPlayer === player
									return (
										<div
											key={`${player}-${index}`}
											onDrop={(e) => handleDrop(e, player)}
											onDragOver={(e) => handleDragOver(e, player)}
											onDragLeave={handleDragLeave}
											className={`rounded-lg border p-3 transition-all ${
												isDraggedOver
													? 'border-blue-500 bg-blue-900/30 shadow-lg shadow-blue-500/20 scale-105'
													: 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800/70'
											}`}
										>
											<div className='flex items-center justify-between mb-2'>
												<div className='flex items-center gap-3'>
													<div className='flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-zinc-300'>
														{index + 1}
													</div>
													<span className='text-sm font-semibold text-zinc-100'>{player}</span>
												</div>
												<button
													type='button'
													onClick={() => handleRemovePlayer(player)}
													className='rounded px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-red-400'
												>
													Удалить
												</button>
											</div>
											{wonPrizes.length > 0 && (
												<div className='mt-2 space-y-1 border-t border-zinc-700 pt-2'>
													<div className='text-xs font-semibold text-zinc-400 mb-1'>
														Выиграл:
													</div>
													{wonPrizes.map((prize, prizeIndex) => (
														<div
															key={`${prize.id}-${prizeIndex}`}
															className='flex items-center gap-2 rounded bg-zinc-900/50 p-1.5'
														>
															<div className='flex h-5 w-5 flex-shrink-0 items-center justify-center'>
																{prize.icon.startsWith('http') ? (
																	<img
																		src={prize.icon}
																		alt={prize.name}
																		className='h-5 w-5 object-contain'
																	/>
																) : (
																	<span className='text-sm'>{prize.icon}</span>
																)}
															</div>
															<div className='flex-1 min-w-0'>
																<div className='text-xs font-medium text-zinc-200 truncate'>
																	{prize.name}
																</div>
																<div className='text-[10px] text-zinc-500'>
																	×{prize.quantity}
																</div>
															</div>
														</div>
													))}
												</div>
											)}
										</div>
									)
								})
							)}
						</div>
					</div>

					{mode === 'raffle' && (
						<div className='flex max-h-[80vh] w-80 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-lg shadow-black/40'>
							<h2 className='mb-4 flex-shrink-0 text-lg font-semibold text-zinc-100'>
								Список призов
							</h2>
							<div className='flex flex-col gap-2 overflow-y-auto'>
								{prizeGroups.map((prize) => (
									<div
										key={prize.name}
										className={`rounded-lg border-2 p-3 ${
											prize.isFullyRevealed ? 'opacity-50' : ''
										} ${rarityColors[prize.rarity as keyof typeof rarityColors]}`}
									>
										<div className='flex items-center gap-3'>
											<div className='flex h-8 w-8 flex-shrink-0 items-center justify-center'>
												{prize.icon.startsWith('http') ? (
													<img
														src={prize.icon}
														alt={prize.name}
														className={`h-8 w-8 object-contain ${
															prize.isFullyRevealed ? 'opacity-50' : ''
														}`}
													/>
												) : (
													<span className={`text-2xl ${prize.isFullyRevealed ? 'opacity-50' : ''}`}>
														{prize.icon}
													</span>
												)}
											</div>
											<div className='flex-1'>
												<div
													className={`text-sm font-semibold ${
														prize.isFullyRevealed
															? 'line-through text-zinc-500'
															: 'text-zinc-100'
													}`}
												>
													{prize.name}
												</div>
												<div className='text-xs text-zinc-400'>
													В розыгрыше: {prize.totalCount} шт.
													{prize.revealedCount > 0 && (
														<span className='ml-2'>
															(Открыто: {prize.revealedCount})
														</span>
													)}
												</div>
												<div className='mt-1 text-xs text-zinc-500'>
													Количество: {prize.quantities.join(', ')}
												</div>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</aside>
			</div>
		</main>
	)
}
