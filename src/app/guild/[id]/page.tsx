'use client'

import { useParams } from 'next/navigation'
import { useGuildById } from '@/hooks/use-guild-by-id'
import { MembersTable } from '@/components/members/members-table'
import { LatestKillsWidget } from '@/components/dashboard/latest-kills-widget'
import { ProgressWidget } from '@/components/dashboard/progress-widget'

export default function GuildByIdPage () {
	const params = useParams()
	const guildId = params?.id ? Number(params.id) : null

	const {
		isLoading,
		isError,
		guild,
		sortedMembers,
		rankById,
	} = useGuildById(guildId || 0)

	if (!guildId) {
		return (
			<div className='flex min-h-screen items-center justify-center'>
				<p className='text-lg text-red-500'>
					Не указан ID гильдии
				</p>
			</div>
		)
	}

	if (isLoading) {
		return (
			<div className='flex min-h-screen items-center justify-center'>
				<p className='text-lg'>Загрузка информации о гильдии…</p>
			</div>
		)
	}

	if (isError || !guild) {
		return (
			<div className='flex min-h-screen items-center justify-center'>
				<p className='text-lg text-red-500'>
					Не удалось загрузить информацию о гильдии
				</p>
			</div>
		)
	}

	return (
		<main className='mx-auto flex max-w-[1500px] flex-col gap-8 px-6 py-8'>
			<div className='flex items-center gap-4'>
				<img
					src={`https://sirus.su/api/base/22/guild/${guild.id}/emblem.webp`}
					alt={`Эмблема гильдии ${guild.name}`}
					className='h-16 w-16 rounded-lg object-contain'
				/>
				<div>
					<h1 className='text-3xl font-bold text-zinc-100'>{guild.name}</h1>
					<p className='text-sm text-zinc-400'>
						Neverest x3 · Уровень {guild.level}
					</p>
				</div>
			</div>

			<ProgressWidget guildId={guild.id} />

			<div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
				{/* Состав гильдии */}
				<div className='flex flex-col'>
					<h2 className='mb-4 text-xl font-semibold text-zinc-100'>
						Состав гильдии
					</h2>
					<div className='flex-1 rounded-xl border border-zinc-800 bg-zinc-900/80 p-4'>
						<MembersTable members={sortedMembers} rankById={rankById} />
					</div>
				</div>

				{/* Последние убийства */}
				<div className='flex flex-col'>
					<h2 className='mb-4 text-xl font-semibold text-zinc-100'>
						Последние убийства
					</h2>
					<div className='flex-1 rounded-xl border border-zinc-800 bg-zinc-900/80 p-4'>
						<LatestKillsWidget guildId={guild.id} />
					</div>
				</div>
			</div>
		</main>
	)
}

