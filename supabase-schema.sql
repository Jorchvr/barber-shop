-- Barberos
create table barberos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  foto_url text,
  descripcion text,
  activo boolean default true,
  created_at timestamptz default now()
);

-- Servicios (tipos de corte)
create table servicios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  duracion_min integer not null default 30,
  precio numeric(10,2) not null default 0,
  activo boolean default true
);

-- Horarios de cada barbero (qué días y horas trabaja)
create table horarios (
  id uuid primary key default gen_random_uuid(),
  barbero_id uuid references barberos(id) on delete cascade,
  dia_semana integer not null check (dia_semana between 0 and 6),
  hora_inicio time not null,
  hora_fin time not null
);

-- Citas
create table citas (
  id uuid primary key default gen_random_uuid(),
  barbero_id uuid references barberos(id) on delete cascade,
  servicio_id uuid references servicios(id) on delete cascade,
  cliente_nombre text not null,
  cliente_telefono text not null,
  fecha date not null,
  hora time not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'completada', 'cancelada')),
  created_at timestamptz default now(),
  unique(barbero_id, fecha, hora)
);

-- RLS: lectura pública para barberos, servicios y horarios
alter table barberos enable row level security;
alter table servicios enable row level security;
alter table horarios enable row level security;
alter table citas enable row level security;

create policy "Lectura pública barberos" on barberos for select using (true);
create policy "Lectura pública servicios" on servicios for select using (true);
create policy "Lectura pública horarios" on horarios for select using (true);
create policy "Insertar citas público" on citas for insert with check (true);
create policy "Lectura citas público" on citas for select using (true);
create policy "Actualizar citas público" on citas for update using (true);

-- Datos de ejemplo
insert into barberos (nombre, descripcion) values
  ('Carlos', 'Especialista en fade y degradados'),
  ('Miguel', 'Experto en cortes clásicos y barba'),
  ('Luis', 'Cortes modernos y diseños');

insert into servicios (nombre, duracion_min, precio) values
  ('Corte clásico', 30, 150),
  ('Fade / Degradado', 45, 200),
  ('Corte + Barba', 60, 250),
  ('Diseño de barba', 30, 100),
  ('Corte infantil', 20, 100);

insert into horarios (barbero_id, dia_semana, hora_inicio, hora_fin)
select b.id, d.dia, '09:00', '19:00'
from barberos b, (values (1),(2),(3),(4),(5),(6)) as d(dia);
