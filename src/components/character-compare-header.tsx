'use client'

import React from 'react'
import Link from 'next/link'
import { SafeImage } from '@/components/safe-image'
import {
	CLASS_NAMES,
	CLASS_ICON_MAP,
	RACE_NAMES,
	getSpecName,
	getSpecIcon,
	getFactionName,
	getFactionIcon,
	getClassColor,
	getAbsoluteSirusImageUrl,
} from '@/utils/character-meta'

interface CharacterCompareHeaderProps {
	character1: any
	character2: any
}

export function CharacterCompareHeader({
	character1,
	character2,
}: CharacterCompareHeaderProps) {
	const classColor1 = getClassColor(character1.class)
	const classIcon1 = CLASS_ICON_MAP[character1.class]
	const raceName1 = RACE_NAMES[character1.race] ?? `Раса ${character1.race}`
	const raceIcon1 = character1.raceIcon
		? getAbsoluteSirusImageUrl(character1.raceIcon)
		: null
	const specName1 =
		character1.spec != null
			? getSpecName(character1.class, character1.spec)
			: null
	const specIcon1 =
		character1.spec != null
			? getSpecIcon(character1.class, character1.spec)
			: null
	const factionName1 = getFactionName(character1.faction)
	const factionIcon1 = getFactionIcon(character1.faction)

	const classColor2 = getClassColor(character2.class)
	const classIcon2 = CLASS_ICON_MAP[character2.class]
	const raceName2 = RACE_NAMES[character2.race] ?? `Раса ${character2.race}`
	const raceIcon2 = character2.raceIcon
		? getAbsoluteSirusImageUrl(character2.raceIcon)
		: null
	const specName2 =
		character2.spec != null
			? getSpecName(character2.class, character2.spec)
			: null
	const specIcon2 =
		character2.spec != null
			? getSpecIcon(character2.class, character2.spec)
			: null
	const factionName2 = getFactionName(character2.faction)
	const factionIcon2 = getFactionIcon(character2.faction)

	const [isExpanded, setIsExpanded] = React.useState(true)

	return (
		<section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className="mb-6 flex w-full items-center justify-between text-xl font-semibold text-zinc-100 hover:text-zinc-200 transition-colors"
			>
				<span>Информация о персонажах</span>
				<svg
					className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			</button>
			{isExpanded && (
				<>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* Первый персонаж */}
				<div className="flex items-start gap-6">
					{raceIcon1 && (
						<div className="relative">
							<SafeImage
								src={raceIcon1}
								alt={raceName1}
								className="h-24 w-24 rounded-lg"
							/>
							{factionIcon1 && (
								<div className="absolute -bottom-1 -right-1 rounded-full border-2 border-zinc-900 bg-zinc-900 p-0.5">
									<SafeImage
										src={factionIcon1}
										alt={factionName1}
										className="h-6 w-6 rounded-full"
									/>
								</div>
							)}
						</div>
					)}
					<div>
						<Link href={`/character/${character1.name}`} className="inline-block">
							<h3 className={`text-2xl font-bold ${classColor1} hover:underline cursor-pointer`}>
								{character1.name}
							</h3>
						</Link>
						{character1.guild && (
							<div className="mt-1 text-sm text-blue-400 font-medium">
								{character1.guild.name}
							</div>
						)}
						<div className="mt-3 space-y-2">
							<div className="flex flex-wrap items-center gap-3 text-sm">
								<span className="text-zinc-300">{raceName1}</span>
								<span className="text-zinc-400">•</span>
								<div className="flex items-center gap-1.5 text-zinc-300">
									{classIcon1 && (
										<SafeImage
											src={classIcon1}
											alt={CLASS_NAMES[character1.class]}
											className="h-4 w-4 rounded"
										/>
									)}
									<span>{CLASS_NAMES[character1.class]}</span>
								</div>
								{specName1 && (
									<>
										<span className="text-zinc-400">•</span>
										<div className="flex items-center gap-1.5 text-zinc-300">
											{specIcon1 && (
												<SafeImage
													src={specIcon1}
													alt={specName1}
													className="h-4 w-4 rounded"
												/>
											)}
											<span>{specName1}</span>
										</div>
									</>
								)}
								<span className="text-zinc-400">
									Уровень{' '}
									<span className="text-zinc-200 font-medium">
										{character1.level}
									</span>
								</span>
								<span className="text-zinc-400">•</span>
								<span className="text-zinc-400">
									ilvl{' '}
									<span className="text-zinc-200 font-medium">
										{character1.ilvl}
									</span>
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Второй персонаж */}
				<div className="flex items-start gap-6 justify-end">
					<div className="text-right">
						<Link href={`/character/${character2.name}`} className="inline-block">
							<h3 className={`text-2xl font-bold ${classColor2} hover:underline cursor-pointer`}>
								{character2.name}
							</h3>
						</Link>
						{character2.guild && (
							<div className="mt-1 text-sm text-blue-400 font-medium">
								{character2.guild.name}
							</div>
						)}
						<div className="mt-3 space-y-2">
							<div className="flex flex-wrap items-center gap-3 text-sm justify-end">
								<span className="text-zinc-400">
									ilvl{' '}
									<span className="text-zinc-200 font-medium">
										{character2.ilvl}
									</span>
								</span>
								<span className="text-zinc-400">•</span>
								<span className="text-zinc-400">
									Уровень{' '}
									<span className="text-zinc-200 font-medium">
										{character2.level}
									</span>
								</span>
								{specName2 && (
									<>
										<span className="text-zinc-400">•</span>
										<div className="flex items-center gap-1.5 text-zinc-300">
											{specIcon2 && (
												<SafeImage
													src={specIcon2}
													alt={specName2}
													className="h-4 w-4 rounded"
												/>
											)}
											<span>{specName2}</span>
										</div>
									</>
								)}
								<span className="text-zinc-400">•</span>
								<div className="flex items-center gap-1.5 text-zinc-300">
									{classIcon2 && (
										<SafeImage
											src={classIcon2}
											alt={CLASS_NAMES[character2.class]}
											className="h-4 w-4 rounded"
										/>
									)}
									<span>{CLASS_NAMES[character2.class]}</span>
								</div>
								<span className="text-zinc-400">•</span>
								<span className="text-zinc-300">{raceName2}</span>
							</div>
						</div>
					</div>
					{raceIcon2 && (
						<div className="relative">
							<SafeImage
								src={raceIcon2}
								alt={raceName2}
								className="h-24 w-24 rounded-lg"
							/>
							{factionIcon2 && (
								<div className="absolute -bottom-1 -right-1 rounded-full border-2 border-zinc-900 bg-zinc-900 p-0.5">
									<SafeImage
										src={factionIcon2}
										alt={factionName2}
										className="h-6 w-6 rounded-full"
									/>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
				</>
			)}
		</section>
	)
}

