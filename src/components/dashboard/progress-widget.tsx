'use client'

import { useQuery } from '@tanstack/react-query'

interface ProgressItem {
	id: string
	name: string
	difficultyLabel: string
	killed: number
	total: number
	ilvl: number
	icon: string
	background: string
}

interface ProgressResponse {
	progress: ProgressItem[]
}

function getProgressColorClass (killed: number, total: number): string {
	if (!total || total <= 0) {
		return 'text-zinc-400'
	}

	const ratio = killed / total

	if (ratio < 0.5) {
		return 'text-red-400'
	}

	if (ratio < 1) {
		return 'text-yellow-400'
	}

	return 'text-emerald-400'
}

export function ProgressWidget () {
	const { data, isLoading, isError } = useQuery<ProgressResponse>({
		queryKey: ['progression'],
		queryFn: async () => {
			const { fetchProgression } = await import('@/lib/sirus-api-helpers')
			return await fetchProgression()
		},
	})

	if (isLoading) {
		return (
			<section className='rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 text-sm text-zinc-300'>
				<p>Загружаем прогресс по рейдам…</p>
			</section>
		)
	}

	if (isError || !data) {
		return (
			<section className='rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 text-sm text-red-400'>
				<p>Не удалось загрузить прогресс рейдов</p>
			</section>
		)
	}

	if (data.progress.length === 0) {
		return (
			<section className='rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 text-sm text-zinc-300'>
				<p>Пока нет убийств рейдовых боссов за текущую неделю.</p>
			</section>
		)
	}

	return (
		<section className='rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 text-sm text-zinc-300'>
			<h2 className='text-base font-semibold text-zinc-100'>
				Прогресс по рейдам
			</h2>
			<p className='mb-3 text-xs text-zinc-500'>
				(Последние 4 недели)
			</p>
			<ul className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
				{data.progress.map((item) => (
					<li
						key={item.id}
						className='relative h-48 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60'
					>
						<div className='absolute inset-0 opacity-20'>
							<img
								src={item.background}
								alt={item.name}
								className='h-full w-full object-cover'
							/>
							<div className='absolute inset-0 bg-gradient-to-tr from-black via-black/60 to-transparent' />
						</div>
						<div className='relative flex h-full items-end justify-between gap-3 px-4 py-4'>
							<div className='flex flex-col'>
								<span className='text-lg font-semibold text-zinc-100'>
									{item.name}
								</span>
								<span className='mt-1 text-xs uppercase tracking-wide text-zinc-300'>
									{item.difficultyLabel}
								</span>
							</div>
							<div
								className={`text-sm font-semibold ${getProgressColorClass(
									item.killed,
									item.total,
								)}`}
							>
								{item.killed}/{item.total}
							</div>
						</div>
					</li>
				))}
			</ul>
		</section>
	)
}


