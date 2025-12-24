/**
 * Прямые запросы к Sirus API с клиента
 * Это обходит блокировку Cloudflare, так как запросы идут из браузера пользователя
 */

const REALM_ID = 22
const GUILD_ID = 39104
const SIRUS_BASE_URL = 'https://sirus.su/api/base'

export const SIRUS_API = {
	guild: `${SIRUS_BASE_URL}/${REALM_ID}/guild/${GUILD_ID}`,
	character: (name: string) => `${SIRUS_BASE_URL}/${REALM_ID}/character/${encodeURIComponent(name)}`,
	latestKills: (params?: URLSearchParams) => {
		const url = `${SIRUS_BASE_URL}/${REALM_ID}/progression/pve/latest-boss-kills?guild=${GUILD_ID}`
		return params ? `${url}&${params.toString()}` : url
	},
	pveInfo: `${SIRUS_BASE_URL}/${REALM_ID}/pve-info?encounters=true`,
	itemTooltip: (itemId: number, guid?: number) => {
		const url = `${SIRUS_BASE_URL}/${REALM_ID}/tooltip/item/${itemId}`
		return guid ? `${url}?guid=${guid}` : url
	},
	spellTooltip: (spellId: number) => `${SIRUS_BASE_URL}/${REALM_ID}/tooltip/spell/${spellId}`,
	bossfight: (id: number) => `${SIRUS_BASE_URL}/${REALM_ID}/bossfight/${id}`,
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

