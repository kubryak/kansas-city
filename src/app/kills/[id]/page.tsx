'use client'

import { useState, useMemo, Fragment } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowUp, ArrowDown, ChevronDown, ChevronUp } from 'lucide-react'
import { ItemTooltip } from '@/components/item-tooltip'
import { SafeImage } from '@/components/safe-image'
import { useSpellNames } from '@/hooks/use-spell-names'

interface BossfightDetails {
	data: {
		boss_name: string
		map_name: string
		achievements: Array<{
			entry: number
			quality: string
			name: string
			icon: string
			points: number
		}>
		loots: Array<{
			entry: number
			count: number
			item: {
				entry: number
				quality: number
				icon: string
				name: string
				color: string
				realm_id: number
			}
		}>
		attempts: number
		difficulty: number
		guild: {
			id: number
			name: string
			level: number
		}
		killed_at: string
		fight_length: string
		players: Array<{
			guid: number
			name: string
			level: number
			class_id: number
			race_id: number
			gender: number
			spec: number
			ilvl: number
			category: number
			dps: number
			hps: number
			guild: {
				id: number
				name: string
				level: number
			} | null
			zodiac: {
				id: number
				name: string
			} | null
			itemset: Array<{
				id: number
				name: string
				count: number
			}>
		}>
	}
	order: number
	encounter: number
}

interface CombatlogSpellData {
	[spellId: string]: [
		Array<[number, number, number]>, // [damage, targetGuid, timestamp]
		{
			[flags: string]: Array<[number, number]> // [damage, targetGuid]
		},
	]
}

interface CombatlogAuras {
	[auraId: string]: [number, number] // [duration, count]
}

interface CombatlogTaken {
	[spellId: string]: [
		Array<[number, number, number]>,
		Array<Array<[number, number]>>,
	]
}

interface CombatlogData {
	dps?: CombatlogSpellData
	hps?: CombatlogSpellData
	auras?: CombatlogAuras
	targets?: Record<string, boolean>
	deaths?: unknown[]
	taken?: CombatlogTaken
}

interface BossfightResponse {
	details: BossfightDetails
	combatlog: CombatlogData | null
}

function getDifficultyLabel (difficulty: number): string {
	switch (difficulty) {
	case 0:
		return '10 об'
	case 1:
		return '25 об'
	case 2:
		return '10 гер'
	case 3:
		return '25 гер'
	default:
		return `${difficulty}`
	}
}

function getClassColor (classId: number): string {
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

function getCategoryLabel (category: number | null | undefined): string {
	if (!category || category === 0) {
		return '-'
	}

	const categoryMap: Record<number, string> = {
		90007: '5+',
		90006: '5',
		90008: '5++',
		90010: '4',
		90011: '4+',
		90004: '6+',
		90005: '6++',
		90003: '6',
	}

	return categoryMap[category] ?? '-'
}

function getCategoryColor (category: number | null | undefined): string {
	if (!category || category === 0) {
		return 'text-zinc-300'
	}

	// Маппинг цветов по ID категории
	const categoryColorMap: Record<number, string> = {
		// Категория 4 - зеленая
		90010: 'text-green-400',
		90011: 'text-green-400',
		// Категория 5 - голубая
		90006: 'text-cyan-400',
		90007: 'text-cyan-400',
		90008: 'text-cyan-400',
		// Категория 6 - синяя
		90003: 'text-blue-400',
		90004: 'text-blue-400',
		90005: 'text-blue-400',
	}

	return categoryColorMap[category] ?? 'text-zinc-300'
}

const SPEC_ICON_MAP: Record<
	number,
	Record<number, string>
> = {
	1: {
		// Воин
		0: 'https://wow.zamimg.com/images/wow/icons/medium/ability_warrior_savageblow.jpg', // Оружие
		1: 'https://wow.zamimg.com/images/wow/icons/medium/ability_warrior_innerrage.jpg', // Неистовство
		2: 'https://wow.zamimg.com/images/wow/icons/medium/inv_shield_05.jpg', // Защита
	},
	2: {
		// Паладин
		0: 'https://wow.zamimg.com/images/wow/icons/medium/spell_holy_holybolt.jpg', // Свет
		1: 'https://wow.zamimg.com/images/wow/icons/medium/inv_shield_06.jpg', // Защита
		2: 'https://wow.zamimg.com/images/wow/icons/medium/spell_holy_auraoflight.jpg', // Воздаяние
	},
	3: {
		// Охотник
		0: 'https://wow.zamimg.com/images/wow/icons/medium/ability_hunter_beasttaming.jpg', // Повелитель зверей
		1: 'https://wow.zamimg.com/images/wow/icons/medium/ability_marksmanship.jpg', // Стрельба
		2: 'https://wow.zamimg.com/images/wow/icons/medium/ability_hunter_swiftstrike.jpg', // Выживание
	},
	4: {
		// Разбойник
		0: 'https://wow.zamimg.com/images/wow/icons/medium/ability_rogue_eviscerate.jpg', // Ликвидация
		1: 'https://wow.zamimg.com/images/wow/icons/medium/ability_backstab.jpg', // Бой
		2: 'https://wow.zamimg.com/images/wow/icons/medium/ability_stealth.jpg', // Скрытность
	},
	5: {
		// Жрец
		0: 'https://wow.zamimg.com/images/wow/icons/medium/spell_holy_wordfortitude.jpg', // Послушание
		1: 'https://wow.zamimg.com/images/wow/icons/medium/spell_holy_guardianspirit.jpg', // Свет
		2: 'https://wow.zamimg.com/images/wow/icons/medium/spell_shadow_shadowwordpain.jpg', // Тьма
	},
	6: {
		// Рыцарь смерти
		0: 'https://wow.zamimg.com/images/wow/icons/medium/spell_deathknight_bloodpresence.jpg', // Кровь
		1: 'https://wow.zamimg.com/images/wow/icons/medium/spell_deathknight_frostpresence.jpg', // Лед
		2: 'https://wow.zamimg.com/images/wow/icons/medium/spell_deathknight_unholypresence.jpg', // Нечестивость
	},
	7: {
		// Шаман
		0: 'https://wow.zamimg.com/images/wow/icons/medium/spell_nature_lightning.jpg', // Стихии
		1: 'https://wow.zamimg.com/images/wow/icons/medium/spell_nature_lightningshield.jpg', // Совершенствование
		2: 'https://wow.zamimg.com/images/wow/icons/medium/spell_nature_magicimmunity.jpg', // Исцеление
	},
	8: {
		// Маг
		0: 'https://wow.zamimg.com/images/wow/icons/medium/spell_holy_magicalsentry.jpg', // Тайная магия
		1: 'https://wow.zamimg.com/images/wow/icons/medium/spell_fire_firebolt02.jpg', // Огонь
		2: 'https://wow.zamimg.com/images/wow/icons/medium/spell_frost_frostbolt02.jpg', // Лед
	},
	9: {
		// Чернокнижник
		0: 'https://wow.zamimg.com/images/wow/icons/medium/spell_shadow_curseoftounges.jpg', // Колдовство
		1: 'https://wow.zamimg.com/images/wow/icons/medium/spell_shadow_metamorphosis.jpg', // Демонология
		2: 'https://wow.zamimg.com/images/wow/icons/medium/spell_shadow_rainoffire.jpg', // Разрушение
	},
	11: {
		// Друид
		0: 'https://wow.zamimg.com/images/wow/icons/medium/spell_nature_starfall.jpg', // Баланс
		1: 'https://wow.zamimg.com/images/wow/icons/medium/ability_racial_bearform.jpg', // Сила зверя
		2: 'https://wow.zamimg.com/images/wow/icons/medium/spell_nature_healingtouch.jpg', // Исцеление

	},
}

function getSpecName (classId: number, spec: number): string {
	// Возвращаем название спека на основе класса и номера спеки
	const specNames: Record<number, string[]> = {
		1: ['Оружие', 'Неистовство', 'Защита'], // Воин
		2: ['Свет', 'Защита', 'Воздаяние'], // Паладин
		3: ['Повелитель зверей', 'Стрельба', 'Выживание'], // Охотник
		4: ['Ликвидация', 'Бой', 'Скрытность'], // Разбойник
		5: ['Послушание', 'Свет', 'Тьма'], // Жрец
		6: ['Кровь', 'Лед', 'Нечестивость'], // Рыцарь смерти
		7: ['Стихии', 'Совершенствование', 'Исцеление'], // Шаман
		8: ['Тайная магия', 'Огонь', 'Лед'], // Маг
		9: ['Колдовство', 'Демонология', 'Разрушение'], // Чернокнижник
		11: ['Баланс', 'Сила зверя', 'Исцеление'], // Друид
	}

	const specs = specNames[classId]
	if (!specs || spec < 0 || spec >= specs.length) {
		return `Спек ${spec}`
	}

	return specs[spec]
}

function getSpecIcon (classId: number, spec: number): string | null {
	const classSpecs = SPEC_ICON_MAP[classId]
	if (!classSpecs) return null

	const icon = classSpecs[spec]
	return icon ?? null
}

function getAbsoluteSirusImageUrl (relativePath: string): string {
	if (relativePath.startsWith('http')) {
		return relativePath
	}
	return `https://sirus.su${relativePath}`
}

interface PlayerCombatlogViewerProps {
	combatlog: CombatlogData
	playerGuid: number
	players: Array<{ guid: number; name: string }>
	spellNameMap: Map<number, string>
	spellIconMap: Map<number, string>
	fightLength: string
}

function PlayerCombatlogViewer ({
	combatlog,
	playerGuid,
	players,
	spellNameMap: parentSpellNameMap,
	spellIconMap: parentSpellIconMap,
	fightLength,
}: PlayerCombatlogViewerProps) {
	const [activeTab, setActiveTab] = useState<'damage' | 'auras'>('damage')
	const [hideFullFightAuras, setHideFullFightAuras] = useState(false)

	const playerMap = useMemo(() => {
		const map = new Map<number, string>()
		for (const player of players) {
			map.set(player.guid, player.name)
		}
		return map
	}, [players])

	// Собираем все уникальные ID заклинаний для массовой загрузки
	const allSpellIds = useMemo(() => {
		const ids: Array<string | number> = []

		// DPS заклинания
		if (combatlog.dps) {
			for (const spellId of Object.keys(combatlog.dps)) {
				ids.push(spellId)
			}
		}

		// HPS заклинания
		if (combatlog.hps) {
			for (const spellId of Object.keys(combatlog.hps)) {
				ids.push(spellId)
			}
		}

		// Ауры
		if (combatlog.auras) {
			for (const auraId of Object.keys(combatlog.auras)) {
				ids.push(auraId)
			}
		}

		// Полученный урон
		if (combatlog.taken) {
			for (const spellId of Object.keys(combatlog.taken)) {
				ids.push(spellId)
			}
		}

		return ids
	}, [combatlog])

	// Загружаем данные о заклинаниях для этого конкретного игрока
	const { data: spells } = useSpellNames(allSpellIds)

	// Создаем карту названий и иконок заклинаний, объединяя с родительской картой
	const spellNameMap = useMemo(() => {
		const map = new Map<number, string>(parentSpellNameMap)
		if (spells && Array.isArray(spells)) {
			for (const spell of spells) {
				if (spell && typeof spell === 'object' && 'id' in spell && 'name' in spell) {
					const spellId = Number(spell.id)
					const spellName = String(spell.name)
					map.set(spellId, spellName)
				}
			}
		}
		return map
	}, [spells, parentSpellNameMap])

	const spellIconMap = useMemo(() => {
		const map = new Map<number, string>(parentSpellIconMap)
		if (spells && Array.isArray(spells)) {
			for (const spell of spells) {
				if (spell && typeof spell === 'object' && 'id' in spell) {
					const spellId = Number(spell.id)
					// Проверяем наличие iconUrl и что он не пустой
					if (spell.iconUrl && typeof spell.iconUrl === 'string' && spell.iconUrl.trim() !== '') {
						map.set(spellId, String(spell.iconUrl))
					}
				}
			}
		}
		console.log('SpellIconMap created:', map.size, 'icons')
		return map
	}, [spells, parentSpellIconMap])

	const dpsData = useMemo(() => {
		const spells: Array<{
			spellId: string
			totalDamage: number
			hitCount: number
			critCount: number
		}> = []

		if (!combatlog.dps || typeof combatlog.dps !== 'object') {
			return spells
		}

		for (const [spellId, spellData] of Object.entries(combatlog.dps)) {
			const [events, flagsData] = spellData

			let totalDamage = 0
			let hitCount = 0
			let critCount = 0

			for (const [damage, targetGuid, timestamp] of events) {
				totalDamage += damage
				hitCount++

				// Проверяем флаги для определения крита
				for (const [flag, flagEvents] of Object.entries(flagsData)) {
					const flagNum = Number(flag)
					// Флаг 2 обычно означает критический удар
					if (flagNum === 2 || flagNum === 512) {
						for (const [flagDamage, flagTarget] of flagEvents) {
							if (
								flagDamage === damage &&
								flagTarget === targetGuid
							) {
								critCount++
								break
							}
						}
					}
				}
			}

			if (totalDamage > 0) {
				spells.push({
					spellId,
					totalDamage,
					hitCount,
					critCount,
				})
			}
		}

		return spells.sort((a, b) => b.totalDamage - a.totalDamage)
	}, [combatlog.dps])

	const hpsData = useMemo(() => {
		const spells: Array<{
			spellId: string
			totalDamage: number
			hitCount: number
		}> = []

		if (!combatlog.hps || typeof combatlog.hps !== 'object') {
			return spells
		}

		for (const [spellId, spellData] of Object.entries(combatlog.hps)) {
			const [events] = spellData

			let totalHealing = 0
			let hitCount = 0

			for (const [healing, targetGuid] of events) {
				totalHealing += healing
				hitCount++
			}

			if (totalHealing > 0) {
				spells.push({
					spellId,
					totalDamage: totalHealing,
					hitCount,
				})
			}
		}

		return spells.sort((a, b) => b.totalDamage - a.totalDamage)
	}, [combatlog.hps])

	// Функция для парсинга длительности боя в секунды
	const parseFightLength = useMemo(() => {
		return (length: string): number => {
			// Формат может быть "MM:SS" или "HH:MM:SS"
			const parts = length.split(':').map(Number)
			if (parts.length === 2) {
				// MM:SS
				return parts[0] * 60 + parts[1]
			} else if (parts.length === 3) {
				// HH:MM:SS
				return parts[0] * 3600 + parts[1] * 60 + parts[2]
			}
			return 0
		}
	}, [])

	const fightLengthSeconds = useMemo(() => {
		return parseFightLength(fightLength)
	}, [fightLength, parseFightLength])

	const aurasData = useMemo(() => {
		if (!combatlog.auras || typeof combatlog.auras !== 'object') {
			return []
		}

		const allAuras = Object.entries(combatlog.auras)
			.map(([auraId, [duration, count]]) => ({
				auraId,
				duration,
				count,
			}))
			.sort((a, b) => b.duration - a.duration)

		// Фильтруем ауры, которые висели весь бой или больше
		if (hideFullFightAuras) {
			return allAuras.filter((aura) => aura.duration < fightLengthSeconds)
		}

		return allAuras
	}, [combatlog.auras, hideFullFightAuras, fightLengthSeconds])

	// Подсчитываем количество препотов (Скорость, Адреналин, Дикая магия) по количеству применений
	const prepotCount = useMemo(() => {
		return aurasData
			.filter((aura) => {
				const auraName = Number(aura.auraId) === 0
					? 'Автоатака'
					: spellNameMap.get(Number(aura.auraId)) ?? `Аура ${aura.auraId}`
				return ['Дикая магия', 'Скорость', 'Адреналин'].includes(auraName)
			})
			.reduce((sum, aura) => sum + aura.count, 0)
	}, [aurasData, spellNameMap])

	const takenData = useMemo(() => {
		const spells: Array<{
			spellId: string
			totalDamage: number
			hitCount: number
			targets: Set<number>
		}> = []

		if (!combatlog.taken || typeof combatlog.taken !== 'object') {
			return spells
		}

		for (const [spellId, spellData] of Object.entries(combatlog.taken)) {
			const [events] = spellData

			let totalDamage = 0
			const targets = new Set<number>()

			for (const [damage, targetGuid] of events) {
				totalDamage += damage
				targets.add(targetGuid)
			}

			if (totalDamage > 0) {
				spells.push({
					spellId,
					totalDamage,
					hitCount: events.length,
					targets,
				})
			}
		}

		return spells.sort((a, b) => b.totalDamage - a.totalDamage)
	}, [combatlog.taken])

	const hasDamage = dpsData.length > 0 || hpsData.length > 0 || takenData.length > 0
	const hasAuras = aurasData.length > 0
	const hasDps = dpsData.length > 0
	const hasHps = hpsData.length > 0
	const hasTaken = takenData.length > 0

	return (
		<div className='rounded-lg border border-zinc-700 bg-zinc-800/50 p-4'>
			<h3 className='mb-3 text-sm font-semibold text-zinc-100'>
				Логи
			</h3>

			{/* Вкладки */}
			<div className='mb-4 flex flex-wrap gap-2 border-b border-zinc-800'>
				{hasDamage && (
					<button
						type='button'
						onClick={() => setActiveTab('damage')}
						className={`px-3 py-1.5 text-xs font-medium transition-colors ${
							activeTab === 'damage'
								? 'border-b-2 border-red-400 text-red-400'
								: 'text-zinc-400 hover:text-zinc-200'
						}`}
					>
						Способности
					</button>
				)}
				{hasAuras && (
					<button
						type='button'
						onClick={() => setActiveTab('auras')}
						className={`px-3 py-1.5 text-xs font-medium transition-colors ${
							activeTab === 'auras'
								? 'border-b-2 border-purple-400 text-purple-400'
								: 'text-zinc-400 hover:text-zinc-200'
						}`}
					>
						Ауры ({aurasData.length})
					</button>
				)}
			</div>

			<div className='space-y-4'>
				{/* Урон (DPS, HPS, Полученный урон) */}
				{activeTab === 'damage' && hasDamage && (
					<div className='space-y-6'>
						{/* DPS */}
						{hasDps && (
							<div className='space-y-2'>
								<h4 className='text-xs font-semibold text-red-400'>Нанесенный урон (DPS)</h4>
								{/* Общий урон */}
								{(() => {
									const totalDamage = dpsData.reduce((sum, spell) => sum + spell.totalDamage, 0)
									const totalHits = dpsData.reduce((sum, spell) => sum + spell.hitCount, 0)
									const totalCrits = dpsData.reduce((sum, spell) => sum + spell.critCount, 0)
									return (
										<div className='rounded-lg border-2 border-zinc-600 bg-zinc-800/70 px-3 py-2'>
											<div className='flex items-center justify-between'>
												<div>
													<div className='text-xs font-semibold text-zinc-100'>
														Общий урон
													</div>
													<div className='mt-0.5 text-xs text-zinc-400'>
														Попаданий: {totalHits} | Критов:{' '}
														{totalCrits} (
														{totalHits > 0
															? ((totalCrits / totalHits) * 100).toFixed(1)
															: 0}
														%)
													</div>
												</div>
												<div className='text-right'>
													<div className='text-sm font-bold text-red-400'>
														{totalDamage.toLocaleString()}
													</div>
													<div className='text-xs text-zinc-400'>
														Средний урон:{' '}
														{totalHits > 0
															? Math.round(totalDamage / totalHits).toLocaleString()
															: 0}
													</div>
												</div>
											</div>
										</div>
									)
								})()}
								{dpsData.slice(0, 10).map((spell) => (
							<div
								key={spell.spellId}
								className='rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2'
							>
								<div className='flex items-center justify-between'>
									<div>
										<div className='flex items-center gap-2 text-xs font-medium text-zinc-100'>
											{spellIconMap.get(Number(spell.spellId)) ? (
												<SafeImage
													src={spellIconMap.get(Number(spell.spellId))!}
													alt=''
													className='h-4 w-4 rounded'
												/>
											) : (
												<div className='h-4 w-4 rounded bg-zinc-700 flex items-center justify-center'>
													<span className='text-[8px] text-zinc-500'>?</span>
												</div>
											)}
											<span>
												{(() => {
													const spellIdNum = Number(spell.spellId)
													if (spellIdNum === 0) {
														return 'Автоатака'
													}
													const name = spellNameMap.get(spellIdNum)
													return name ?? `Заклинание ${spell.spellId}`
												})()}
											</span>
										</div>
										<div className='mt-0.5 text-xs text-zinc-400'>
											Попаданий: {spell.hitCount} | Критов:{' '}
											{spell.critCount} (
											{spell.hitCount > 0
												? (
														(spell.critCount / spell.hitCount) *
														100
												  ).toFixed(1)
												: 0}
											%)
										</div>
									</div>
									<div className='text-right'>
										<div className='text-sm font-bold text-red-400'>
											{spell.totalDamage.toLocaleString()}
										</div>
										<div className='text-xs text-zinc-400'>
											Средний урон:{' '}
											{Math.round(
												spell.totalDamage / spell.hitCount,
											).toLocaleString()}
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				)}

						{/* HPS */}
						{hasHps && (
							<div className='space-y-2'>
								<h4 className='text-xs font-semibold text-green-400'>Исцеление (HPS)</h4>
								{/* Общее исцеление */}
								{(() => {
									const totalHealing = hpsData.reduce((sum, spell) => sum + spell.totalDamage, 0)
									const totalHits = hpsData.reduce((sum, spell) => sum + spell.hitCount, 0)
									return (
										<div className='rounded-lg border-2 border-zinc-600 bg-zinc-800/70 px-3 py-2'>
											<div className='flex items-center justify-between'>
												<div>
													<div className='text-xs font-semibold text-zinc-100'>
														Общее исцеление
													</div>
													<div className='mt-0.5 text-xs text-zinc-400'>
														Попаданий: {totalHits}
													</div>
												</div>
												<div className='text-right'>
													<div className='text-sm font-bold text-green-400'>
														{totalHealing.toLocaleString()}
													</div>
													<div className='text-xs text-zinc-400'>
														Среднее исцеление:{' '}
														{totalHits > 0
															? Math.round(totalHealing / totalHits).toLocaleString()
															: 0}
													</div>
												</div>
											</div>
										</div>
									)
								})()}
								{hpsData.slice(0, 10).map((spell) => (
									<div
										key={spell.spellId}
										className='rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2'
									>
										<div className='flex items-center justify-between'>
											<div>
												<div className='flex items-center gap-2 text-xs font-medium text-zinc-100'>
													{spellIconMap.get(Number(spell.spellId)) ? (
														<SafeImage
															src={spellIconMap.get(Number(spell.spellId))!}
															alt=''
															className='h-4 w-4 rounded'
														/>
													) : (
														<div className='h-4 w-4 rounded bg-zinc-700 flex items-center justify-center'>
															<span className='text-[8px] text-zinc-500'>?</span>
														</div>
													)}
													<span>
														{(() => {
															const spellIdNum = Number(spell.spellId)
															if (spellIdNum === 0) {
																return 'Автоатака'
															}
															const name = spellNameMap.get(spellIdNum)
															return name ?? `Заклинание ${spell.spellId}`
														})()}
													</span>
												</div>
												<div className='mt-0.5 text-xs text-zinc-400'>
													Попаданий: {spell.hitCount}
												</div>
											</div>
											<div className='text-right'>
												<div className='text-sm font-bold text-green-400'>
													{spell.totalDamage.toLocaleString()}
												</div>
												<div className='text-xs text-zinc-400'>
													Среднее исцеление:{' '}
													{Math.round(
														spell.totalDamage / spell.hitCount,
													).toLocaleString()}
												</div>
											</div>
										</div>
									</div>
								))}
							</div>
						)}

						{/* Полученный урон */}
						{hasTaken && (
							<div className='space-y-2'>
								<h4 className='text-xs font-semibold text-orange-400'>Полученный урон</h4>
								{/* Общий полученный урон */}
								{(() => {
									const totalDamage = takenData.reduce((sum, spell) => sum + spell.totalDamage, 0)
									const totalHits = takenData.reduce((sum, spell) => sum + spell.hitCount, 0)
									return (
										<div className='rounded-lg border-2 border-zinc-600 bg-zinc-800/70 px-3 py-2'>
											<div className='flex items-center justify-between'>
												<div>
													<div className='text-xs font-semibold text-zinc-100'>
														Общий полученный урон
													</div>
													<div className='mt-0.5 text-xs text-zinc-400'>
														Попаданий: {totalHits}
													</div>
												</div>
												<div className='text-right'>
													<div className='text-sm font-bold text-orange-400'>
														{totalDamage.toLocaleString()}
													</div>
													<div className='text-xs text-zinc-400'>
														Средний урон:{' '}
														{totalHits > 0
															? Math.round(totalDamage / totalHits).toLocaleString()
															: 0}
													</div>
												</div>
											</div>
										</div>
									)
								})()}
								{takenData.slice(0, 10).map((spell) => (
									<div
										key={spell.spellId}
										className='rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2'
									>
										<div className='flex items-center justify-between'>
											<div>
												<div className='flex items-center gap-2 text-xs font-medium text-zinc-100'>
													{spellIconMap.get(Number(spell.spellId)) ? (
														<SafeImage
															src={spellIconMap.get(Number(spell.spellId))!}
															alt=''
															className='h-4 w-4 rounded'
														/>
													) : (
														<div className='h-4 w-4 rounded bg-zinc-700 flex items-center justify-center'>
															<span className='text-[8px] text-zinc-500'>?</span>
														</div>
													)}
													<span>
														{(() => {
															const spellIdNum = Number(spell.spellId)
															if (spellIdNum === 0) {
																return 'Автоатака'
															}
															const name = spellNameMap.get(spellIdNum)
															return name ?? `Заклинание ${spell.spellId}`
														})()}
													</span>
												</div>
												<div className='mt-0.5 text-xs text-zinc-400'>
													Попаданий: {spell.hitCount} | Целей:{' '}
													{spell.targets.size}
												</div>
											</div>
											<div className='text-right'>
												<div className='text-sm font-bold text-orange-400'>
													{spell.totalDamage.toLocaleString()}
												</div>
												<div className='text-xs text-zinc-400'>
													Средний урон:{' '}
													{Math.round(
														spell.totalDamage / spell.hitCount,
													).toLocaleString()}
												</div>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)}

				{/* Ауры */}
				{activeTab === 'auras' && hasAuras && (
					<div className='space-y-3'>
						<div className='flex items-center justify-between'>
							<div className='flex items-center gap-2'>
								<input
									type='checkbox'
									id='hide-full-fight-auras'
									checked={hideFullFightAuras}
									onChange={(e) => setHideFullFightAuras(e.target.checked)}
									className='h-4 w-4 cursor-pointer rounded border-zinc-600 bg-zinc-800/50 text-red-400 transition-colors checked:bg-red-500/20 checked:border-red-500/50 focus:ring-2 focus:ring-red-400/50 focus:ring-offset-0 focus:ring-offset-zinc-900 hover:border-zinc-500'
								/>
								<label
									htmlFor='hide-full-fight-auras'
									className='cursor-pointer text-xs text-zinc-400 hover:text-zinc-300 transition-colors'
								>
									Скрыть ауры, висевшие весь бой или больше
								</label>
							</div>
							{prepotCount > 0 && (
								<div className='text-xs text-zinc-400'>
									Препоты: <span className='font-medium text-green-400'>{prepotCount}</span>
								</div>
							)}
						</div>
						<div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-3'>
						{aurasData.map((aura) => {
							const auraName = Number(aura.auraId) === 0
								? 'Автоатака'
								: spellNameMap.get(Number(aura.auraId)) ?? `Аура ${aura.auraId}`
							const isSpecialAura = ['Дикая магия', 'Скорость', 'Адреналин'].includes(auraName)
							
							return (
								<div
									key={aura.auraId}
									className={`rounded-lg border px-3 py-2 ${
										isSpecialAura
											? 'border-green-500/50 bg-green-500/10'
											: 'border-zinc-700 bg-zinc-800/50'
									}`}
								>
									<div className='flex items-center gap-2 text-xs font-medium text-zinc-100'>
										{spellIconMap.get(Number(aura.auraId)) && (
											<SafeImage
												src={spellIconMap.get(Number(aura.auraId))!}
												alt=''
												className='h-4 w-4 rounded'
											/>
										)}
										<span>
											{auraName}
										</span>
									</div>
									<div className='mt-0.5 text-xs text-zinc-400'>
										Длительность: {(() => {
											const totalSeconds = Math.floor(aura.duration)
											const minutes = Math.floor(totalSeconds / 60)
											const seconds = totalSeconds % 60
											return `${minutes}:${seconds.toString().padStart(2, '0')}`
										})()} | Применений:{' '}
										{aura.count}
									</div>
								</div>
							)
						})}
						</div>
					</div>
				)}

			</div>
		</div>
	)
}

export default function BossfightPage () {
	const params = useParams()
	const id = params.id as string
	const [sortBy, setSortBy] = useState<'dps' | 'hps'>('dps')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
	const [expandedPlayerGuid, setExpandedPlayerGuid] = useState<number | null>(null)

	const { data, isLoading, isError } = useQuery<BossfightResponse>({
		queryKey: ['bossfight', id],
		queryFn: async () => {
			const { fetchSirusAPI, SIRUS_API } = await import('@/lib/sirus-api')
			const [details, combatlog] = await Promise.all([
				fetchSirusAPI<BossfightDetails>(SIRUS_API.bossfight(id)).catch(() => null),
				fetchSirusAPI<CombatlogData>(SIRUS_API.bossfightCombatlog(id)).catch(() => null),
			])
			return {
				details: details ?? {
					data: {
						boss_name: '',
						map_name: '',
						achievements: [],
						loots: [],
						attempts: 0,
						difficulty: 0,
						guild: { id: 0, name: '', level: 0 },
						killed_at: '',
						fight_length: '',
						players: [],
					},
					order: 0,
					encounter: 0,
				},
				combatlog: combatlog ?? null,
			} as BossfightResponse
		},
	})

	// Создаем пустые карты для передачи в компонент (будут заполнены внутри компонента)
	const spellNameMap = useMemo(() => new Map<number, string>(), [])
	const spellIconMap = useMemo(() => new Map<number, string>(), [])

	// Функция для фильтрации данных combatlog по guid игрока
	const getPlayerCombatlogData = useMemo(() => {
		return (playerGuid: number) => {
			if (!data?.combatlog) {
				return null
			}

			const combatlog = data.combatlog
			
			// Проверяем, может быть данные уже структурированы по guid игрока
			// Если combatlog содержит объект с ключами-guid, то используем данные для этого игрока
			if (
				typeof combatlog === 'object' &&
				combatlog !== null &&
				playerGuid.toString() in combatlog
			) {
				return (combatlog as Record<string, CombatlogData>)[playerGuid.toString()]
			}

			// Если данные структурированы по guid на верхнем уровне
			const playerGuidStr = playerGuid.toString()
			if (combatlog[playerGuidStr as keyof typeof combatlog]) {
				return (combatlog as Record<string, CombatlogData>)[playerGuidStr]
			}

			// Иначе используем все данные combatlog (они могут быть общими для всех игроков)
			return combatlog
		}
	}, [data?.combatlog])

	if (isLoading) {
		return (
			<main className='mx-auto flex max-w-[1500px] flex-col gap-8 px-6 py-8'>
				<p className='text-zinc-300'>Загрузка детальной статистики…</p>
			</main>
		)
	}

	if (isError || !data) {
		return (
			<main className='mx-auto flex max-w-[1500px] flex-col gap-8 px-6 py-8'>
				<p className='text-red-400'>
					Не удалось загрузить детальную статистику
				</p>
			</main>
		)
	}

	const { details } = data
	const { data: fightData } = details

	// Подсчитываем состав рейда по классам
	const classCounts = fightData.players.reduce(
		(acc, player) => {
			acc[player.class_id] = (acc[player.class_id] || 0) + 1
			return acc
		},
		{} as Record<number, number>,
	)

	const CLASS_NAMES: Record<number, string> = {
		1: 'Воин',
		2: 'Паладин',
		3: 'Охотник',
		4: 'Разбойник',
		5: 'Жрец',
		6: 'Рыцарь смерти',
		7: 'Шаман',
		8: 'Маг',
		9: 'Чернокнижник',
		11: 'Друид',
	}

	return (
		<main className='mx-auto flex max-w-[1500px] flex-col gap-8 px-6 py-8'>
			<div className='flex items-center gap-4'>
				<Link
					href='/kills'
					className='text-sm text-zinc-400 hover:text-zinc-200'
				>
					← Назад к списку убийств
				</Link>
			</div>

			{/* Основной блок с информацией о боссе и достижениями/добычей */}
			<div className='grid gap-6 lg:grid-cols-2'>
				{/* Левая часть: информация о боссе */}
				<section className='rounded-xl border border-zinc-800 bg-zinc-900/80 p-6'>
					<div className='flex flex-col gap-4'>
						<div>
							<h1 className='text-2xl font-bold text-zinc-100'>
								{fightData.boss_name}
							</h1>
							<p className='mt-1 text-sm text-zinc-400'>
								{getDifficultyLabel(fightData.difficulty)}
							</p>
						</div>
						<div className='space-y-2 text-sm text-zinc-300'>
							<div>
								<span className='text-zinc-500'>Попыток:</span>{' '}
								<span className='font-medium'>{fightData.attempts}</span>
							</div>
							<div>
								<span className='text-zinc-500'>Убит:</span>{' '}
								<span className='font-medium'>{fightData.killed_at}</span>
							</div>
							<div>
								<span className='text-zinc-500'>Время боя:</span>{' '}
								<span className='font-medium'>{fightData.fight_length}</span>
							</div>
						</div>
						<div className='mt-4 border-t border-zinc-800 pt-4'>
							<h2 className='mb-3 text-sm font-semibold text-zinc-200'>
								Состав рейда по классам
							</h2>
							<div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
								{Object.entries(classCounts)
									.sort(([a], [b]) => Number(a) - Number(b))
									.map(([classId, count]) => {
										const classIdNum = Number(classId)
										const className = CLASS_NAMES[classIdNum] ?? `Класс ${classId}`
										const classColor = getClassColor(classIdNum)
										const classIcon = CLASS_ICON_MAP[classIdNum]

										return (
											<div
												key={classId}
												className='flex items-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-2'
											>
												{classIcon && (
													<SafeImage
														src={classIcon}
														alt={className}
														className='h-6 w-6 rounded'
													/>
												)}
												<div className='flex-1'>
													<div className={`text-xs font-medium ${classColor}`}>
														{className}
													</div>
													<div className='text-xs text-zinc-400'>
														{count} {count === 1 ? 'игрок' : 'игроков'}
													</div>
												</div>
											</div>
										)
									})}
							</div>
						</div>
					</div>
				</section>

				{/* Правая часть: достижения и добыча */}
				<section className='rounded-xl border border-zinc-800 bg-zinc-900/80 p-6'>
					{fightData.achievements.length > 0 && (
						<div className='mb-6'>
							<h2 className='mb-3 text-lg font-semibold text-zinc-100'>
								Достижения
							</h2>
							<div className='flex flex-col gap-2'>
								{fightData.achievements.map((achievement) => (
									<div
										key={achievement.entry}
										className='flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2'
									>
										<SafeImage
											src={getAbsoluteSirusImageUrl(achievement.icon)}
											alt={achievement.name}
											className='h-10 w-10 rounded'
										/>
										<div className='flex-1'>
											<div className='text-sm font-medium text-zinc-100'>
												{achievement.name}
											</div>
											<div className='text-xs text-zinc-500'>
												{achievement.points} очков
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{fightData.loots.length > 0 && (
						<div>
							<h2 className='mb-3 text-lg font-semibold text-zinc-100'>
								Добыча
							</h2>
							<div className='flex flex-col gap-2'>
								{fightData.loots.map((loot, index) => {
									const itemName = loot.item.name
									const itemIcon = loot.item.icon
									const itemCount = loot.count > 1 ? ` x${loot.count}` : ''

									return (
										<div
											key={index}
											className='flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2'
										>
											{itemIcon && (
												<ItemTooltip itemId={loot.entry}>
													<SafeImage
														src={getAbsoluteSirusImageUrl(itemIcon)}
														alt={itemName}
														className='h-10 w-10 rounded cursor-pointer'
													/>
												</ItemTooltip>
											)}
											<div className='flex-1 text-sm text-zinc-100'>
												<ItemTooltip itemId={loot.entry}>
													<span className='cursor-pointer hover:text-zinc-200'>
														{itemName}
													</span>
												</ItemTooltip>
												{itemCount && (
													<span className='ml-1 text-zinc-400'>
														{itemCount}
													</span>
												)}
											</div>
										</div>
									)
								})}
							</div>
						</div>
					)}

					{fightData.achievements.length === 0 &&
						fightData.loots.length === 0 && (
							<p className='text-sm text-zinc-500'>
								Нет достижений и добычи
							</p>
						)}
				</section>
			</div>

			{/* Таблица игроков */}
			<section className='rounded-xl border border-zinc-800 bg-zinc-900/80 p-6'>
				<h2 className='mb-4 text-lg font-semibold text-zinc-100'>
					Менеджеры ({fightData.players.length})
				</h2>
				<div className='overflow-x-auto'>
					{(() => {
						const totalDps = fightData.players.reduce(
							(sum, player) => sum + player.dps,
							0
						)
						const totalHps = fightData.players.reduce(
							(sum, player) => sum + player.hps,
							0
						)

						const handleSort = (column: 'dps' | 'hps') => {
							if (sortBy === column) {
								setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
							} else {
								setSortBy(column)
								setSortOrder('asc')
							}
						}

						const sortedPlayers = [...fightData.players].sort((a, b) => {
							const aValue = sortBy === 'dps' ? a.dps : a.hps
							const bValue = sortBy === 'dps' ? b.dps : b.hps
							return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
						})

						return (
							<table className='w-full border-collapse text-sm'>
								<thead>
									<tr className='border-b border-zinc-700'>
										<th className='px-4 py-2 text-left text-zinc-400'>Игрок</th>
										<th className='px-4 py-2 text-left text-zinc-400'>
											Созвездие
										</th>
										<th className='pl-4 pr-2 py-2 text-left text-zinc-400'>Спек</th>
										<th className='pl-2 pr-2 py-2 text-left text-zinc-400'>ilvl</th>
										<th className='pl-6 pr-4 py-2 text-left text-zinc-400'>
											Категория
										</th>
										<th
											className='px-4 py-2 text-right text-zinc-400 cursor-pointer select-none hover:text-zinc-200 transition-colors'
											onClick={() => handleSort('dps')}
										>
											<div className='flex items-center justify-end gap-1'>
												<span>DPS</span>
												{sortBy === 'dps' &&
													(sortOrder === 'asc' ? (
														<ArrowUp className='h-3 w-3' />
													) : (
														<ArrowDown className='h-3 w-3' />
													))}
											</div>
										</th>
										<th
											className='px-4 py-2 text-right text-zinc-400 cursor-pointer select-none hover:text-zinc-200 transition-colors'
											onClick={() => handleSort('hps')}
										>
											<div className='flex items-center justify-end gap-1'>
												<span>HPS</span>
												{sortBy === 'hps' &&
													(sortOrder === 'asc' ? (
														<ArrowUp className='h-3 w-3' />
													) : (
														<ArrowDown className='h-3 w-3' />
													))}
											</div>
										</th>
										{data.combatlog && (
											<th className='px-4 py-2 text-center text-zinc-400'>
												Логи
											</th>
										)}
									</tr>
								</thead>
								<tbody>
									{/* Строка с общими показателями */}
									<tr className='border-b-2 border-zinc-700 bg-zinc-800/50'>
										<td
											colSpan={data.combatlog ? 5 : 5}
											className='px-4 py-3 text-left font-semibold text-zinc-200'
										>
											Всего:
										</td>
										<td className='px-4 py-3 text-right'>
											<div className='flex flex-col items-end gap-0.5'>
												<span className='text-base font-bold text-red-400'>
													{totalDps.toLocaleString()}
												</span>
												<span className='text-xs text-zinc-400'>100%</span>
											</div>
										</td>
										<td className='px-4 py-3 text-right'>
											<div className='flex flex-col items-end gap-0.5'>
												<span className='text-base font-bold text-green-400'>
													{totalHps.toLocaleString()}
												</span>
												<span className='text-xs text-zinc-400'>100%</span>
											</div>
										</td>
										{data.combatlog && <td></td>}
									</tr>
									{sortedPlayers.map((player) => {
											const classColor = getClassColor(player.class_id)
											const classIcon = CLASS_ICON_MAP[player.class_id]
											const specName = getSpecName(player.class_id, player.spec)
											const specIcon = getSpecIcon(player.class_id, player.spec)
											const dpsPercent =
												totalDps > 0
													? ((player.dps / totalDps) * 100).toFixed(1)
													: '0.0'
											const hpsPercent =
												totalHps > 0
													? ((player.hps / totalHps) * 100).toFixed(1)
													: '0.0'

											return (
												<Fragment key={player.guid}>
													<tr
														className='border-b border-zinc-800 hover:bg-zinc-800/30'
													>
														<td className='px-4 py-2'>
															<Link
																href={`/character/${encodeURIComponent(
																	player.name,
																)}`}
																className='flex items-center gap-2 group'
															>
																{classIcon && (
																	<SafeImage
																		src={classIcon}
																		alt=''
																		className='h-6 w-6 rounded'
																	/>
																)}
																<span
																	className={`font-medium ${classColor} group-hover:underline`}
																>
																	{player.name}
																</span>
															</Link>
														</td>
														<td className='px-4 py-2 text-zinc-300'>
															{player.zodiac?.name ?? '-'}
														</td>
														<td className='pl-4 pr-2 py-2'>
															<div className='flex items-center gap-2'>
																{specIcon ? (
																	<span className='group relative inline-flex'>
																		<SafeImage
																			src={specIcon}
																			alt={specName}
																			className='h-6 w-6 rounded'
																		/>
																		<span className='pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-3 py-1 text-xs text-white opacity-0 shadow-lg backdrop-blur-sm transition-opacity group-hover:block group-hover:opacity-100'>
																			{specName}
																		</span>
																	</span>
																) : (
																	<span className='text-zinc-300'>{specName}</span>
																)}
															</div>
														</td>
														<td className='pl-2 pr-2 py-2 text-left text-zinc-300'>
															{player.ilvl}
														</td>
														<td className='pl-6 pr-4 py-2'>
															<span className={getCategoryColor(player.category)}>
																{getCategoryLabel(player.category)}
															</span>
														</td>
														<td className='px-4 py-2 text-right'>
															<div className='flex flex-col items-end gap-0.5'>
																<span className='text-base font-bold text-red-400'>
																	{player.dps.toLocaleString()}
																</span>
																<span className='text-xs text-zinc-400'>
																	{dpsPercent}%
																</span>
															</div>
														</td>
														<td className='px-4 py-2 text-right'>
															<div className='flex flex-col items-end gap-0.5'>
																<span className='text-base font-bold text-green-400'>
																	{player.hps.toLocaleString()}
																</span>
																<span className='text-xs text-zinc-400'>
																	{hpsPercent}%
																</span>
															</div>
														</td>
														{data.combatlog && (
															<td className='px-4 py-2 text-center'>
																<button
																	type='button'
																	onClick={() =>
																		setExpandedPlayerGuid(
																			expandedPlayerGuid === player.guid
																				? null
																				: player.guid,
																		)
																	}
																	className='rounded-md bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-zinc-100'
																>
																	{expandedPlayerGuid === player.guid ? (
																		<div className='flex items-center gap-1'>
																			<ChevronUp className='h-4 w-4' />
																			<span>Скрыть</span>
																		</div>
																	) : (
																		<div className='flex items-center gap-1'>
																			<ChevronDown className='h-4 w-4' />
																			<span>Логи</span>
																		</div>
																	)}
																</button>
															</td>
														)}
													</tr>
													{expandedPlayerGuid === player.guid &&
														data?.combatlog && (
															<tr>
																<td
																	colSpan={data.combatlog ? 8 : 7}
																	className='px-4 py-4'
																>
																	{getPlayerCombatlogData(player.guid) ? (
																		<PlayerCombatlogViewer
																			combatlog={getPlayerCombatlogData(player.guid)!}
																			playerGuid={player.guid}
																			players={fightData.players.map((p) => ({
																				guid: p.guid,
																				name: p.name,
																			}))}
																			spellNameMap={spellNameMap}
																			spellIconMap={spellIconMap}
																			fightLength={fightData.fight_length}
																		/>
																	) : (
																		<div className='rounded-lg border border-zinc-700 bg-zinc-800/50 p-4 text-sm text-zinc-400'>
																			Нет данных combatlog для этого игрока
																		</div>
																	)}
																</td>
															</tr>
														)}
												</Fragment>
											)
										})}
									{/* Строка с общими показателями снизу */}
									<tr className='border-t-2 border-zinc-700 bg-zinc-800/50'>
										<td
											colSpan={data.combatlog ? 5 : 5}
											className='px-4 py-3 text-left font-semibold text-zinc-200'
										>
											Всего:
										</td>
										<td className='px-4 py-3 text-right'>
											<div className='flex flex-col items-end gap-0.5'>
												<span className='text-base font-bold text-red-400'>
													{totalDps.toLocaleString()}
												</span>
												<span className='text-xs text-zinc-400'>100%</span>
											</div>
										</td>
										<td className='px-4 py-3 text-right'>
											<div className='flex flex-col items-end gap-0.5'>
												<span className='text-base font-bold text-green-400'>
													{totalHps.toLocaleString()}
												</span>
												<span className='text-xs text-zinc-400'>100%</span>
											</div>
										</td>
										{data.combatlog && <td></td>}
									</tr>
								</tbody>
							</table>
						)
					})()}
				</div>
			</section>
		</main>
	)
}
