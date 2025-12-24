interface ClassDistributionProps {
	classCounts: Record<number, number>
	classMembers: Record<number, string[]>
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

const CLASS_BAR_COLOR_MAP: Record<number, string> = {
	1: 'bg-[#C79C6E]',
	2: 'bg-[#F58CBA]',
	3: 'bg-[#ABD473]',
	4: 'bg-[#FFF569]',
	5: 'bg-[#FFFFFF]',
	6: 'bg-[#C41F3B]',
	7: 'bg-[#0070DE]',
	8: 'bg-[#69CCF0]',
	9: 'bg-[#9482C9]',
	11: 'bg-[#FF7D0A]',
}

export function ClassDistribution ({
	classCounts,
	classMembers,
}: ClassDistributionProps) {
	return (
		<div className='w-full text-xs text-zinc-300'>
			<div className='mb-2 flex items-center justify-between'>
				<span className='text-sm font-semibold text-zinc-100'>
					Распределение по классам (мейны)
				</span>
			</div>
			<div className='flex flex-wrap gap-2'>
				{Object.entries(classCounts)
					.sort(([, a], [, b]) => b - a)
					.map(([classId, count]) => {
						const id = Number(classId)
						const color = getClassColor(id)
						const barColor =
							CLASS_BAR_COLOR_MAP[id] ?? 'bg-zinc-500'
						const icon = CLASS_ICON_MAP[id]
						const members = classMembers[id] ?? []

						return (
							<div
								key={classId}
								className='group relative inline-flex items-center gap-2 rounded-full bg-zinc-900/80 px-2 py-1'
							>
								<span className='inline-flex h-[30px] w-[30px] items-center justify-center rounded-full bg-zinc-800'>
									{icon ? (
										<img
											src={icon}
											alt=''
											className='h-[26px] w-[26px] rounded-full'
										/>
									) : (
										<span className='text-[10px] text-zinc-200'>
											{id}
										</span>
									)}
								</span>
								<span
									className={`text-xs font-medium ${color}`}
								>
									{count}
								</span>

								{members.length > 0 && (
									<div className='pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden max-h-64 w-64 -translate-x-1/2 overflow-y-auto rounded-md bg-black/90 px-3 py-2 text-xs text-zinc-100 shadow-xl backdrop-blur-sm group-hover:block'>
										<p className='mb-1 text-[11px] font-semibold text-zinc-300'>
											Игроки этого класса:
										</p>
										<ul className='space-y-0.5'>
											{members.slice(0, 30).map((name) => (
												<li key={name}>{name}</li>
											))}
											{members.length > 30 && (
												<li className='text-[11px] text-zinc-500'>
													и ещё {members.length - 30}…
												</li>
											)}
										</ul>
									</div>
								)}
							</div>
						)
					})}
			</div>
		</div>
	)
}



