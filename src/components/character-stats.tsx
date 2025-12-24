'use client'

import React from 'react'

interface CharacterStatsProps {
	stats?: {
		strength?: number
		agility?: number
		stamina?: number
		intellect?: number
		spirit?: number
		armor?: number
		blockPct?: number
		dodgePct?: number
		parryPct?: number
		critPct?: number
		rangedCritPct?: number
		spellCritPct?: number
		attackPower?: number
		rangedAttackPower?: number
		spellPower?: number
		hitRating?: number
		hasteRating?: number
		armorPenetration?: number
		spellPenetration?: number
		manaRegen?: number
		defenseRating?: number
		expertiseRating?: number
	} | null
}

export function CharacterStats ({ stats }: CharacterStatsProps) {
	if (!stats) {
		return null
	}

	return (
		<div className='flex flex-col gap-2 px-4 border-l border-r border-zinc-700 self-stretch'>
			<h3 className='text-sm font-semibold text-zinc-300 mb-2 text-left'>
				Характеристики
			</h3>
			<div className='space-y-1.5 text-xs'>
				<div>
					<h4 className='text-xs font-semibold text-zinc-300 mb-1.5 mt-0'>
						Основные характеристики
					</h4>
					{stats.strength !== undefined && (
						<div className='flex justify-between gap-4'>
							<span className='text-zinc-400'>Сила:</span>
							<span className='text-zinc-200 font-medium'>
								{stats.strength}
							</span>
						</div>
					)}
					{stats.agility !== undefined && (
						<div className='flex justify-between gap-4'>
							<span className='text-zinc-400'>Ловкость:</span>
							<span className='text-zinc-200 font-medium'>
								{stats.agility}
							</span>
						</div>
					)}
					{stats.stamina !== undefined && (
						<div className='flex justify-between gap-4'>
							<span className='text-zinc-400'>Выносливость:</span>
							<span className='text-zinc-200 font-medium'>
								{stats.stamina}
							</span>
						</div>
					)}
					{stats.intellect !== undefined && (
						<div className='flex justify-between gap-4'>
							<span className='text-zinc-400'>Интеллект:</span>
							<span className='text-zinc-200 font-medium'>
								{stats.intellect}
							</span>
						</div>
					)}
					{stats.spirit !== undefined && (
						<div className='flex justify-between gap-4'>
							<span className='text-zinc-400'>Дух:</span>
							<span className='text-zinc-200 font-medium'>
								{stats.spirit}
							</span>
						</div>
					)}

					<h4 className='text-xs font-semibold text-zinc-300 mb-1.5 mt-3 pt-2 border-t border-zinc-700'>
						Защитные характеристики
					</h4>
					{stats.armor !== undefined && (
						<div className='flex justify-between gap-4'>
							<span className='text-zinc-400'>Броня:</span>
							<span className='text-zinc-200 font-medium'>
								{stats.armor.toLocaleString('ru-RU')}
							</span>
						</div>
					)}
					{stats.defenseRating !== undefined && (
						<div className='flex justify-between gap-4'>
							<span className='text-zinc-400'>Защита:</span>
							<span className='text-zinc-200 font-medium'>
								{stats.defenseRating}
							</span>
						</div>
					)}
					{stats.blockPct !== undefined && (
						<div className='flex justify-between gap-4'>
							<span className='text-zinc-400'>Блок:</span>
							<span className='text-zinc-200 font-medium'>
								{stats.blockPct.toFixed(2)}%
							</span>
						</div>
					)}
					{stats.dodgePct !== undefined && (
						<div className='flex justify-between gap-4'>
							<span className='text-zinc-400'>Уклонение:</span>
							<span className='text-zinc-200 font-medium'>
								{stats.dodgePct.toFixed(2)}%
							</span>
						</div>
					)}
					{stats.parryPct !== undefined && (
						<div className='flex justify-between gap-4'>
							<span className='text-zinc-400'>Парирование:</span>
							<span className='text-zinc-200 font-medium'>
								{stats.parryPct.toFixed(2)}%
							</span>
						</div>
					)}

					<h4 className='text-xs font-semibold text-zinc-300 mb-1.5 mt-3 pt-2 border-t border-zinc-700'>
						Атакующие характеристики
					</h4>
					{stats.critPct !== undefined && (
						<div className='flex justify-between gap-4'>
							<span className='text-zinc-400'>Крит. удар:</span>
							<span className='text-zinc-200 font-medium'>
								{stats.critPct.toFixed(2)}%
							</span>
						</div>
					)}
					<div className='flex justify-between gap-4'>
						<span className='text-zinc-400'>
							Крит. дальнего боя:
						</span>
						<span className='text-zinc-200 font-medium'>
							{(stats.rangedCritPct ?? 0).toFixed(2)}%
						</span>
					</div>
					{stats.spellCritPct !== undefined && (
						<div className='flex justify-between gap-4'>
							<span className='text-zinc-400'>
								Крит. заклинаний:
							</span>
							<span className='text-zinc-200 font-medium'>
								{stats.spellCritPct.toFixed(2)}%
							</span>
						</div>
					)}
					{stats.attackPower !== undefined && (
						<div className='flex justify-between gap-4'>
							<span className='text-zinc-400'>Сила атаки:</span>
							<span className='text-zinc-200 font-medium'>
								{stats.attackPower}
							</span>
						</div>
					)}
					{stats.rangedAttackPower !== undefined && (
						<div className='flex justify-between gap-4'>
							<span className='text-zinc-400'>
								Дальнобойная атака:
							</span>
							<span className='text-zinc-200 font-medium'>
								{stats.rangedAttackPower}
							</span>
						</div>
					)}
					{stats.spellPower !== undefined && (
						<div className='flex justify-between gap-4'>
							<span className='text-zinc-400'>
								Сила заклинаний:
							</span>
							<span className='text-zinc-200 font-medium'>
								{stats.spellPower}
							</span>
						</div>
					)}
					{stats.hitRating !== undefined && stats.hitRating > 0 && (
						<div className='flex justify-between gap-4'>
							<span className='text-zinc-400'>Меткость:</span>
							<span className='text-zinc-200 font-medium'>
								{stats.hitRating}
							</span>
						</div>
					)}
					{stats.hasteRating !== undefined && stats.hasteRating > 0 && (
						<div className='flex justify-between gap-4'>
							<span className='text-zinc-400'>Скорость:</span>
							<span className='text-zinc-200 font-medium'>
								{stats.hasteRating}
							</span>
						</div>
					)}
					{stats.expertiseRating !== undefined &&
						stats.expertiseRating > 0 && (
						<div className='flex justify-between gap-4'>
							<span className='text-zinc-400'>Экспертиза:</span>
							<span className='text-zinc-200 font-medium'>
								{stats.expertiseRating}
							</span>
						</div>
					)}

					<h4 className='text-xs font-semibold text-zinc-300 mb-1.5 mt-3 pt-2 border-t border-zinc-700'>
						Ресурсы и регенерация
					</h4>
					{stats.manaRegen !== undefined && (
						<div className='flex justify-between gap-4'>
							<span className='text-zinc-400'>Восст. маны:</span>
							<span className='text-zinc-200 font-medium'>
								{stats.manaRegen.toFixed(2)}
							</span>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}


