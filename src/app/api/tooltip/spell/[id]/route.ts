import { NextResponse } from 'next/server'

const REALM_ID = 22

export async function GET (
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params
	const { searchParams } = new URL(request.url)
	const guid = searchParams.get('guid') ?? ''

	try {
		const url = `https://api.sirus.su/api/base/${REALM_ID}/tooltip/spell/${id}/?lang=ru&guid=${guid}`

		const res = await fetch(url, {
			headers: {
				Accept: 'application/json',
				'Accept-Language': 'ru',
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) KansasCityGuildDash/1.0',
			},
			next: { revalidate: 3600 },
		})

		if (!res.ok) {
			return NextResponse.json(
				{
					error: 'Failed to fetch spell tooltip',
					status: res.status,
				},
				{ status: res.status },
			)
		}

		const data = await res.json()

		return NextResponse.json(data)
	} catch (err) {
		console.error('Error in /api/tooltip/spell/[id]:', err)
		return NextResponse.json(
			{
				error: 'Unexpected error while fetching spell tooltip',
				details: (err as Error).message,
			},
			{ status: 500 },
		)
	}
}




