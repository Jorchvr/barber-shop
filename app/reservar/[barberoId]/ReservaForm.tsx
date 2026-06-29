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

const card = { background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 'var(--radius)', backdropFilter: 'blur(10px)' } as React.CSSProperties
const glassBtn = {
  active: { border: '1px solid var(--gold-border)', color: 'var(--gold)', background: 'rgba(181,150,90,0.25)', borderRadius: 'var(--radius-sm)' } as React.CSSProperties,
  idle: { border: '1px solid var(--dark-border)', color: 'rgba(255,255,255,0.8)', background: 'var(--dark-card)', borderRadius: 'var(--radius-sm)', backdropFilter: 'blur(10px)' } as React.CSSProperties,
  disabled: { border: '1px solid rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)', background: 'transparent', borderRadius: 'var(--radius-sm)', cursor: 'not-allowed' } as React.CSSProperties,
}

function StepChip({ num, label, value, onEdit }: { num: number; label: string; value: string; onEdit: () => void }) {
  return (
    <button
      onClick={onEdit}
      className="w-full flex items-center gap-3 px-4 py-3 mb-3 text-left transition-all hover:opacity-80 active:scale-[0.98]"
      style={card}
    >
      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'var(--gold-glass)', border: '1px solid var(--gold-border)', color: 'var(--gold)' }}>
        {num}
      </span>
      <span className="text-white/40 text-sm shrink-0">{label}</span>
      <span className="text-white text-sm font-medium flex-1 truncate">{value}</span>
      <span className="text-xs shrink-0" style={{ color: 'var(--gold)' }}>cambiar</span>
    </button>
  )
}

function StepTitle({ num, text }: { num: number; text: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'var(--gold-glass)', border: '1px solid var(--gold-border)', color: 'var(--gold)' }}>
        {num}
      </span>
      <span className="font-serif text-xl font-semibold">{text}</span>
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
  const [email, setEmail] = useState('')
  const [cargando, setCargando] = useState(false)
  const [citaCreada, setCitaCreada] = useState(false)
  const [emailEnviado, setEmailEnviado] = useState(false)
  const [error, setError] = useState('')

  const dias = Array.from({ length: DIAS_ADELANTE }, (_, i) => addDays(new Date(), i + 1))

  function diaDisponible(dia: Date) {
    return horarios.some((h) => h.dia_semana === dia.getDay())
  }

  function irA(nuevoPaso: 1 | 2 | 3 | 4) {
    if (nuevoPaso <= 2) { setFechaSeleccionada(null); setHoraSeleccionada(null); setCitasOcupadas([]) }
    if (nuevoPaso <= 3) { setHoraSeleccionada(null) }
    setPaso(nuevoPaso)
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
      cliente_email: email.trim() || null,
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
        irA(3)
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

    let correoConfirmado = false
    if (email.trim()) {
      const emailRes = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email.trim(),
          nombre: nombre.trim(),
          barberoNombre: barbero.nombre,
          servicioNombre: servicioSeleccionado.nombre,
          fechaLegible,
          hora: horaSeleccionada,
          precio: servicioSeleccionado.precio,
        }),
      }).then((r) => r.json()).catch(() => ({ ok: false }))
      correoConfirmado = emailRes.ok && !emailRes.skipped
    }

    await Promise.allSettled(notifs)
    setCargando(false)
    setEmailEnviado(correoConfirmado)
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
        <p className="text-white/40 mb-6 capitalize">
          {fechaSeleccionada && format(fechaSeleccionada, "EEEE d 'de' MMMM", { locale: es })} · {horaSeleccionada}
        </p>
        {emailEnviado && (
          <p className="text-sm mb-8 px-4 py-2.5 rounded-xl" style={{ color: 'var(--gold)', background: 'var(--gold-glass)', border: '1px solid var(--gold-border)' }}>
            Confirmación enviada a {email}
          </p>
        )}
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
    <div className="max-w-md mx-auto">

      {/* Paso 1: Servicio */}
      {paso > 1 && servicioSeleccionado ? (
        <StepChip
          num={1}
          label="Servicio"
          value={`${servicioSeleccionado.nombre} · ${servicioSeleccionado.duracion_min} min · $${servicioSeleccionado.precio}`}
          onEdit={() => irA(1)}
        />
      ) : (
        <div className="mb-5 p-5" style={card}>
          <StepTitle num={1} text="Tipo de corte" />
          <div className="grid grid-cols-1 gap-2">
            {servicios.map((s) => (
              <button
                key={s.id}
                onClick={() => { setServicioSeleccionado(s); setPaso(2) }}
                className="flex items-center justify-between px-4 py-3 text-left transition-all duration-200 active:scale-95"
                style={servicioSeleccionado?.id === s.id ? glassBtn.active : glassBtn.idle}
              >
                <span className="font-medium">{s.nombre}</span>
                <span className="text-sm opacity-50 shrink-0 ml-4">{s.duracion_min} min · ${s.precio}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Paso 2: Fecha */}
      {paso >= 2 && (
        paso > 2 && fechaSeleccionada ? (
          <StepChip
            num={2}
            label="Fecha"
            value={format(fechaSeleccionada, "EEEE d 'de' MMMM", { locale: es })}
            onEdit={() => irA(2)}
          />
        ) : (
          <div className="mb-5 p-5" style={card}>
            <StepTitle num={2} text="Fecha" />
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {dias.map((dia) => {
                const disponible = diaDisponible(dia)
                const seleccionado = fechaSeleccionada && isSameDay(dia, fechaSeleccionada)
                return (
                  <button
                    key={dia.toISOString()}
                    disabled={!disponible}
                    onClick={() => seleccionarFecha(dia)}
                    className="flex flex-col items-center px-3 py-2.5 shrink-0 min-w-[56px] transition-all duration-200 active:scale-95"
                    style={seleccionado ? glassBtn.active : disponible ? glassBtn.idle : glassBtn.disabled}
                  >
                    <span className="text-xs font-medium capitalize">{format(dia, 'EEE', { locale: es })}</span>
                    <span className="text-xs mt-0.5 opacity-60">{format(dia, 'd', { locale: es })}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      )}

      {/* Paso 3: Hora */}
      {paso >= 3 && (
        paso > 3 && horaSeleccionada ? (
          <StepChip num={3} label="Hora" value={horaSeleccionada} onEdit={() => irA(3)} />
        ) : (
          <div className="mb-5 p-5" style={card}>
            <StepTitle num={3} text="Hora" />
            <div className="grid grid-cols-4 gap-2">
              {horasDelDia().map((hora) => {
                const ocupada = citasOcupadas.includes(hora)
                const seleccionada = horaSeleccionada === hora
                return (
                  <button
                    key={hora}
                    disabled={ocupada}
                    onClick={() => { setHoraSeleccionada(hora); setPaso(4) }}
                    className="py-2.5 text-sm font-medium transition-all duration-200 active:scale-95"
                    style={seleccionada ? glassBtn.active : ocupada ? { ...glassBtn.disabled, textDecoration: 'line-through' } : glassBtn.idle}
                  >
                    {hora}
                  </button>
                )
              })}
            </div>
          </div>
        )
      )}

      {/* Paso 4: Datos */}
      {paso >= 4 && (
        <div className="mb-5 p-5" style={card}>
          <StepTitle num={4} text="Tus datos" />
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Tu nombre *"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-4 py-3.5 text-base text-white placeholder-white/30 focus:outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--dark-border)', borderRadius: 'var(--radius-sm)' }}
            />
            <input
              type="tel"
              placeholder="Tu teléfono (opcional)"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full px-4 py-3.5 text-base text-white placeholder-white/30 focus:outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--dark-border)', borderRadius: 'var(--radius-sm)' }}
            />
            <input
              type="email"
              placeholder="Tu correo (opcional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 text-base text-white placeholder-white/30 focus:outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--dark-border)', borderRadius: 'var(--radius-sm)' }}
            />
            <p className="text-white/30 text-xs text-center">Con tu correo recibirás confirmación por email.</p>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button
              onClick={confirmarCita}
              disabled={cargando}
              className="w-full py-4 text-base font-medium transition-all hover:opacity-80 disabled:opacity-40 active:scale-95 mt-1"
              style={{ border: '1px solid var(--gold-border)', color: 'var(--gold)', background: 'var(--gold-glass)', borderRadius: 'var(--radius-sm)' }}
            >
              {cargando ? 'Confirmando...' : `Confirmar cita · $${servicioSeleccionado?.precio}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
