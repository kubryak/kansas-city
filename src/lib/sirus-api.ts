/**
 * Прямые запросы к Sirus API с клиента
 * Это обходит блокировку Cloudflare, так как запросы идут из браузера пользователя
 */

const REALM_ID = 22
const GUILD_ID = 39104
const SIRUS_BASE_URL = 'https://sirus.su/api/base'
const SIRUS_API_BASE_URL = 'https://api.sirus.su/api/base'

export const SIRUS_API = {
	guild: `${SIRUS_BASE_URL}/${REALM_ID}/guild/${GUILD_ID}`,
	character: (name: string) => {
		// Next.js может передать имя уже закодированным, поэтому декодируем перед повторным кодированием
		// Проверяем, закодировано ли имя (содержит ли %)
		let decodedName = name
		try {
			// Если имя содержит закодированные символы, декодируем его
			if (name.includes('%')) {
				decodedName = decodeURIComponent(name)
			}
		} catch (e) {
			// Если декодирование не удалось, используем исходное имя
			decodedName = name
		}
		return `${SIRUS_BASE_URL}/${REALM_ID}/character/${encodeURIComponent(decodedName)}`
	},
	latestKills: (params?: URLSearchParams) => {
		const url = `${SIRUS_BASE_URL}/${REALM_ID}/progression/pve/latest-boss-kills?guild=${GUILD_ID}`
		return params ? `${url}&${params.toString()}` : url
	},
	pveInfo: `${SIRUS_BASE_URL}/${REALM_ID}/pve-info?encounters=true`,
	progression: `${SIRUS_BASE_URL}/${REALM_ID}/progression/pve/latest-boss-kills?guild=${GUILD_ID}&page=1`,
	itemTooltip: (itemId: number | string, guid?: number | string) => {
		// Формат: /tooltip/item/{id}/{guid}?lang=ru&guid или /tooltip/item/{id}/?lang=ru
		if (guid) {
			return `${SIRUS_API_BASE_URL}/${REALM_ID}/tooltip/item/${itemId}/${guid}?lang=ru&guid`
		}
		return `${SIRUS_API_BASE_URL}/${REALM_ID}/tooltip/item/${itemId}/?lang=ru`
	},
	spellTooltip: (spellId: number | string, guid?: number | string) => {
		const url = `${SIRUS_API_BASE_URL}/${REALM_ID}/tooltip/spell/${spellId}/?lang=ru`
		return guid ? `${url}&guid=${guid}` : url
	},
	spellTooltipMany: (ids: Array<string | number>, lang = 'ru') => {
		const url = new URL(`${SIRUS_API_BASE_URL}/${REALM_ID}/tooltip/spell/many`)
		url.searchParams.set('lang', lang)
		for (const id of ids) {
			url.searchParams.append('ids[]', String(id))
		}
		return url.toString()
	},
	bossfight: (id: number | string) => `${SIRUS_BASE_URL}/${REALM_ID}/details/bossfight/${id}`,
	bossfightCombatlog: (id: number | string) => `${SIRUS_BASE_URL}/${REALM_ID}/details/bossfight/${id}/combatlog`,
}

/**
 * Выполняет запрос к Sirus API напрямую с клиента
 */
export async function fetchSirusAPI<T>(url: string): Promise<T> {
	const res = await fetch(url, {
		method: 'GET',
		headers: {
			'Accept': 'application/json',
			'Accept-Language': 'ru-RU,ru;q=0.9',
		},
		// Не кэшируем, чтобы всегда получать свежие данные
		cache: 'no-store',
	})

	if (!res.ok) {
		const errorText = await res.text().catch(() => '')
		throw new Error(`Sirus API error: ${res.status} ${res.statusText}. ${errorText.slice(0, 200)}`)
	}

	return res.json()
}

