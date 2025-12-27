'use client'

import { useState } from 'react'
import type { RafflePrize } from '@/types/raffle'

interface RaffleCardProps {
	prize: RafflePrize
	index: number
	rowIndex: number
	colIndex: number
	hoveredRow: number | null
	hoveredCol: number | null
	onMouseEnter: () => void
	onMouseLeave: () => void
	onRevealed?: (prizeId: number) => void
	isAssigned?: boolean
	assignedTo?: string
}

const rarityColors = {
	common: 'border-zinc-600 bg-zinc-800/50',
	uncommon: 'border-green-600 bg-green-900/20',
	rare: 'border-blue-600 bg-blue-900/20',
	epic: 'border-purple-600 bg-purple-900/20',
	legendary: 'border-amber-500 bg-amber-900/20',
}

export function RaffleCard ({
	prize,
	index,
	rowIndex,
	colIndex,
	hoveredRow,
	hoveredCol,
	onMouseEnter,
	onMouseLeave,
	onRevealed,
	isAssigned = false,
	assignedTo,
}: RaffleCardProps) {
	const [isRevealed, setIsRevealed] = useState(false)
	const [isAnimating, setIsAnimating] = useState(false)

	const handleClick = () => {
		if (!isRevealed && !isAnimating) {
			setIsAnimating(true)
			setTimeout(() => {
				setIsRevealed(true)
				onRevealed?.(prize.id)
				setTimeout(() => {
					setIsAnimating(false)
				}, 700)
			}, 300)
		}
	}

	const rarity = prize.rarity || 'common'
	const cardColor = rarityColors[rarity]
	const isHighlighted = hoveredRow === rowIndex || hoveredCol === colIndex

	const handleDragStart = (e: React.DragEvent) => {
		if (isRevealed && !isAssigned) {
			e.dataTransfer.effectAllowed = 'move'
			e.dataTransfer.setData('application/json', JSON.stringify(prize))
		} else {
			e.preventDefault()
		}
	}

	return (
		<button
			type='button'
			onClick={handleClick}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
			draggable={isRevealed && !isAssigned}
			onDragStart={handleDragStart}
			className={`group relative h-32 w-full rounded-lg border-2 transition-all duration-300 ${
				isAnimating ? 'animate-card-flip' : ''
			} ${
				isRevealed
					? `${cardColor} shadow-lg ${
							isAssigned
								? 'opacity-60 cursor-not-allowed'
								: 'cursor-move'
						} ${
							isHighlighted ? 'ring-2 ring-blue-500/50 ring-offset-2 ring-offset-zinc-900' : ''
						}`
					: `cursor-pointer shadow-md ${
							isHighlighted
								? 'border-blue-500 bg-blue-900/30 shadow-lg shadow-blue-500/20'
								: 'border-zinc-700 bg-zinc-900/80 hover:border-zinc-600 hover:bg-zinc-800/90 hover:shadow-lg'
						}`
			}`}
			disabled={!isRevealed && isAnimating}
		>
			{isRevealed ? (
				<div className='flex h-full flex-col items-center justify-center gap-2 p-3 animate-card-reveal'>
					<div className='flex h-8 w-8 items-center justify-center animate-prize-fade'>
						{prize.icon.startsWith('http') ? (
							<img
								src={prize.icon}
								alt={prize.name}
								className='h-8 w-8 object-contain'
								onError={(e) => {
									// Fallback to emoji if image fails to load
									const target = e.target as HTMLImageElement
									target.style.display = 'none'
									if (target.nextSibling) {
										;(target.nextSibling as HTMLElement).style.display = 'block'
									}
								}}
							/>
						) : null}
						{!prize.icon.startsWith('http') && (
							<span className='text-2xl'>{prize.icon}</span>
						)}
					</div>
					<div className='text-center animate-prize-fade' style={{ animationDelay: '0.1s' }}>
						<div className='text-sm font-semibold text-zinc-100'>
							{prize.name}
						</div>
						<div className='text-xs text-zinc-400'>
							Количество: {prize.quantity}
						</div>
						{isAssigned && assignedTo && (
							<div className='mt-1 text-[10px] text-zinc-500'>
								→ {assignedTo}
							</div>
						)}
					</div>
				</div>
			) : (
				<div className='flex h-full items-center justify-center'>
					<div className='text-4xl opacity-50 transition-opacity group-hover:opacity-70'>
						?
					</div>
				</div>
			)}
		</button>
	)
}

