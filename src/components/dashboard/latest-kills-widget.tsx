'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Cross, Shield, Swords } from 'lucide-react'
import Link from 'next/link'

interface LatestKillItem {
	id: number
	bossName: string
	bossIcon: string
	raidName: string
	difficultyLabel: string
	equipment: number
	dps: number
	healers: number
	tanks: number
	time: string
	timeEnd: string
}

interface PaginationMeta {
	currentPage: number
	totalPages: number
	perPage: number
	total: number
}

interface RaidOption {
	key: string
	name: string
	difficulty: number
	difficultyLabel: string
	index: number | null
}

interface BossOption {
	id: number
	name: string
	icon: string
}

interface LatestKillsResponse {
	kills: LatestKillItem[]
	pagination: PaginationMeta
	raids: RaidOption[]
	bosses: BossOption[]
}

type PeriodKey = 'current' | 'previous' | 'last_two_weeks' | 'last_four_weeks'

const PERIOD_LABELS: Record<PeriodKey, string> = {
	current: 'Текущая неделя',
	previous: 'Прошлая неделя',
	last_two_weeks: 'Последние 2 недели',
	last_four_weeks: 'Последние 4 недели',
}

type ViewMode = 'cards' | 'list'

function formatDateTime (timeEnd: string): { date: string; time: string } {
	const [datePart, timePart] = timeEnd.split(' ')

	if (!datePart || !timePart) {
		return { date: timeEnd, time: '' }
	}

	const [year, month, day] = datePart.split('-')

	return {
		date: [day, month, year].join('.'),
		time: timePart.slice(0, 5),
	}
}

export function LatestKillsWidget () {
	const [period, setPeriod] = useState<PeriodKey>('current')
	const [viewMode, setViewMode] = useState<ViewMode>('list')
	const [page, setPage] = useState<number>(1)
	const [selectedRaidIndex, setSelectedRaidIndex] = useState<number | null>(null)
	const [selectedBossId, setSelectedBossId] = useState<number | null>(null)

	const { data, isLoading, isError } = useQuery<LatestKillsResponse>({
		queryKey: ['latest-kills', period, page, selectedRaidIndex, selectedBossId],
		queryFn: async () => {
			const params = new URLSearchParams()
			params.set('period', period)
			params.set('page', String(page))
			if (selectedRaidIndex !== null) {
				params.set('i', String(selectedRaidIndex))
			}
			if (selectedBossId !== null) {
				params.set('boss', String(selectedBossId))
			}
			const { fetchLatestKills } = await import('@/lib/sirus-api-helpers')
			return await fetchLatestKills({
				period: period as any,
				page,
				raidIndex: selectedRaidIndex,
				bossId: selectedBossId,
			})
		},
	})

	useEffect(() => {
		setPage(1)
	}, [period, selectedRaidIndex, selectedBossId])

	useEffect(() => {
		// Сбрасываем выбранного босса при смене рейда
		setSelectedBossId(null)
	}, [selectedRaidIndex])

	if (isLoading) {
		return (
			<section className='rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 text-sm text-zinc-300'>
				<p>Загружаем последние убийства…</p>
			</section>
		)
	}

	if (isError || !data) {
		return (
			<section className='rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 text-sm text-red-400'>
				<p>Не удалось загрузить последние убийства</p>
			</section>
		)
	}

	const { pagination } = data
	const totalPages = Math.max(1, pagination.totalPages)
	const perPage = pagination.perPage

	// Если данных нет, но есть пагинация, показываем сообщение с кнопками
	if (data.kills.length === 0) {
		return (
			<section className='rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 text-sm text-zinc-300'>
				<div className='mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
					<h2 className='text-base font-semibold text-zinc-100'>
						Последние убийства
					</h2>
					<div className='flex flex-wrap items-center gap-3 text-xs text-zinc-300'>
						<div className='flex items-center gap-2'>
							<span className='text-zinc-500'>Период:</span>
							<select
								className='rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 outline-none'
								value={period}
								onChange={(event) =>
									setPeriod(event.target.value as PeriodKey)
								}
							>
								{Object.entries(PERIOD_LABELS).map(
									([key, label]) => (
										<option key={key} value={key}>
											{label}
										</option>
									),
								)}
							</select>
						</div>
						{data && data.raids.length > 0 && (
							<div className='flex items-center gap-2'>
								<span className='text-zinc-500'>Рейд:</span>
								<select
									className='rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 outline-none'
									value={selectedRaidIndex ?? ''}
									onChange={(event) =>
										setSelectedRaidIndex(
											event.target.value === ''
												? null
												: Number(event.target.value),
										)
									}
								>
									<option value=''>Все рейды</option>
									{data.raids
										.filter((raid) => raid.index !== null)
										.map((raid) => (
											<option
												key={raid.key}
												value={raid.index ?? ''}
											>
												{raid.name} · {raid.difficultyLabel}
											</option>
										))}
								</select>
							</div>
						)}
						{data &&
							data.bosses.length > 0 &&
							selectedRaidIndex !== null && (
								<div className='flex items-center gap-2'>
									<span className='text-zinc-500'>Босс:</span>
									<select
										className='rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 outline-none'
										value={selectedBossId ?? ''}
										onChange={(event) =>
											setSelectedBossId(
												event.target.value === ''
													? null
													: Number(event.target.value),
											)
										}
									>
										<option value=''>Все боссы</option>
										{data.bosses.map((boss) => (
											<option key={boss.id} value={boss.id}>
												{boss.name}
											</option>
										))}
									</select>
								</div>
							)}
					</div>
				</div>
				<p className='mb-4 text-center text-zinc-400'>
					Пока нет данных о последних убийствах на этой странице.
				</p>
				<div className='flex items-center justify-between text-xs text-zinc-400'>
					<span>
						Страница {page} из {totalPages}
					</span>
					<div className='flex items-center gap-2'>
						<button
							type='button'
							disabled={page <= 1}
							onClick={() => setPage((prev) => Math.max(1, prev - 1))}
							className='rounded border border-zinc-700 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-40 hover:border-zinc-500 hover:text-zinc-200'
						>
							Назад
						</button>
						<button
							type='button'
							disabled={page >= totalPages}
							onClick={() =>
								setPage((prev) =>
									Math.min(totalPages, prev + 1),
								)
							}
							className='rounded border border-zinc-700 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-40 hover:border-zinc-500 hover:text-zinc-200'
						>
							Вперёд
						</button>
					</div>
				</div>
			</section>
		)
	}

	return (
		<section className='rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 text-sm text-zinc-300'>
			<div className='mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
				<h2 className='text-base font-semibold text-zinc-100'>
					Последние убийства
				</h2>
				<div className='flex flex-wrap items-center gap-3 text-xs text-zinc-300'>
					<div className='flex items-center gap-2'>
						<span className='text-zinc-500'>Период:</span>
						<select
							className='rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 outline-none'
							value={period}
							onChange={(event) =>
								setPeriod(event.target.value as PeriodKey)
							}
						>
							{Object.entries(PERIOD_LABELS).map(
								([key, label]) => (
									<option key={key} value={key}>
										{label}
									</option>
								),
							)}
						</select>
					</div>
					{data && data.raids.length > 0 && (
						<div className='flex items-center gap-2'>
							<span className='text-zinc-500'>Рейд:</span>
							<select
								className='rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 outline-none'
								value={selectedRaidIndex ?? ''}
								onChange={(event) =>
									setSelectedRaidIndex(
										event.target.value === ''
											? null
											: Number(event.target.value),
									)
								}
							>
								<option value=''>Все рейды</option>
								{data.raids
									.filter((raid) => raid.index !== null)
									.map((raid) => (
										<option
											key={raid.key}
											value={raid.index ?? ''}
										>
											{raid.name} · {raid.difficultyLabel}
										</option>
									))}
							</select>
						</div>
					)}
					{data &&
						data.bosses.length > 0 &&
						selectedRaidIndex !== null && (
							<div className='flex items-center gap-2'>
								<span className='text-zinc-500'>Босс:</span>
								<select
									className='rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 outline-none'
									value={selectedBossId ?? ''}
									onChange={(event) =>
										setSelectedBossId(
											event.target.value === ''
												? null
												: Number(event.target.value),
										)
									}
								>
									<option value=''>Все боссы</option>
									{data.bosses.map((boss) => (
										<option key={boss.id} value={boss.id}>
											{boss.name}
										</option>
									))}
								</select>
							</div>
						)}
					<div className='flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900 p-0.5'>
						<button
							type='button'
							onClick={() => setViewMode('cards')}
							className={`rounded px-2 py-1 text-[11px] ${
								viewMode === 'cards'
									? 'bg-zinc-800 text-zinc-100'
									: 'text-zinc-400 hover:text-zinc-100'
							}`}
						>
							Карточки
						</button>
						<button
							type='button'
							onClick={() => setViewMode('list')}
							className={`rounded px-2 py-1 text-[11px] ${
								viewMode === 'list'
									? 'bg-zinc-800 text-zinc-100'
									: 'text-zinc-400 hover:text-zinc-100'
							}`}
						>
							Список
						</button>
					</div>
				</div>
			</div>

			{viewMode === 'cards' ? (
				<ul className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
					{data.kills.map((kill, indexOnPage) => {
						const { date, time } = formatDateTime(kill.timeEnd)
						const globalIndex =
							(page - 1) * perPage + indexOnPage

						return (
							<li key={kill.id}>
								<Link
									href={`/kills/${kill.id}`}
									className='flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 transition-transform transition-colors duration-150 hover:-translate-y-1 hover:border-zinc-600 hover:bg-zinc-900 cursor-pointer'
								>
								<div className='flex items-start justify-between gap-3'>
									<div className='flex items-center gap-3'>
										<span className='flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-zinc-300'>
											{globalIndex + 1}
										</span>
										<img
											src={kill.bossIcon}
											alt={kill.bossName}
											className='h-12 w-12 rounded-lg object-cover'
										/>
										<div className='flex flex-col'>
											<span className='text-base font-semibold text-zinc-100'>
												{kill.bossName}
											</span>
											<span className='text-[13px] text-zinc-400'>
												{kill.raidName} ·{' '}
												{kill.difficultyLabel}
											</span>
										</div>
									</div>
									<div className='text-right text-[11px] text-zinc-400'>
										<div>{time}</div>
										<div>{date}</div>
									</div>
								</div>

								<div className='flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-300'>
									<div>
										<div className='text-[10px] uppercase text-zinc-500'>
											Экипировка
										</div>
										<div className='mt-0.5 text-base font-medium'>
											{kill.equipment}
										</div>
									</div>
									<div>
										<div className='text-[10px] uppercase text-zinc-500'>
											Состав
										</div>
										<div className='mt-0.5 flex items-center gap-3 text-base font-medium'>
											<div className='flex items-center gap-1 text-red-400'>
												<Swords className='h-4 w-4' />
												<span>{kill.dps}</span>
											</div>
											<div className='flex items-center gap-1 text-emerald-400'>
												<Cross className='h-4 w-4' />
												<span>{kill.healers}</span>
											</div>
											<div className='flex items-center gap-1 text-sky-400'>
												<Shield className='h-4 w-4' />
												<span>{kill.tanks}</span>
											</div>
										</div>
									</div>
									<div className='text-right'>
										<div className='text-[10px] uppercase text-zinc-500'>
											Убийство
										</div>
										<div className='mt-0.5 text-sm font-medium text-zinc-200'>
											{kill.time}
										</div>
									</div>
								</div>
								</Link>
							</li>
						)
					})}
				</ul>
			) : (
				<ul className='flex flex-col gap-2'>
					{data.kills.map((kill, indexOnPage) => {
						const { date, time } = formatDateTime(kill.timeEnd)
						const globalIndex =
							(page - 1) * perPage + indexOnPage

						return (
							<li key={kill.id}>
								<Link
									href={`/kills/${kill.id}`}
									className='flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-sm text-zinc-300 transition-colors duration-150 hover:border-zinc-600 hover:bg-zinc-900 cursor-pointer'
								>
								<div className='flex items-start justify-between gap-3'>
									<div className='flex items-center gap-3'>
										<span className='flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-semibold text-zinc-300'>
											{globalIndex + 1}
										</span>
										<img
											src={kill.bossIcon}
											alt={kill.bossName}
											className='h-10 w-10 rounded-lg object-cover'
										/>
										<div className='flex flex-col'>
											<span className='text-sm font-semibold text-zinc-100'>
												{kill.bossName}
											</span>
											<span className='text-xs text-zinc-400'>
												{kill.raidName} ·{' '}
												{kill.difficultyLabel}
											</span>
										</div>
									</div>
									<div className='text-right text-[11px] text-zinc-400'>
										<div>{time}</div>
										<div>{date}</div>
									</div>
								</div>

								<div className='mt-1 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-300'>
									<div className='flex items-center gap-2'>
										<div className='text-[10px] uppercase text-zinc-500'>
											Экипировка
										</div>
										<div className='text-sm font-medium'>
											{kill.equipment}
										</div>
									</div>
									<div className='flex flex-wrap items-center gap-3'>
										<div className='flex items-center gap-1 text-red-400'>
											<Swords className='h-3.5 w-3.5' />
											<span>{kill.dps}</span>
										</div>
										<div className='flex items-center gap-1 text-emerald-400'>
											<Cross className='h-3.5 w-3.5' />
											<span>{kill.healers}</span>
										</div>
										<div className='flex items-center gap-1 text-sky-400'>
											<Shield className='h-3.5 w-3.5' />
											<span>{kill.tanks}</span>
										</div>
									</div>
									<div className='text-right'>
										<div className='text-[10px] uppercase text-zinc-500'>
											Убийство
										</div>
										<div className='mt-0.5 text-xs font-medium text-zinc-200'>
											{kill.time}
										</div>
									</div>
								</div>
								</Link>
							</li>
						)
					})}
				</ul>
			)}

			<div className='mt-4 flex items-center justify-between text-xs text-zinc-400'>
				<span>
					Страница {page} из {totalPages}
				</span>
				<div className='flex items-center gap-2'>
					<button
						type='button'
						disabled={page <= 1}
						onClick={() => setPage((prev) => Math.max(1, prev - 1))}
						className='rounded border border-zinc-700 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-40 hover:border-zinc-500 hover:text-zinc-200'
					>
						Назад
					</button>
					<button
						type='button'
						disabled={page >= totalPages}
						onClick={() =>
							setPage((prev) =>
								Math.min(totalPages, prev + 1),
							)
						}
						className='rounded border border-zinc-700 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-40 hover:border-zinc-500 hover:text-zinc-200'
					>
						Вперёд
					</button>
				</div>
			</div>
		</section>
	)
}



