import Link from 'next/link'
import { Map } from 'lucide-react'
import { SearchBox } from '@/components/search/search-box'

export function MainHeader () {
	return (
		<header className='relative z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur'>
			<div className='mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-6 py-3'>
				<div className='flex items-center gap-6'>
					<Link
						href='/'
						className='flex items-center gap-3 text-sm font-semibold text-zinc-100'
					>
						<div className='flex h-10 w-10 items-center justify-center rounded-md bg-zinc-800'>
							<Map className='h-5 w-5 text-zinc-100' />
						</div>
						<div className='flex flex-col'>
							<span>Atlas</span>
							<span className='text-xs font-normal text-zinc-500'>
								Neverest x3
							</span>
						</div>
					</Link>

					<nav className='flex items-center gap-4 text-sm text-zinc-300'>
						<Link
							href='/compare'
							className='rounded px-2 py-1 text-zinc-300 hover:bg-zinc-800 hover:text-white'
						>
							Сравнение
						</Link>
						<Link
							href='/watermelon'
							className='rounded px-2 py-1 text-zinc-300 hover:bg-zinc-800 hover:text-white'
						>
							Поиск арбузов
						</Link>
					</nav>
				</div>

				<div className='w-full max-w-[350px]'>
					<SearchBox />
				</div>
			</div>
		</header>
	)
}


