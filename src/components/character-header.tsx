import React from 'react'
import { SafeImage } from '@/components/safe-image'

interface CharacterHeaderProps {
	character: any
	raceName: string
	raceIcon: string | null
	classNameText: string
	classColor: string
	classIcon?: string
	specName: string | null
	specIcon: string | null
	factionName: string
	factionIcon: string | null
}

export function CharacterHeader ({
	character,
	raceName,
	raceIcon,
	classNameText,
	classColor,
	classIcon,
	specName,
	specIcon,
	factionName,
	factionIcon,
}: CharacterHeaderProps) {
	return (
		<div className='flex items-start gap-6'>
			{raceIcon && (
				<div className='relative'>
					<SafeImage
						src={raceIcon}
						alt={raceName}
						className='h-24 w-24 rounded-lg'
					/>
					{factionIcon && (
						<div className='absolute -bottom-1 -right-1 rounded-full border-2 border-zinc-900 bg-zinc-900 p-0.5'>
							<SafeImage
								src={factionIcon}
								alt={factionName}
								className='h-6 w-6 rounded-full'
							/>
						</div>
					)}
				</div>
			)}
			<div className='flex-1'>
				<h1 className={`text-3xl font-bold ${classColor}`}>
					{character.name}
				</h1>
				{character.titled && typeof character.titled === 'string' && (
					<div className='mt-1 text-base text-yellow-400 font-medium'>
						{character.titled}
					</div>
				)}
				{character.guild && (
					<div className='mt-1 text-base text-blue-400 font-medium'>
						{character.guild.name}
					</div>
				)}
				<div className='mt-3 space-y-2'>
					{(() => {
						const category = typeof character.category === 'string'
							? character.category
							: null
						const zodiac = character.zodiac as { name?: string } | null | undefined
						const zodiacName = zodiac && zodiac.name ? zodiac.name : null

						if (!category && !zodiacName) return null

						return (
							<div className='flex flex-wrap items-center gap-3 text-sm'>
								{category && (
									<span className='px-2 py-1 rounded bg-zinc-800/50 border border-zinc-700 text-purple-400 font-medium'>
										{category}
									</span>
								)}
								{zodiacName && (
									<span className='px-2 py-1 rounded bg-zinc-800/50 border border-zinc-700 text-cyan-400 font-medium'>
										{zodiacName}
									</span>
								)}
							</div>
						)
					})()}

					<div className='flex flex-wrap items-center gap-3 text-sm'>
						<span className='text-zinc-300'>{raceName}</span>
						<span className='text-zinc-400'>•</span>
						<div className='flex items-center gap-1.5 text-zinc-300'>
							{classIcon && (
								<SafeImage
									src={classIcon}
									alt={classNameText}
									className='h-4 w-4 rounded'
								/>
							)}
							<span>{classNameText}</span>
						</div>
						{specName && (
							<>
								<span className='text-zinc-400'>•</span>
								<div className='flex items-center gap-1.5 text-zinc-300'>
									{specIcon && (
										<SafeImage
											src={specIcon}
											alt={specName}
											className='h-4 w-4 rounded'
										/>
									)}
									<span>{specName}</span>
								</div>
							</>
						)}
						<span className='text-zinc-400'>
							Уровень{' '}
							<span className='text-zinc-200 font-medium'>
								{character.level}
							</span>
						</span>
						<span className='text-zinc-400'>•</span>
						<span className='text-zinc-400'>
							ilvl{' '}
							<span className='text-zinc-200 font-medium'>
								{character.ilvl}
							</span>
						</span>
					</div>
				</div>
			</div>
		</div>
	)
}


