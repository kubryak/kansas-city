import type { RafflePrize } from '@/types/raffle'

// Базовый URL для иконок WoW из Wowhead CDN
const WOW_ICON_BASE = 'https://wow.zamimg.com/images/wow/icons/large'

// Порядок редкости для сортировки
const rarityOrder = {
	common: 5,
	uncommon: 4,
	rare: 3,
	epic: 2,
	legendary: 1,
}

// Статичный список из 50 призов для розыгрыша, отсортированный по редкости
export const rafflePrizes: RafflePrize[] = [
	// COMMON
	// 4 сумки из ледяной ткани х2
	{ id: 5, name: 'Сумка из ледяной ткани', icon: `${WOW_ICON_BASE}/inv_misc_bag_enchantedmageweave.jpg`, quantity: 4, rarity: 'common' },
	{ id: 6, name: 'Сумка из ледяной ткани', icon: `${WOW_ICON_BASE}/inv_misc_bag_enchantedmageweave.jpg`, quantity: 4, rarity: 'common' },
	
	// 1 иллюзия: Имульс V x1
	{ id: 47, name: 'Иллюзия: Имульс V', icon: `${WOW_ICON_BASE}/ui_profession_enchanting.jpg`, quantity: 1, rarity: 'common' },
	
	// 1 иллюзия: нечестивое оружие х1
	{ id: 50, name: 'Иллюзия: нечестивое оружие', icon: `${WOW_ICON_BASE}/ui_profession_enchanting.jpg`, quantity: 1, rarity: 'common' },
	
	// UNCOMMON
	// 3 поврежденных ожерелья х3
	{ id: 7, name: 'Поврежденное ожерелье', icon: `${WOW_ICON_BASE}/inv_jewelry_amulet_02.jpg`, quantity: 3, rarity: 'uncommon' },
	{ id: 8, name: 'Поврежденное ожерелье', icon: `${WOW_ICON_BASE}/inv_jewelry_amulet_02.jpg`, quantity: 3, rarity: 'uncommon' },
	{ id: 9, name: 'Поврежденное ожерелье', icon: `${WOW_ICON_BASE}/inv_jewelry_amulet_02.jpg`, quantity: 3, rarity: 'uncommon' },
	
	// 5 арктического меха х3
	{ id: 19, name: 'Арктический мех', icon: `${WOW_ICON_BASE}/inv_misc_pelt_14.jpg`, quantity: 5, rarity: 'uncommon' },
	{ id: 20, name: 'Арктический мех', icon: `${WOW_ICON_BASE}/inv_misc_pelt_14.jpg`, quantity: 5, rarity: 'uncommon' },
	{ id: 21, name: 'Арктический мех', icon: `${WOW_ICON_BASE}/inv_misc_pelt_14.jpg`, quantity: 5, rarity: 'uncommon' },
	
	// RARE
	// 5 настой бесконечной ярости х3
	{ id: 10, name: 'Настой бесконечной ярости', icon: `${WOW_ICON_BASE}/inv_alchemy_endlessflask_06.jpg`, quantity: 5, rarity: 'rare' },
	{ id: 11, name: 'Настой бесконечной ярости', icon: `${WOW_ICON_BASE}/inv_alchemy_endlessflask_06.jpg`, quantity: 5, rarity: 'rare' },
	{ id: 12, name: 'Настой бесконечной ярости', icon: `${WOW_ICON_BASE}/inv_alchemy_endlessflask_06.jpg`, quantity: 5, rarity: 'rare' },
	
	// 5 настой ледяного змея х3
	{ id: 13, name: 'Настой ледяного змея', icon: `${WOW_ICON_BASE}/inv_alchemy_endlessflask_04.jpg`, quantity: 5, rarity: 'rare' },
	{ id: 14, name: 'Настой ледяного змея', icon: `${WOW_ICON_BASE}/inv_alchemy_endlessflask_04.jpg`, quantity: 5, rarity: 'rare' },
	{ id: 15, name: 'Настой ледяного змея', icon: `${WOW_ICON_BASE}/inv_alchemy_endlessflask_04.jpg`, quantity: 5, rarity: 'rare' },
	
	// 3 око дракона х3
	{ id: 16, name: 'Око дракона', icon: `${WOW_ICON_BASE}/inv_jewelcrafting_dragonseye01.jpg`, quantity: 3, rarity: 'rare' },
	{ id: 17, name: 'Око дракона', icon: `${WOW_ICON_BASE}/inv_jewelcrafting_dragonseye01.jpg`, quantity: 3, rarity: 'rare' },
	{ id: 18, name: 'Око дракона', icon: `${WOW_ICON_BASE}/inv_jewelcrafting_dragonseye01.jpg`, quantity: 3, rarity: 'rare' },
	
	// 2 слитка титановой стали х3
	{ id: 22, name: 'Слиток титановой стали', icon: `${WOW_ICON_BASE}/inv_ingot_titansteel_blue.jpg`, quantity: 2, rarity: 'rare' },
	{ id: 23, name: 'Слиток титановой стали', icon: `${WOW_ICON_BASE}/inv_ingot_titansteel_blue.jpg`, quantity: 2, rarity: 'rare' },
	{ id: 24, name: 'Слиток титановой стали', icon: `${WOW_ICON_BASE}/inv_ingot_titansteel_blue.jpg`, quantity: 2, rarity: 'rare' },
	
	// 50 зелье адреналина х3
	{ id: 30, name: 'Зелье адреналина', icon: `${WOW_ICON_BASE}/inv_alchemy_elixir_03.jpg`, quantity: 50, rarity: 'rare' },
	{ id: 31, name: 'Зелье адреналина', icon: `${WOW_ICON_BASE}/inv_alchemy_elixir_03.jpg`, quantity: 50, rarity: 'rare' },
	{ id: 32, name: 'Зелье адреналина', icon: `${WOW_ICON_BASE}/inv_alchemy_elixir_03.jpg`, quantity: 50, rarity: 'rare' },
	
	// 50 зелье дикой магии х3
	{ id: 33, name: 'Зелье дикой магии', icon: `${WOW_ICON_BASE}/inv_alchemy_elixir_01.jpg`, quantity: 50, rarity: 'rare' },
	{ id: 34, name: 'Зелье дикой магии', icon: `${WOW_ICON_BASE}/inv_alchemy_elixir_01.jpg`, quantity: 50, rarity: 'rare' },
	{ id: 35, name: 'Зелье дикой магии', icon: `${WOW_ICON_BASE}/inv_alchemy_elixir_01.jpg`, quantity: 50, rarity: 'rare' },
	
	// 2 багровый рубин х1
	{ id: 40, name: 'Багровый рубин', icon: `${WOW_ICON_BASE}/inv_jewelcrafting_gem_32.jpg`, quantity: 2, rarity: 'rare' },
	
	// 2 царский янтарь х1
	{ id: 41, name: 'Царский янтарь', icon: `${WOW_ICON_BASE}/inv_jewelcrafting_gem_36.jpg`, quantity: 2, rarity: 'rare' },
	
	// 1 иллюзия: Отведение удара х2
	{ id: 48, name: 'Иллюзия: Отведение удара', icon: `${WOW_ICON_BASE}/ui_profession_enchanting.jpg`, quantity: 1, rarity: 'rare' },
	{ id: 49, name: 'Иллюзия: Отведение удара', icon: `${WOW_ICON_BASE}/ui_profession_enchanting.jpg`, quantity: 1, rarity: 'rare' },
	
	// EPIC
	// 4 кристалла пропасти х5
	{ id: 25, name: 'Кристалл пропасти', icon: `${WOW_ICON_BASE}/inv_enchant_abysscrystal.jpg`, quantity: 4, rarity: 'epic' },
	{ id: 26, name: 'Кристалл пропасти', icon: `${WOW_ICON_BASE}/inv_enchant_abysscrystal.jpg`, quantity: 4, rarity: 'epic' },
	{ id: 27, name: 'Кристалл пропасти', icon: `${WOW_ICON_BASE}/inv_enchant_abysscrystal.jpg`, quantity: 4, rarity: 'epic' },
	{ id: 28, name: 'Кристалл пропасти', icon: `${WOW_ICON_BASE}/inv_enchant_abysscrystal.jpg`, quantity: 4, rarity: 'epic' },
	{ id: 29, name: 'Кристалл пропасти', icon: `${WOW_ICON_BASE}/inv_enchant_abysscrystal.jpg`, quantity: 4, rarity: 'epic' },
	
	// 3 багровый рубин х1
	{ id: 38, name: 'Багровый рубин', icon: `${WOW_ICON_BASE}/inv_jewelcrafting_gem_32.jpg`, quantity: 3, rarity: 'epic' },
	
	// 3 царский янтарь х1
	{ id: 39, name: 'Царский янтарь', icon: `${WOW_ICON_BASE}/inv_jewelcrafting_gem_36.jpg`, quantity: 3, rarity: 'epic' },
	
	// 4 северный лотос х5
	{ id: 42, name: 'Северный лотос', icon: `${WOW_ICON_BASE}/inv_misc_herb_frostlotus.jpg`, quantity: 4, rarity: 'epic' },
	{ id: 43, name: 'Северный лотос', icon: `${WOW_ICON_BASE}/inv_misc_herb_frostlotus.jpg`, quantity: 4, rarity: 'epic' },
	{ id: 44, name: 'Северный лотос', icon: `${WOW_ICON_BASE}/inv_misc_herb_frostlotus.jpg`, quantity: 4, rarity: 'epic' },
	{ id: 45, name: 'Северный лотос', icon: `${WOW_ICON_BASE}/inv_misc_herb_frostlotus.jpg`, quantity: 4, rarity: 'epic' },
	{ id: 46, name: 'Северный лотос', icon: `${WOW_ICON_BASE}/inv_misc_herb_frostlotus.jpg`, quantity: 4, rarity: 'epic' },
	
	// LEGENDARY
	// 5.000 золота х1
	{ id: 1, name: 'Золото', icon: `${WOW_ICON_BASE}/inv_misc_coin_01.jpg`, quantity: 5000, rarity: 'legendary' },
	
	// 2 рунические сферы х2
	{ id: 2, name: 'Руническая сфера', icon: `${WOW_ICON_BASE}/inv_misc_runedorb_01.jpg`, quantity: 2, rarity: 'legendary' },
	{ id: 3, name: 'Руническая сфера', icon: `${WOW_ICON_BASE}/inv_misc_runedorb_01.jpg`, quantity: 2, rarity: 'legendary' },
	
	// 1 руническая сфера х1
	{ id: 4, name: 'Руническая сфера', icon: `${WOW_ICON_BASE}/inv_misc_runedorb_01.jpg`, quantity: 1, rarity: 'legendary' },
	
	// 1 свиток чар для оружия - берсерк х2
	{ id: 36, name: 'Свиток чар для оружия - берсерк', icon: `${WOW_ICON_BASE}/inv_scroll_03.jpg`, quantity: 1, rarity: 'legendary' },
	{ id: 37, name: 'Свиток чар для оружия - берсерк', icon: `${WOW_ICON_BASE}/inv_scroll_03.jpg`, quantity: 1, rarity: 'legendary' },
].sort((a, b) => {
	const aRarity = (a.rarity || 'common') as keyof typeof rarityOrder
	const bRarity = (b.rarity || 'common') as keyof typeof rarityOrder
	return (rarityOrder[aRarity] || 0) - (rarityOrder[bRarity] || 0)
}) as RafflePrize[]
