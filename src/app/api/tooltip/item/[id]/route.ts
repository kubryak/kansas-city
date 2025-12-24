import { NextResponse } from 'next/server'
import { getSirusHeaders } from '@/lib/sirus-headers'

const REALM_ID = 22

export async function GET (
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params
	const { searchParams } = new URL(request.url)
	const guid = searchParams.get('guid') ?? ''

	try {
		// Формат: /tooltip/item/{id}/{guid}?lang=ru&guid
		// guid должен быть в пути и в параметре
		let url: string
		if (guid) {
			url = `https://api.sirus.su/api/base/${REALM_ID}/tooltip/item/${id}/${guid}?lang=ru&guid`
		} else {
			url = `https://api.sirus.su/api/base/${REALM_ID}/tooltip/item/${id}/?lang=ru`
		}

		const res = await fetch(url, {
			headers: getSirusHeaders(),
			next: { revalidate: 3600 },
		})

		if (!res.ok) {
			return NextResponse.json(
				{
					error: 'Failed to fetch item tooltip',
					status: res.status,
				},
				{ status: res.status },
			)
		}

		const data = await res.json()

		return NextResponse.json(data)
	} catch (err) {
		console.error('Error in /api/tooltip/item/[id]:', err)
		return NextResponse.json(
			{
				error: 'Unexpected error while fetching item tooltip',
				details: (err as Error).message,
			},
			{ status: 500 },
		)
	}
}



