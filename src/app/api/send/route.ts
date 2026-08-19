import { NextResponse } from 'next/server'

import { getResend, getResendFromEmail, HELLO_WORLD_TO } from '@/lib/resend'

/**
 * Sends the Resend "first email" to confirm the API key works.
 * Disabled in production so this cannot be used as a public mailer.
 */
export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const resend = getResend()
  if (!resend) {
    return NextResponse.json(
      {
        error:
          'Missing Resend API key. Replace re_xxxxxxxxx in RESEND_API_KEY with your real key from https://resend.com/api-keys',
      },
      { status: 500 },
    )
  }

  const { data, error } = await resend.emails.send({
    from: getResendFromEmail(),
    to: HELLO_WORLD_TO,
    subject: 'Hello World',
    html: '<p>Congrats on sending your <strong>first email</strong>!</p>',
  })

  if (error) {
    return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json(data)
}
