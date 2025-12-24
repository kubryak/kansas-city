import { NextResponse } from 'next/server'

const REALM_ID = 22

export async function GET (request: Request) {
	const { searchParams } = new URL(request.url)
	const ids = searchParams.getAll('ids[]')
	const lang = searchParams.get('lang') ?? 'ru'

	if (ids.length === 0) {
		return NextResponse.json(
			{
				error: 'No spell IDs provided',
			},
			{ status: 400 },
		)
	}

	try {
		// Формируем URL с параметрами ids[]
		const url = new URL(`https://api.sirus.su/api/base/${REALM_ID}/tooltip/spell/many`)
		url.searchParams.set('lang', lang)
		for (const id of ids) {
			url.searchParams.append('ids[]', id)
		}

		const res = await fetch(url.toString(), {
			headers: {
				Accept: 'application/json',
				'Accept-Language': lang,
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) KansasCityGuildDash/1.0',
			},
			next: { revalidate: 3600 },
		})

		if (!res.ok) {
			return NextResponse.json(
				{
					error: 'Failed to fetch spell tooltips',
					status: res.status,
				},
				{ status: res.status },
			)
		}

		const data = await res.json()

		return NextResponse.json(data)
	} catch (err) {
		console.error('Error in /api/tooltip/spell/many:', err)
		return NextResponse.json(
			{
				error: 'Unexpected error while fetching spell tooltips',
				details: (err as Error).message,
			},
			{ status: 500 },
		)
	}
}

