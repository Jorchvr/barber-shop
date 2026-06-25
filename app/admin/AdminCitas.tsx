'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Cita } from '@/types'

const ESTADO = {
  pendiente: { label: 'Pendiente', color: '#b5965a' },
  completada: { label: 'Completada', color: '#4ade80' },
  cancelada: { label: 'Cancelada', color: 'rgba(255,255,255,0.25)' },
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
      <div className="text-center py-20 border" style={{ borderColor: 'var(--dark-border)' }}>
        <p className="font-serif italic text-white/30 text-lg">Sin citas para mostrar</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {citas.map((cita) => {
        const e = ESTADO[cita.estado]
        const ocupado = cargando === cita.id
        return (
          <div
            key={cita.id}
            className="border p-5 transition-opacity"
            style={{ borderColor: 'var(--dark-border)', background: 'var(--dark-card)', opacity: ocupado ? 0.5 : 1 }}
          >
            {/* Hora y fecha */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="font-serif text-2xl font-bold" style={{ color: 'var(--gold)' }}>
                  {cita.hora.slice(0, 5)}
                </span>
                <span className="text-white/30 text-xs ml-2">
                  {new Date(cita.fecha + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                </span>
              </div>
              <span className="text-xs font-medium" style={{ color: e.color }}>
                {e.label}
              </span>
            </div>

            {/* Info cliente */}
            <div className="border-t pt-4 mb-4" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <p className="font-medium text-sm text-white">{cita.cliente_nombre}</p>
              <p className="text-white/40 text-xs mt-0.5">{(cita as any).servicios?.nombre} · {(cita as any).barberos?.nombre}</p>
              {cita.cliente_telefono && (
                <p className="text-white/30 text-xs mt-0.5">{cita.cliente_telefono}</p>
              )}
            </div>

            {/* Acciones */}
            {cita.estado === 'pendiente' && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => cambiarEstado(cita.id, 'completada')}
                  disabled={ocupado}
                  className="py-2 text-xs tracking-wider uppercase font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                  style={{ background: 'var(--gold)', color: '#0d0d0d' }}
                >
                  Completar
                </button>
                <button
                  onClick={() => cambiarEstado(cita.id, 'cancelada')}
                  disabled={ocupado}
                  className="py-2 text-xs tracking-wider uppercase font-medium border text-white/40 hover:text-white transition-colors disabled:opacity-40"
                  style={{ borderColor: 'var(--dark-border)' }}
                >
                  Cancelar
                </button>
              </div>
            )}
            {cita.estado !== 'pendiente' && (
              <button
                onClick={() => cambiarEstado(cita.id, 'pendiente')}
                disabled={ocupado}
                className="w-full py-2 text-xs tracking-wider uppercase font-medium border text-white/30 hover:text-white transition-colors disabled:opacity-40"
                style={{ borderColor: 'var(--dark-border)' }}
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
