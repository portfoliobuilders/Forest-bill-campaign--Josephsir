import { NextResponse } from 'next/server'

import { PDF_LETTER_AVAILABLE } from '@/lib/pdf-available'

/**
 * Malayalam letters are not generated in this release.
 * @pdf-lib/fontkit GPOS throws on hanging virama (`ക്` / `ക്ക്`), so a
 * composed objection would crash or mis-shape. The wizard button stays disabled.
 */
export async function GET() {
  return NextResponse.json(
    { error: 'pdf_unavailable', reason: 'malayalam_shaping', available: PDF_LETTER_AVAILABLE },
    { status: 501 },
  )
}

export async function POST() {
  return NextResponse.json(
    { error: 'pdf_unavailable', reason: 'malayalam_shaping', available: PDF_LETTER_AVAILABLE },
    { status: 501 },
  )
}
