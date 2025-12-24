'use client'

import React from 'react'
import { SafeImage } from '@/components/safe-image'
import { getAbsoluteSirusImageUrl } from '@/utils/character-meta'

export interface PveTooltipState {
	raidName: string
	difficulty: string
	type: string
	encounters: Array<{ name: string; killed: boolean }>
	x: number
	y: number
}

interface CharacterPveProgressProps {
	groupedPve: Array<{
		mapId: number
		mapName: string
		background: string
		difficulties: Record<number, any>
	}>
	isPveExpanded: boolean
	onToggleExpanded: () => void
	onSetTooltip: (tooltip: PveTooltipState | null) => void
}

export function CharacterPveProgress({
	groupedPve,
	isPveExpanded,
	onToggleExpanded,
	onSetTooltip,
}: CharacterPveProgressProps) {
	if (groupedPve.length === 0) return null

	const sortedGroupedPve = [...groupedPve].sort((a, b) => {
		const getRaidPriority = (
			raid: any
		): { score: number; order: number } => {
			const n10 = raid.difficulties[0]
			const n25 = raid.difficulties[1]
			const h10 = raid.difficulties[2]
			const h25 = raid.difficulties[3]

			const hasNormal = !!(n10 || n25)
			const hasHeroic = !!(h10 || h25)

			const normalAnyActual =
				(n10 && n10.actual === true) || (n25 && n25.actual === true)
			const heroicAnyActual =
				(h10 && h10.actual === true) || (h25 && h25.actual === true)

			// Все имеющиеся сложности актуальны?
			const normalAllActual =
				!hasNormal ||
				((!n10 || n10.actual === true) && (!n25 || n25.actual === true))
			const heroicAllActual =
				!hasHeroic ||
				((!h10 || h10.actual === true) && (!h25 || h25.actual === true))

			// Приоритет группы рейда
			// 0: все сложности (норм+гер), которые есть, актуальны
			// 1: есть актуальные нормальные (10/25 об)
			// 2: есть актуальные только героические (10/25 гер)
			// 3: нет актуальных вообще
			let score: number
			if (
				normalAllActual &&
				heroicAllActual &&
				(hasNormal || hasHeroic)
			) {
				score = 0
			} else if (normalAnyActual) {
				score = 1
			} else if (!normalAnyActual && heroicAnyActual) {
				score = 2
			} else {
				score = 3
			}

			// Берём минимальный order из сложностей, чтобы сохранить логический порядок
			const orders = Object.values(raid.difficulties || {})
				.map((d: any) => d?.order)
				.filter((v: any) => typeof v === 'number') as number[]
			const order = orders.length > 0 ? Math.min(...orders) : 9999

			return { score, order }
		}

		const aP = getRaidPriority(a)
		const bP = getRaidPriority(b)

		if (aP.score !== bP.score) {
			return aP.score - bP.score
		}

		return aP.order - bP.order
	})

	return (
		<div className="mt-6">
			<h3 className="mb-3 text-sm font-semibold text-zinc-300">
				PvE прогресс
			</h3>
			<div
				className={`grid grid-cols-1 gap-3 lg:grid-cols-2 ${
					isPveExpanded ? '' : 'max-h-[170px] overflow-hidden'
				}`}
			>
				{sortedGroupedPve.flatMap((raid) => {
					// 0 - 10 об, 1 - 25 об, 2 - 10 гер, 3 - 25 гер
					const normal10 = raid.difficulties[0]
					const normal25 = raid.difficulties[1]
					const heroic10 = raid.difficulties[2]
					const heroic25 = raid.difficulties[3]

					const cards: Array<{
						isActual: boolean
						card: React.ReactElement
					}> = []

					// Карточка для обычных сложностей (10/25 об)
					if (normal10 || normal25) {
						const diff10 = normal10
						const diff25 = normal25

						const diff10Type = 'об.'
						const diff25Type = 'об.'

						const isDiff10Actual =
							diff10 && diff10.actual === true
						const isDiff25Actual =
							diff25 && diff25.actual === true
						const isActual = isDiff10Actual || isDiff25Actual

						const background =
							diff10?.background ||
							diff25?.background ||
							raid.background

						cards.push({
							isActual,
							card: (
								<div
									key={`${raid.mapId}-normal`}
									className={`relative rounded-lg border ${
										isActual
											? 'border-zinc-700 bg-zinc-800/50'
											: 'border-zinc-900 bg-zinc-900/40'
									}`}
								>
									{background && (
										<div className="absolute inset-0 opacity-15">
											<SafeImage
												src={getAbsoluteSirusImageUrl(background)}
												alt={raid.mapName}
												className="h-full w-full object-cover"
											/>
										</div>
									)}

									<div className={`relative p-4`}>
										<div className="mb-3 flex items-start justify-between gap-2">
											<div>
												<h4 className="text-sm font-semibold text-zinc-100">
													{raid.mapName}
												</h4>
												{!isActual && (
													<p className="mt-0.5 text-[11px] text-zinc-500">
														Рейд неактуален
													</p>
												)}
											</div>
											<div className="flex flex-col items-end gap-1 text-[11px] text-zinc-400">
												{diff10?.equipment && (
													<span>
														10 {diff10Type}: ilvl{' '}
														{diff10.equipment}
													</span>
												)}
												{diff25?.equipment && (
													<span>
														25 {diff25Type}: ilvl{' '}
														{diff25.equipment}
													</span>
												)}
											</div>
										</div>

										<div className="space-y-2 text-xs">
											{diff10 && (
												<div className="relative">
													<div className="mb-1">
														<span className="text-zinc-400">
															10 {diff10Type}: {diff10.progressed}{' '}
															/ {diff10.encounters.length}
														</span>
													</div>
													<div
														className="grid grid-cols-[1fr_auto] items-center gap-2"
														onMouseEnter={(e) => {
															const rect =
																e.currentTarget.getBoundingClientRect()
															onSetTooltip({
																raidName: raid.mapName,
																difficulty: '10',
																type: diff10Type,
																encounters: diff10.encounters || [],
																x: rect.left,
																y: rect.bottom + 8,
															})
														}}
														onMouseLeave={() => onSetTooltip(null)}
													>
														<div className="h-1.5 overflow-hidden rounded-full bg-zinc-700">
															<div
																className={`h-full transition-all ${
																	isDiff10Actual
																		? 'bg-gradient-to-r from-green-500 to-green-600'
																		: 'bg-zinc-600'
																}`}
																style={{
																	width: `${diff10.percentage}%`,
																}}
															/>
														</div>
														<span className="w-10 text-right text-zinc-300 font-medium text-xs whitespace-nowrap">
															{Math.round(diff10.percentage)}%
														</span>
													</div>
												</div>
											)}

											{diff25 && (
												<div className="relative">
													<div className="mb-1">
														<span className="text-zinc-400">
															25 {diff25Type}: {diff25.progressed}{' '}
															/ {diff25.encounters.length}
														</span>
													</div>
													<div
														className="grid grid-cols-[1fr_auto] items-center gap-2"
														onMouseEnter={(e) => {
															const rect =
																e.currentTarget.getBoundingClientRect()
															onSetTooltip({
																raidName: raid.mapName,
																difficulty: '25',
																type: diff25Type,
																encounters: diff25.encounters || [],
																x: rect.left,
																y: rect.bottom + 8,
															})
														}}
														onMouseLeave={() => onSetTooltip(null)}
													>
														<div className="h-1.5 overflow-hidden rounded-full bg-zinc-700">
															<div
																className={`h-full transition-all ${
																	isDiff25Actual
																		? 'bg-gradient-to-r from-blue-500 to-blue-600'
																		: 'bg-zinc-600'
																}`}
																style={{
																	width: `${diff25.percentage}%`,
																}}
															/>
														</div>
														<span className="w-10 text-right text-zinc-300 font-medium text-xs whitespace-nowrap">
															{Math.round(diff25.percentage)}%
														</span>
													</div>
												</div>
											)}
										</div>
									</div>
								</div>
							),
						})
					}

					// Карточка для героических сложностей (10/25 гер)
					if (heroic10 || heroic25) {
						const diff10 = heroic10
						const diff25 = heroic25

						const diff10Type = 'гер.'
						const diff25Type = 'гер.'

						const isDiff10Actual =
							diff10 && diff10.actual === true
						const isDiff25Actual =
							diff25 && diff25.actual === true
						const isActual = isDiff10Actual || isDiff25Actual

						const background =
							diff10?.background ||
							diff25?.background ||
							raid.background

						cards.push({
							isActual,
							card: (
								<div
									key={`${raid.mapId}-heroic`}
									className={`relative rounded-lg border ${
										isActual
											? 'border-zinc-700 bg-zinc-800/50'
											: 'border-zinc-900 bg-zinc-900/40'
									}`}
								>
									{background && (
										<div className="absolute inset-0 opacity-15">
											<SafeImage
												src={getAbsoluteSirusImageUrl(background)}
												alt={raid.mapName}
												className="h-full w-full object-cover"
											/>
										</div>
									)}

									<div
										className={`relative p-4 ${
											!isActual ? 'opacity-60' : ''
										}`}
									>
										<div className="mb-3 flex items-start justify-between gap-2">
											<div>
												<h4 className="text-sm font-semibold text-zinc-100">
													{raid.mapName}
												</h4>
												{!isActual && (
													<p className="mt-0.5 text-[11px] text-zinc-500">
														Рейд неактуален
													</p>
												)}
											</div>
											<div className="flex flex-col items-end gap-1 text-[11px] text-zinc-400">
												{diff10?.equipment && (
													<span>
														10 {diff10Type}: ilvl{' '}
														{diff10.equipment}
													</span>
												)}
												{diff25?.equipment && (
													<span>
														25 {diff25Type}: ilvl{' '}
														{diff25.equipment}
													</span>
												)}
											</div>
										</div>

										<div className="space-y-2 text-xs">
											{diff10 && (
												<div className="relative">
													<div className="mb-1">
														<span className="text-zinc-400">
															10 {diff10Type}: {diff10.progressed}{' '}
															/ {diff10.encounters.length}
														</span>
													</div>
													<div
														className="grid grid-cols-[1fr_auto] items-center gap-2"
														onMouseEnter={(e) => {
															const rect =
																e.currentTarget.getBoundingClientRect()
															onSetTooltip({
																raidName: raid.mapName,
																difficulty: '10',
																type: diff10Type,
																encounters: diff10.encounters || [],
																x: rect.left,
																y: rect.bottom + 8,
															})
														}}
														onMouseLeave={() => onSetTooltip(null)}
													>
														<div className="h-1.5 overflow-hidden rounded-full bg-zinc-700">
															<div
																className={`h-full transition-all ${
																	isDiff10Actual
																		? 'bg-gradient-to-r from-green-500 to-green-600'
																		: 'bg-zinc-600'
																}`}
																style={{
																	width: `${diff10.percentage}%`,
																}}
															/>
														</div>
														<span className="w-10 text-right text-zinc-300 font-medium text-xs whitespace-nowrap">
															{Math.round(diff10.percentage)}%
														</span>
													</div>
												</div>
											)}

											{diff25 && (
												<div className="relative">
													<div className="mb-1">
														<span className="text-zinc-400">
															25 {diff25Type}: {diff25.progressed}{' '}
															/ {diff25.encounters.length}
														</span>
													</div>
													<div
														className="grid grid-cols-[1fr_auto] items-center gap-2"
														onMouseEnter={(e) => {
															const rect =
																e.currentTarget.getBoundingClientRect()
															onSetTooltip({
																raidName: raid.mapName,
																difficulty: '25',
																type: diff25Type,
																encounters: diff25.encounters || [],
																x: rect.left,
																y: rect.bottom + 8,
															})
														}}
														onMouseLeave={() => onSetTooltip(null)}
													>
														<div className="h-1.5 overflow-hidden rounded-full bg-zinc-700">
															<div
																className={`h-full transition-all ${
																	isDiff25Actual
																		? 'bg-gradient-to-r from-blue-500 to-blue-600'
																		: 'bg-zinc-600'
																}`}
																style={{
																	width: `${diff25.percentage}%`,
																}}
															/>
														</div>
														<span className="w-10 text-right text-zinc-300 font-medium text-xs whitespace-nowrap">
															{Math.round(diff25.percentage)}%
														</span>
													</div>
												</div>
											)}
										</div>
									</div>
								</div>
							),
						})
					}

					// Сортируем карточки: сначала актуальные, потом неактуальные
					return cards
						.sort((a, b) => {
							if (a.isActual === b.isActual) {
								return 0
							}
							return a.isActual ? -1 : 1
						})
						.map((item) => item.card)
				})}
			</div>
			{sortedGroupedPve.length > 0 && (
				<button
					type="button"
					className="mt-2 text-xs text-zinc-400 hover:text-zinc-200"
					onClick={onToggleExpanded}
				>
					{isPveExpanded ? 'Свернуть' : 'Показать все рейды'}
				</button>
			)}
		</div>
	)
}

