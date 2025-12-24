/**
 * Заголовки для запросов к Sirus.su API
 * Используются для обхода Cloudflare защиты
 */
export const getSirusHeaders = () => ({
	'Accept': 'application/json, text/plain, */*',
	'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
	'Accept-Encoding': 'gzip, deflate, br',
	'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
	'Referer': 'https://sirus.su/',
	'Origin': 'https://sirus.su',
	'Sec-Fetch-Dest': 'empty',
	'Sec-Fetch-Mode': 'cors',
	'Sec-Fetch-Site': 'same-origin',
})

