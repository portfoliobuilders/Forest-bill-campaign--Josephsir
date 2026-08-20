import { NextResponse } from 'next/server'

import { lookupPincode } from '@/lib/pin-lookup'
import { isValidPincode } from '@/lib/postal'

export const dynamic = 'force-dynamic'

const CACHE = 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'

export async function GET(_request: Request, context: { params: Promise<{ pin: string }> }) {
  const { pin } = await context.params
  if (!isValidPincode(pin)) {
    return NextResponse.json({ error: 'invalid_pincode', found: false, offices: [] }, { status: 400 })
  }

  try {
    const result = await lookupPincode(pin)
    return NextResponse.json(result, {
      headers: { 'Cache-Control': result.found ? CACHE : 'no-store' },
    })
  } catch {
    return NextResponse.json(
      { pincode: pin, found: false, offices: [], askPostOffice: false, source: 'none', common: {} },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
