'use client'

import { useGuild } from '@/hooks/use-guild'
import { MembersTable } from '@/components/members/members-table'

export default function MembersPage () {
	const {
		isLoading,
		isError,
		guild,
		sortedMembers,
		rankById,
	} = useGuild()

	if (isLoading) {
		return (
			<div className='flex min-h-screen items-center justify-center'>
				<p className='text-lg'>Загрузка состава гильдии…</p>
			</div>
		)
	}

	if (isError || !guild) {
		return (
			<div className='flex min-h-screen items-center justify-center'>
				<p className='text-lg text-red-500'>
					Не удалось загрузить состав гильдии
				</p>
			</div>
		)
	}

	return (
		<main className='mx-auto flex max-w-[1500px] flex-col gap-8 px-6 py-8'>
			<h1 className='text-2xl font-semibold'>
				Состав гильдии
			</h1>
			<MembersTable members={sortedMembers} rankById={rankById} />
		</main>
	)
}


