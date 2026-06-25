import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BarberShop — Reserva tu cita',
  description: 'Agenda tu cita con el mejor barbero de la ciudad',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen" style={{ background: 'var(--dark)', color: '#fff' }}>
        <header
          className="fixed top-0 left-0 right-0 z-50"
          style={{ background: 'rgba(13,13,13,0.75)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderBottom: '1px solid var(--dark-border)' }}
        >
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <a href="/" className="font-serif text-lg tracking-wide text-white">
              BARBER<span style={{ color: 'var(--gold)' }}>SHOP</span>
            </a>
            <div className="flex items-center gap-3">
              <a href="/admin" className="text-xs text-white/50 hover:text-white transition-colors hidden sm:block tracking-wider uppercase">
                Admin
              </a>
              <a
                href="/#barberos"
                className="text-xs tracking-wider uppercase px-5 py-2.5 font-medium transition-all hover:opacity-80"
                style={{ border: '1px solid var(--gold-border)', color: 'var(--gold)', background: 'var(--gold-glass)', borderRadius: 'var(--radius-sm)', backdropFilter: 'blur(10px)' }}
              >
                Reservar
              </a>
            </div>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  )
}
