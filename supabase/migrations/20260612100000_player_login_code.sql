-- Connexion multi-appareils : chaque joueur reçoit à l'inscription un code
-- à 6 chiffres qui lui permet de se reconnecter ailleurs (prénom + code).
-- Le code est stocké haché (bcrypt) et n'est jamais lisible par les clients.

-- Sur Supabase, pgcrypto vit dans le schéma "extensions"
create extension if not exists pgcrypto with schema extensions;

alter table players add column if not exists pin_hash text;

-- Inscription : insère le joueur avec son code haché.
-- Idempotente sur l'id (resynchronisation d'un appareil déjà inscrit) ;
-- un prénom déjà pris lève l'erreur 23505 (index players_name_unique).
create or replace function register_player(p_id uuid, p_name text, p_avatar text, p_pin text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  insert into players (id, name, avatar, pin_hash)
  values (p_id, trim(p_name), p_avatar, extensions.crypt(p_pin, extensions.gen_salt('bf')))
  on conflict (id) do nothing;
end $$;

-- Connexion depuis un autre appareil : rend le joueur si prénom + code valides.
create or replace function claim_player(p_name text, p_pin text)
returns table (id uuid, name text, avatar text)
language sql
security definer
set search_path = public, extensions
stable
as $$
  select p.id, p.name, p.avatar
  from players p
  where lower(p.name) = lower(trim(p_name))
    and p.pin_hash is not null
    and p.pin_hash = extensions.crypt(p_pin, p.pin_hash)
$$;

grant execute on function register_player(uuid, text, text, text) to anon;
grant execute on function claim_player(text, text) to anon;

-- Le hash du code ne doit pas être lisible : lecture limitée colonne par colonne.
revoke select on players from anon;
grant select (id, name, avatar, created_at) on players to anon;
