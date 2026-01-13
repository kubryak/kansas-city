'use client'

import Link from 'next/link'
import { GitCompare, Search } from 'lucide-react'

export default function Home () {
	return (
		<main className='mx-auto flex max-w-[1500px] flex-col gap-8 px-6 py-8'>
			<div className='flex flex-col items-center justify-center gap-6 rounded-xl border border-zinc-800 bg-zinc-900/80 p-12 text-center'>
				<h1 className='text-4xl font-bold text-zinc-100'>
					Добро пожаловать в Atlas
				</h1>
				<p className='text-lg text-zinc-400'>
					Проект, который помощет сравнить персонажей, просмотреть детальную информацию о конкретном персонаже или гильдии
				</p>
				
				<div className='mt-8 grid grid-cols-1 gap-4 md:grid-cols-2'>
					<Link
						href='/compare'
						className='rounded-xl border border-zinc-800 bg-zinc-950/60 p-6 transition-colors hover:border-zinc-700 hover:bg-zinc-900/80'
					>
						<div className='mb-3 flex justify-center'>
							<GitCompare className='h-12 w-12 text-blue-400' />
						</div>
						<h2 className='mb-2 text-xl font-semibold text-zinc-100'>
							Сравнение персонажей
						</h2>
						<p className='text-sm text-zinc-400'>
							Сравните характеристики, экипировку, сокеты, комплекты, таланты и символы двух персонажей
						</p>
					</Link>
					
					<button
						type='button'
						onClick={() => {
							const searchInput = document.getElementById('main-search-input')
							if (searchInput) {
								searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
								setTimeout(() => {
									searchInput.focus()
								}, 300)
							}
						}}
						className='rounded-xl border border-zinc-800 bg-zinc-950/60 p-6 text-center transition-colors hover:border-zinc-700 hover:bg-zinc-900/80'
					>
						<div className='mb-3 flex justify-center'>
							<Search className='h-12 w-12 text-blue-400' />
						</div>
						<h2 className='mb-2 text-xl font-semibold text-zinc-100'>
							Поиск
						</h2>
						<p className='text-sm text-zinc-400'>
							Найдите любого персонажа или гильдию на сервере
						</p>
					</button>
				</div>
			</div>
		</main>
	)
}
