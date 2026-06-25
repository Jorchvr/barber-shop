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
    <div>
      <div className="mb-7">
        <a href="/" className="text-[#888] text-sm flex items-center gap-1 mb-4">
          ‹ Volver
        </a>
        <h1 className="text-2xl font-bold">{barbero.nombre}</h1>
        {barbero.descripcion && (
          <p className="text-[#888] text-sm mt-0.5">{barbero.descripcion}</p>
        )}
      </div>
      <ReservaForm
        barbero={barbero}
        servicios={servicios ?? []}
        horarios={horarios ?? []}
      />
    </div>
  )
}
