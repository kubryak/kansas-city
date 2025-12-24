export const CLASS_NAMES: Record<number, string> = {
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

export const CLASS_ICON_MAP: Record<number, string> = {
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

export const RACE_NAMES: Record<number, string> = {
	1: 'Человек',
	2: 'Орк',
	3: 'Дворф',
	4: 'Ночной эльф',
	5: 'Нежить',
	6: 'Таурен',
	7: 'Гном',
	8: 'Тролль',
	9: 'Гоблин',
	10: 'Эльф крови',
	11: 'Дреней',
	12: 'Ворген',
	13: 'Нага',
	15: 'Высший эльф',
	16: 'Пандарен',
	17: 'Ночнорожденный',
	18: 'Эльф бездны',
	19: 'Вульпера',
	20: 'Вульпера',
	23: 'Зандаларский тролль',
	24: 'Озаренный дреней',
	25: 'Эредар',
	26: 'Дворф черного железа',
	27: 'Драктир',
}

const SPEC_ICON_MAP: Record<number, Record<number, string>> = {
	1: {
		0: 'https://wow.zamimg.com/images/wow/icons/medium/ability_warrior_savageblow.jpg',
		1: 'https://wow.zamimg.com/images/wow/icons/medium/ability_warrior_innerrage.jpg',
		2: 'https://wow.zamimg.com/images/wow/icons/medium/inv_shield_05.jpg',
	},
	2: {
		0: 'https://wow.zamimg.com/images/wow/icons/medium/spell_holy_holybolt.jpg',
		1: 'https://wow.zamimg.com/images/wow/icons/medium/inv_shield_06.jpg',
		2: 'https://wow.zamimg.com/images/wow/icons/medium/spell_holy_auraoflight.jpg',
	},
	3: {
		0: 'https://wow.zamimg.com/images/wow/icons/medium/ability_hunter_beasttaming.jpg',
		1: 'https://wow.zamimg.com/images/wow/icons/medium/ability_marksmanship.jpg',
		2: 'https://wow.zamimg.com/images/wow/icons/medium/ability_hunter_swiftstrike.jpg',
	},
	4: {
		0: 'https://wow.zamimg.com/images/wow/icons/medium/ability_rogue_eviscerate.jpg',
		1: 'https://wow.zamimg.com/images/wow/icons/medium/ability_backstab.jpg',
		2: 'https://wow.zamimg.com/images/wow/icons/medium/ability_stealth.jpg',
	},
	5: {
		0: 'https://wow.zamimg.com/images/wow/icons/medium/spell_holy_wordfortitude.jpg',
		1: 'https://wow.zamimg.com/images/wow/icons/medium/spell_holy_guardianspirit.jpg',
		2: 'https://wow.zamimg.com/images/wow/icons/medium/spell_shadow_shadowwordpain.jpg',
	},
	6: {
		0: 'https://wow.zamimg.com/images/wow/icons/medium/spell_deathknight_bloodpresence.jpg',
		1: 'https://wow.zamimg.com/images/wow/icons/medium/spell_deathknight_frostpresence.jpg',
		2: 'https://wow.zamimg.com/images/wow/icons/medium/spell_deathknight_unholypresence.jpg',
	},
	7: {
		0: 'https://wow.zamimg.com/images/wow/icons/medium/spell_nature_lightning.jpg',
		1: 'https://wow.zamimg.com/images/wow/icons/medium/spell_nature_lightningshield.jpg',
		2: 'https://wow.zamimg.com/images/wow/icons/medium/spell_nature_magicimmunity.jpg',
	},
	8: {
		0: 'https://wow.zamimg.com/images/wow/icons/medium/spell_holy_magicalsentry.jpg',
		1: 'https://wow.zamimg.com/images/wow/icons/medium/spell_fire_firebolt02.jpg',
		2: 'https://wow.zamimg.com/images/wow/icons/medium/spell_frost_frostbolt02.jpg',
	},
	9: {
		0: 'https://wow.zamimg.com/images/wow/icons/medium/spell_shadow_curseoftounges.jpg',
		1: 'https://wow.zamimg.com/images/wow/icons/medium/spell_shadow_metamorphosis.jpg',
		2: 'https://wow.zamimg.com/images/wow/icons/medium/spell_shadow_rainoffire.jpg',
	},
	11: {
		0: 'https://wow.zamimg.com/images/wow/icons/medium/spell_nature_starfall.jpg',
		1: 'https://wow.zamimg.com/images/wow/icons/medium/ability_racial_bearform.jpg',
		2: 'https://wow.zamimg.com/images/wow/icons/medium/spell_nature_healingtouch.jpg',
	},
}

export function getSpecName (classId: number, spec: number): string {
	const specNames: Record<number, string[]> = {
		1: ['Оружие', 'Неистовство', 'Защита'],
		2: ['Свет', 'Защита', 'Воздаяние'],
		3: ['Повелитель зверей', 'Стрельба', 'Выживание'],
		4: ['Ликвидация', 'Бой', 'Скрытность'],
		5: ['Послушание', 'Свет', 'Тьма'],
		6: ['Кровь', 'Лед', 'Нечестивость'],
		7: ['Стихии', 'Совершенствование', 'Исцеление'],
		8: ['Тайная магия', 'Огонь', 'Лед'],
		9: ['Колдовство', 'Демонология', 'Разрушение'],
		11: ['Баланс', 'Сила зверя', 'Исцеление'],
	}

	const specs = specNames[classId]
	if (!specs || spec < 0 || spec >= specs.length) {
		return `Спек ${spec}`
	}

	return specs[spec]
}

export function getSpecIcon (classId: number, spec: number): string | null {
	const classSpecs = SPEC_ICON_MAP[classId]
	if (!classSpecs) return null

	const icon = classSpecs[spec]
	return icon ?? null
}

export function getAbsoluteSirusImageUrl (relativePath: string): string {
	if (relativePath.startsWith('http')) {
		return relativePath
	}
	return `https://sirus.su${relativePath}`
}

export function getFactionName (faction: number): string {
	switch (faction) {
	case 2:
		return 'Орда'
	case 4:
		return 'Альянс'
	case 8:
		return 'Ренегаты'
	default:
		return `Фракция ${faction}`
	}
}

export function getFactionIcon (faction: number): string | null {
	switch (faction) {
	case 2:
		return getAbsoluteSirusImageUrl('/images/factions/lg/horde.webp')
	case 4:
		return getAbsoluteSirusImageUrl('/images/factions/lg/alliance.webp')
	case 8:
		return getAbsoluteSirusImageUrl('/images/factions/lg/renegade.webp')
	default:
		return null
	}
}

export function getClassColor (classId: number): string {
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


