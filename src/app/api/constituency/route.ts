import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentRepresentative, resolveConstituencies } from '@/lib/constituency'
import type { ConstituencyMatch } from '@/types/database'

const querySchema = z.object({
  pincode: z.string().regex(/^[1-9][0-9]{5}$/),
  panchayat: z.string().optional().default(''),
  district: z.string().trim().min(1),
})

const CACHE_ONE_HOUR = 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const parsed = querySchema.safeParse({
    pincode: url.searchParams.get('pincode') ?? '',
    panchayat: url.searchParams.get('panchayat') ?? '',
    district: url.searchParams.get('district') ?? '',
  })

  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_query', candidates: [] }, { status: 400 })
  }

  try {
    const resolved = await resolveConstituencies(parsed.data)
    const candidates: ConstituencyMatch[] = await Promise.all(
      resolved.map(async (candidate) => ({
        ...candidate,
        representative: await getCurrentRepresentative(candidate.constituency.id),
      })),
    )

    return NextResponse.json(
      { candidates },
      {
        headers: {
          'Cache-Control': CACHE_ONE_HOUR,
        },
      },
    )
  } catch {
    return NextResponse.json(
      { candidates: [] },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    )
  }
}
