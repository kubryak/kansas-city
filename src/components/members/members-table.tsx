'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { GuildResponse } from '@/app/api/guild/route'

interface MembersTableProps {
	members: GuildResponse['members']
	rankById: Map<number, string>
}

interface ProfessionInfo {
	name: string
	icon: string
}

function getClassColor (classId: number) {
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
		return 'text-foreground'
	}
}

const CLASS_ICON_MAP: Record<number, string> = {
	1: 'https://wow.zamimg.com/images/wow/icons/medium/class_warrior.jpg',
	2: 'https://wow.zamimg.com/images/wow/icons/medium/class_paladin.jpg',
	3: 'https://wow.zamimg.com/images/wow/icons/medium/class_hunter.jpg',
	4: 'https://wow.zamimg.com/images/wow/icons/medium/class_rogue.jpg',
	5: 'https://wow.zamimg.com/images/wow/icons/medium/class_priest.jpg',
	6: 'https://wow.zamimg.com/images/wow/icons/medium/class_deathknight.jpg',
	7: 'https://wow.zamimg.com/images/wow/icons/medium/class_shaman.jpg',
	8: 'https://wow.zamimg.com/images/wow/icons/medium/class_mage.jpg',
	9: 'https://wow.zamimg.com/images/wow/icons/medium/class_warlock.jpg',
	11: 'https://wow.zamimg.com/images/wow/icons/medium/class_druid.jpg',
}

const PRIMARY_PROFESSION_MAP: Record<number, ProfessionInfo> = {
	171: {
		name: 'Алхимия',
		icon: 'https://wow.zamimg.com/images/wow/icons/medium/trade_alchemy.jpg',
	},
	164: {
		name: 'Кузнечное дело',
		icon: 'https://wow.zamimg.com/images/wow/icons/medium/trade_blacksmithing.jpg',
	},
	165: {
		name: 'Кожевничество',
		icon: 'https://wow.zamimg.com/images/wow/icons/medium/trade_leatherworking.jpg',
	},
	182: {
		name: 'Травничество',
		icon: 'https://wow.zamimg.com/images/wow/icons/medium/trade_herbalism.jpg',
	},
	186: {
		name: 'Горное дело',
		icon: 'https://wow.zamimg.com/images/wow/icons/medium/trade_mining.jpg',
	},
	333: {
		name: 'Наложение чар',
		icon: 'https://wow.zamimg.com/images/wow/icons/medium/trade_engraving.jpg',
	},
	393: {
		name: 'Снятие шкур',
		icon: 'https://wow.zamimg.com/images/wow/icons/medium/inv_misc_pelt_wolf_01.jpg',
	},
	197: {
		name: 'Портняжное дело',
		icon: 'https://wow.zamimg.com/images/wow/icons/medium/trade_tailoring.jpg',
	},
	202: {
		name: 'Инженерное дело',
		icon: 'https://wow.zamimg.com/images/wow/icons/medium/trade_engineering.jpg',
	},
	755: {
		name: 'Ювелирное дело',
		icon: 'https://wow.zamimg.com/images/wow/icons/medium/inv_misc_gem_01.jpg',
	},
	773: {
		name: 'Начертание',
		icon: 'https://wow.zamimg.com/images/wow/icons/medium/inv_inscription_tradeskill01.jpg',
	},
}

const SECONDARY_PROFESSION_MAP: Record<number, ProfessionInfo> = {}

function splitProfessions (
	skills: GuildResponse['members'][number]['skills'],
) {
	const primary = skills.filter((skill) =>
		Object.prototype.hasOwnProperty.call(
			PRIMARY_PROFESSION_MAP,
			skill.skill,
		),
	)

	return { primary, secondary: [] }
}

type SortKey = 'name' | 'class' | 'ilvl' | 'rank' | 'primaryCount'

function getPrimaryCountForMember (
	member: GuildResponse['members'][number],
): number {
	const { primary } = splitProfessions(member.skills)

	return primary.filter(
		(skill) =>
			skill.value >= 400 &&
			skill.skill !== 182 && // Травничество
			skill.skill !== 186, // Горное дело
	).length
}

function getPrimaryCountColorClass (count: number): string {
	if (count <= 1) {
		return 'text-red-500'
	}

	if (count === 2) {
		return 'text-emerald-400'
	}

	if (count === 3) {
		return 'text-emerald-500'
	}

	return 'text-emerald-600'
}

export function MembersTable ({ members, rankById }: MembersTableProps) {
	const [sortKey, setSortKey] = useState<SortKey>('rank')
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

	const sortedMembers = useMemo(() => {
		const copy = [...members]

		copy.sort((a, b) => {
			let cmp = 0

			switch (sortKey) {
			case 'name':
				cmp = a.name.localeCompare(b.name, 'ru')
				break
			case 'class':
				cmp = a.class - b.class
				break
			case 'ilvl':
				cmp = a.ilvl - b.ilvl
				break
			case 'rank':
				cmp = a.rank - b.rank
				break
			case 'primaryCount':
				cmp =
					getPrimaryCountForMember(a) -
					getPrimaryCountForMember(b)
				break
			default:
				cmp = 0
			}

			return sortDirection === 'asc' ? cmp : -cmp
		})

		return copy
	}, [members, sortKey, sortDirection])

	function handleSort (key: SortKey) {
		if (sortKey === key) {
			setSortDirection((prevDir) =>
				prevDir === 'asc' ? 'desc' : 'asc',
			)
		} else {
			setSortKey(key)
			setSortDirection('asc')
		}
	}

	function renderSortIndicator (key: SortKey) {
		if (sortKey !== key) {
			return null
		}

		return sortDirection === 'asc' ? ' ↑' : ' ↓'
	}

	return (
		<section className='rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-sm'>
			<div className='mb-4 flex items-center justify-between gap-4'>
				<h2 className='text-lg font-semibold'>Состав гильдии</h2>
			</div>

			<div className='overflow-x-auto'>
				<table className='min-w-full text-left text-sm'>
					<thead className='border-b border-black/5 text-xs uppercase text-zinc-500 dark:border-white/10'>
						<tr>
							<th
								className='py-2 pr-4 cursor-pointer select-none'
								onClick={() => handleSort('name')}
							>
								Ник
								{renderSortIndicator('name')}
							</th>
							<th
								className='py-2 pr-4 cursor-pointer select-none'
								onClick={() => handleSort('class')}
							>
								Класс
								{renderSortIndicator('class')}
							</th>
							<th
								className='py-2 pr-4 cursor-pointer select-none'
								onClick={() => handleSort('ilvl')}
							>
								ilvl
								{renderSortIndicator('ilvl')}
							</th>
							<th
								className='py-2 pr-4 cursor-pointer select-none'
								onClick={() => handleSort('rank')}
							>
								Ранг
								{renderSortIndicator('rank')}
							</th>
							<th className='py-2 pr-4'>
								Профессии
							</th>
							<th
								className='py-2 pr-4 cursor-pointer select-none'
								onClick={() => handleSort('primaryCount')}
							>
								Профессии &gt; 400
								{renderSortIndicator('primaryCount')}
							</th>
						</tr>
					</thead>
					<tbody>
						{sortedMembers.map((member) => {
							const { primary } = splitProfessions(member.skills)

							const primaryCount = primary.filter(
								(skill) =>
									skill.value >= 400 &&
									skill.skill !== 182 &&
									skill.skill !== 186,
							).length

							return (
								<tr
									key={member.guid}
									className='border-b border-zinc-800 last:border-0 hover:bg-zinc-800/40'
								>
									<td
										className={`py-2 pr-4 font-medium ${getClassColor(
											member.class,
										)}`}
									>
										<Link
											href={`/character/${encodeURIComponent(member.name)}`}
											className='hover:underline'
										>
											{member.name}
										</Link>
									</td>
									<td className='py-2 pr-4 font-medium'>
										<span className='inline-flex h-[30px] w-[30px] items-center justify-center rounded-full bg-zinc-800'>
											{CLASS_ICON_MAP[member.class] ? (
												<img
													src={
														CLASS_ICON_MAP[
															member.class
														]
													}
													alt=''
													className='h-[26px] w-[26px] rounded-full'
												/>
											) : (
												<span className='text-xs text-zinc-200'>
													{member.class}
												</span>
											)}
										</span>
									</td>
									<td className='py-2 pr-4'>
										{member.ilvl}
									</td>
									<td className='py-2 pr-4'>
										{rankById.get(member.rank) ??
											member.rank}
									</td>
									<td className='py-2 pr-4 text-xs text-zinc-300'>
										{primary.length === 0
											? '—'
											: primary.map((skill) => {
													const info =
														PRIMARY_PROFESSION_MAP[
															skill.skill
														]

													if (!info) {
														return null
													}

													return (
														<span
															key={skill.skill}
															className='group relative mr-1 inline-flex'
														>
															<img
																src={info.icon}
																alt=''
																className='h-[30px] w-[30px] rounded-sm'
															/>
															<span className='pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-3 py-1 text-xs text-white opacity-0 shadow-lg backdrop-blur-sm transition-opacity group-hover:block group-hover:opacity-100'>
																{
																	skill.value
																}
																{' / '}
																{skill.max}
															</span>
														</span>
													)
											  })}
									</td>
									<td className='py-2 pr-4 text-xs text-zinc-300'>
										<span
											className={getPrimaryCountColorClass(
												primaryCount,
											)}
										>
											{primaryCount}
											{' / 4'}
										</span>
									</td>
								</tr>
							)
						})}
					</tbody>
				</table>
			</div>
		</section>
	)
}






