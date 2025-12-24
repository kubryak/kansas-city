/**
 * Заголовки для запросов к Sirus.su API
 * Используются для обхода Cloudflare защиты
 */
export const getSirusHeaders = () => ({
	// Минимальные заголовки, похожие на Postman/CLI, чтобы не триггерить Cloudflare
	'Accept': '*/*',
	'User-Agent': 'PostmanRuntime/7.39.0',
	'Accept-Encoding': 'gzip, deflate, br',
})

