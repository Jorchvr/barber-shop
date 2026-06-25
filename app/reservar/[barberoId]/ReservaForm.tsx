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

function Seccion({ num, titulo, activo, children }: {
  num: number; titulo: string; activo: boolean; children: React.ReactNode
}) {
  return (
    <div className="mb-7">
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${activo ? 'bg-[#111] text-white' : 'bg-[rgba(0,0,0,0.08)] text-[#aaa]'}`}>
          {num}
        </span>
        <span className={`text-sm font-semibold transition-colors ${activo ? 'text-[#111]' : 'text-[#bbb]'}`}>{titulo}</span>
      </div>
      {children}
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
    if (!nombre.trim()) {
      setError('Por favor ingresa tu nombre.')
      return
    }
    setCargando(true)
    setError('')

    const fechaStr = format(fechaSeleccionada, 'yyyy-MM-dd')
    const { error: err } = await supabase.from('citas').insert({
      barbero_id: barbero.id,
      servicio_id: servicioSeleccionado.id,
      cliente_nombre: nombre.trim(),
      cliente_telefono: telefono.trim() || null,
      fecha: fechaStr,
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

    // Notificaciones WhatsApp en paralelo (no bloquean si fallan)
    const fechaLegible = format(fechaSeleccionada, "EEEE d 'de' MMMM", { locale: es })
    const notificaciones: Promise<void>[] = []

    // Al barbero
    if (barbero.telefono) {
      notificaciones.push(
        fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: barbero.telefono,
            mensaje: `Nueva cita 📅\nCliente: ${nombre.trim()}\nServicio: ${servicioSeleccionado.nombre}\nFecha: ${fechaLegible} a las ${horaSeleccionada}${telefono.trim() ? `\nTel: ${telefono.trim()}` : ''}`,
          }),
        }).then(() => {})
      )
    }

    // Al cliente (si dejó teléfono)
    if (telefono.trim()) {
      notificaciones.push(
        fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: telefono.trim(),
            mensaje: `¡Hola ${nombre.trim()}! ✂️ Tu cita está confirmada.\nBarbero: ${barbero.nombre}\nServicio: ${servicioSeleccionado.nombre}\nFecha: ${fechaLegible} a las ${horaSeleccionada}\n\n¡Te esperamos!`,
          }),
        }).then(() => {})
      )
    }

    await Promise.allSettled(notificaciones)

    setCargando(false)
    setCitaCreada(true)
  }

  if (citaCreada) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-[rgba(0,0,0,0.06)] rounded-full flex items-center justify-center text-3xl mx-auto mb-5">
          ✓
        </div>
        <h2 className="text-xl font-bold mb-1">¡Cita confirmada!</h2>
        <p className="text-[#888] text-sm mb-1">{servicioSeleccionado?.nombre} con {barbero.nombre}</p>
        <p className="text-[#888] text-sm mb-8 capitalize">
          {fechaSeleccionada && format(fechaSeleccionada, "EEEE d 'de' MMMM", { locale: es })} · {horaSeleccionada}
        </p>
        <a
          href="/"
          className="inline-block bg-[#111] text-white text-sm font-medium px-6 py-3 rounded-xl active:opacity-80 transition-opacity"
        >
          Hacer otra reserva
        </a>
      </div>
    )
  }

  const resumenVisible = servicioSeleccionado || fechaSeleccionada || horaSeleccionada

  return (
    <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8 lg:items-start">
      {/* Columna izquierda: pasos */}
      <div>
        {/* Paso 1: Servicio */}
        <Seccion num={1} titulo="Tipo de corte" activo={paso >= 1}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {servicios.map((s) => (
              <button
                key={s.id}
                onClick={() => { setServicioSeleccionado(s); setPaso(2) }}
                className={`text-left px-4 py-3.5 rounded-xl transition-all active:scale-[0.98] ${
                  servicioSeleccionado?.id === s.id
                    ? 'bg-[#111] text-white'
                    : 'bg-white text-[#111] shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm">{s.nombre}</span>
                  <span className={`text-xs shrink-0 ${servicioSeleccionado?.id === s.id ? 'text-white/60' : 'text-[#888]'}`}>
                    {s.duracion_min} min · ${s.precio}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </Seccion>

        {/* Paso 2: Fecha */}
        {paso >= 2 && (
          <Seccion num={2} titulo="Fecha" activo={paso >= 2}>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {dias.map((dia) => {
                const disponible = diaDisponible(dia)
                const seleccionado = fechaSeleccionada && isSameDay(dia, fechaSeleccionada)
                return (
                  <button
                    key={dia.toISOString()}
                    disabled={!disponible}
                    onClick={() => seleccionarFecha(dia)}
                    className={`flex flex-col items-center px-3 py-2.5 rounded-xl text-xs shrink-0 min-w-[52px] transition-all active:scale-95 ${
                      seleccionado
                        ? 'bg-[#111] text-white'
                        : disponible
                        ? 'bg-white text-[#111] shadow-sm hover:shadow-md'
                        : 'bg-[rgba(0,0,0,0.04)] text-[#ccc] cursor-not-allowed'
                    }`}
                  >
                    <span className="font-medium capitalize">{format(dia, 'EEE', { locale: es })}</span>
                    <span className={`text-[11px] mt-0.5 ${seleccionado ? 'text-white/70' : 'text-[#888]'}`}>
                      {format(dia, 'd MMM', { locale: es })}
                    </span>
                  </button>
                )
              })}
            </div>
          </Seccion>
        )}

        {/* Paso 3: Hora */}
        {paso >= 3 && fechaSeleccionada && (
          <Seccion num={3} titulo="Hora" activo={paso >= 3}>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {horasDelDia().map((hora) => {
                const ocupada = citasOcupadas.includes(hora)
                const seleccionada = horaSeleccionada === hora
                return (
                  <button
                    key={hora}
                    disabled={ocupada}
                    onClick={() => { setHoraSeleccionada(hora); setPaso(4) }}
                    className={`py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                      seleccionada
                        ? 'bg-[#111] text-white'
                        : ocupada
                        ? 'bg-[rgba(0,0,0,0.04)] text-[#ccc] cursor-not-allowed line-through'
                        : 'bg-white text-[#111] shadow-sm hover:shadow-md'
                    }`}
                  >
                    {hora}
                  </button>
                )
              })}
            </div>
          </Seccion>
        )}

        {/* Paso 4: Datos del cliente */}
        {paso >= 4 && horaSeleccionada && (
          <Seccion num={4} titulo="Tus datos" activo={paso >= 4}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
              <input
                type="text"
                placeholder="Tu nombre *"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full bg-white rounded-xl px-4 py-3 text-sm text-[#111] placeholder-[#bbb] focus:outline-none shadow-sm"
              />
              <div className="relative">
                <input
                  type="tel"
                  placeholder="Tu teléfono (opcional)"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full bg-white rounded-xl px-4 py-3 text-sm text-[#111] placeholder-[#bbb] focus:outline-none shadow-sm"
                />
              </div>
            </div>
            <p className="text-[#aaa] text-xs mb-4 flex items-start gap-1.5 px-1">
              <span>💬</span>
              <span>Si agregas tu teléfono, recibirás un mensaje de WhatsApp como recordatorio de tu cita.</span>
            </p>

            {/* Resumen en móvil (en desktop va en la columna derecha) */}
            <div className="lg:hidden bg-white rounded-xl p-4 text-sm mb-4 shadow-sm">
              <ResumenCita
                barbero={barbero}
                servicio={servicioSeleccionado}
                fecha={fechaSeleccionada}
                hora={horaSeleccionada}
              />
            </div>

            {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

            <button
              onClick={confirmarCita}
              disabled={cargando}
              className="w-full sm:w-auto bg-[#111] text-white font-semibold px-8 py-4 rounded-xl text-sm active:opacity-80 transition-opacity disabled:opacity-40"
            >
              {cargando ? 'Confirmando...' : `Confirmar · $${servicioSeleccionado?.precio}`}
            </button>
          </Seccion>
        )}
      </div>

      {/* Columna derecha: resumen sticky (solo desktop) */}
      <div className="hidden lg:block sticky top-24">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#888] uppercase tracking-wider mb-4">Resumen</p>
          {resumenVisible ? (
            <ResumenCita
              barbero={barbero}
              servicio={servicioSeleccionado}
              fecha={fechaSeleccionada}
              hora={horaSeleccionada}
            />
          ) : (
            <p className="text-[#bbb] text-sm">Selecciona un servicio para comenzar.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function ResumenCita({ barbero, servicio, fecha, hora }: {
  barbero: Barbero
  servicio: Servicio | null
  fecha: Date | null
  hora: string | null
}) {
  return (
    <div className="space-y-0">
      <Row label="Barbero" value={barbero.nombre} />
      <Row label="Servicio" value={servicio?.nombre} />
      <Row label="Duración" value={servicio ? `${servicio.duracion_min} min` : undefined} />
      <Row
        label="Fecha"
        value={fecha ? format(fecha, "EEE d 'de' MMM", { locale: es }) : undefined}
        capitalize
      />
      <Row label="Hora" value={hora ?? undefined} />
      {servicio && (
        <div className="flex justify-between pt-3 mt-1 border-t border-[#f0f0f0]">
          <span className="text-[#888] text-sm">Total</span>
          <span className="font-bold text-[#111]">${servicio.precio}</span>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, capitalize }: { label: string; value?: string; capitalize?: boolean }) {
  if (!value) return null
  return (
    <div className="flex justify-between py-2 border-b border-[#f5f5f5]">
      <span className="text-[#888] text-sm">{label}</span>
      <span className={`font-medium text-sm text-[#111] ${capitalize ? 'capitalize' : ''}`}>{value}</span>
    </div>
  )
}
