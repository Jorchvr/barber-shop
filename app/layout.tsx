import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BarberShop — Reserva tu cita',
  description: 'Agenda tu cita con el mejor barbero de la ciudad',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[#f5f5f5] text-[#111]">
        <header className="bg-white/80 backdrop-blur-md border-b border-black/5 px-5 py-4 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <a href="/" className="text-base font-semibold tracking-tight">
              ✂ BarberShop
            </a>
            <a
              href="/admin"
              className="text-sm text-[#888] hover:text-[#111] transition-colors"
            >
              Admin
            </a>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-5 sm:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
