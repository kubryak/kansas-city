import type { GuildResponse } from '@/app/api/guild/route'
import { ClassDistribution } from '@/components/dashboard/class-distribution'

interface GuildHeaderProps {
	guild: GuildResponse['guild']
	membersCount: number
	mainsCount: number
	twinksCount: number
	avgIlvl: number
	classCounts: Record<number, number>
	classMembers: Record<number, string[]>
}

export function GuildHeader ({
	guild,
	membersCount,
	mainsCount,
	twinksCount,
	avgIlvl,
	classCounts,
	classMembers,
}: GuildHeaderProps) {
	return (
		<section className='flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-lg shadow-black/40'>
			<div className='flex items-stretch gap-4'>
				<div className='flex flex-col items-center justify-center rounded-xl bg-zinc-900/80 px-4 py-3'>
					<img
						src='https://sirus.su/api/base/22/guild/39104/emblem.webp'
						alt='Эмблема гильдии Kansas City'
						className='h-16 w-16 rounded-lg object-contain'
					/>
					<span className='mt-2 text-[11px] text-zinc-500'>
						Neverest x3 · Уровень {guild.level}
					</span>
				</div>

				<div className='flex flex-1 flex-col justify-between'>
					<h1 className='text-xl font-semibold text-zinc-100'>
						{guild.name}
					</h1>

					<div className='mt-3 grid grid-cols-2 gap-3 text-sm text-zinc-300 md:grid-cols-4'>
						<div className='rounded-lg bg-zinc-900/80 px-3 py-2'>
							<div className='text-[11px] uppercase tracking-wide text-zinc-500'>
								Всего персонажей
							</div>
							<div className='mt-1 text-xl font-semibold text-zinc-100'>
								{membersCount}
							</div>
						</div>
						<div className='rounded-lg bg-zinc-900/80 px-3 py-2'>
							<div className='text-[11px] uppercase tracking-wide text-zinc-500'>
								Мейны
							</div>
							<div className='mt-1 text-xl font-semibold text-emerald-400'>
								{mainsCount}
							</div>
						</div>
						<div className='rounded-lg bg-zinc-900/80 px-3 py-2'>
							<div className='text-[11px] uppercase tracking-wide text-zinc-500'>
								Твинки
							</div>
							<div className='mt-1 text-xl font-semibold text-sky-400'>
								{twinksCount}
							</div>
						</div>
						<div className='rounded-lg bg-zinc-900/80 px-3 py-2'>
							<div className='text-[11px] uppercase tracking-wide text-zinc-500'>
								Средний ilvl мейнов
							</div>
							<div className='mt-1 text-xl font-semibold text-amber-300'>
								{Math.round(avgIlvl)}
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className='pt-2'>
				<ClassDistribution
					classCounts={classCounts}
					classMembers={classMembers}
				/>
			</div>
		</section>
	)
}



