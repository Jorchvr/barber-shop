'use client'

import { useState } from 'react'
import { format, addDays, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import type { Barbero, Servicio, Horario } from '@/types'

interface Props {
  barbero: Barbero
  servicios: Servicio[]
  horarios: Horario[]
}

const DIAS_ADELANTE = 14

function generarHoras(inicio: string, fin: string, duracion: number): string[] {
  const horas: string[] = []
  const [hi, mi] = inicio.split(':').map(Number)
  const [hf, mf] = fin.split(':').map(Number)
  let minutos = hi * 60 + mi
  const finMin = hf * 60 + mf
  while (minutos + duracion <= finMin) {
    const h = Math.floor(minutos / 60).toString().padStart(2, '0')
    const m = (minutos % 60).toString().padStart(2, '0')
    horas.push(`${h}:${m}`)
    minutos += duracion
  }
  return horas
}

function Label({ num, texto, activo }: { num: number; texto: string; activo: boolean }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all"
        style={activo
          ? { background: 'var(--gold)', color: '#0d0d0d' }
          : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }
        }
      >
        {num}
      </span>
      <span
        className="text-xs tracking-widest uppercase font-medium transition-colors"
        style={{ color: activo ? '#fff' : 'rgba(255,255,255,0.3)' }}
      >
        {texto}
      </span>
    </div>
  )
}

export default function ReservaForm({ barbero, servicios, horarios }: Props) {
  const [paso, setPaso] = useState<1 | 2 | 3 | 4>(1)
  const [servicioSeleccionado, setServicioSeleccionado] = useState<Servicio | null>(null)
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(null)
  const [horaSeleccionada, setHoraSeleccionada] = useState<string | null>(null)
  const [citasOcupadas, setCitasOcupadas] = useState<string[]>([])
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [cargando, setCargando] = useState(false)
  const [citaCreada, setCitaCreada] = useState(false)
  const [error, setError] = useState('')

  const dias = Array.from({ length: DIAS_ADELANTE }, (_, i) => addDays(new Date(), i + 1))

  function diaDisponible(dia: Date) {
    return horarios.some((h) => h.dia_semana === dia.getDay())
  }

  async function seleccionarFecha(dia: Date) {
    setFechaSeleccionada(dia)
    setHoraSeleccionada(null)
    const { data } = await supabase
      .from('citas')
      .select('hora')
      .eq('barbero_id', barbero.id)
      .eq('fecha', format(dia, 'yyyy-MM-dd'))
      .neq('estado', 'cancelada')
    setCitasOcupadas((data ?? []).map((c) => c.hora.slice(0, 5)))
    setPaso(3)
  }

  function horasDelDia(): string[] {
    if (!fechaSeleccionada || !servicioSeleccionado) return []
    const horarioDia = horarios.find((h) => h.dia_semana === fechaSeleccionada.getDay())
    if (!horarioDia) return []
    return generarHoras(
      horarioDia.hora_inicio.slice(0, 5),
      horarioDia.hora_fin.slice(0, 5),
      servicioSeleccionado.duracion_min
    )
  }

  async function confirmarCita() {
    if (!servicioSeleccionado || !fechaSeleccionada || !horaSeleccionada) return
    if (!nombre.trim()) { setError('Por favor ingresa tu nombre.'); return }
    setCargando(true)
    setError('')

    const { error: err } = await supabase.from('citas').insert({
      barbero_id: barbero.id,
      servicio_id: servicioSeleccionado.id,
      cliente_nombre: nombre.trim(),
      cliente_telefono: telefono.trim() || null,
      fecha: format(fechaSeleccionada, 'yyyy-MM-dd'),
      hora: horaSeleccionada,
      estado: 'pendiente',
    })

    if (err) {
      setCargando(false)
      if (err.code === '23505') {
        setError('Ese horario ya fue tomado. Elige otra hora.')
        setCitasOcupadas((prev) => [...prev, horaSeleccionada])
        setHoraSeleccionada(null)
      } else {
        setError('Error al crear la cita. Intenta de nuevo.')
      }
      return
    }

    const fechaLegible = format(fechaSeleccionada, "EEEE d 'de' MMMM", { locale: es })
    const notifs: Promise<void>[] = []

    if (barbero.telefono) {
      notifs.push(fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: barbero.telefono,
          mensaje: `Nueva cita\nCliente: ${nombre.trim()}\nServicio: ${servicioSeleccionado.nombre}\nFecha: ${fechaLegible} a las ${horaSeleccionada}${telefono.trim() ? `\nTel: ${telefono.trim()}` : ''}`,
        }),
      }).then(() => {}))
    }

    if (telefono.trim()) {
      notifs.push(fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: telefono.trim(),
          mensaje: `Hola ${nombre.trim()}, tu cita está confirmada.\nBarbero: ${barbero.nombre}\nServicio: ${servicioSeleccionado.nombre}\nFecha: ${fechaLegible} a las ${horaSeleccionada}`,
        }),
      }).then(() => {}))
    }

    await Promise.allSettled(notifs)
    setCargando(false)
    setCitaCreada(true)
  }

  if (citaCreada) {
    return (
      <div className="text-center py-20">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-6"
          style={{ border: '1px solid var(--gold)', color: 'var(--gold)' }}
        >
          ✓
        </div>
        <p className="font-serif italic mb-2" style={{ color: 'var(--gold)' }}>Reserva confirmada</p>
        <h2 className="font-serif text-3xl font-bold mb-3">¡Hasta pronto, {nombre}!</h2>
        <p className="text-white/50 mb-1">{servicioSeleccionado?.nombre} con {barbero.nombre}</p>
        <p className="text-white/50 mb-10 capitalize">
          {fechaSeleccionada && format(fechaSeleccionada, "EEEE d 'de' MMMM", { locale: es })} · {horaSeleccionada}
        </p>
        <a
          href="/"
          className="inline-block text-xs tracking-widest uppercase px-8 py-4 font-medium transition-opacity hover:opacity-90"
          style={{ background: 'var(--gold)', color: '#0d0d0d' }}
        >
          Volver al inicio
        </a>
      </div>
    )
  }

  const resumenVisible = servicioSeleccionado || fechaSeleccionada || horaSeleccionada

  return (
    <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-12">
      {/* Pasos */}
      <div>
        {/* Paso 1 */}
        <div className="mb-10">
          <Label num={1} texto="Tipo de corte" activo={paso >= 1} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-9">
            {servicios.map((s) => (
              <button
                key={s.id}
                onClick={() => { setServicioSeleccionado(s); setPaso(2) }}
                className="text-left px-5 py-4 border transition-all duration-200"
                style={servicioSeleccionado?.id === s.id
                  ? { background: 'var(--gold)', borderColor: 'var(--gold)', color: '#0d0d0d' }
                  : { background: 'var(--dark-card)', borderColor: 'var(--dark-border)', color: '#fff' }
                }
              >
                <div className="font-medium text-sm">{s.nombre}</div>
                <div className="text-xs mt-1 opacity-60">{s.duracion_min} min · ${s.precio}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Paso 2 */}
        {paso >= 2 && (
          <div className="mb-10">
            <Label num={2} texto="Fecha" activo={paso >= 2} />
            <div className="flex gap-2 overflow-x-auto pb-2 pl-9">
              {dias.map((dia) => {
                const disponible = diaDisponible(dia)
                const seleccionado = fechaSeleccionada && isSameDay(dia, fechaSeleccionada)
                return (
                  <button
                    key={dia.toISOString()}
                    disabled={!disponible}
                    onClick={() => seleccionarFecha(dia)}
                    className="flex flex-col items-center px-4 py-3 shrink-0 border transition-all duration-200 min-w-[60px]"
                    style={seleccionado
                      ? { background: 'var(--gold)', borderColor: 'var(--gold)', color: '#0d0d0d' }
                      : disponible
                        ? { background: 'var(--dark-card)', borderColor: 'var(--dark-border)', color: '#fff' }
                        : { background: 'transparent', borderColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)', cursor: 'not-allowed' }
                    }
                  >
                    <span className="text-xs font-medium capitalize">{format(dia, 'EEE', { locale: es })}</span>
                    <span className="text-xs mt-0.5 opacity-70">{format(dia, 'd MMM', { locale: es })}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Paso 3 */}
        {paso >= 3 && fechaSeleccionada && (
          <div className="mb-10">
            <Label num={3} texto="Hora" activo={paso >= 3} />
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pl-9">
              {horasDelDia().map((hora) => {
                const ocupada = citasOcupadas.includes(hora)
                const seleccionada = horaSeleccionada === hora
                return (
                  <button
                    key={hora}
                    disabled={ocupada}
                    onClick={() => { setHoraSeleccionada(hora); setPaso(4) }}
                    className="py-3 text-sm font-medium border transition-all duration-200"
                    style={seleccionada
                      ? { background: 'var(--gold)', borderColor: 'var(--gold)', color: '#0d0d0d' }
                      : ocupada
                        ? { background: 'transparent', borderColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)', cursor: 'not-allowed', textDecoration: 'line-through' }
                        : { background: 'var(--dark-card)', borderColor: 'var(--dark-border)', color: '#fff' }
                    }
                  >
                    {hora}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Paso 4 */}
        {paso >= 4 && horaSeleccionada && (
          <div className="mb-10">
            <Label num={4} texto="Tus datos" activo={paso >= 4} />
            <div className="pl-9 space-y-3 max-w-md">
              <input
                type="text"
                placeholder="Tu nombre *"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-4 py-3 text-sm text-white placeholder-white/30 border focus:outline-none transition-colors"
                style={{ background: 'var(--dark-card)', borderColor: 'var(--dark-border)' }}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                onBlur={e => e.target.style.borderColor = 'var(--dark-border)'}
              />
              <input
                type="tel"
                placeholder="Tu teléfono (opcional)"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full px-4 py-3 text-sm text-white placeholder-white/30 border focus:outline-none transition-colors"
                style={{ background: 'var(--dark-card)', borderColor: 'var(--dark-border)' }}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                onBlur={e => e.target.style.borderColor = 'var(--dark-border)'}
              />
              <p className="text-white/30 text-xs pt-1">
                Si agregas tu teléfono recibirás un mensaje de confirmación.
              </p>

              {/* Resumen móvil */}
              <div className="lg:hidden border p-4 mt-2" style={{ borderColor: 'var(--dark-border)', background: 'var(--dark-card)' }}>
                <ResumenCita barbero={barbero} servicio={servicioSeleccionado} fecha={fechaSeleccionada} hora={horaSeleccionada} />
              </div>

              {error && <p className="text-red-400 text-xs">{error}</p>}

              <button
                onClick={confirmarCita}
                disabled={cargando}
                className="text-xs tracking-widest uppercase px-8 py-4 font-medium transition-opacity hover:opacity-90 disabled:opacity-40 mt-2"
                style={{ background: 'var(--gold)', color: '#0d0d0d' }}
              >
                {cargando ? 'Confirmando...' : `Confirmar Cita · $${servicioSeleccionado?.precio}`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Resumen desktop */}
      <div className="hidden lg:block">
        <div className="sticky top-28 border p-6" style={{ borderColor: 'var(--dark-border)', background: 'var(--dark-card)' }}>
          <p className="text-xs tracking-widest uppercase mb-5" style={{ color: 'var(--gold)' }}>Resumen</p>
          {resumenVisible
            ? <ResumenCita barbero={barbero} servicio={servicioSeleccionado} fecha={fechaSeleccionada} hora={horaSeleccionada} />
            : <p className="text-white/30 text-sm">Selecciona un servicio para comenzar.</p>
          }
        </div>
      </div>
    </div>
  )
}

function ResumenCita({ barbero, servicio, fecha, hora }: {
  barbero: Barbero; servicio: Servicio | null; fecha: Date | null; hora: string | null
}) {
  return (
    <div className="space-y-3 text-sm">
      <Row label="Barbero" value={barbero.nombre} />
      <Row label="Servicio" value={servicio?.nombre} />
      <Row label="Duración" value={servicio ? `${servicio.duracion_min} min` : undefined} />
      <Row label="Fecha" value={fecha ? format(fecha, "EEE d 'de' MMM", { locale: es }) : undefined} cap />
      <Row label="Hora" value={hora ?? undefined} />
      {servicio && (
        <div className="flex justify-between pt-3 border-t" style={{ borderColor: 'var(--dark-border)' }}>
          <span className="text-white/50">Total</span>
          <span className="font-semibold" style={{ color: 'var(--gold)' }}>${servicio.precio}</span>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, cap }: { label: string; value?: string; cap?: boolean }) {
  if (!value) return null
  return (
    <div className="flex justify-between border-b pb-3" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
      <span className="text-white/40">{label}</span>
      <span className={`text-white font-medium ${cap ? 'capitalize' : ''}`}>{value}</span>
    </div>
  )
}
