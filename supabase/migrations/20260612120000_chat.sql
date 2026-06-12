-- Chat de chambrage entre parieurs : messages publics en temps réel.

create table if not exists messages (
  id bigint generated always as identity primary key,
  player_id uuid not null references players (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 280),
  created_at timestamptz not null default now()
);

alter table messages enable row level security;

drop policy if exists "messages lecture publique" on messages;
drop policy if exists "messages écriture publique" on messages;
create policy "messages lecture publique" on messages for select using (true);
create policy "messages écriture publique" on messages for insert with check (true);

-- Temps réel (sans échouer si déjà publié)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table messages;
  end if;
end $$;
