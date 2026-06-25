'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Cita } from '@/types'

const ESTADO = {
  pendiente: { label: 'Pendiente', color: 'var(--gold)' },
  completada: { label: 'Completada', color: '#4ade80' },
  cancelada: { label: 'Cancelada', color: 'rgba(255,255,255,0.3)' },
}

export default function AdminCitas({ citas: citasIniciales }: { citas: Cita[] }) {
  const [citas, setCitas] = useState<Cita[]>(citasIniciales)
  const [cargando, setCargando] = useState<string | null>(null)

  async function cambiarEstado(id: string, estado: Cita['estado']) {
    setCargando(id)
    const { error } = await supabase.from('citas').update({ estado }).eq('id', id)
    if (!error) setCitas((prev) => prev.map((c) => (c.id === id ? { ...c, estado } : c)))
    setCargando(null)
  }

  if (citas.length === 0) {
    return (
      <div
        className="text-center py-20"
        style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 'var(--radius-lg)' }}
      >
        <p className="font-serif italic text-white/30 text-xl">Sin citas para mostrar</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {citas.map((cita) => {
        const e = ESTADO[cita.estado]
        const ocupado = cargando === cita.id
        return (
          <div
            key={cita.id}
            className="p-5 transition-opacity text-center"
            style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 'var(--radius)', backdropFilter: 'blur(20px)', opacity: ocupado ? 0.5 : 1 }}
          >
            {/* Hora */}
            <div className="mb-1">
              <span className="font-serif text-3xl font-bold" style={{ color: 'var(--gold)' }}>
                {cita.hora.slice(0, 5)}
              </span>
            </div>
            <span className="text-white/30 text-xs">
              {new Date(cita.fecha + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short' })}
            </span>

            {/* Divider */}
            <div className="my-4 border-t" style={{ borderColor: 'var(--dark-border)' }} />

            {/* Cliente */}
            <p className="font-semibold text-white mb-1">{cita.cliente_nombre}</p>
            <p className="text-white/40 text-sm">{(cita as any).servicios?.nombre}</p>
            <p className="text-white/30 text-xs mt-0.5">{(cita as any).barberos?.nombre}</p>
            {cita.cliente_telefono && (
              <p className="text-white/20 text-xs mt-0.5">{cita.cliente_telefono}</p>
            )}

            {/* Estado */}
            <div className="mt-3 mb-4">
              <span className="text-xs font-medium" style={{ color: e.color }}>{e.label}</span>
            </div>

            {/* Acciones */}
            {cita.estado === 'pendiente' && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => cambiarEstado(cita.id, 'completada')}
                  disabled={ocupado}
                  className="py-2.5 text-xs font-medium transition-all hover:opacity-80 disabled:opacity-40 active:scale-95"
                  style={{ border: '1px solid var(--gold-border)', color: 'var(--gold)', background: 'var(--gold-glass)', borderRadius: 'var(--radius-sm)' }}
                >
                  Completar
                </button>
                <button
                  onClick={() => cambiarEstado(cita.id, 'cancelada')}
                  disabled={ocupado}
                  className="py-2.5 text-xs font-medium transition-all hover:opacity-70 disabled:opacity-40 active:scale-95"
                  style={{ border: '1px solid var(--dark-border)', color: 'rgba(255,255,255,0.4)', borderRadius: 'var(--radius-sm)' }}
                >
                  Cancelar
                </button>
              </div>
            )}
            {cita.estado !== 'pendiente' && (
              <button
                onClick={() => cambiarEstado(cita.id, 'pendiente')}
                disabled={ocupado}
                className="w-full py-2.5 text-xs font-medium transition-all hover:opacity-70 disabled:opacity-40 active:scale-95"
                style={{ border: '1px solid var(--dark-border)', color: 'rgba(255,255,255,0.3)', borderRadius: 'var(--radius-sm)' }}
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
