-- Migración: agrega cliente_email y hace cliente_telefono nullable
-- Ejecuta esto en el SQL Editor de tu dashboard de Supabase

alter table citas
  add column if not exists cliente_email text;

alter table citas
  alter column cliente_telefono drop not null;
