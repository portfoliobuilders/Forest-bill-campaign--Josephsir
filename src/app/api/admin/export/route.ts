import { NextResponse, type NextRequest } from 'next/server'

import { getAdminSession } from '@/lib/admin/auth'
import { parseAdminFilters } from '@/lib/admin/filters'
import { streamSubmissionsCsv } from '@/lib/admin/queries'

export async function GET(request: NextRequest) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const filters = parseAdminFilters(request.nextUrl.searchParams)
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamSubmissionsCsv(filters)) {
          controller.enqueue(encoder.encode(chunk))
        }
        controller.close()
      } catch {
        controller.error(new Error('export_failed'))
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="submissions-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
