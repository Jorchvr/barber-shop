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
    supabase.from('citas').select('*, barberos(nombre), servicios(nombre, precio)')
      .order('fecha', { ascending: true }).order('hora', { ascending: true }),
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
        <div className="text-center mb-10">
          <p className="font-serif italic mb-2 text-lg" style={{ color: 'var(--gold)' }}>Panel de administración</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold">
            {fecha
              ? format(new Date(fecha + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es })
              : 'Todas las citas'}
          </h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Total', value: citas.length },
            { label: 'Pendientes', value: pendientes },
            { label: 'Completadas', value: completadas },
          ].map((s) => (
            <div
              key={s.label}
              className="text-center py-5 px-3"
              style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 'var(--radius)', backdropFilter: 'blur(10px)' }}
            >
              <div className="font-serif text-4xl font-bold mb-1" style={{ color: 'var(--gold)' }}>{s.value}</div>
              <div className="text-xs uppercase tracking-widest text-white/40">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <form className="flex flex-wrap justify-center gap-2 mb-10">
          <input
            type="date"
            name="fecha"
            defaultValue={fecha ?? ''}
            className="px-4 py-3 text-sm focus:outline-none text-white"
            style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 'var(--radius-sm)', backdropFilter: 'blur(10px)' }}
          />
          <select
            name="barbero"
            defaultValue={barberoId ?? ''}
            className="px-4 py-3 text-sm focus:outline-none text-white"
            style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 'var(--radius-sm)', backdropFilter: 'blur(10px)' }}
          >
            <option value="">Todos los barberos</option>
            {(barberos ?? []).map((b) => (
              <option key={b.id} value={b.id}>{b.nombre}</option>
            ))}
          </select>
          <button
            type="submit"
            className="px-6 py-3 text-sm font-medium transition-all hover:opacity-80"
            style={{ border: '1px solid var(--gold-border)', color: 'var(--gold)', background: 'var(--gold-glass)', borderRadius: 'var(--radius-sm)' }}
          >
            Filtrar
          </button>
          {(fecha || barberoId) && (
            <a
              href="/admin"
              className="px-6 py-3 text-sm font-medium text-white/40 hover:text-white transition-colors"
              style={{ border: '1px solid var(--dark-border)', borderRadius: 'var(--radius-sm)' }}
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
