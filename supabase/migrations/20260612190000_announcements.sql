-- Annonces de l'organisateur : seul moussa (vérifié par son code de
-- connexion) peut publier ; chaque joueur voit l'annonce une seule fois
-- (le « vu » est mémorisé sur l'appareil).

create table if not exists announcements (
  id bigint generated always as identity primary key,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table announcements enable row level security;

drop policy if exists "annonces lecture publique" on announcements;
create policy "annonces lecture publique" on announcements for select using (true);
-- Pas de politique d'écriture : tout passe par post_announcement.

create or replace function post_announcement(p_pin text, p_body text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  admin players%rowtype;
begin
  select * into admin from players where lower(name) = 'moussa' limit 1;
  if admin.id is null or admin.pin_hash is null
     or admin.pin_hash <> extensions.crypt(p_pin, admin.pin_hash) then
    raise exception 'Non autorisé.';
  end if;
  if char_length(trim(p_body)) not between 1 and 500 then
    raise exception 'Message invalide (1 à 500 caractères).';
  end if;
  insert into announcements (body) values (trim(p_body));
end $$;

grant execute on function post_announcement(text, text) to anon;

-- Temps réel : la bulle apparaît chez tout le monde sans recharger
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'announcements'
  ) then
    alter publication supabase_realtime add table announcements;
  end if;
end $$;
