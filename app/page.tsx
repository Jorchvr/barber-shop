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
      <div className="mb-8">
        <p className="text-[#888] text-sm mb-1">Bienvenido</p>
        <h1 className="text-2xl font-bold">¿Con quién vas hoy?</h1>
      </div>

      {!barberos || barberos.length === 0 ? (
        <p className="text-center text-[#888] py-16">No hay barberos disponibles.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(barberos as Barbero[]).map((barbero) => (
            <Link
              key={barbero.id}
              href={`/reservar/${barbero.id}`}
              className="group bg-white rounded-2xl p-4 flex sm:flex-col sm:items-center sm:text-center items-center gap-4 active:scale-[0.98] transition-transform shadow-sm hover:shadow-md"
            >
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-[rgba(0,0,0,0.06)] flex items-center justify-center text-2xl sm:text-4xl shrink-0 overflow-hidden sm:mb-3">
                {barbero.foto_url ? (
                  <img src={barbero.foto_url} alt={barbero.nombre} className="w-full h-full object-cover" />
                ) : (
                  '✂'
                )}
              </div>
              <div className="flex-1 min-w-0 sm:flex-none">
                <h2 className="font-semibold text-[#111]">{barbero.nombre}</h2>
                {barbero.descripcion && (
                  <p className="text-[#888] text-sm truncate sm:whitespace-normal">{barbero.descripcion}</p>
                )}
                <p className="text-[#bbb] text-xs mt-2 hidden sm:block">Ver disponibilidad →</p>
              </div>
              <span className="text-[#bbb] text-lg shrink-0 sm:hidden">›</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
