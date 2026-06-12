-- Un prénom ne peut être pris qu'une seule fois (insensible à la casse) :
-- chaque joueur s'inscrit avec un prénom unique et définitif.
create unique index if not exists players_name_unique on players (lower(name));

-- Le prénom est définitif : on retire le droit de modifier un joueur.
drop policy if exists "players maj publique" on players;
