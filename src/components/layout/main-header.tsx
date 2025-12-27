import Link from 'next/link'

export function MainHeader () {
	return (
		<header className='border-b border-zinc-800 bg-zinc-950/80 backdrop-blur'>
			<div className='mx-auto flex max-w-[1500px] items-center justify-between px-6 py-3'>
				<Link
					href='/'
					className='flex items-center gap-3 text-sm font-semibold text-zinc-100'
				>
					<img
						src='https://sirus.su/api/base/22/guild/39104/emblem.webp'
						alt='Эмблема гильдии Kansas City'
						className='h-10 w-10 rounded-md object-contain'
					/>
					<div className='flex flex-col'>
						<span>Kansas City</span>
						<span className='text-xs font-normal text-zinc-500'>
							Neverest x3
						</span>
					</div>
				</Link>

				<nav className='flex items-center gap-4 text-sm text-zinc-300'>
					<Link
						href='/'
						className='rounded px-2 py-1 text-zinc-300 hover:bg-zinc-800 hover:text-white'
					>
						Главная
					</Link>
					<Link
						href='/members'
						className='rounded px-2 py-1 text-zinc-300 hover:bg-zinc-800 hover:text-white'
					>
						Состав
					</Link>
					<Link
						href='/compare'
						className='rounded px-2 py-1 text-zinc-300 hover:bg-zinc-800 hover:text-white'
					>
						Сравнение
					</Link>
					<Link
						href='/kills'
						className='rounded px-2 py-1 text-zinc-300 hover:bg-zinc-800 hover:text-white'
					>
						Последние убийства
					</Link>
					<Link
						href='/raffle'
						className='rounded px-2 py-1 text-zinc-300 hover:bg-zinc-800 hover:text-white'
					>
						Розыгрыш
					</Link>
				</nav>
			</div>
		</header>
	)
}


