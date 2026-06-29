export interface Barbero {
  id: string
  nombre: string
  foto_url: string | null
  descripcion: string | null
  telefono: string | null
  activo: boolean
}

export interface Servicio {
  id: string
  nombre: string
  duracion_min: number
  precio: number
}

export interface Horario {
  id: string
  barbero_id: string
  dia_semana: number // 0=Dom, 1=Lun, ..., 6=Sab
  hora_inicio: string // "09:00"
  hora_fin: string   // "18:00"
}

export interface Cita {
  id: string
  barbero_id: string
  servicio_id: string
  cliente_nombre: string
  cliente_telefono: string | null
  cliente_email: string | null
  fecha: string      // "2024-01-15"
  hora: string       // "10:00"
  estado: 'pendiente' | 'completada' | 'cancelada'
  created_at: string
  barberos?: Barbero
  servicios?: Servicio
}
