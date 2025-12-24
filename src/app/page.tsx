'use client'

import { useGuild } from '@/hooks/use-guild'
import { GuildHeader } from '@/components/dashboard/guild-header'
import { ProgressWidget } from '@/components/dashboard/progress-widget'

export default function Home () {
	const {
		isLoading,
		isError,
		guild,
		members,
		mains,
		twinks,
		avgIlvl,
		classCounts,
		classMembers,
	} = useGuild()

	if (isLoading) {
		return (
			<div className='flex min-h-screen items-center justify-center bg-background'>
				<p className='text-lg'>Загрузка данных гильдии…</p>
			</div>
		)
	}

	if (isError || !guild) {
		return (
			<div className='flex min-h-screen items-center justify-center'>
				<p className='text-lg text-red-500'>
					Не удалось загрузить данные гильдии
				</p>
			</div>
		)
	}

	return (
		<main className='mx-auto flex max-w-[1500px] flex-col gap-8 px-6 py-8'>
			<GuildHeader
				guild={guild}
				membersCount={members.length}
				mainsCount={mains.length}
				twinksCount={twinks.length}
				avgIlvl={avgIlvl}
				classCounts={classCounts}
				classMembers={classMembers}
			/>

			<ProgressWidget />
		</main>
	)
}
