import { NextResponse } from 'next/server'

import { getAdminSession } from '@/lib/admin/auth'
import { streamNotifySignupsCsv } from '@/lib/admin/queries'

export async function GET() {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamNotifySignupsCsv()) {
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
      'Content-Disposition': `attachment; filename="notify-signups-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
