'use client'

import React from 'react'

export interface Stats {
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
}

interface CharacterCompareStatsProps {
	stats1?: Stats | null
	stats2?: Stats | null
	character1Name: string
	character2Name: string
}

function getStatValue(stats: Stats | null | undefined, key: keyof Stats): number | undefined {
	return stats?.[key]
}

function formatStatValue(value: number | undefined, isPercentage = false): string {
	if (value === undefined) return '-'
	if (isPercentage) {
		return value.toFixed(2) + '%'
	}
	if (value >= 1000) {
		return value.toLocaleString('ru-RU')
	}
	return value.toString()
}

function getStatDifference(value1: number | undefined, value2: number | undefined): {
	diff: number
	isBetter: 'first' | 'second' | 'equal'
} {
	if (value1 === undefined && value2 === undefined) {
		return { diff: 0, isBetter: 'equal' }
	}
	if (value1 === undefined) return { diff: -(value2 ?? 0), isBetter: 'second' }
	if (value2 === undefined) return { diff: value1, isBetter: 'first' }
	const diff = value1 - value2
	return {
		diff,
		isBetter: diff > 0 ? 'first' : diff < 0 ? 'second' : 'equal',
	}
}

type StatItem = {
	key: keyof Stats
	label: string
	isPercentage?: boolean
}

type StatGroup = {
	title: string
	stats: StatItem[]
}

export function CharacterCompareStats({
	stats1,
	stats2,
	character1Name,
	character2Name,
}: CharacterCompareStatsProps) {
	const [isExpanded, setIsExpanded] = React.useState(true)

	if (!stats1 && !stats2) {
		return null
	}

	const statGroups: StatGroup[] = [
		{
			title: 'Основные характеристики',
			stats: [
				{ key: 'strength' as const, label: 'Сила' },
				{ key: 'agility' as const, label: 'Ловкость' },
				{ key: 'stamina' as const, label: 'Выносливость' },
				{ key: 'intellect' as const, label: 'Интеллект' },
				{ key: 'spirit' as const, label: 'Дух' },
			],
		},
		{
			title: 'Защитные характеристики',
			stats: [
				{ key: 'armor' as const, label: 'Броня' },
				{ key: 'defenseRating' as const, label: 'Защита' },
				{ key: 'blockPct' as const, label: 'Блок', isPercentage: true },
				{ key: 'dodgePct' as const, label: 'Уклонение', isPercentage: true },
				{ key: 'parryPct' as const, label: 'Парирование', isPercentage: true },
			],
		},
		{
			title: 'Атакующие характеристики',
			stats: [
				{ key: 'critPct' as const, label: 'Крит. удар', isPercentage: true },
				{ key: 'rangedCritPct' as const, label: 'Крит. дальнего боя', isPercentage: true },
				{ key: 'spellCritPct' as const, label: 'Крит. заклинаний', isPercentage: true },
				{ key: 'attackPower' as const, label: 'Сила атаки' },
				{ key: 'rangedAttackPower' as const, label: 'Дальнобойная атака' },
				{ key: 'spellPower' as const, label: 'Сила заклинаний' },
				{ key: 'hitRating' as const, label: 'Меткость' },
				{ key: 'hasteRating' as const, label: 'Скорость' },
				{ key: 'expertiseRating' as const, label: 'Экспертиза' },
			],
		},
		{
			title: 'Ресурсы и регенерация',
			stats: [
				{ key: 'manaRegen' as const, label: 'Восст. маны', isPercentage: true },
			],
		},
	]

	return (
		<section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className="mb-6 flex w-full items-center justify-between text-xl font-semibold text-zinc-100 hover:text-zinc-200 transition-colors"
			>
				<span>Сравнение характеристик</span>
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
					<div className="mb-4 pb-4 border-b border-zinc-800">
				<div className="grid grid-cols-5 gap-4 text-xs text-zinc-500">
					<div className="font-medium">Характеристика</div>
					<div className="text-right font-medium">{character1Name}</div>
					<div className="text-center">Разница</div>
					<div className="text-left font-medium">{character2Name}</div>
					<div></div>
				</div>
			</div>
			<div className="space-y-6">
				{statGroups.map((group) => (
					<div key={group.title}>
						<h3 className="text-sm font-semibold text-zinc-300 mb-3">
							{group.title}
						</h3>
						<div className="space-y-2">
							{group.stats.map((stat) => {
								const value1 = getStatValue(stats1, stat.key)
								const value2 = getStatValue(stats2, stat.key)
								const { diff, isBetter } = getStatDifference(value1, value2)
								const isPercentage = stat.isPercentage ?? false

								// Пропускаем статы, которые равны 0 или undefined у обоих
								if (value1 === undefined && value2 === undefined) {
									return null
								}
								// Для некоторых стат (hitRating, hasteRating, expertiseRating) 0 означает отсутствие
								if (
									(value1 === 0 || value1 === undefined) &&
									(value2 === 0 || value2 === undefined)
								) {
									return null
								}

								return (
									<div
										key={stat.key}
										className="grid grid-cols-5 gap-4 items-center py-2 border-b border-zinc-800 last:border-0"
									>
										<div className="text-sm text-zinc-400">{stat.label}</div>
										<div className="text-sm text-zinc-200 font-medium text-right">
											{formatStatValue(value1, isPercentage)}
										</div>
										<div className="text-xs text-center">
											{diff !== 0 && (
												<span
													className={`px-2 py-1 rounded ${
														isBetter === 'first'
															? 'bg-green-900/30 text-green-400'
															: isBetter === 'second'
															? 'bg-red-900/30 text-red-400'
															: 'text-zinc-500'
													}`}
												>
													{isBetter === 'first' ? '+' : ''}
													{formatStatValue(diff, isPercentage)}
												</span>
											)}
										</div>
										<div className="text-sm text-zinc-200 font-medium text-left">
											{formatStatValue(value2, isPercentage)}
										</div>
										<div></div>
									</div>
								)
							})}
						</div>
					</div>
				))}
			</div>
					<div className="mt-4 pt-4 border-t border-zinc-800">
						<div className="grid grid-cols-5 gap-4 text-xs text-zinc-500">
							<div className="font-medium">Характеристика</div>
							<div className="text-right font-medium">{character1Name}</div>
							<div className="text-center">Разница</div>
							<div className="text-left font-medium">{character2Name}</div>
							<div></div>
						</div>
					</div>
				</>
			)}
		</section>
	)
}

