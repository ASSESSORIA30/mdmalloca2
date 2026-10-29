-- ModularDom · Mallorca Private Residences
-- Content (optional, CONTENT_SOURCE=supabase) and private enquiries.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------
-- Residences: one JSON document per residence, validated by the
-- same zod schema as content/properties/*.json (src/content/schema.ts).
-- Edit in Supabase Studio → Table editor, no code needed.
-- ---------------------------------------------------------------
create table if not exists public.properties (
  slug        text primary key check (slug ~ '^[a-z0-9-]+$'),
  published   boolean not null default false,
  document    jsonb   not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id)
);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists properties_touch on public.properties;
create trigger properties_touch before update on public.properties
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------
-- Enquiries from the private presentation form
-- ---------------------------------------------------------------
create table if not exists public.enquiries (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  intent         text not null check (intent in ('presentation','dossier','consultation','call')),
  name           text not null,
  email          text not null,
  phone          text,
  country        char(2),
  -- slug of the residence (not a foreign key: residences may live in JSON files)
  property_slug  text,
  message        text,
  locale         text not null default 'en',
  consent_at     timestamptz not null,
  user_agent     text,
  status         text not null default 'new' check (status in ('new','contacted','qualified','closed')),
  crm_id         text
);
create index if not exists enquiries_created_idx on public.enquiries (created_at desc);

-- ---------------------------------------------------------------
-- Staff roles for the private admin (Supabase Auth users)
-- ---------------------------------------------------------------
create table if not exists public.staff (
  user_id  uuid primary key references auth.users(id) on delete cascade,
  role     text not null check (role in ('admin','editor','sales'))
);

create or replace function public.staff_role() returns text language sql stable security definer set search_path = public as $$
  select role from public.staff where user_id = auth.uid()
$$;

-- ---------------------------------------------------------------
-- Row level security
-- The public website never talks to these tables from the browser:
-- it reads/writes server-side with the service role key.
-- ---------------------------------------------------------------
alter table public.properties enable row level security;
alter table public.enquiries  enable row level security;
alter table public.staff      enable row level security;

-- published residences are readable by anyone (useful for previews / static builds)
drop policy if exists "read published" on public.properties;
create policy "read published" on public.properties for select using (published);

drop policy if exists "editors manage properties" on public.properties;
create policy "editors manage properties" on public.properties for all
  using (public.staff_role() in ('admin','editor'))
  with check (public.staff_role() in ('admin','editor'));

-- enquiries: no public access at all; sales and admins can read and update status
drop policy if exists "sales read enquiries" on public.enquiries;
create policy "sales read enquiries" on public.enquiries for select using (public.staff_role() in ('admin','sales'));
drop policy if exists "sales update enquiries" on public.enquiries;
create policy "sales update enquiries" on public.enquiries for update using (public.staff_role() in ('admin','sales'));

drop policy if exists "staff read own role" on public.staff;
create policy "staff read own role" on public.staff for select using (user_id = auth.uid());

-- ---------------------------------------------------------------
-- Media storage: create a bucket for project assets uploaded from Studio
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('projects', 'projects', true)
on conflict (id) do nothing;
