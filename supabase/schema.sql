-- Schéma RedionCup : à exécuter dans l'éditeur SQL de votre projet Supabase.

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

create policy "players lecture publique" on players for select using (true);
create policy "players écriture publique" on players for insert with check (true);
create policy "players maj publique" on players for update using (true);
create policy "events lecture publique" on events for select using (true);
create policy "events écriture publique" on events for insert with check (true);

-- Active le temps réel sur les deux tables (classement live)
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table events;
