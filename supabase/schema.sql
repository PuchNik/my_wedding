-- Выполните в Supabase: SQL Editor → New query → Run
-- После этого все ответы будут в Table Editor → rsvp

create table if not exists public.rsvp (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  attending text not null check (attending in ('будет', 'не будет')),
  guests integer not null default 0,
  comment text not null default '',
  submitted_at timestamptz not null default now()
);

alter table public.rsvp enable row level security;

create policy "Гости могут отправить анкету"
  on public.rsvp
  for insert
  to anon
  with check (true);
