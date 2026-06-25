import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import AdminCitas from './AdminCitas'

export const revalidate = 0

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string; barbero?: string }>
}) {
  const { fecha, barbero: barberoId } = await searchParams

  const [{ data: barberos }, citasResult] = await Promise.all([
    supabase.from('barberos').select('*').eq('activo', true).order('nombre'),
    supabase
      .from('citas')
      .select('*, barberos(nombre), servicios(nombre, precio)')
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true }),
  ])

  let citas = citasResult.data ?? []
  if (fecha) citas = citas.filter((c) => c.fecha === fecha)
  if (barberoId) citas = citas.filter((c) => c.barbero_id === barberoId)

  const pendientes = citas.filter((c) => c.estado === 'pendiente').length
  const completadas = citas.filter((c) => c.estado === 'completada').length

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: 'var(--dark)' }}>
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="mb-10 pb-6 border-b" style={{ borderColor: 'var(--dark-border)' }}>
          <p className="font-serif italic mb-1" style={{ color: 'var(--gold)' }}>Panel de administración</p>
          <h1 className="font-serif text-4xl font-bold">
            {fecha
              ? format(new Date(fecha + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es })
              : 'Todas las citas'}
          </h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total', value: citas.length },
            { label: 'Pendientes', value: pendientes },
            { label: 'Completadas', value: completadas },
          ].map((stat) => (
            <div key={stat.label} className="border p-5 text-center" style={{ borderColor: 'var(--dark-border)', background: 'var(--dark-card)' }}>
              <div className="font-serif text-3xl font-bold mb-1" style={{ color: 'var(--gold)' }}>{stat.value}</div>
              <div className="text-xs tracking-widest uppercase text-white/40">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <form className="flex flex-wrap gap-2 mb-8">
          <input
            type="date"
            name="fecha"
            defaultValue={fecha ?? ''}
            className="px-4 py-2.5 text-sm border focus:outline-none"
            style={{ background: 'var(--dark-card)', borderColor: 'var(--dark-border)', color: '#fff' }}
          />
          <select
            name="barbero"
            defaultValue={barberoId ?? ''}
            className="px-4 py-2.5 text-sm border focus:outline-none"
            style={{ background: 'var(--dark-card)', borderColor: 'var(--dark-border)', color: '#fff' }}
          >
            <option value="">Todos los barberos</option>
            {(barberos ?? []).map((b) => (
              <option key={b.id} value={b.id}>{b.nombre}</option>
            ))}
          </select>
          <button
            type="submit"
            className="px-6 py-2.5 text-xs tracking-widest uppercase font-medium transition-opacity hover:opacity-90"
            style={{ background: 'var(--gold)', color: '#0d0d0d' }}
          >
            Filtrar
          </button>
          {(fecha || barberoId) && (
            <a
              href="/admin"
              className="px-6 py-2.5 text-xs tracking-widest uppercase font-medium border text-white/50 hover:text-white transition-colors"
              style={{ borderColor: 'var(--dark-border)' }}
            >
              Limpiar
            </a>
          )}
        </form>

        <AdminCitas citas={citas} />
      </div>
    </div>
  )
}
