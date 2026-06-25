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

function Paso({ num, texto, activo }: { num: number; texto: string; activo: boolean }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-5">
      <span
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all"
        style={activo
          ? { background: 'var(--gold-glass)', border: '1px solid var(--gold-border)', color: 'var(--gold)' }
          : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.25)' }
        }
      >
        {num}
      </span>
      <span className="font-serif text-xl font-semibold" style={{ color: activo ? '#fff' : 'rgba(255,255,255,0.25)' }}>
        {texto}
      </span>
    </div>
  )
}

const glassBtn = {
  active: { border: '1px solid var(--gold-border)', color: 'var(--gold)', background: 'rgba(181,150,90,0.25)', borderRadius: 'var(--radius-sm)' } as React.CSSProperties,
  idle: { border: '1px solid var(--dark-border)', color: 'rgba(255,255,255,0.8)', background: 'var(--dark-card)', borderRadius: 'var(--radius-sm)', backdropFilter: 'blur(10px)' } as React.CSSProperties,
  disabled: { border: '1px solid rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)', background: 'transparent', borderRadius: 'var(--radius-sm)', cursor: 'not-allowed' } as React.CSSProperties,
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
      .from('citas').select('hora')
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
    return generarHoras(horarioDia.hora_inicio.slice(0, 5), horarioDia.hora_fin.slice(0, 5), servicioSeleccionado.duracion_min)
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
      notifs.push(fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: barbero.telefono, mensaje: `Nueva cita\nCliente: ${nombre.trim()}\nServicio: ${servicioSeleccionado.nombre}\nFecha: ${fechaLegible} a las ${horaSeleccionada}${telefono.trim() ? `\nTel: ${telefono.trim()}` : ''}` }) }).then(() => {}))
    }
    if (telefono.trim()) {
      notifs.push(fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: telefono.trim(), mensaje: `Hola ${nombre.trim()}, tu cita está confirmada.\nBarbero: ${barbero.nombre}\nServicio: ${servicioSeleccionado.nombre}\nFecha: ${fechaLegible} a las ${horaSeleccionada}` }) }).then(() => {}))
    }
    await Promise.allSettled(notifs)
    setCargando(false)
    setCitaCreada(true)
  }

  if (citaCreada) {
    return (
      <div className="text-center py-16 px-6">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl mx-auto mb-6"
          style={{ background: 'var(--gold-glass)', border: '1px solid var(--gold-border)' }}
        >
          ✓
        </div>
        <p className="font-serif italic mb-2 text-lg" style={{ color: 'var(--gold)' }}>Reserva confirmada</p>
        <h2 className="font-serif text-4xl font-bold mb-3">¡Hasta pronto, {nombre}!</h2>
        <p className="text-white/50 text-lg mb-1">{servicioSeleccionado?.nombre} con {barbero.nombre}</p>
        <p className="text-white/40 mb-10 capitalize">
          {fechaSeleccionada && format(fechaSeleccionada, "EEEE d 'de' MMMM", { locale: es })} · {horaSeleccionada}
        </p>
        <a
          href="/"
          className="inline-block text-sm font-medium px-10 py-4 transition-all hover:opacity-80"
          style={{ border: '1px solid var(--gold-border)', color: 'var(--gold)', background: 'var(--gold-glass)', borderRadius: 'var(--radius-lg)' }}
        >
          Volver al inicio
        </a>
      </div>
    )
  }

  return (
    <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-10">
      <div>
        {/* Paso 1: Servicio */}
        <div className="mb-10">
          <Paso num={1} texto="Tipo de corte" activo={paso >= 1} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {servicios.map((s) => (
              <button
                key={s.id}
                onClick={() => { setServicioSeleccionado(s); setPaso(2) }}
                className="text-center p-5 transition-all duration-200 active:scale-95"
                style={servicioSeleccionado?.id === s.id ? glassBtn.active : glassBtn.idle}
              >
                <div className="font-semibold text-base mb-1">{s.nombre}</div>
                <div className="text-sm opacity-50">{s.duracion_min} min · ${s.precio}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Paso 2: Fecha */}
        {paso >= 2 && (
          <div className="mb-10">
            <Paso num={2} texto="Fecha" activo={paso >= 2} />
            <div className="flex gap-2 overflow-x-auto pb-2">
              {dias.map((dia) => {
                const disponible = diaDisponible(dia)
                const seleccionado = fechaSeleccionada && isSameDay(dia, fechaSeleccionada)
                return (
                  <button
                    key={dia.toISOString()}
                    disabled={!disponible}
                    onClick={() => seleccionarFecha(dia)}
                    className="flex flex-col items-center px-4 py-3 shrink-0 min-w-[64px] transition-all duration-200 active:scale-95"
                    style={seleccionado ? glassBtn.active : disponible ? glassBtn.idle : glassBtn.disabled}
                  >
                    <span className="text-sm font-medium capitalize">{format(dia, 'EEE', { locale: es })}</span>
                    <span className="text-xs mt-1 opacity-60">{format(dia, 'd MMM', { locale: es })}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Paso 3: Hora */}
        {paso >= 3 && fechaSeleccionada && (
          <div className="mb-10">
            <Paso num={3} texto="Hora" activo={paso >= 3} />
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {horasDelDia().map((hora) => {
                const ocupada = citasOcupadas.includes(hora)
                const seleccionada = horaSeleccionada === hora
                return (
                  <button
                    key={hora}
                    disabled={ocupada}
                    onClick={() => { setHoraSeleccionada(hora); setPaso(4) }}
                    className="py-3 text-sm font-medium transition-all duration-200 active:scale-95"
                    style={seleccionada ? glassBtn.active : ocupada ? { ...glassBtn.disabled, textDecoration: 'line-through' } : glassBtn.idle}
                  >
                    {hora}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Paso 4: Datos */}
        {paso >= 4 && horaSeleccionada && (
          <div className="mb-10">
            <Paso num={4} texto="Tus datos" activo={paso >= 4} />
            <div className="space-y-3 max-w-md mx-auto">
              <input
                type="text"
                placeholder="Tu nombre *"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-5 py-4 text-base text-white placeholder-white/30 focus:outline-none transition-all text-center"
                style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 'var(--radius-sm)', backdropFilter: 'blur(10px)' }}
              />
              <input
                type="tel"
                placeholder="Tu teléfono (opcional)"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full px-5 py-4 text-base text-white placeholder-white/30 focus:outline-none transition-all text-center"
                style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 'var(--radius-sm)', backdropFilter: 'blur(10px)' }}
              />
              <p className="text-white/30 text-sm text-center pt-1">
                Con tu teléfono recibirás confirmación por mensaje.
              </p>

              {/* Resumen móvil */}
              <div className="lg:hidden p-5 mt-4" style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 'var(--radius)', backdropFilter: 'blur(10px)' }}>
                <ResumenCita barbero={barbero} servicio={servicioSeleccionado} fecha={fechaSeleccionada} hora={horaSeleccionada} />
              </div>

              {error && <p className="text-red-400 text-sm text-center">{error}</p>}

              <button
                onClick={confirmarCita}
                disabled={cargando}
                className="w-full py-4 text-base font-medium transition-all hover:opacity-80 disabled:opacity-40 active:scale-95 mt-2"
                style={{ border: '1px solid var(--gold-border)', color: 'var(--gold)', background: 'var(--gold-glass)', borderRadius: 'var(--radius-sm)', backdropFilter: 'blur(10px)' }}
              >
                {cargando ? 'Confirmando...' : `Confirmar Cita · $${servicioSeleccionado?.precio}`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Resumen desktop */}
      <div className="hidden lg:block">
        <div
          className="sticky top-28 p-6"
          style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 'var(--radius-lg)', backdropFilter: 'blur(20px)' }}
        >
          <p className="font-serif italic text-center mb-5 text-base" style={{ color: 'var(--gold)' }}>Resumen</p>
          {servicioSeleccionado || fechaSeleccionada || horaSeleccionada
            ? <ResumenCita barbero={barbero} servicio={servicioSeleccionado} fecha={fechaSeleccionada} hora={horaSeleccionada} />
            : <p className="text-white/30 text-sm text-center">Selecciona un servicio para comenzar.</p>
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
    <div className="space-y-3 text-sm text-center">
      <Row label="Barbero" value={barbero.nombre} />
      <Row label="Servicio" value={servicio?.nombre} />
      <Row label="Duración" value={servicio ? `${servicio.duracion_min} min` : undefined} />
      <Row label="Fecha" value={fecha ? format(fecha, "EEE d 'de' MMM", { locale: es }) : undefined} cap />
      <Row label="Hora" value={hora ?? undefined} />
      {servicio && (
        <div className="pt-3 border-t" style={{ borderColor: 'var(--dark-border)' }}>
          <span className="text-white/40">Total </span>
          <span className="font-bold text-lg" style={{ color: 'var(--gold)' }}>${servicio.precio}</span>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, cap }: { label: string; value?: string; cap?: boolean }) {
  if (!value) return null
  return (
    <div className="py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <span className="text-white/40 block text-xs uppercase tracking-wider mb-0.5">{label}</span>
      <span className={`text-white font-medium ${cap ? 'capitalize' : ''}`}>{value}</span>
    </div>
  )
}
