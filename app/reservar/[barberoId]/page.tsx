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
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-10 text-center">
          <a href="/" className="inline-block text-sm text-white/40 hover:text-white/70 transition-colors mb-6">
            ← Volver
          </a>
          <p className="font-serif italic mb-2 text-lg" style={{ color: 'var(--gold)' }}>Reservar cita</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold">{barbero.nombre}</h1>
          {barbero.descripcion && (
            <p className="text-white/50 mt-3 text-lg">{barbero.descripcion}</p>
          )}
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
