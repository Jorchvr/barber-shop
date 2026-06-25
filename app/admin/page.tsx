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

  const hoy = format(new Date(), 'yyyy-MM-dd')

  const [{ data: barberos }, citasResult] = await Promise.all([
    supabase.from('barberos').select('*').eq('activo', true).order('nombre'),
    supabase
      .from('citas')
      .select('*, barberos(nombre), servicios(nombre, precio)')
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true }),
  ])

  let citas = citasResult.data ?? []

  // Filtro por fecha si se seleccionó
  if (fecha) citas = citas.filter((c) => c.fecha === fecha)

  // Filtro por barbero si se seleccionó
  if (barberoId) citas = citas.filter((c) => c.barbero_id === barberoId)

  const pendientes = citas.filter((c) => c.estado === 'pendiente').length
  const completadas = citas.filter((c) => c.estado === 'completada').length
  const total = citas.length

  return (
    <div>
      <div className="mb-6">
        <p className="text-[#888] text-sm mb-0.5 capitalize">
          {fecha
            ? format(new Date(fecha + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es })
            : 'Todas las fechas'}
        </p>
        <h1 className="text-2xl font-bold">Citas</h1>
      </div>

      {/* Filtros */}
      <form className="flex gap-2 mb-6">
        <input
          type="date"
          name="fecha"
          defaultValue={fecha ?? ''}
          placeholder="Todas las fechas"
          className="flex-1 bg-white rounded-xl px-4 py-2.5 text-sm text-[#111] focus:outline-none shadow-sm"
        />
        <select
          name="barbero"
          defaultValue={barberoId ?? ''}
          className="flex-1 bg-white rounded-xl px-3 py-2.5 text-sm text-[#111] focus:outline-none shadow-sm"
        >
          <option value="">Todos</option>
          {(barberos ?? []).map((b) => (
            <option key={b.id} value={b.id}>{b.nombre}</option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-[#111] text-white text-sm font-medium px-4 py-2.5 rounded-xl active:opacity-80 transition-opacity shrink-0"
        >
          Ver
        </button>
        {(fecha || barberoId) && (
          <a
            href="/admin"
            className="bg-[rgba(0,0,0,0.06)] text-[#888] text-sm font-medium px-4 py-2.5 rounded-xl transition-opacity shrink-0 flex items-center"
          >
            Limpiar
          </a>
        )}
      </form>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
        <div className="bg-white rounded-xl p-3 sm:p-5 text-center shadow-sm">
          <div className="text-2xl sm:text-3xl font-bold">{total}</div>
          <div className="text-[#888] text-xs mt-0.5">Total</div>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-5 text-center shadow-sm">
          <div className="text-2xl sm:text-3xl font-bold">{pendientes}</div>
          <div className="text-[#888] text-xs mt-0.5">Pendientes</div>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-5 text-center shadow-sm">
          <div className="text-2xl sm:text-3xl font-bold">{completadas}</div>
          <div className="text-[#888] text-xs mt-0.5">Listas</div>
        </div>
      </div>

      <AdminCitas citas={citas} />
    </div>
  )
}
