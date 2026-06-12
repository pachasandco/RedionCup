-- Durcissement sécurité. Rappel du modèle : la clé anon est publique par
-- conception (bundle navigateur), la sécurité repose entièrement sur les
-- politiques RLS, les contraintes et les fonctions security definer.

-- 1. Nettoie les doublons existants (garde le premier event de chaque trio)
delete from events e
using events e2
where e.player_id = e2.player_id
  and e.match_id = e2.match_id
  and e.type = e2.type
  and e.id > e2.id;

-- 2. Anti-rejeu : un seul event "match" et un seul event "quiz"
--    par joueur et par match — borne le gain maximal d'un tricheur
create unique index if not exists events_once_per_match
  on events (player_id, match_id, type);

-- 3. Bornes plausibles : match max 10 pts, quiz max 3×8 = 24 pts
alter table events drop constraint if exists events_points_bounds;
alter table events add constraint events_points_bounds
  check (points >= 0 and points <= 24);
alter table events drop constraint if exists events_sizes;
alter table events add constraint events_sizes
  check (char_length(match_id) <= 24 and char_length(label) <= 80);

-- 4. Contraintes joueurs : prénom 2-20 caractères, avatar court
alter table players drop constraint if exists players_name_len;
alter table players add constraint players_name_len
  check (char_length(trim(name)) between 2 and 20);
alter table players drop constraint if exists players_avatar_len;
alter table players add constraint players_avatar_len
  check (char_length(avatar) <= 8);

-- 5. L'inscription passe exclusivement par register_player (code haché) :
--    plus d'insertion anonyme directe dans players
drop policy if exists "players écriture publique" on players;

-- 6. Validation côté serveur du prénom et du format du code
create or replace function register_player(p_id uuid, p_name text, p_avatar text, p_pin text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if char_length(trim(p_name)) not between 2 and 20 then
    raise exception 'Prénom invalide (2 à 20 caractères).';
  end if;
  if p_pin !~ '^[0-9]{6}$' then
    raise exception 'Code invalide (6 chiffres attendus).';
  end if;
  insert into players (id, name, avatar, pin_hash)
  values (p_id, trim(p_name), left(coalesce(p_avatar, '⚽'), 8), extensions.crypt(p_pin, extensions.gen_salt('bf')))
  on conflict (id) do nothing;
end $$;
