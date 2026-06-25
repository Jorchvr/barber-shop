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
        className="relative min-h-screen flex items-center"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1920&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(13,13,13,0.92) 40%, rgba(13,13,13,0.4) 100%)' }} />

        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-16">
          <p className="font-serif italic mb-4 text-lg" style={{ color: 'var(--gold)' }}>
            No es solo un corte, es una experiencia.
          </p>
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6 max-w-2xl">
            El arte de cuidar<br />a las personas.
          </h1>
          <p className="text-white/60 max-w-md mb-10 leading-relaxed">
            Una barbería donde la calidad, el tiempo y el estilo se encuentran para darte el mejor resultado.
          </p>
          <a
            href="/#barberos"
            className="inline-block text-xs tracking-widest uppercase px-8 py-4 font-medium transition-opacity hover:opacity-90"
            style={{ background: 'var(--gold)', color: '#0d0d0d' }}
          >
            Reservar Cita
          </a>
        </div>
      </section>

      {/* Barberos */}
      <section id="barberos" className="max-w-6xl mx-auto px-6 py-20">
        <div className="mb-12 text-center">
          <p className="font-serif italic mb-2" style={{ color: 'var(--gold)' }}>Nuestro equipo</p>
          <h2 className="font-serif text-4xl font-bold">Elige tu Barbero</h2>
        </div>

        {!barberos || barberos.length === 0 ? (
          <p className="text-center text-white/40 py-16">No hay barberos disponibles.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(barberos as Barbero[]).map((barbero) => (
              <Link
                key={barbero.id}
                href={`/reservar/${barbero.id}`}
                className="group block border transition-all duration-300 hover:border-[#b5965a]"
                style={{ background: 'var(--dark-card)', borderColor: 'var(--dark-border)' }}
              >
                <div
                  className="h-52 flex items-center justify-center text-6xl"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  {barbero.foto_url
                    ? <img src={barbero.foto_url} alt={barbero.nombre} className="w-full h-full object-cover" />
                    : <span style={{ color: 'var(--gold)', opacity: 0.4 }}>✂</span>
                  }
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-xl font-semibold mb-1">{barbero.nombre}</h3>
                  {barbero.descripcion && (
                    <p className="text-sm text-white/50 mb-4">{barbero.descripcion}</p>
                  )}
                  <span
                    className="text-xs tracking-widest uppercase font-medium transition-colors"
                    style={{ color: 'var(--gold)' }}
                  >
                    Reservar →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
