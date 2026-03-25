-- Activa funciones criptográficas para poder generar UUIDs.
create extension if not exists "pgcrypto";

-- Perfil público/ampliado del usuario autenticado.
-- La PK coincide con auth.users(id), así cada usuario tiene un solo perfil.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  risk_profile text check (risk_profile in ('conservador', 'moderado', 'agresivo')),
  preferred_currency text default 'EUR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cartera principal o secundaria de cada usuario.
-- Un usuario puede tener varias carteras.
create table if not exists public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Posiciones o instrumentos guardados dentro de una cartera.
-- Cada símbolo solo puede aparecer una vez por cartera.
create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  symbol text not null,
  instrument_name text,
  category text check (category in ('money', 'bonds', 'mixed', 'equity')),
  units numeric(18,6) not null default 0 check (units >= 0),
  average_cost numeric(18,6) check (average_cost >= 0),
  target_weight numeric(6,2) check (target_weight >= 0 and target_weight <= 100),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (portfolio_id, symbol)
);

-- Lista de favoritos del usuario.
-- Cada usuario solo puede guardar una vez cada símbolo.
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  instrument_name text,
  category text check (category in ('money', 'bonds', 'mixed', 'equity')),
  created_at timestamptz not null default now(),
  unique (user_id, symbol)
);

-- Función reutilizable para actualizar updated_at automáticamente.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger para profiles: cada update refresca updated_at.
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- Trigger para portfolios.
drop trigger if exists portfolios_set_updated_at on public.portfolios;
create trigger portfolios_set_updated_at
before update on public.portfolios
for each row
execute function public.set_updated_at();

-- Trigger para portfolio_items.
drop trigger if exists portfolio_items_set_updated_at on public.portfolio_items;
create trigger portfolio_items_set_updated_at
before update on public.portfolio_items
for each row
execute function public.set_updated_at();

-- Activamos RLS para que nadie acceda a datos sin policy explícita.
alter table public.profiles enable row level security;
alter table public.portfolios enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.favorites enable row level security;

-- El usuario autenticado puede leer solo su propio perfil.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

-- El usuario autenticado puede crear solo su propio perfil.
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

-- El usuario autenticado puede modificar solo su propio perfil.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- El usuario autenticado puede gestionar solo sus carteras.
drop policy if exists "portfolios_manage_own" on public.portfolios;
create policy "portfolios_manage_own"
on public.portfolios
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- El usuario autenticado puede gestionar solo items de carteras que sean suyas.
drop policy if exists "portfolio_items_manage_own" on public.portfolio_items;
create policy "portfolio_items_manage_own"
on public.portfolio_items
for all
to authenticated
using (
  exists (
    select 1
    from public.portfolios p
    where p.id = portfolio_id
      and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.portfolios p
    where p.id = portfolio_id
      and p.user_id = auth.uid()
  )
);

-- El usuario autenticado puede gestionar solo sus favoritos.
drop policy if exists "favorites_manage_own" on public.favorites;
create policy "favorites_manage_own"
on public.favorites
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
