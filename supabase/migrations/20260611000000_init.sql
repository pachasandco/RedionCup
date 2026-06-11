-- Migration initiale RedionCup : tables joueurs + événements de points.
-- Appliquée automatiquement par l'intégration GitHub de Supabase,
-- ou manuellement via l'éditeur SQL du dashboard.

create table if not exists players (
  id uuid primary key,
  name text not null,
  avatar text not null default '⚽',
  created_at timestamptz not null default now()
);

create table if not exists events (
  id bigint generated always as identity primary key,
  player_id uuid not null references players (id) on delete cascade,
  match_id text not null,
  type text not null check (type in ('match', 'quiz')),
  points integer not null default 0,
  label text not null default '',
  created_at timestamptz not null default now()
);

-- Politique ouverte pour une partie entre amis (démo).
-- Pour durcir : passer par Supabase Auth et restreindre player_id à auth.uid().
alter table players enable row level security;
alter table events enable row level security;

drop policy if exists "players lecture publique" on players;
drop policy if exists "players écriture publique" on players;
drop policy if exists "players maj publique" on players;
drop policy if exists "events lecture publique" on events;
drop policy if exists "events écriture publique" on events;

create policy "players lecture publique" on players for select using (true);
create policy "players écriture publique" on players for insert with check (true);
create policy "players maj publique" on players for update using (true);
create policy "events lecture publique" on events for select using (true);
create policy "events écriture publique" on events for insert with check (true);

-- Active le temps réel sur les deux tables (classement live),
-- sans échouer si elles sont déjà dans la publication.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'players'
  ) then
    alter publication supabase_realtime add table players;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'events'
  ) then
    alter publication supabase_realtime add table events;
  end if;
end $$;
