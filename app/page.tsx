import { supabase } from '@/lib/supabase'
import type { Barbero } from '@/types'
import Link from 'next/link'

export const revalidate = 60

export default async function Home() {
  const { data: barberos } = await supabase
    .from('barberos')
    .select('*')
    .eq('activo', true)
    .order('nombre')

  return (
    <div>
      {/* Hero */}
      <section
        className="relative min-h-screen flex items-center justify-center text-center"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1920&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(13,13,13,0.6) 0%, rgba(13,13,13,0.85) 100%)' }} />
        <div className="relative z-10 px-6 pt-24 pb-16 max-w-3xl mx-auto">
          <p className="font-serif italic text-xl mb-5" style={{ color: 'var(--gold)' }}>
            No es solo un corte, es una experiencia.
          </p>
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            El arte de cuidar<br />a las personas.
          </h1>
          <p className="text-white/60 text-lg mb-10 max-w-md mx-auto leading-relaxed">
            Calidad, tiempo y estilo en cada visita.
          </p>
          <a
            href="/#barberos"
            className="inline-block text-sm font-medium px-10 py-4 transition-all hover:opacity-80 active:scale-95"
            style={{ border: '1px solid var(--gold-border)', color: 'var(--gold)', background: 'var(--gold-glass)', borderRadius: 'var(--radius-lg)', backdropFilter: 'blur(12px)' }}
          >
            Reservar Cita
          </a>
        </div>
      </section>

      {/* Barberos */}
      <section id="barberos" className="max-w-lg mx-auto px-6 py-16">
        <div className="mb-8 text-center">
          <p className="font-serif italic mb-2 text-lg" style={{ color: 'var(--gold)' }}>Nuestro equipo</p>
          <h2 className="font-serif text-4xl font-bold">Elige tu Barbero</h2>
        </div>

        {!barberos || barberos.length === 0 ? (
          <p className="text-center text-white/40 py-16">No hay barberos disponibles.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {(barberos as Barbero[]).map((barbero) => (
              <Link
                key={barbero.id}
                href={`/reservar/${barbero.id}`}
                className="group flex items-center gap-4 p-4 transition-all duration-200 active:scale-[0.98]"
                style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 'var(--radius)', backdropFilter: 'blur(20px)' }}
              >
                <div
                  className="w-14 h-14 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-2xl"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  {barbero.foto_url
                    ? <img src={barbero.foto_url} alt={barbero.nombre} className="w-full h-full object-cover" />
                    : <span style={{ color: 'var(--gold)', opacity: 0.5 }}>✂</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-xl font-semibold">{barbero.nombre}</h3>
                  {barbero.descripcion && (
                    <p className="text-sm text-white/40 truncate">{barbero.descripcion}</p>
                  )}
                </div>
                <span className="text-lg shrink-0" style={{ color: 'var(--gold)' }}>›</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
