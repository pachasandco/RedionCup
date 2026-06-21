-- Protection serveur : impossible d'insérer des points hors barème,
-- même depuis un cache navigateur obsolète.
-- Match max 6 pts, quiz max 2.25 pts.

alter table public.events drop constraint if exists events_points_bounds;
alter table public.events add constraint events_points_bounds
  check (
    (type = 'match' and points >= 0 and points <= 6) or
    (type = 'quiz'  and points >= 0 and points <= 2.25)
  );
