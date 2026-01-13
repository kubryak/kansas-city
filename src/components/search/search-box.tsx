'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { fetchSirusAPI, SIRUS_API } from '@/lib/sirus-api'

interface CharacterData {
	guid: number
	name: string
	level: number
	race_icon: string
	class_icon: string
	race_name: string
	class_name: string
	class_id: number
	race_id: number
	faction: number
	gender: number
	zodiac?: {
		id: number
		name: string
	}
}

interface GuildData {
	id: number
	name: string
	level: number
	leader: {
		guid: number
		name: string
	}
}

interface NpcData {
	entry: number
	name: string
	subname: string | null
	minlevel: number
	maxlevel: number
	zones: Array<{
		id: number
		name: string
	}>
	rank: string
	reaction: {
		alliance: number
		horde: number
		renegade: number
	}
	realm_id: number
}

interface SearchResult {
	type: 'character' | 'npc' | 'guild' | string
	data: CharacterData | NpcData | GuildData
}

type SearchResponse = SearchResult[]

export function SearchBox () {
	const [query, setQuery] = useState('')
	const [results, setResults] = useState<SearchResult[]>([])
	const [isOpen, setIsOpen] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const pathname = usePathname()
	const containerRef = useRef<HTMLDivElement>(null)
	const dropdownRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	// Очищаем поиск при смене страницы
	useEffect(() => {
		setQuery('')
		setResults([])
		setIsOpen(false)
	}, [pathname])

	useEffect(() => {
		if (searchTimeoutRef.current) {
			clearTimeout(searchTimeoutRef.current)
		}

		if (query.trim().length < 2) {
			setResults([])
			setIsOpen(false)
			return
		}

		setIsLoading(true)
		searchTimeoutRef.current = setTimeout(async () => {
			try {
				const data = await fetchSirusAPI<SearchResponse>(
					SIRUS_API.search(query.trim()),
				)
				// Фильтруем только персонажей и гильдии
				const filteredResults = (data || []).filter(
					(result) => result.type === 'character' || result.type === 'guild',
				)
				setResults(filteredResults)
				setIsOpen(filteredResults.length > 0)
			} catch (error) {
				console.error('Search error:', error)
				setResults([])
				setIsOpen(false)
			} finally {
				setIsLoading(false)
			}
		}, 300)

		return () => {
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current)
			}
		}
	}, [query])

	const handleLinkClick = () => {
		setIsOpen(false)
		setQuery('')
	}

	const handleGuildClick = () => {
		setIsOpen(false)
		setQuery('')
	}

	const getTypeLabel = (type: string) => {
		switch (type) {
		case 'character':
			return 'Персонаж'
		case 'npc':
			return 'НПС'
		case 'guild':
			return 'Гильдия'
		default:
			return type
		}
	}

	const handleClear = () => {
		setQuery('')
		setResults([])
		setIsOpen(false)
		if (searchTimeoutRef.current) {
			clearTimeout(searchTimeoutRef.current)
		}
	}

	const getClassColor = (classId?: number) => {
		if (!classId) return 'text-zinc-300'
		switch (classId) {
		case 1:
			return 'text-[#C79C6E]'
		case 2:
			return 'text-[#F58CBA]'
		case 3:
			return 'text-[#ABD473]'
		case 4:
			return 'text-[#FFF569]'
		case 5:
			return 'text-[#FFFFFF]'
		case 6:
			return 'text-[#C41F3B]'
		case 7:
			return 'text-[#0070DE]'
		case 8:
			return 'text-[#69CCF0]'
		case 9:
			return 'text-[#9482C9]'
		case 11:
			return 'text-[#FF7D0A]'
		default:
			return 'text-zinc-300'
		}
	}

	return (
		<div ref={containerRef} className='relative z-[10000] w-full max-w-[350px]'>
			<div className='relative'>
					<input
						id='main-search-input'
						type='text'
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onFocus={() => {
							if (results.length > 0) {
								setIsOpen(true)
							}
						}}
						placeholder='Поиск персонажа или гильдии...'
						className='w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 pl-10 pr-10 text-sm text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
					/>
				<div className='absolute left-3 top-1/2 -translate-y-1/2'>
					{isLoading ? (
						<div className='h-4 w-4 animate-spin rounded-full border-2 border-zinc-500 border-t-blue-500' />
					) : (
						<svg
							className='h-4 w-4 text-zinc-500'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
							/>
						</svg>
					)}
				</div>
				{query && (
					<button
						type='button'
						onClick={handleClear}
						className='absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-100'
						aria-label='Очистить поиск'
					>
						<svg
							className='h-4 w-4'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M6 18L18 6M6 6l12 12'
							/>
						</svg>
					</button>
				)}
			</div>

			{isOpen && results.length > 0 && (
				<div
					ref={dropdownRef}
					className='fixed z-[10000] mt-2 max-h-96 w-full max-w-md overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl'
					style={{
						top: containerRef.current
							? containerRef.current.getBoundingClientRect().bottom + 8
							: 0,
						left: containerRef.current
							? containerRef.current.getBoundingClientRect().left
							: 0,
						width: containerRef.current
							? containerRef.current.getBoundingClientRect().width
							: 'auto',
					}}
				>
					{results.map((result, index) => {
						if (result.type === 'character') {
							const characterData = result.data as CharacterData
							return (
								<Link
									key={`${result.type}-${characterData.guid}-${index}`}
									href={`/character/${encodeURIComponent(characterData.name)}`}
									onClick={handleLinkClick}
									className='flex w-full items-center gap-3 border-b border-zinc-800 px-4 py-3 text-left transition-colors hover:bg-zinc-800/50 last:border-b-0'
								>
									{characterData.race_icon && (
										<img
											src={`https://sirus.su${characterData.race_icon}`}
											alt={characterData.race_name}
											className='h-8 w-8 flex-shrink-0 rounded'
										/>
									)}
									<div className='flex flex-1 flex-col gap-1'>
										<div className='flex items-center gap-2'>
											<span
												className={`text-sm font-semibold ${getClassColor(
													characterData.class_id,
												)}`}
											>
												{characterData.name}
											</span>
											<span className='rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400'>
												{getTypeLabel(result.type)}
											</span>
										</div>
										<div className='flex items-center gap-3 text-xs text-zinc-500'>
											<span>Уровень {characterData.level}</span>
											<span>{characterData.race_name}</span>
											<span>{characterData.class_name}</span>
										</div>
									</div>
								</Link>
							)
						}

						if (result.type === 'guild') {
							const guildData = result.data as GuildData
							return (
								<Link
									key={`${result.type}-${guildData.id}-${index}`}
									href={`/guild/${guildData.id}`}
									onClick={handleGuildClick}
									className='flex w-full items-center gap-3 border-b border-zinc-800 px-4 py-3 text-left transition-colors hover:bg-zinc-800/50 last:border-b-0'
								>
									<div className='flex flex-1 flex-col gap-1'>
										<div className='flex items-center gap-2'>
											<span className='text-sm font-semibold text-zinc-100'>
												{guildData.name}
											</span>
											<span className='rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400'>
												{getTypeLabel(result.type)}
											</span>
										</div>
										<div className='flex items-center gap-3 text-xs text-zinc-500'>
											<span>Уровень {guildData.level}</span>
											{guildData.leader && (
												<span>Лидер: {guildData.leader.name}</span>
											)}
										</div>
									</div>
								</Link>
							)
						}

						return null
					})}
				</div>
			)}
		</div>
	)
}

