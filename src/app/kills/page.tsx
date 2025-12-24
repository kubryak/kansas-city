'use client'

import { LatestKillsWidget } from '@/components/dashboard/latest-kills-widget'

export default function KillsPage () {
	return (
		<main className='mx-auto flex max-w-[1500px] flex-col gap-8 px-6 py-8'>
			<LatestKillsWidget />
		</main>
	)
}




