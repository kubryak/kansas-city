'use client'

import React from 'react'
import { SafeImage } from '@/components/safe-image'

function getAbsoluteSirusImageUrl (relativePath: string): string {
	if (relativePath.startsWith('http')) {
		return relativePath
	}
	return `https://sirus.su${relativePath}`
}

interface SkillInfo {
	entry: number
	quality: number
	name: string
	icon: string
	skill: {
		value: number
		max: number
	}
}

interface CharacterProfessionsProps {
	professions?: Array<unknown> | null
	secondarySkills?: Array<unknown> | null
}

export function CharacterProfessions ({
	professions,
	secondarySkills,
}: CharacterProfessionsProps) {
	const hasMain =
		Array.isArray(professions) && professions.length > 0
	const hasSecondary =
		Array.isArray(secondarySkills) && secondarySkills.length > 0

	if (!hasMain && !hasSecondary) {
		return null
	}

	return (
		<div className='mt-6 flex flex-col gap-6'>
			{hasMain && (
				<div className='flex flex-col gap-3'>
					<h3 className='text-sm font-semibold text-zinc-300'>
						Основные профессии
					</h3>
					<div className='grid grid-cols-2 gap-3'>
						{professions!.map((profession) => {
							if (
								typeof profession !== 'object' ||
								profession === null ||
								!('entry' in profession) ||
								!('name' in profession) ||
								!('icon' in profession) ||
								!('skill' in profession)
							) {
								return null
							}

							const prof = profession as SkillInfo
							const skillPercent = Math.round(
								(prof.skill.value / prof.skill.max) * 100,
							)

							let progressColor: string
							if (prof.skill.value > 400) {
								progressColor = 'bg-green-500'
							} else if (prof.skill.value > 300) {
								progressColor = 'bg-yellow-500'
							} else {
								progressColor = 'bg-red-500'
							}

							return (
								<div
									key={prof.entry}
									className='flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5'
								>
									{prof.icon && (
										<SafeImage
											src={getAbsoluteSirusImageUrl(prof.icon)}
											alt={prof.name}
											className='h-5 w-5 rounded'
										/>
									)}
									<div className='flex flex-col'>
										<span className='text-xs font-medium text-zinc-200'>
											{prof.name}
										</span>
										<div className='flex items-center gap-2'>
											<div className='h-1.5 w-20 overflow-hidden rounded-full bg-zinc-700'>
												<div
													className={`h-full transition-all ${progressColor}`}
													style={{ width: `${skillPercent}%` }}
												/>
											</div>
											<span className='text-xs text-zinc-400'>
												{prof.skill.value} / {prof.skill.max}
											</span>
										</div>
									</div>
								</div>
							)
						})}
					</div>
				</div>
			)}

			{hasSecondary && (
				<div className='flex flex-col gap-3'>
					<h3 className='text-sm font-semibold text-zinc-300'>
						Дополнительные профессии
					</h3>
					<div className='grid grid-cols-2 gap-3'>
						{secondarySkills!.map((skill) => {
							if (
								typeof skill !== 'object' ||
								skill === null ||
								!('entry' in skill) ||
								!('name' in skill) ||
								!('icon' in skill) ||
								!('skill' in skill)
							) {
								return null
							}

							const secSkill = skill as SkillInfo
							const skillPercent = Math.round(
								(secSkill.skill.value / secSkill.skill.max) * 100,
							)

							let progressColor: string
							if (secSkill.skill.value > 400) {
								progressColor = 'bg-green-500'
							} else if (secSkill.skill.value > 300) {
								progressColor = 'bg-yellow-500'
							} else {
								progressColor = 'bg-red-500'
							}

							return (
								<div
									key={secSkill.entry}
									className='flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5'
								>
									{secSkill.icon && (
										<SafeImage
											src={getAbsoluteSirusImageUrl(secSkill.icon)}
											alt={secSkill.name}
											className='h-5 w-5 rounded'
										/>
									)}
									<div className='flex flex-col'>
										<span className='text-xs font-medium text-zinc-200'>
											{secSkill.name}
										</span>
										<div className='flex items-center gap-2'>
											<div className='h-1.5 w-20 overflow-hidden rounded-full bg-zinc-700'>
												<div
													className={`h-full transition-all ${progressColor}`}
													style={{ width: `${skillPercent}%` }}
												/>
											</div>
											<span className='text-xs text-zinc-400'>
												{secSkill.skill.value} / {secSkill.skill.max}
											</span>
										</div>
									</div>
								</div>
							)
						})}
					</div>
				</div>
			)}
		</div>
	)
}




