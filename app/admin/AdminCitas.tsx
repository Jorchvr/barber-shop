'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Cita } from '@/types'

const ESTADO = {
  pendiente: { label: 'Pendiente', dot: 'bg-yellow-400' },
  completada: { label: 'Lista', dot: 'bg-green-400' },
  cancelada: { label: 'Cancelada', dot: 'bg-[#ccc]' },
}

export default function AdminCitas({ citas: citasIniciales }: { citas: Cita[] }) {
  const [citas, setCitas] = useState<Cita[]>(citasIniciales)
  const [cargando, setCargando] = useState<string | null>(null)

  async function cambiarEstado(id: string, estado: Cita['estado']) {
    setCargando(id)
    const { error } = await supabase.from('citas').update({ estado }).eq('id', id)
    if (!error) {
      setCitas((prev) => prev.map((c) => (c.id === id ? { ...c, estado } : c)))
    }
    setCargando(null)
  }

  if (citas.length === 0) {
    return (
      <div className="text-center py-16 text-[#bbb] text-sm">
        Sin citas para este día.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {citas.map((cita) => {
        const e = ESTADO[cita.estado]
        const ocupado = cargando === cita.id
        return (
          <div
            key={cita.id}
            className={`bg-white rounded-2xl p-4 shadow-sm transition-opacity ${ocupado ? 'opacity-50' : ''}`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-3">
                <div className="shrink-0 pt-0.5 text-right w-14">
                  <span className="text-base font-bold text-[#111] block leading-tight">
                    {cita.hora.slice(0, 5)}
                  </span>
                  <span className="text-[10px] text-[#bbb] block">
                    {new Date(cita.fecha + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-sm text-[#111]">{cita.cliente_nombre}</div>
                  <div className="text-[#888] text-xs mt-0.5">
                    {(cita as any).servicios?.nombre} · {(cita as any).barberos?.nombre}
                  </div>
                  <div className="text-[#aaa] text-xs">{cita.cliente_telefono || 'Sin teléfono'}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${e.dot}`} />
                <span className="text-xs text-[#888]">{e.label}</span>
              </div>
            </div>

            {cita.estado === 'pendiente' && (
              <div className="flex gap-2">
                <button
                  onClick={() => cambiarEstado(cita.id, 'completada')}
                  disabled={ocupado}
                  className="flex-1 bg-[rgba(0,0,0,0.06)] text-[#111] text-xs font-medium py-2 rounded-lg active:opacity-70 transition-opacity"
                >
                  Marcar lista
                </button>
                <button
                  onClick={() => cambiarEstado(cita.id, 'cancelada')}
                  disabled={ocupado}
                  className="flex-1 bg-[rgba(0,0,0,0.04)] text-[#aaa] text-xs font-medium py-2 rounded-lg active:opacity-70 transition-opacity"
                >
                  Cancelar
                </button>
              </div>
            )}
            {cita.estado !== 'pendiente' && (
              <button
                onClick={() => cambiarEstado(cita.id, 'pendiente')}
                disabled={ocupado}
                className="w-full bg-[rgba(0,0,0,0.04)] text-[#aaa] text-xs font-medium py-2 rounded-lg active:opacity-70 transition-opacity"
              >
                Reactivar
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
