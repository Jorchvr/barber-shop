import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Barbershop <onboarding@resend.dev>'

interface EmailPayload {
  to: string
  nombre: string
  barberoNombre: string
  servicioNombre: string
  fechaLegible: string
  hora: string
  precio: number
}

function buildEmailHtml({ nombre, barberoNombre, servicioNombre, fechaLegible, hora, precio }: Omit<EmailPayload, 'to'>) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Cita confirmada</title>
</head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0d0d0d;padding:48px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;width:100%;background:#111111;border:1px solid rgba(181,150,90,0.3);border-radius:20px;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td align="center" style="padding:44px 40px 36px;border-bottom:1px solid rgba(255,255,255,0.07);">
            <p style="margin:0 0 20px;font-size:11px;letter-spacing:5px;text-transform:uppercase;color:#b5965a;font-weight:600;">BARBERSHOP</p>
            <div style="width:60px;height:60px;background:rgba(181,150,90,0.12);border:1px solid rgba(181,150,90,0.4);border-radius:50%;margin:0 auto 24px;line-height:60px;text-align:center;">
              <span style="font-size:26px;color:#b5965a;">✓</span>
            </div>
            <h1 style="margin:0 0 10px;font-size:28px;font-weight:700;color:#ffffff;line-height:1.2;">Cita confirmada</h1>
            <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.4);">Hola ${nombre}, tu reserva está lista.</p>
          </td>
        </tr>

        <!-- Detalles -->
        <tr>
          <td style="padding:32px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
                  <p style="margin:0 0 5px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.3);">Barbero</p>
                  <p style="margin:0;font-size:17px;font-weight:600;color:#ffffff;">${barberoNombre}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
                  <p style="margin:0 0 5px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.3);">Servicio</p>
                  <p style="margin:0;font-size:17px;font-weight:600;color:#ffffff;">${servicioNombre}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
                  <p style="margin:0 0 5px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.3);">Fecha y hora</p>
                  <p style="margin:0;font-size:17px;font-weight:600;color:#ffffff;text-transform:capitalize;">${fechaLegible} a las ${hora}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 0;">
                  <p style="margin:0 0 5px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.3);">Total</p>
                  <p style="margin:0;font-size:22px;font-weight:700;color:#b5965a;">$${precio}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding:24px 40px 36px;border-top:1px solid rgba(255,255,255,0.07);">
            <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.25);line-height:1.6;">
              Si necesitas cancelar o cambiar tu cita,<br>contáctanos con anticipación.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  if (!RESEND_API_KEY) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const payload: EmailPayload = await req.json()
  const { to, ...templateData } = payload

  if (!to) return NextResponse.json({ ok: true, skipped: true })

  const resend = new Resend(RESEND_API_KEY)

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Cita confirmada · ${templateData.fechaLegible} a las ${templateData.hora}`,
    html: buildEmailHtml(templateData),
  })

  if (error) {
    console.error('Resend error:', error)
    return NextResponse.json({ ok: false, error }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
