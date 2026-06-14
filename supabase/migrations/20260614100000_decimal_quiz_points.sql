-- Les points de quiz sont désormais décimaux (0.25, 0.5, 1 par bonne réponse).
-- On passe la colonne en numeric et on ajuste la contrainte de borne.

alter table events alter column points type numeric(6,2) using points::numeric(6,2);

alter table events drop constraint if exists events_points_bounds;
alter table events add constraint events_points_bounds
  check (points >= 0 and points <= 30);
