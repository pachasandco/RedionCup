-- Synchronisation des pronostics entre appareils : jusqu'ici ils vivaient
-- uniquement dans le localStorage du navigateur. Un joueur connecté sur
-- PC + téléphone retrouve désormais les mêmes pronos partout.

create table if not exists predictions (
  player_id uuid not null references players (id) on delete cascade,
  match_id text not null check (char_length(match_id) <= 24),
  h integer not null check (h between 0 and 9),
  a integer not null check (a between 0 and 9),
  updated_at timestamptz not null default now(),
  primary key (player_id, match_id)
);

alter table predictions enable row level security;

drop policy if exists "predictions lecture publique" on predictions;
drop policy if exists "predictions écriture publique" on predictions;
drop policy if exists "predictions maj publique" on predictions;
create policy "predictions lecture publique" on predictions for select using (true);
create policy "predictions écriture publique" on predictions for insert with check (true);
create policy "predictions maj publique" on predictions for update using (true);
