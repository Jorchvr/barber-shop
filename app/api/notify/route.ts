import { NextRequest, NextResponse } from 'next/server'

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_FROM = process.env.TWILIO_WHATSAPP_FROM // whatsapp:+14155238886

export async function POST(req: NextRequest) {
  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) {
    // Twilio no configurado — no falla la reserva, solo omite el mensaje
    return NextResponse.json({ ok: true, skipped: true })
  }

  const { to, mensaje } = await req.json()

  if (!to) return NextResponse.json({ ok: true, skipped: true })

  const body = new URLSearchParams({
    From: TWILIO_FROM,
    To: `whatsapp:${to}`,
    Body: mensaje,
  })

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    console.error('Twilio error:', err)
    return NextResponse.json({ ok: false, error: err }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
