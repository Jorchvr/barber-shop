import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import ReservaForm from './ReservaForm'

export default async function ReservarPage({
  params,
}: {
  params: Promise<{ barberoId: string }>
}) {
  const { barberoId } = await params

  const [{ data: barbero }, { data: servicios }, { data: horarios }] = await Promise.all([
    supabase.from('barberos').select('*').eq('id', barberoId).single(),
    supabase.from('servicios').select('*').eq('activo', true).order('nombre'),
    supabase.from('horarios').select('*').eq('barbero_id', barberoId),
  ])

  if (!barbero) notFound()

  return (
    <div className="pt-24 pb-16 min-h-screen" style={{ background: 'var(--dark)' }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-10">
          <a href="/" className="text-xs tracking-widest uppercase text-white/40 hover:text-white/70 transition-colors">
            ← Volver
          </a>
          <div className="mt-6 pb-6 border-b" style={{ borderColor: 'var(--dark-border)' }}>
            <p className="font-serif italic mb-1" style={{ color: 'var(--gold)' }}>Reservar cita</p>
            <h1 className="font-serif text-4xl font-bold">{barbero.nombre}</h1>
            {barbero.descripcion && (
              <p className="text-white/50 mt-2">{barbero.descripcion}</p>
            )}
          </div>
        </div>
        <ReservaForm
          barbero={barbero}
          servicios={servicios ?? []}
          horarios={horarios ?? []}
        />
      </div>
    </div>
  )
}
