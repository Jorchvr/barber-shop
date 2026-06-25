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
        <header className="fixed top-0 left-0 right-0 z-50 border-b" style={{ background: 'rgba(13,13,13,0.92)', borderColor: 'var(--dark-border)', backdropFilter: 'blur(12px)' }}>
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <a href="/" className="font-serif text-lg tracking-wide text-white">
              BARBER<span style={{ color: 'var(--gold)' }}>SHOP</span>
            </a>
            <div className="flex items-center gap-8">
              <a href="/" className="text-xs tracking-widest uppercase text-white/60 hover:text-white transition-colors hidden sm:block">Inicio</a>
              <a href="/#barberos" className="text-xs tracking-widest uppercase text-white/60 hover:text-white transition-colors hidden sm:block">Barberos</a>
              <a href="/admin" className="text-xs tracking-widest uppercase text-white/60 hover:text-white transition-colors hidden sm:block">Admin</a>
              <a
                href="/#barberos"
                className="text-xs tracking-widest uppercase px-5 py-2.5 font-medium transition-colors"
                style={{ background: 'var(--gold)', color: '#0d0d0d' }}
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
