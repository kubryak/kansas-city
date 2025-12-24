import { NextResponse } from 'next/server'
import { getSirusHeaders } from '@/lib/sirus-headers'

const REALM_ID = 22

export async function GET (
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params

	try {
		const [detailsRes, combatlogRes] = await Promise.all([
			fetch(
				`https://sirus.su/api/base/${REALM_ID}/details/bossfight/${id}`,
				{
					headers: getSirusHeaders(),
					next: { revalidate: 60 },
				},
			),
			fetch(
				`https://sirus.su/api/base/${REALM_ID}/details/bossfight/${id}/combatlog`,
				{
					headers: getSirusHeaders(),
					next: { revalidate: 60 },
				},
			),
		])

		if (!detailsRes.ok) {
			const text = await detailsRes.text().catch(() => '')
			console.error('Bossfight details error:', {
				status: detailsRes.status,
				statusText: detailsRes.statusText,
				url: detailsRes.url,
				text: text.slice(0, 500),
			})

			return NextResponse.json(
				{
					error: 'Failed to fetch bossfight details',
					status: detailsRes.status,
					statusText: detailsRes.statusText,
					details: text.slice(0, 500),
				},
				{ status: detailsRes.status },
			)
		}

		if (!combatlogRes.ok) {
			const text = await combatlogRes.text().catch(() => '')
			console.error('Combatlog error:', {
				status: combatlogRes.status,
				statusText: combatlogRes.statusText,
				url: combatlogRes.url,
				text: text.slice(0, 500),
			})
		}

		const details = await detailsRes.json()
		const combatlog = combatlogRes.ok ? await combatlogRes.json() : null

		return NextResponse.json({
			details,
			combatlog,
		})
	} catch (err) {
		console.error('Error in /api/bossfight/[id]:', err)
		return NextResponse.json(
			{
				error: 'Unexpected error while fetching bossfight details',
				details: (err as Error).message,
			},
			{ status: 500 },
		)
	}
}

